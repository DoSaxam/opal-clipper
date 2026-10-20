import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import { ensureTunnel } from "./tunnel";
import { SOCKS_PROXY, YTDLP_BIN, VIDEOS_DIR, videoDir } from "./paths";
import type { VideoInfo } from "./state";

/**
 * yt-dlp wrapper.
 * - Metadata: try DIRECT first (fast for the 1000+ supported sites),
 *   fall back to WARP tunnel (required for YouTube's datacenter-IP bot wall).
 * - Stream formats are cached per video with the route they were extracted
 *   through (direct vs tunnel), because googlevideo URLs are IP-locked to the
 *   extracting IP.
 */

export interface StreamFormat {
  itag: string;
  height: number | null;
  ext: string;
  vcodec: string;
  acodec: string;
  fps: number | null;
  abr: number | null;
  url: string;
  protocol: string; // "https" (direct file w/ ranges) | "m3u8_native" | ...
  filesize: number | null;
}

export interface FormatCacheEntry {
  video: StreamFormat[];
  audio: StreamFormat[];
  combined: StreamFormat[];
  viaTunnel: boolean;
  fetchedAt: number;
}

interface YtGlobal {
  __opalFormats?: Map<string, FormatCacheEntry>;
}

const g = globalThis as unknown as YtGlobal;
if (!g.__opalFormats) g.__opalFormats = new Map();

const URL_TTL = 1000 * 60 * 60 * 3; // stream URLs live ~6h; refresh at 3h

function runYtdlp(
  args: string[],
  timeoutMs = 120000
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(
      YTDLP_BIN,
      args,
      {
        timeout: timeoutMs,
        maxBuffer: 64 * 1024 * 1024,
        env: { ...process.env },
      },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(stderr?.slice(-800) || err.message));
        } else {
          resolve({ stdout, stderr });
        }
      }
    );
  });
}

interface RawFormat {
  format_id?: string;
  height?: number | null;
  ext?: string;
  vcodec?: string;
  acodec?: string;
  fps?: number | null;
  abr?: number | null;
  url?: string;
  protocol?: string;
  filesize?: number | null;
  filesize_approx?: number | null;
  format_note?: string;
}

interface RawInfo {
  id?: string;
  _type?: string;
  entries?: RawInfo[];
  title?: string;
  uploader?: string;
  duration?: number | null;
  thumbnail?: string;
  extractor_key?: string;
  formats?: RawFormat[];
  url?: string;
  is_live?: boolean;
  live_status?: string;
  ext?: string;
}

function parseFormats(raw: RawInfo): FormatCacheEntry {
  const video: StreamFormat[] = [];
  const audio: StreamFormat[] = [];
  const combined: StreamFormat[] = [];
  for (const f of raw.formats || []) {
    if (!f.url) continue;
    const vcodec = f.vcodec || "none";
    const acodec = f.acodec || "none";
    const protocol = f.protocol || "https";
    const entry: StreamFormat = {
      itag: String(f.format_id || ""),
      height: f.height ?? null,
      ext: f.ext || "mp4",
      vcodec,
      acodec,
      fps: f.fps ?? null,
      abr: f.abr ?? null,
      url: f.url,
      protocol,
      filesize: f.filesize ?? f.filesize_approx ?? null,
    };
    const isStoryboard = (f.format_note || "").includes("storyboard") || f.ext === "mhtml";
    if (isStoryboard) continue;
    if (vcodec !== "none" && acodec !== "none") combined.push(entry);
    else if (vcodec !== "none") video.push(entry);
    else if (acodec !== "none") audio.push(entry);
  }
  // single-url media (generic extractor)
  if (!raw.formats?.length && raw.url) {
    combined.push({
      itag: "src",
      height: null,
      ext: raw.ext || "mp4",
      vcodec: "unknown",
      acodec: "unknown",
      fps: null,
      abr: null,
      url: raw.url,
      protocol: "https",
      filesize: null,
    });
  }
  return { video, audio, combined, viaTunnel: false, fetchedAt: Date.now() };
}

function stableVideoId(extractor: string, id: string) {
  return `${(extractor || "generic").toLowerCase()}:${id}`;
}

export class ExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractionError";
  }
}

