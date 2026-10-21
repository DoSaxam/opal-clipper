"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Hero art (reference 393 × 480 @3x): cave walls, stone plinth and the glowing opal.
 * The bitmap is the original artwork with the UI glyphs cleaned out, so the
 * app keeps the exact photographic lighting of the reference.
 * Live layers: breathing mint aura behind the stone + a slow shimmer sweep.
 * The bottom blends into the app background so content flows out of the cave.
 */
export function Hero({ height = 430 }: { height?: number }) {
  const reduce = useReducedMotion();

  return (
    <div className="relative w-full overflow-hidden" style={{ height }}>
      <motion.img
        src="/assets/hero.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        initial={{ scale: 1.045, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: "cover",
          objectPosition: "50% 32%",
          transformOrigin: "50% 32%",
        }}
      />

      {/* breathing aura behind the gem */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={
          reduce
            ? { opacity: 0.1, scale: 1 }
            : { opacity: [0, 0.42, 0], scale: [0.92, 1.06, 0.92] }
        }
        transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut", delay: 2.2 }}
        style={{
          position: "absolute",
          left: "24%",
          top: "27%",
          width: "51%",
          aspectRatio: "200 / 224",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(150,255,214,0.5), rgba(120,255,200,0.12) 55%, rgba(120,255,200,0) 76%)",
          mixBlendMode: "screen",
          filter: "blur(6px)",
          pointerEvents: "none",
        }}
      />

      {/* gem shimmer sweep */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={reduce ? { opacity: 0 } : { opacity: [0, 0.5, 0], x: [-26, 26, -26] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 3.4 }}
        style={{
          position: "absolute",
          left: "35%",
          top: "36%",
          width: "30%",
          aspectRatio: "118 / 120",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(255,255,255,0.5), rgba(180,255,235,0.16) 58%, rgba(180,255,235,0) 80%)",
          mixBlendMode: "overlay",
          filter: "blur(3px)",
          pointerEvents: "none",
        }}
      />

      {/* drifting sparks above the cave art */}
      {!reduce && (
        <div aria-hidden="true" className="absolute inset-0">
          {[
            { x: "32%", y: "11%", d: 0, s: 3.2, o: 0.5 },
            { x: "68%", y: "9%", d: 1.4, s: 2.4, o: 0.35 },
            { x: "53%", y: "15%", d: 2.6, s: 2.8, o: 0.3 },
            { x: "82%", y: "17%", d: 0.7, s: 2, o: 0.28 },
          ].map((sp, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, sp.o, 0], y: [0, -10, -18] }}
              transition={{ duration: 6.5, repeat: Infinity, delay: sp.d + 1.4, ease: "easeInOut" }}
              style={{
                position: "absolute",
                left: sp.x,
                top: sp.y,
                width: sp.s,
                height: sp.s,
                borderRadius: "50%",
                background: "rgba(214,255,238,0.9)",
                boxShadow: "0 0 6px rgba(190,255,225,0.8)",
              }}
            />
          ))}
        </div>
      )}

      {/* bottom blend into the app background */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "100%",
          height: 190,
          background:
            "linear-gradient(180deg, rgba(11,14,13,0) 0%, rgba(11,14,13,0.45) 40%, rgba(11,14,13,0.85) 72%, rgba(11,14,13,0.985) 92%, #0b0e0d 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
