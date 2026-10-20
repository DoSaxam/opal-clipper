import { NextResponse } from "next/server";
import { getVideo } from "@/lib/server/state";
import { proxyFetchThroughTunnel } from "@/lib/server/tunnel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Thumbnail proxy.
 *
 * The browser often cannot reach i.ytimg.com directly (datacenter egress is
 * blocked by YouTube), so the server fetches the image through the WARP
 * tunnel and re-serves it.
 *
 * Only videos that were already analyzed in this instance are served, and the
 * stored URL must be on YouTube's image CDN — no arbitrary URL fetching.
 */

const ALLOWED_HOSTS = [
  "i.ytimg.com",
  "i9.ytimg.com",
  "i1.ytimg.com",
  "i2.ytimg.com",
  "i3.ytimg.com",
  "yt3.ggpht.com",
  "yt3.googleusercontent.com",
];

function hostAllowed(raw: string): boolean {
  try {
    const h = new URL(raw).hostname.toLowerCase();
    return ALLOWED_HOSTS.some((a) => h === a || h.endsWith(`.${a}`));
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("v") || "";
  if (!id) return new Response("Missing video id", { status: 400 });

  const video = getVideo(id);
  if (!video?.thumbnail) return new Response("Not found", { status: 404 });
  if (!hostAllowed(video.thumbnail)) return new Response("Not allowed", { status: 403 });

  try {
    const upstream = await proxyFetchThroughTunnel(video.thumbnail, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: "https://www.youtube.com/",
      },
    });

    if (!upstream.ok) return new Response("Upstream failed", { status: 502 });

    const body = upstream.body;
    if (!body) return new Response("Empty", { status: 502 });

    const type = upstream.headers.get("content-type") || "image/jpeg";
    return new Response(body as unknown as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new Response("Proxy error", { status: 502 });
  }
}