function humanError(stderr: string): string {
  if (/Sign in to confirm|not a bot/i.test(stderr))
    return "YouTube is asking for sign-in from this IP (bot check). Retrying through tunnel…";
  if (/Private video/i.test(stderr)) return "This video is private.";
  if (/members[- ]only|join this channel/i.test(stderr)) return "This video is members-only.";
  if (/age.?restrict|confirm your age/i.test(stderr)) return "This video is age-restricted and cannot be processed.";
  if (/Video unavailable/i.test(stderr)) return "Video unavailable (removed or region-locked).";
  if (/is not a valid URL|Unsupported URL/i.test(stderr)) return "This link is not supported. Paste a direct video URL.";
  if (/HTTP Error 404/i.test(stderr)) return "Not found (404). Check the link.";
  if (/live event will begin|is live|premieres/i.test(stderr)) return "Live streams can't be clipped.";
  const line = stderr.split("\n").find((l) => l.trim().startsWith("ERROR:"));
  return line ? line.replace("ERROR:", "").trim().slice(0, 200) : "Could not analyze this link.";
}

/** Extract video metadata + stream formats. Returns VideoInfo + caches formats. */
export async function extractVideo(url: string): Promise<VideoInfo> {
  await ensureTunnel();

  const baseArgs = [
    "-J",
    "--no-playlist",
    "--no-warnings",
    "--socket-timeout",
    "20",
    "--js-runtimes",
    "node",
  ];

  let raw: RawInfo | null = null;
  let viaTunnel = false;
  let lastErr = "";

  // Attempt 1: direct (works for most sites + already-allowed IPs)
  try {
    const { stdout } = await runYtdlp([...baseArgs, url], 45000);
    raw = JSON.parse(stdout) as RawInfo;
  } catch (e) {
    lastErr = (e as Error).message;
  }

  // Attempt 2: through WARP tunnel (YouTube datacenter-IP-block fix)
  if (!raw) {
    try {
      const { stdout } = await runYtdlp([...baseArgs, "--proxy", SOCKS_PROXY, url], 120000);
      raw = JSON.parse(stdout) as RawInfo;
      viaTunnel = true;
    } catch (e) {
      lastErr = (e as Error).message || lastErr;
      throw new ExtractionError(humanError(lastErr));
    }
  }

  if (!raw) throw new ExtractionError(humanError(lastErr));
  if (raw._type === "playlist" && raw.entries?.length) {
    raw = raw.entries[0]; // take first entry of a playlist link
  }
  if (!raw.id || (!raw.formats?.length && !raw.url)) {
    throw new ExtractionError("No downloadable media found at this link.");
  }
  if (raw.is_live || raw.live_status === "is_live" || (raw.duration === null && !raw.url)) {
    throw new ExtractionError("Live streams can't be clipped.");
  }

  const formats = parseFormats(raw);
  formats.viaTunnel = viaTunnel;

  const videoId = stableVideoId(raw.extractor_key || "generic", String(raw.id));
  const info: VideoInfo = {
    id: videoId,
    sourceUrl: url,
    extractor: (raw.extractor_key || "generic").toLowerCase(),
    title: raw.title || "Untitled",
    uploader: raw.uploader || "",
    duration: raw.duration || 0,
    thumbnail: raw.thumbnail || "",
    heights: [...new Set(formats.video.map((f) => f.height).filter((h): h is number => !!h))].sort(
      (a, b) => b - a
    ),
    createdAt: Date.now(),
  };

  // cache formats + info json on disk
  g.__opalFormats!.set(videoId, formats);
  try {
    const dir = videoDir(videoId);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "info.json"), JSON.stringify({ info, formats }, null, 1));
  } catch {
    /* best-effort */
  }

  return info;
}

/** Get cached formats, refresh if stale or missing. */
export async function getFormats(videoId: string, sourceUrl: string): Promise<FormatCacheEntry> {
  const cached = g.__opalFormats!.get(videoId);
  if (cached && Date.now() - cached.fetchedAt < URL_TTL) return cached;
  // disk cache (survives reload)
  try {
    const p = path.join(VIDEOS_DIR, videoId, "info.json");
    if (fs.existsSync(p)) {
      const { formats } = JSON.parse(fs.readFileSync(p, "utf-8")) as { formats: FormatCacheEntry };
      if (Date.now() - formats.fetchedAt < URL_TTL) {
        g.__opalFormats!.set(videoId, formats);
        return formats;
      }
    }
  } catch {
    /* ignore */
  }
  await extractVideo(sourceUrl); // refreshes cache
  const fresh = g.__opalFormats!.get(videoId);
  if (!fresh) throw new ExtractionError("Could not fetch stream formats.");
  return fresh;
}

/** Force fresh extraction (used when stream URLs 403 mid-cut). */
export async function refreshFormats(videoId: string, sourceUrl: string): Promise<FormatCacheEntry> {
  g.__opalFormats!.delete(videoId);
  try {
    const p = path.join(VIDEOS_DIR, videoId, "info.json");
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch {
    /* ignore */
  }
  return getFormats(videoId, sourceUrl);
}
