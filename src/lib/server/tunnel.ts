import { spawn, ChildProcess } from "child_process";
import net from "net";
import http from "http";
import fs from "fs";
import path from "path";
import {
  BIN_DIR,
  WIREPROXY_BIN,
  WIREPROXY_CONF,
  GOST_BIN,
  SOCKS_PORT,
  GOST_PORT,
  MEDIA_PROXY_PORT,
} from "./paths";

/**
 * Tunnel supervisor.
 *
 * Architecture (the YouTube datacenter-IP-block fix):
 *   wireproxy (userspace WireGuard)  ->  Cloudflare WARP egress IP
 *   gost (HTTP proxy)                ->  bridges HTTP clients into the SOCKS5 WARP tunnel
 *   media-proxy (in-process, :9898)  ->  HTTP Range passthrough for ffmpeg, routed via gost
 *
 * yt-dlp talks SOCKS5 to wireproxy directly; ffmpeg talks plain HTTP to the local
 * media-proxy which fetches remote ranges through gost (ffmpeg's own HTTP stack
 * cannot use proxies for https properly).
 */

interface TunnelGlobal {
  __opalTunnel?: {
    initPromise?: Promise<TunnelStatus>;
    mediaProxy?: http.Server;
    wireproxyProc?: ChildProcess;
    gostProc?: ChildProcess;
    lastStatus?: TunnelStatus;
    lastCheck?: number;
    warpFails?: number;
    lastRestart?: number;
    restarting?: boolean;
  };
}

export interface TunnelStatus {
  socksUp: boolean;
  httpProxyUp: boolean;
  mediaProxyUp: boolean;
  warpOn: boolean;
  egressIp?: string;
  error?: string;
}

const g = globalThis as unknown as TunnelGlobal & { __opalProxyAgent?: unknown };
if (!g.__opalTunnel) g.__opalTunnel = {};

/** fetch via the gost HTTP bridge (WARP egress). */
async function proxyFetch(url: string, init?: RequestInit): Promise<Response> {
  const undici = await import("undici");
  if (!g.__opalProxyAgent) {
    g.__opalProxyAgent = new undici.ProxyAgent(`http://127.0.0.1:${GOST_PORT}`);
  }
  const dispatcher = g.__opalProxyAgent as import("undici").Dispatcher;
  return undici.fetch(url, { ...init, dispatcher } as never) as unknown as Response;
}

function isPortOpen(port: number, host = "127.0.0.1"): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = net.connect({ port, host, timeout: 1200 });
    const done = (ok: boolean) => {
      sock.removeAllListeners();
      sock.destroy();
      resolve(ok);
    };
    sock.once("connect", () => done(true));
    sock.once("error", () => done(false));
    sock.once("timeout", () => done(false));
  });
}

function spawnDetached(bin: string, args: string[], logFile: string, pidFile?: string): ChildProcess | null {
  try {
    if (!fs.existsSync(bin)) return null;
    const out = fs.openSync(logFile, "a");
    const proc = spawn(bin, args, {
      detached: true,
      stdio: ["ignore", out, out],
      env: { ...process.env },
    });
    proc.unref();
    if (pidFile) {
      try {
        fs.writeFileSync(pidFile, String(proc.pid));
      } catch {
        /* ignore */
      }
    }
    return proc;
  } catch {
    return null;
  }
}

const WIREPROXY_PID_FILE = path.join(BIN_DIR, "wireproxy.pid");
const WIREPROXY_LOG = path.join(BIN_DIR, "wireproxy.log");
const GOST_LOG = path.join(BIN_DIR, "gost.log");

/** Kill & respawn wireproxy (fixes stuck WireGuard handshakes under heavy use). */
async function restartWireproxy(): Promise<boolean> {
  try {
    try {
      const pid = fs.existsSync(WIREPROXY_PID_FILE) ? parseInt(fs.readFileSync(WIREPROXY_PID_FILE, "utf-8").trim(), 10) : NaN;
      if (Number.isFinite(pid)) process.kill(pid, "SIGKILL");
    } catch {
      /* stale pid */
    }
    try {
      const { execFileSync } = await import("child_process");
      execFileSync("pkill", ["-f", "wireproxy --config"], { stdio: "ignore" });
    } catch {
      /* no process matched */
    }
    await new Promise((r) => setTimeout(r, 1200));
    spawnDetached(WIREPROXY_BIN, ["--config", WIREPROXY_CONF], WIREPROXY_LOG, WIREPROXY_PID_FILE);
    return await waitPort(SOCKS_PORT, 15000);
  } catch {
    return false;
  }
}

