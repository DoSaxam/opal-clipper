import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { clipDir, MEDIA_PROXY_PORT } from "./paths";
import type { FormatCacheEntry, StreamFormat } from "./ytdlp";
import { refreshFormats } from "./ytdlp";

/**
 * Clip cutting engine.
 *
 * Frame-accurate technique:
 *   ffmpeg -ss START -to END -copyts -i <videoStream> -ss START -to END -copyts -i <audioStream>
 *   (input seek jumps to the keyframe before START, decodes & discards up to START exactly,
 *    -copyts keeps absolute timestamps so -to END lands precisely)
 *
 * ORIGINAL AUDIO TRACK is preserved: when the source audio is AAC (m4a/mp4a —
 * what YouTube serves) the audio stream is muxed over with `-c:a copy`, i.e.
 * bit-for-bit the original track — no re-encode, no quality loss. Non-AAC
 * sources (opus/webm) fall back to a high-quality AAC encode, and a failed
 * copy auto-retries encoded.
 *
 * Streams are fed through the local range-proxy so ffmpeg's HTTP client works
 * through the WARP tunnel and only fetches the bytes needed for the clip.
 */

export interface CutOptions {
  videoId: string;
  sourceUrl: string;
  start: number;
  end: number;
  outPath: string;
  height?: number | null; // target height; null = source height
  crf?: number;
  onProgress?: (pct: number) => void;
  signal?: { aborted: boolean };
}

function proxyUrl(remote: string, viaTunnel: boolean): string {
  const route = viaTunnel ? "gost" : "direct";
  return `http://127.0.0.1:${MEDIA_PROXY_PORT}/?r=${route}&u=${encodeURIComponent(remote)}`;
}

/** Pick best video format for a target height. Preference: avc1(h264) > vp9 > av1, https protocol. */
export function pickVideoFormat(entry: FormatCacheEntry, targetHeight: number | null): StreamFormat | null {
  const pool = entry.video.filter((f) => f.protocol === "https");
  if (!pool.length) return null;
  const codecRank = (v: string) => (/avc1|h264/i.test(v) ? 0 : /vp9/i.test(v) ? 1 : /av01/i.test(v) ? 2 : 3);
  const sorted = [...pool].sort((a, b) => {
    const ah = a.height || 0;
    const bh = b.height || 0;
    if (targetHeight != null) {
      // prefer largest height <= target; then smallest overshoot
      const aOk = ah <= targetHeight ? 0 : 1;
      const bOk = bh <= targetHeight ? 0 : 1;
      if (aOk !== bOk) return aOk - bOk;
      if (aOk === 0 && ah !== bh) return bh - ah; // bigger (closer to target) first
      if (aOk === 1 && ah !== bh) return ah - bh; // smallest overshoot first
    } else if (ah !== bh) {
      return bh - ah; // best quality
    }
    return codecRank(a.vcodec) - codecRank(b.vcodec);
  });
  return sorted[0] || null;
}

/**
 * Timeout multiplier by resolution — 4K VP9 decode + x264 encode on small CPUs
 * runs far below realtime, and the WARP tunnel download adds more. Scale generously.
 */
function cutTimeoutMs(durSec: number, workHeight: number): number {
  const mult = workHeight >= 2160 ? 45 : workHeight >= 1440 ? 30 : workHeight >= 1080 ? 15 : 10;
  const minMs = workHeight >= 2160 ? 420000 : workHeight >= 1440 ? 300000 : workHeight >= 1080 ? 180000 : 150000;
  return Math.max(minMs, durSec * 1000 * mult);
}

