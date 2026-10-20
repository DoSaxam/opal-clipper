import { NextResponse } from "next/server";
import { getTunnelStatus } from "@/lib/server/tunnel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getTunnelStatus();
  return NextResponse.json({ ...status, ok: status.warpOn && status.socksUp && status.httpProxyUp && status.mediaProxyUp });
}