async function waitPort(port: number, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isPortOpen(port)) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

/** Start the in-process media range-proxy (ffmpeg -> localhost -> gost -> WARP). */
async function startMediaProxy(): Promise<http.Server | null> {
  if (g.__opalTunnel!.mediaProxy && (await isPortOpen(MEDIA_PROXY_PORT))) {
    return g.__opalTunnel!.mediaProxy;
  }
  g.__opalTunnel!.mediaProxy = undefined;

  for (let attempt = 0; attempt < 4; attempt++) {
    const ok = await new Promise<boolean>((resolve) => {
      const server = http.createServer(mediaProxyHandler);
      server.on("clientError", (_err, socket) => socket.destroy());
      const onError = (err: NodeJS.ErrnoException) => {
        server.removeListener("error", onError);
        resolve(false);
      };
      server.once("error", onError);
      server.listen(MEDIA_PROXY_PORT, "127.0.0.1", () => {
        server.removeListener("error", onError);
        g.__opalTunnel!.mediaProxy = server;
        resolve(true);
      });
    });
    if (ok) return g.__opalTunnel!.mediaProxy!;
    // port busy — maybe an orphan from a previous process; wait and retry
    await new Promise((r) => setTimeout(r, 800));
  }
  // final check: an orphan from a previous process may still be serving — usable as-is
  if (await isPortOpen(MEDIA_PROXY_PORT)) {
    return null; // port is open; health only needs it listening
  }
  return null;
}

type MediaHandler = (req: http.IncomingMessage, res: http.ServerResponse) => void;

const mediaProxyHandler: MediaHandler = async (req, res) => {
  try {
    const u = new URL(req.url || "/", "http://localhost");
    const target = u.searchParams.get("u");
    const route = u.searchParams.get("r") || "gost"; // gost | direct
    if (!target) {
      res.writeHead(400);
      res.end("missing u");
      return;
    }
    const parsed = new URL(target);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      res.writeHead(403);
      res.end("bad protocol");
      return;
    }
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
    };
    if (req.headers.range) headers.Range = req.headers.range;

    const controller = new AbortController();
    const signal = controller.signal;
    const upstream =
      route === "gost"
        ? ((await proxyFetch(target, { headers, redirect: "follow", signal })) as unknown as Response)
        : ((await fetch(target, { headers, redirect: "follow", signal })) as Response);
    const h: Record<string, string> = {};
    for (const k of ["content-range", "content-length", "content-type", "accept-ranges", "etag"]) {
      const v = upstream.headers.get(k);
      if (v) h[k] = v;
    }
    res.writeHead(upstream.status, h);
    if (upstream.body) {
      const reader = (upstream.body as ReadableStream<Uint8Array>).getReader();
      const pump = async () => {
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!res.write(value)) {
              await new Promise<void>((r) => res.once("drain", () => r()));
            }
          }
          res.end();
        } catch {
          res.destroy();
        }
      };
      pump();
      req.once("close", () => controller.abort());
    } else {
      res.end();
    }
  } catch (e) {
    console.error("[media-proxy] error:", e instanceof Error ? `${e.message} | cause: ${String((e as Error & { cause?: unknown }).cause)}` : e);
    if (!res.headersSent) {
      res.writeHead(502);
      res.end("upstream error");
    } else {
      res.destroy();
    }
  }
};

async function checkWarp(): Promise<{ warpOn: boolean; egressIp: string | undefined }> {
  try {
    const res = (await proxyFetch("https://www.cloudflare.com/cdn-cgi/trace", {
      signal: AbortSignal.timeout(10000),
    })) as unknown as Response;
    const text = await res.text();
    const warp = /^warp=on$/m.test(text);
    const ip = text.match(/^ip=(.+)$/m)?.[1];
    return { warpOn: warp, egressIp: ip };
  } catch {
    return { warpOn: false, egressIp: undefined };
  }
}