export function pickAudioFormat(entry: FormatCacheEntry): StreamFormat | null {
  const pool = entry.audio.filter((f) => f.protocol === "https");
  if (!pool.length) return null;

  // Multi-language videos (YouTube auto-dubs / MrBeast-style multi-audio):
  // the video's ORIGINAL language track is the only acceptable one — a higher
  // -bitrate dub must NEVER win. Order of preference:
  //   1. tracks labelled with the video's original language
  //   2. unlabelled tracks (single-track sources; some sites leave the
  //      original unlabelled while dubs always carry a language)
  //   3. everything (last resort — original language simply not identifiable)
  const norm = (l?: string | null) => (l || "").trim().toLowerCase().split(/[-_]/)[0] || "";
  const marked = pool.filter((f) => !!norm(f.language));
  if (marked.length) {
    const original = norm(entry.originalLang);
    let candidates = original ? marked.filter((f) => norm(f.language) === original) : [];
    if (!candidates.length) {
      const unmarked = pool.filter((f) => !norm(f.language));
      if (unmarked.length) candidates = unmarked;
    }
    if (!candidates.length) {
      const unmarked = pool.filter((f) => !norm(f.language));
      candidates = unmarked.length ? unmarked : pool;
    }
    return bestAudio(candidates);
  }
  return bestAudio(pool);
}

/** Best audio within ONE language: highest abr, m4a/AAC preferred (copy-safe). */
function bestAudio(cands: StreamFormat[]): StreamFormat | null {
  const sorted = [...cands].sort((a, b) => (b.abr || 0) - (a.abr || 0));
  return (
    sorted.find((f) => f.ext === "m4a" || /mp4a/i.test(f.acodec)) ||
    sorted[0] ||
    null
  );
}

/** True when the audio format can be stream-copied into mp4 (original track, no re-encode). */
export function audioCopySafe(fmt?: StreamFormat | null): boolean {
  if (!fmt) return false;
  return fmt.ext === "m4a" || /mp4a|aac/i.test(fmt.acodec || "");
}

/** How the audio of a produced file relates to the source video's own track. */
export type AudioMode = "original" | "reencoded" | "none";

export interface CutResult {
  audioMode: AudioMode;
  /** Short human label of the audio actually inside the file (e.g. "AAC 128k"). */
  audioLabel?: string;
}

/** "AAC 128k"-style label for the audio stream we actually fed to the muxer. */
function audioCodecLabel(fmt?: StreamFormat | null): string {
  if (!fmt) return "";
  const c = fmt.acodec || "";
  const codec = /mp4a|aac/i.test(c)
    ? "AAC"
    : /opus/i.test(c)
      ? "OPUS"
      : /vorbis/i.test(c)
        ? "VORBIS"
        : /mp3/i.test(c)
          ? "MP3"
          : c
            ? c.split(".")[0].toUpperCase()
            : "AUDIO";
  const abr = fmt.abr ? ` ${Math.round(fmt.abr)}k` : "";
  // language code when known ("en" → "EN") — makes the picked track visible
  const lang = fmt.language ? ` · ${fmt.language.split(/[-_]/)[0].toUpperCase()}` : "";
  return `${codec}${abr}${lang}`;
}

function ffmpeg(
  args: string[],
  opts: {
    totalSec: number;
    onProgress?: (pct: number) => void;
    timeoutMs: number;
    signal?: { aborted: boolean };
  }
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", ["-hide_banner", "-nostdin", "-y", ...args], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderrTail = "";
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      proc.kill("SIGKILL");
      reject(new Error("Timed out while cutting this clip."));
    }, opts.timeoutMs);

    const abortTimer = opts.signal
      ? setInterval(() => {
          if (opts.signal!.aborted && !killed) {
            killed = true;
            proc.kill("SIGKILL");
          }
        }, 500)
      : null;

    let buf = "";
    proc.stdout.on("data", (d: Buffer) => {
      buf += d.toString();
      const lines = buf.split("\n");
      buf = lines.pop() || "";
      for (const line of lines) {
        const m = line.match(/^out_time_ms=(\d+)/);
        if (m && opts.onProgress) {
          const sec = Number(m[1]) / 1e6;
          const pct = Math.max(0, Math.min(99, (sec / opts.totalSec) * 100));
          opts.onProgress(pct);
        }
      }
    });

    const errChunks: Buffer[] = [];
    proc.stderr.on("data", (d: Buffer) => {
      errChunks.push(d);
      if (errChunks.length > 60) errChunks.shift();
    });

    proc.on("error", (e) => {
      clearTimeout(timer);
      if (abortTimer) clearInterval(abortTimer);
      reject(e);
    });

    proc.on("close", (code) => {
      clearTimeout(timer);
      if (abortTimer) clearInterval(abortTimer);
      stderrTail = Buffer.concat(errChunks).toString();
      if (killed) {
        reject(new Error("Cut was cancelled."));
      } else if (code === 0) {
        opts.onProgress?.(100);
        resolve();
      } else {
        const httpErr = stderrTail.match(/Server returned (\d+) .*/)?.[0];
        reject(new Error(httpErr || stderrTail.split("\n").filter(Boolean).slice(-2).join(" ").slice(0, 220) || `ffmpeg exited (${code})`));
      }
    });
  });
}

