import path from "path";
import { clipDir } from "@/lib/server/paths";
import { getClip } from "@/lib/server/state";
import { serveFile } from "@/lib/server/serve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const clip = getClip(id);
  if (!clip || !clip.hasPoster) return new Response("Not found", { status: 404 });
  return serveFile(path.join(clipDir(id), "poster.jpg"), req, { contentType: "image/jpeg" });
}
