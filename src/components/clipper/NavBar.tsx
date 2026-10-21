"use client";

import { motion } from "framer-motion";
import { OpalMark, HourglassIcon, ScissorsGlyph } from "./icons";
import { useOpal, type TabKey } from "@/lib/clipper/store";

/** cx = centre inside the dock (reference geometry, 274-wide dock) */
const TABS: { key: TabKey; label: string; cx: number }[] = [
  { key: "home", label: "Home", cx: 50.5 },
  { key: "clips", label: "My Clips", cx: 136.7 },
  { key: "queue", label: "Timer", cx: 221.3 },
];

/**
 * Floating dock — traced from the reference: 274 × 62, radius 31,
 * the selected capsule (94 × 57.5) springs between tabs.
 */
export function NavBar() {
  const tab = useOpal((s) => s.tab);
  const setTab = useOpal((s) => s.setTab);
  const clips = useOpal((s) => s.clips);
  const renders = useOpal((s) => s.renders);

  const activeJobs =
    clips.filter((c) => c.status === "queued" || c.status === "cutting").length +
    renders.filter((r) => r.status === "queued" || r.status === "rendering").length;

  const tabIdx = TABS.findIndex((t) => t.key === tab);
  const capsuleX = tabIdx <= 0 ? 0 : tabIdx === 1 ? 43.1 : 85.4;

  return (
    <nav
      aria-label="Primary"
      className="relative z-20 flex justify-center pb-5 pt-2"
      style={{
        background: "linear-gradient(to top, rgba(7,10,9,0.94) 18%, rgba(7,10,9,0.6) 70%, transparent)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 210, damping: 26, delay: 1.15 }}
        style={{
          position: "relative",
          width: 274,
          maxWidth: "100%",
          height: 62,
          borderRadius: 31,
          background: "linear-gradient(180deg,#202020 0%,#191919 55%,#151515 100%)",
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.055), inset 0 1px 0 rgba(255,255,255,0.07), 0 16px 34px -18px rgba(0,0,0,0.95)",
        }}
      >
        {/* selected capsule */}
        <motion.span
          aria-hidden="true"
          initial={false}
          animate={{ x: capsuleX }}
          transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.6 }}
          style={{
            position: "absolute",
            left: 3.5,
            top: 2.5,
            width: 94,
            height: 57.5,
            borderRadius: 28.5,
            background: "linear-gradient(180deg,#414141 0%,#3a3a3a 60%,#343434 100%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 16px -10px rgba(0,0,0,0.9)",
          }}
        />

        {TABS.map((t) => {
          const active = tab === t.key;
          const badge =
            t.key === "queue"
              ? activeJobs
              : t.key === "clips"
                ? clips.filter((c) => c.status === "ready").length
                : 0;
          return (
            <motion.button
              key={t.key}
              type="button"
              aria-label={t.label}
              aria-current={active ? "page" : undefined}
              onClick={() => setTab(t.key)}
              whileTap={{ scale: 0.94 }}
              style={{
                position: "absolute",
                left: t.cx - 47,
                top: 0,
                width: 94,
                height: 62,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4.6,
                paddingTop: 6.4,
                borderRadius: 28,
                zIndex: 2,
              }}
            >
              <motion.span
                animate={{ opacity: active ? 1 : 0.92, scale: active ? 1 : 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 23,
                  width: 30,
                  color: active ? "#ffffff" : "#f3fbf8",
                }}
              >
                {t.key === "home" && <OpalMark style={{ width: 24.6, height: 24.4 }} strokeWidth={2.5} />}
                {t.key === "clips" && <ScissorsGlyph style={{ width: 23, height: 23 }} />}
                {t.key === "queue" && <HourglassIcon style={{ width: 15, height: 22 }} />}
                {badge > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    className="mono-meta"
                    style={{
                      position: "absolute",
                      top: -5,
                      right: -7,
                      minWidth: 16,
                      height: 16,
                      padding: "0 4px",
                      borderRadius: 8,
                      background: "#CDFCE2",
                      color: "#0b0e0d",
                      fontSize: 9.5,
                      fontWeight: 600,
                      display: "grid",
                      placeItems: "center",
                      boxShadow: "0 0 10px -1px rgba(183,247,230,0.55)",
                    }}
                  >
                    {badge > 9 ? "9+" : badge}
                  </motion.span>
                )}
              </motion.span>
              <span
                className="t-tab"
                style={{
                  lineHeight: "13px",
                  color: active ? "#ffffff" : "#eaf5f1",
                  opacity: active ? 1 : 0.94,
                }}
              >
                {t.label}
              </span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* home indicator */}
      <div
        aria-hidden="true"
        className="absolute bottom-1.5 left-1/2 -translate-x-1/2"
        style={{ width: 120, height: 5, borderRadius: 999, background: "rgba(255,255,255,0.2)" }}
      />
    </nav>
  );
}