export async function probeDuration(file: string): Promise<number> {
  return new Promise((resolve) => {
    const p = spawn("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]);
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.on("close", () => {
      const n = parseFloat(out.trim());
      resolve(Number.isFinite(n) ? n : 0);
    });
    p.on("error", () => resolve(0));
  });
}

/** x264 preset by target height — 4K/2K need a faster preset on small CPUs. */
function presetFor(targetHeight: number | null): string {
  if (targetHeight == null) return "veryfast"; // source-height render of a small video
  if (targetHeight >= 1440) return "superfast";
  return "veryfast";
}

function buildCutArgs(
  videoUrl: string | null,
  audioUrl: string | null,
  combinedUrl: string | null,
  start: number,
  end: number,
  outPath: string,
  opts: {
    targetHeight: number | null;
    srcHeight: number | null;
    crf: number;
    audioOnly?: boolean;
    audioCopy?: boolean; // true = mux original audio track bit-for-bit (-c:a copy)
  }
): string[] {
  const args: string[] = ["-progress", "pipe:1", "-nostats"];
  // NOTE: never combine output `-t` with `-copyts` — with copyts, -t is applied on the
  // ABSOLUTE timeline (first pts ≈ start), which would discard the whole clip.
  // Input-side -ss/-to already bound every stream precisely.

  if (opts.audioOnly && audioUrl) {
    args.push("-ss", String(start), "-to", String(end), "-copyts", "-i", audioUrl);
    args.push("-vn", "-c:a", "libmp3lame", "-q:a", "0");
    args.push("-metadata", "title=Opal Clip", "-id3v2_version", "3");
    args.push(outPath);
    return args;
  }

  if (combinedUrl) {
    args.push("-ss", String(start), "-to", String(end), "-copyts", "-i", combinedUrl);
    args.push("-map", "0:v:0", "-map", "0:a:0?");
  } else {
    if (videoUrl) args.push("-ss", String(start), "-to", String(end), "-copyts", "-i", videoUrl);
    if (audioUrl) args.push("-ss", String(start), "-to", String(end), "-copyts", "-i", audioUrl);
    args.push("-map", "0:v:0");
    args.push("-map", "1:a:0?");
  }

  args.push("-c:v", "libx264", "-crf", String(opts.crf), "-preset", presetFor(opts.targetHeight), "-pix_fmt", "yuv420p");
  if (opts.targetHeight && opts.srcHeight && opts.srcHeight > opts.targetHeight) {
    args.push("-vf", `scale=-2:${opts.targetHeight}`);
  }
  if (opts.audioCopy) {
    // ORIGINAL AUDIO TRACK — stream copy, zero re-encode, zero quality loss.
    args.push("-c:a", "copy");
  } else {
    // last-resort fallback (non-AAC source codec that mp4 can't hold): transparent
    // AAC encode at the SOURCE's own sample rate — never resample, never merge a
    // synthetic track; this is still the original recording, just re-packaged.
    args.push("-c:a", "aac", "-b:a", "192k");
  }
  args.push("-movflags", "+faststart");
  args.push(outPath);
  return args;
}

/**
 * Cut a clip. The ORIGINAL AUDIO TRACK is the top priority at every retry
 * level: the audio stream YouTube serves (m4a/AAC) is muxed over with
 * `-c:a copy` — bit-for-bit the same track that plays on the source video,
 * never re-encoded, never resampled, never replaced with a synthetic one.
 *
 * Retry ladder (IMPORTANT — no silent downgrades):
 *   1. copy on the current stream URLs
 *   2. STALE URL error (403/401/… googlevideo links are IP-locked and expire)
 *      → refresh URLs and COPY AGAIN (original audio preserved — a stale URL
 *      is a transport problem, NOT a reason to re-encode the audio)
 *   3. GENUINE mux failure only (codec can't live in mp4 — only possible for
 *      non-AAC sources) → transparent AAC re-encode of the SAME source track
 *   4. re-encode that hits a stale URL → refresh and finish the re-encode
 */
export async function cutClip(
  entry: FormatCacheEntry,
  opts: CutOptions,
  getFresh: () => Promise<FormatCacheEntry>
): Promise<CutResult> {
  const attempt = async (e: FormatCacheEntry, copyAudio: boolean): Promise<CutResult> => {
    const { start, end, height } = opts;
    const video = pickVideoFormat(e, height ?? null);
    const audio = pickAudioFormat(e);
    const combined = e.combined.find((f) => f.protocol === "https") ?? null;

    if (!video && !combined) {
      // no direct-URL video format (HLS-only source) — cannot range-proxy
      throw new Error("This source only provides HLS streams which can't be cut precisely here.");
    }

    fs.mkdirSync(path.dirname(opts.outPath), { recursive: true });
    const dur = end - start;
    const args = buildCutArgs(
      video ? proxyUrl(video.url, e.viaTunnel) : null,
      audio ? proxyUrl(audio.url, e.viaTunnel) : null,
      video ? null : combined ? proxyUrl(combined.url, e.viaTunnel) : null,
      start,
      end,
      opts.outPath,
      {
        targetHeight: height ?? null,
        srcHeight: (combined && !video ? combined.height : video?.height) ?? null,
        crf: opts.crf ?? 18,
        audioCopy: copyAudio,
      }
    );

    // Work height = max(source decode height, output height) — drives the timeout.
    const srcH = (combined && !video ? combined.height : video?.height) ?? 0;
    const workHeight = Math.max(srcH, height ?? 0);
    const timeout = cutTimeoutMs(dur, workHeight);
    await ffmpeg(args, { totalSec: dur, onProgress: opts.onProgress, timeoutMs: timeout, signal: opts.signal });

    const outDur = await probeDuration(opts.outPath);
    if (outDur <= 0.2 * dur) {
      throw new Error("Output clip looks empty — stream may have moved.");
    }

    // Report EXACTLY what audio ended up in the file.
    const audioSrc =
      video && audio ? audio : !video && combined ? combined : null;
    if (!audioSrc) return { audioMode: "none" };
    if (!copyAudio) return { audioMode: "reencoded", audioLabel: "AAC 192k" };
    return { audioMode: "original", audioLabel: audioCodecLabel(audioSrc) };
  };

  // original-audio decision: the stream actually feeding audio into the muxer
  const planCopy = (e: FormatCacheEntry) => {
    const video = pickVideoFormat(e, opts.height ?? null);
    const audio = pickAudioFormat(e);
    const combined = e.combined.find((f) => f.protocol === "https") ?? null;
    if (video && audio) return audioCopySafe(audio); // separate audio stream
    if (!video && combined) return audioCopySafe(combined); // muxed stream carries the audio
    return false;
  };

  // Stale/broken TRANSPORT (URLs expired or network blipped). The fix is fresh
  // URLs — NOT re-encoding the audio. Note: the proxied audio URL contains
  // "mime=audio/mp4", so stale errors routinely contain the word "audio" —
  // matching on that word alone (old bug) silently downgraded clips to a
  // re-encoded 192k track instead of the original one.
  const stale = (m: string) =>
    /\b40[134]\b|server returned|http error|expired|gone|empty|moved|connection|reset by peer|unable to open|input\/output error|invalid data|temporarily/i.test(
      m
    );

  // GENUINE "this codec cannot be stream-copied into mp4" muxer failures.
  const muxFail = (m: string) =>
    /could not find tag for codec|monotonic|operation not permitted|could not write header|incompatible|error initializing|only .* in .* experimental|muxer/i.test(
      m
    );

  const runCopy = async (e: FormatCacheEntry): Promise<CutResult> => {
    try {
      return await attempt(e, planCopy(e));
    } catch (err) {
      const msg = (err as Error).message || "";
      if (planCopy(e) && muxFail(msg)) {
        // codec genuinely can't be copied into mp4 → transparent AAC of the same track
        return attempt(e, false);
      }
      if (stale(msg)) throw err; // bubble to the refresh handler below
      throw err;
    }
  };

  try {
    // 1+2: copy now; if URLs went stale, refresh and COPY AGAIN (original kept)
    return await runCopy(entry);
  } catch (err) {
    const msg = (err as Error).message || "";
    if (!stale(msg)) throw err;
    const fresh = await getFresh(); // refreshFormats()
    try {
      return await runCopy(fresh);
    } catch (err2) {
      const m2 = (err2 as Error).message || "";
      if (!stale(m2)) throw err2;
      // still stale — one more refresh; keep the original-copy if at all possible,
      // and only drop to a re-encode on a GENUINE mux failure (never on a
      // timeout/network error — that would just double the wait for nothing)
      const fresh2 = await getFresh();
      try {
        return await runCopy(fresh2);
      } catch (err3) {
        const m3 = (err3 as Error).message || "";
        if (muxFail(m3)) return attempt(fresh2, false);
        throw err3;
      }
    }
  }
}

/** Extract a poster frame at clip start (from local preview file — instant). */
export async function makePoster(previewPath: string, posterPath: string): Promise<boolean> {
  try {
    await ffmpeg(
      ["-y", "-ss", "0.4", "-i", previewPath, "-frames:v", "1", "-q:v", "4", posterPath],
      { totalSec: 1, timeoutMs: 20000 }
    );
    return fs.existsSync(posterPath);
  } catch {
    return false;
  }
}

/**
 * Shift the file's presentation timeline to start at zero (fast stream-copy
 * remux). The frame-accurate cut uses -copyts, which keeps ORIGINAL absolute
 * timestamps (clip 60s→90s stays 60→90 inside the file) — great for precision,
 * but an embedded <video> would then start its clock at 60 with an empty lead,
 * breaking scrub position and any timestamp UI. Normalizing to 0 keeps the
 * embedded preview clock relative, so the UI can map it back to the source
 * timeline exactly (srcTime = clip.start + currentTime). Best effort: on
 * failure the original file is kept (still playable, just offset).
 */
export async function normalizeTs(file: string): Promise<boolean> {
  const ext = path.extname(file);
  const tmp = file + ".norm" + ext;
  try {
    await ffmpeg(
      ["-y", "-i", file, "-c", "copy", "-avoid_negative_ts", "make_zero", "-movflags", "+faststart", tmp],
      { totalSec: 1, timeoutMs: 180000 }
    );
    if (!fs.existsSync(tmp) || fs.statSync(tmp).size < 1024) throw new Error("empty normalize output");
    fs.renameSync(tmp, file);
    return true;
  } catch {
    try {
      fs.rmSync(tmp, { force: true });
    } catch {
      /* ignore */
    }
    return false;
  }
}

/** Render MP3 (audio-only) directly from the source audio stream. */
export async function renderMp3(
  entry: FormatCacheEntry,
  opts: CutOptions,
  getFresh: () => Promise<FormatCacheEntry>
): Promise<void> {
  const attempt = async (e: FormatCacheEntry) => {
    const audio = pickAudioFormat(e);
    if (!audio) throw new Error("No audio stream found for this video.");
    fs.mkdirSync(path.dirname(opts.outPath), { recursive: true });
    const dur = opts.end - opts.start;
    const args = buildCutArgs(
      null,
      proxyUrl(audio.url, e.viaTunnel),
      null,
      opts.start,
      opts.end,
      opts.outPath,
      { targetHeight: null, srcHeight: null, crf: 18, audioOnly: true }
    );
    await ffmpeg(args, {
      totalSec: dur,
      onProgress: opts.onProgress,
      timeoutMs: Math.max(90000, dur * 1000 * 5),
      signal: opts.signal,
    });
  };
  try {
    await attempt(entry);
  } catch (err) {
    const msg = (err as Error).message || "";
    if (/403|401|expired|gone/i.test(msg)) {
      await attempt(await getFresh());
    } else throw err;
  }
}

export function clipFilePath(clipId: string, quality: string): string {
  const ext = quality === "mp3" ? "mp3" : "mp4";
  return path.join(clipDir(clipId), `q_${quality}.${ext}`);
}
