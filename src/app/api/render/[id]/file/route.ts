import path from "path";
import { clipDir, sanitizeFilename, fmtTime } from "@/lib/server/paths";
import { getClip, getRender, getVideo } from "@/lib/server/state";
import { serveFile } from "@/lib/server/serve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const render = getRender(id);
  if (!render) return new Response("Not found", { status: 404 });
  if (render.status !== "ready") return new Response("Render not ready", { status: 409 });

  const clip = getClip(render.clipId);
  const video = clip ? getVideo(clip.videoId) : undefined;
  const ext = render.quality === "mp3" ? "mp3" : "mp4";
  const file = path.join(clipDir(render.clipId), `q_${render.quality}.${ext}`);

  const qLabel = render.quality === "mp3" ? "audio" : `${render.quality}p`;
  const base = video ? sanitizeFilename(video.title, 60) : "clip";
  const name = `${base} · ${fmtTime(clip?.start ?? 0)}-${fmtTime(clip?.end ?? 0)} [${qLabel}].${ext}`;

  return serveFile(file, req, {
    contentType: ext === "mp3" ? "audio/mpeg" : "video/mp4",
    downloadName: name,
  });
}
