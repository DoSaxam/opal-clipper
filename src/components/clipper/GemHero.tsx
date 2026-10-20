"use client";

import Image from "next/image";
import { useMemo } from "react";

/**
 * The hero opal gem: generated art + layered CSS light effects.
 * - Volumetric god-rays slowly rotating behind the gem
 * - Breathing iridescent glow
 * - Twinkling cave dust
 * - The gem itself floats gently and shifts hue
 */
export function GemHero({ size = 210, mini = false }: { size?: number; mini?: boolean }) {
  const sparkles = useMemo(
    () =>
      Array.from({ length: mini ? 5 : 11 }, (_, i) => ({
        left: `${8 + ((i * 37) % 84)}%`,
        top: `${6 + ((i * 53) % 78)}%`,
        size: 1.5 + ((i * 7) % 3),
        delay: (i * 0.7) % 2.8,
        dur: 2.4 + ((i * 13) % 20) / 10,
      })),
    [mini]
  );

  return (
    <div
      className="relative grid place-items-center select-none pointer-events-none"
      style={{ width: size * 1.5, height: size * 1.5 }}
      aria-hidden
    >
      {/* rotating god rays */}
      <div
        className="absolute inset-0 animate-rays"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0deg, rgba(129,230,217,0.05) 12deg, transparent 24deg, transparent 90deg, rgba(99,179,237,0.045) 102deg, transparent 114deg, transparent 180deg, rgba(129,230,217,0.05) 192deg, transparent 204deg, transparent 270deg, rgba(183,148,244,0.04) 282deg, transparent 294deg)",
          borderRadius: "50%",
          filter: "blur(6px)",
        }}
      />
      {/* breathing glow */}
      <div
        className="absolute animate-gem-glow"
        style={{
          width: size * 1.18,
          height: size * 1.18,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(129,230,217,0.32) 0%, rgba(99,179,237,0.18) 34%, rgba(85,60,154,0.12) 58%, transparent 72%)",
          filter: "blur(18px)",
        }}
      />
      {/* gem */}
      <div className="animate-gem-float" style={{ width: size, height: size }}>
        <div
          className="animate-hue-breathe w-full h-full"
          style={{
            borderRadius: "50%",
            overflow: "hidden",
            boxShadow: "0 0 60px rgba(129,230,217,0.28), 0 0 120px rgba(99,179,237,0.14)",
          }}
        >
          <Image
            src="/gem-hero.png"
            alt=""
            width={640}
            height={640}
            priority
            className="w-full h-full object-cover"
            style={{ borderRadius: "50%", transform: "scale(1.35) translateY(4%)" }}
          />
        </div>
      </div>
      {/* sparkles */}
      {sparkles.map((s, i) => (
        <span
          key={i}
          className="absolute animate-sparkle rounded-full"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            background: i % 3 === 0 ? "#F6E05E" : i % 3 === 1 ? "#81E6D9" : "#63B3ED",
            boxShadow: `0 0 ${s.size * 3}px currentColor`,
            color: i % 3 === 0 ? "#F6E05E" : i % 3 === 1 ? "#81E6D9" : "#63B3ED",
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
          }}
        />
      ))}
    </div>
  );
}
