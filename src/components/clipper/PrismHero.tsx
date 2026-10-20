"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * The 3D hero — a precision glass prism rotating in space.
 * - 6 translucent faces with acid-lime hairline edges (preserve-3d)
 * - Glowing acid core breathing inside
 * - Slow endless spin + float
 * - Mouse parallax on desktop (the prism leans toward the cursor)
 */
export function PrismHero({ size = 128 }: { size?: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  // mouse parallax — prism leans toward cursor (desktop only)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const leanX = useSpring(useTransform(my, [-1, 1], [10, -10]), { stiffness: 60, damping: 16 });
  const leanY = useSpring(useTransform(mx, [-1, 1], [-12, 12]), { stiffness: 60, damping: 16 });

  const onMove = (e: React.PointerEvent) => {
    const el = wrapRef.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    my.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const half = size / 2;
  const face = size;

  const faceStyle: React.CSSProperties = {
    position: "absolute",
    width: face,
    height: face,
    borderRadius: 4,
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.012) 46%, rgba(228,242,34,0.05) 100%)",
    boxShadow:
      "rgba(228,242,34,0.16) 0 0 0 1px inset, rgba(255,255,255,0.07) 0 0 0 1px inset, rgba(0,0,0,0.35) 0 2px 18px 0",
    backfaceVisibility: "hidden",
  };

  return (
    <div
      ref={wrapRef}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="relative select-none pointer-events-auto grid place-items-center"
      style={{ width: size * 1.7, height: size * 1.7 }}
      aria-hidden
    >
      {/* ambient acid wash behind the prism */}
      <div
        className="absolute animate-aurora"
        style={{
          width: size * 1.9,
          height: size * 1.9,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(228,242,34,0.075) 0%, rgba(228,242,34,0.02) 38%, transparent 66%)",
          filter: "blur(22px)",
        }}
      />

      {/* the floating 3D assembly */}
      <motion.div
        className="preserve-3d"
        style={{ rotateX: leanX, rotateY: leanY, perspective: 1200 }}
      >
        <div className="animate-prism-float preserve-3d">
          <div
            className="preserve-3d animate-prism-spin"
            style={{ width: face, height: face, position: "relative" }}
          >
            {/* 6 glass faces */}
            <div style={{ ...faceStyle, transform: `translateZ(${half}px)` }} />
            <div style={{ ...faceStyle, transform: `rotateY(180deg) translateZ(${half}px)` }} />
            <div style={{ ...faceStyle, transform: `rotateY(90deg) translateZ(${half}px)` }} />
            <div style={{ ...faceStyle, transform: `rotateY(-90deg) translateZ(${half}px)` }} />
            <div style={{ ...faceStyle, transform: `rotateX(90deg) translateZ(${half}px)` }} />
            <div style={{ ...faceStyle, transform: `rotateX(-90deg) translateZ(${half}px)` }} />

            {/* acid core — a smaller glowing cube suspended in the center */}
            <div
              className="preserve-3d"
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: face * 0.34,
                height: face * 0.34,
                marginLeft: -face * 0.17,
                marginTop: -face * 0.17,
                transform: "rotateY(45deg) rotateX(18deg)",
              }}
            >
              <div
                className="animate-core-breathe"
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 3,
                  background: "linear-gradient(135deg, #eefba0 0%, #e4f222 55%, #b8cc1a 100%)",
                }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* floor shadow — grounds the 3D object */}
      <div
        className="absolute animate-prism-float"
        style={{
          bottom: size * 0.08,
          width: size * 1.15,
          height: size * 0.2,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 68%)",
          filter: "blur(6px)",
          animationDelay: "-0.6s",
        }}
      />
    </div>
  );
}