/** Idempotent: make sure wireproxy + gost + media proxy are all up. */
export async function ensureTunnel(force = false): Promise<TunnelStatus> {
  const t = g.__opalTunnel!;
  const healthy =
    t.lastStatus?.socksUp && t.lastStatus?.httpProxyUp && t.lastStatus?.mediaProxyUp && t.lastStatus?.warpOn;
  if (!force && healthy && t.initPromise) return t.initPromise;

  t.initPromise = (async (): Promise<TunnelStatus> => {
    // 1. wireproxy (WARP SOCKS5)
    if (!(await isPortOpen(SOCKS_PORT))) {
      spawnDetached(WIREPROXY_BIN, ["--config", WIREPROXY_CONF], WIREPROXY_LOG);
      await waitPort(SOCKS_PORT, 15000);
    }
    const socksUp = await isPortOpen(SOCKS_PORT);

    // 2. gost (HTTP bridge)
    if (!(await isPortOpen(GOST_PORT))) {
      spawnDetached(GOST_BIN, ["-L", `http://:${GOST_PORT}`, "-F", `socks5://127.0.0.1:${SOCKS_PORT}`], GOST_LOG);
      await waitPort(GOST_PORT, 10000);
    }
    const httpProxyUp = await isPortOpen(GOST_PORT);

    // 3. media proxy (in-process)
    await startMediaProxy();
    const mediaProxyUp = await isPortOpen(MEDIA_PROXY_PORT);

    // 4. verify WARP egress
    let warp: { warpOn: boolean; egressIp: string | undefined } = { warpOn: false, egressIp: undefined };
    if (socksUp && httpProxyUp) warp = await checkWarp();

    const status: TunnelStatus = {
      socksUp,
      httpProxyUp,
      mediaProxyUp,
      warpOn: warp.warpOn,
      egressIp: warp.egressIp,
      error: !socksUp
        ? "WARP tunnel (wireproxy) failed to start"
        : !httpProxyUp
          ? "HTTP bridge (gost) failed to start"
          : !warp.warpOn
            ? "Tunnel up but WARP verification failed"
            : undefined,
    };
    t.lastStatus = status;
    t.lastCheck = Date.now();
    return status;
  })();

  return t.initPromise;
}

/** Fresh status (re-checks ports, cheap; re-verifies WARP at most once per 60s; self-heals). */
export async function getTunnelStatus(): Promise<TunnelStatus> {
  const t = g.__opalTunnel!;
  let socksUp = await isPortOpen(SOCKS_PORT);
  let httpProxyUp = await isPortOpen(GOST_PORT);
  let mediaProxyUp = await isPortOpen(MEDIA_PROXY_PORT);

  if (!socksUp || !httpProxyUp || !mediaProxyUp) {
    await ensureTunnel(); // attempt to bring things back up
    socksUp = await isPortOpen(SOCKS_PORT);
    httpProxyUp = await isPortOpen(GOST_PORT);
    mediaProxyUp = await isPortOpen(MEDIA_PROXY_PORT);
  }

  const cacheFresh = Date.now() - (t.lastCheck || 0) < 60000 && t.lastStatus;
  let warpOn = t.lastStatus?.warpOn ?? false;
  let egressIp = t.lastStatus?.egressIp;

  if (socksUp && httpProxyUp && (!cacheFresh || !warpOn)) {
    const w = await checkWarp();
    warpOn = w.warpOn;
    egressIp = w.egressIp;

    // Auto-heal: stuck WireGuard handshake → restart wireproxy after 2 consecutive
    // failed verifications (with a 45s cooldown to avoid flapping).
    if (!warpOn) {
      t.warpFails = (t.warpFails || 0) + 1;
      const cooldownOk = Date.now() - (t.lastRestart || 0) > 45000;
      if (t.warpFails >= 2 && cooldownOk && !t.restarting) {
        t.restarting = true;
        console.warn("[tunnel] WARP handshake stuck — restarting wireproxy…");
        try {
          const ok = await restartWireproxy();
          if (ok) {
            const w2 = await checkWarp();
            warpOn = w2.warpOn;
            egressIp = w2.egressIp;
            if (warpOn) t.warpFails = 0;
          }
        } finally {
          t.lastRestart = Date.now();
          t.restarting = false;
        }
      }
    } else {
      t.warpFails = 0;
    }
  }

  const status: TunnelStatus = {
    socksUp,
    httpProxyUp,
    mediaProxyUp,
    warpOn: socksUp && httpProxyUp ? warpOn : false,
    egressIp,
    error: !socksUp
      ? "WARP tunnel down"
      : !httpProxyUp
        ? "HTTP bridge down"
        : !mediaProxyUp
          ? "Media proxy down"
          : !warpOn
            ? "WARP verification failed"
            : undefined,
  };
  t.lastStatus = status;
  t.lastCheck = Date.now();
  return status;
}
