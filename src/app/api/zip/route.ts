import { Readable } from "stream";
import { createRequire } from "module";
import { clipDir, sanitizeFilename, fmtTime } from "@/lib/server/paths";
import { getClip, getRender, getVideo } from "@/lib/server/state";

// archiver is CJS — require() it directly for reliable interop under Turbopack externals
const require = createRequire(import.meta.url);
const archiver = require("archiver") as (
  format: "zip",
  opts?: { zlib?: { level?: number } }
) => import("archiver").Archiver;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Bulk download: zip of ready renders. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const ids = (u.searchParams.get("ids") || "").split(",").filter(Boolean);
  if (!ids.length) return new Response("No render ids", { status: 400 });

  const files: { path: string; name: string }[] = [];
  for (const id of ids) {
    const render = getRender(id);
    if (!render || render.status !== "ready") continue;
    const clip = getRender(id) ? getClip(render.clipId) : undefined;
    const video = clip ? getVideo(clip.videoId) : undefined;
    const ext = render.quality === "mp3" ? "mp3" : "mp4";
    const qLabel = render.quality === "mp3" ? "audio" : `${render.quality}p`;
    const base = video ? sanitizeFilename(video.title, 50) : "clip";
    const name = `${base} · ${fmtTime(clip?.start ?? 0)}-${fmtTime(clip?.end ?? 0)} [${qLabel}].${ext}`;
    const file = `${clipDir(render.clipId)}/q_${render.quality}.${ext}`;
    files.push({ path: file, name });
  }

  if (!files.length) return new Response("No ready renders", { status: 409 });

  const archive = archiver("zip", { zlib: { level: 1 } }); // store-ish: fast, video is already compressed
  const webStream = Readable.toWeb(archive as unknown as Readable) as ReadableStream;

  for (const f of files) archive.file(f.path, { name: f.name });
  archive.finalize().catch(() => {});

  return new Response(webStream, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent("opal-clips.zip")}`,
    },
  });
}
