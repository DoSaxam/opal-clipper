"use client";

import Image from "next/image";
import { useMemo } from "react";

/**
 * The opal: generated gem art wrapped in layered light.
 * Volumetric rays, a breathing iridescent halo, floating dust.
 */
export function GemHero({ size = 200, mini = false }: { size?: number; mini?: boolean }) {
  const sparkles = useMemo(
    () =>
      Array.from({ length: mini ? 5 : 10 }, (_, i) => ({
        left: `${8 + ((i * 37) % 84)}%`,
        top: `${6 + ((i * 53) % 78)}%`,
        size: 1.4 + ((i * 7) % 3),
        delay: (i * 0.7) % 2.8,
        dur: 2.4 + ((i * 13) % 20) / 10,
        tone: i % 3,
      })),
    [mini]
  );

  const tone = ["#f6e05e", "#4fd1c5", "#63b3ed"];

  return (
    <div
      className="pointer-events-none relative grid select-none place-items-center"
      style={{ width: size * 1.45, height: size * 1.45 }}
      aria-hidden
    >
      {/* rotating god rays */}
      <div
        className="animate-rotate-slow absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0deg, color-mix(in oklab, var(--brand-teal) 9%, transparent) 12deg, transparent 26deg, transparent 92deg, color-mix(in oklab, var(--brand-blue) 8%, transparent) 104deg, transparent 118deg, transparent 182deg, color-mix(in oklab, var(--brand-teal) 8%, transparent) 194deg, transparent 208deg, transparent 272deg, color-mix(in oklab, var(--brand-violet) 7%, transparent) 284deg, transparent 298deg)",
          filter: "blur(8px)",
        }}
      />
      {/* breathing halo */}
      <div
        className="animate-pulse-soft absolute"
        style={{
          width: size * 1.2,
          height: size * 1.2,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--brand-teal) 34%, transparent) 0%, color-mix(in oklab, var(--brand-blue) 18%, transparent) 36%, color-mix(in oklab, var(--brand-violet) 12%, transparent) 60%, transparent 74%)",
          filter: "blur(20px)",
        }}
      />
      {/* the gem */}
      <div className="animate-float" style={{ width: size, height: size }}>
        <div
          className="animate-hue size-full overflow-hidden rounded-full"
          style={{
            boxShadow:
              "0 0 60px color-mix(in oklab, var(--brand-teal) 30%, transparent), 0 0 130px color-mix(in oklab, var(--brand-blue) 16%, transparent)",
          }}
        >
          <Image
            src="/gem-hero.png"
            alt=""
            width={640}
            height={640}
            priority
            className="size-full object-cover"
            style={{ borderRadius: "50%", transform: "scale(1.5) translateY(3%)" }}
          />
        </div>
      </div>
      {/* dust */}
      {sparkles.map((s, i) => (
        <span
          key={i}
          className="animate-twinkle absolute rounded-full"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            background: tone[s.tone],
            boxShadow: `0 0 ${s.size * 3}px ${tone[s.tone]}`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
          }}
        />
      ))}
    </div>
  );
}
