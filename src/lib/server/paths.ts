import fs from "fs";
import path from "path";

/**
 * Project root resolution.
 * In dev mode, cwd IS the project root. In production standalone mode,
 * Next's server.js chdir's into .next/standalone — climb out so that
 * scripts/ (binaries) and storage/ (clips) always live at the project
 * root and survive rebuilds.
 */
function findProjectRoot(): string {
  let dir = process.cwd();
  // production standalone: cwd is <project>/.next/standalone
  if (path.basename(dir) === "standalone" && path.basename(path.dirname(dir)) === ".next") {
    dir = path.dirname(path.dirname(dir));
  }
  // nearest ancestor with package.json = the app root
  for (let i = 0; i < 3; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}
export const ROOT = findProjectRoot();

// Binaries & configs (created during setup)
export const BIN_DIR = path.join(ROOT, "scripts");
export const WIREPROXY_BIN = path.join(BIN_DIR, "wireproxy");
export const WIREPROXY_CONF = path.join(BIN_DIR, "warp-tunnel.conf");
export const GOST_BIN = path.join(BIN_DIR, "gost");

// Ports
export const SOCKS_PORT = 1080; // wireproxy (WARP tunnel SOCKS5)
export const GOST_PORT = 8080; // gost (HTTP proxy bridging to SOCKS/WARP)
export const MEDIA_PROXY_PORT = 9898; // local range-proxy for ffmpeg

export const SOCKS_PROXY = `socks5://127.0.0.1:${SOCKS_PORT}`;
export const HTTP_PROXY = `http://127.0.0.1:${GOST_PORT}`;

// Storage
export const STORAGE_DIR = path.join(ROOT, "storage");
export const VIDEOS_DIR = path.join(STORAGE_DIR, "videos");
export const CLIPS_DIR = path.join(STORAGE_DIR, "clips");
export const STATE_FILE = path.join(STORAGE_DIR, "state.json");

// yt-dlp binary — prefer the self-contained copy in scripts/ (survives container
// restarts); fall back to PATH only if it's missing.
const LOCAL_YTDLP = path.join(BIN_DIR, "yt-dlp");
export const YTDLP_BIN = fs.existsSync(LOCAL_YTDLP) ? LOCAL_YTDLP : "yt-dlp";

export function clipDir(clipId: string) {
  return path.join(CLIPS_DIR, clipId);
}

export function videoDir(videoId: string) {
  return path.join(VIDEOS_DIR, videoId);
}

export function sanitizeFilename(name: string, maxLen = 80): string {
  return (
    name
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLen) || "clip"
  );
}

export function fmtTime(sec: number): string {
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  return `${m}:${String(ss).padStart(2, "0")}`;
}
