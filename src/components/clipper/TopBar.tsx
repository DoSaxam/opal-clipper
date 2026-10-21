"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { FlameIcon, OpalMark, PersonGlyph, ProfileShield } from "./icons";

const spring = { type: "spring" as const, stiffness: 520, damping: 32, mass: 0.7 };

/**
 * Top bar — traced from the reference (y 54 → 120):
 *  · Opal wordmark  — rotating hexagon mark + "pal" word
 *  · streak flame + count (wired to lifetime clip stats)
 *  · profile shield + person glyph
 */
export function TopBar({ streak = 5 }: { streak?: number }) {
  const [pop, setPop] = useState(0);

  return (
    <div className="relative flex items-center" style={{ height: 66, padding: "11.5px 0 0 28.5px" }}>
      {/* ---------- wordmark ---------- */}
      <motion.div
        initial={{ opacity: 0, y: -7 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
        style={{ position: "relative", width: 70, height: 34 }}
        aria-label="Opal"
        role="img"
      >
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            display: "block",
            width: 22.6,
            height: 30.5,
            color: "#fff",
          }}
        >
          <OpalMark style={{ width: 22.6, height: 30.5 }} strokeWidth={2.5} />
        </motion.span>

        <svg
          width={52}
          height={40}
          viewBox="0 0 52 40"
          style={{ position: "absolute", left: 18.9, top: -14.8, overflow: "visible" }}
          aria-hidden="true"
        >
          <text
            x={0}
            y={38.6}
            fill="#ffffff"
            fontFamily="var(--font-inter), sans-serif"
            fontSize={39}
            fontWeight={400}
            letterSpacing="-0.1"
          >
            pal
          </text>
        </svg>
      </motion.div>

      <div className="flex-1" />

      {/* ---------- streak ---------- */}
      <div style={{ display: "flex", alignItems: "center", gap: 3.4, paddingRight: 28.5 }}>
        <motion.button
          type="button"
          aria-label={`Day streak: ${streak}`}
          onClick={() => setPop((n) => n + 1)}
          whileTap={{ scale: 0.85 }}
          animate={{ scale: [1, 1.08, 0.98, 1.04, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.6, ease: "easeInOut" }}
          style={{ position: "relative", width: 16.4, height: 18.4, display: "block", borderRadius: 8 }}
        >
          <FlameIcon
            style={{ width: 16.4, height: 18.4, filter: "drop-shadow(0 0 5px rgba(255,196,110,0.5))" }}
          />
          <AnimatePresence>
            {pop > 0 && (
              <motion.span
                key={pop}
                initial={{ opacity: 0.8, scale: 0.3, y: 0 }}
                animate={{ opacity: 0, scale: 1.6, y: -15 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  inset: -7,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(255,196,110,0.6), rgba(255,196,110,0) 70%)",
                  pointerEvents: "none",
                }}
              />
            )}
          </AnimatePresence>
        </motion.button>
        <motion.span
          key={streak}
          initial={false}
          animate={{ scale: [0.9, 1] }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
          style={{
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: "-0.7px",
            lineHeight: 1,
            color: "#F2DEA9",
            fontVariantNumeric: "tabular-nums",
            display: "block",
          }}
        >
          {streak}
        </motion.span>

        {/* ---------- profile ---------- */}
        <motion.button
          type="button"
          aria-label="Open profile"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...spring, delay: 0.18 }}
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.045 }}
          style={{ position: "relative", width: 36.6, height: 35, display: "block", borderRadius: 12 }}
        >
          <ProfileShield style={{ width: 36.6, height: 35, display: "block" }} />
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PersonGlyph style={{ width: 20.5, height: 20.5, marginTop: 1.2 }} />
          </span>
        </motion.button>
      </div>
    </div>
  );
}
