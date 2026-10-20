"use client";

import { useState } from "react";
import { Film } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Video thumbnail.
 * Served through the app's own /api/thumb route (which fetches via the WARP
 * tunnel) so images still load when the browser's direct egress is blocked.
 * Falls back to a neutral placeholder instead of a broken image.
 */
export function Thumb({
  videoId,
  src,
  alt = "",
  className,
  style,
}: {
  videoId?: string;
  src?: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [failed, setFailed] = useState(false);
  const url = videoId ? `/api/thumb?v=${encodeURIComponent(videoId)}` : src;

  if (failed || !url) {
    return (
      <div
        className={cn(
          "grid place-items-center bg-[var(--surface-sunken)]",
          className
        )}
        style={style}
      >
        <Film className="size-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
      style={style}
    />
  );
}
