"use client";

import { motion } from "framer-motion";
import { House, Scissors, Timer, type LucideIcon } from "lucide-react";
import { useOpal, type TabKey } from "@/lib/clipper/store";

const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "home", label: "Home", icon: House },
  { key: "clips", label: "My Clips", icon: Scissors },
  { key: "queue", label: "Timer", icon: Timer },
];

export function TabBar() {
  const tab = useOpal((s) => s.tab);
  const setTab = useOpal((s) => s.setTab);
  const clips = useOpal((s) => s.clips);
  const renders = useOpal((s) => s.renders);

  const activeJobs =
    clips.filter((c) => c.status === "queued" || c.status === "cutting").length +
    renders.filter((r) => r.status === "queued" || r.status === "rendering").length;

  return (
    <nav
      className="relative z-20 px-5 pb-5 pt-2"
      style={{
        background: "linear-gradient(to top, rgba(5,6,8,0.92) 20%, rgba(5,6,8,0.55) 70%, transparent)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around">
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          const badge = key === "queue" ? activeJobs : key === "clips" ? clips.filter((c) => c.status === "ready").length : 0;
          return (
            <motion.button
              key={key}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 500, damping: 26 }}
              onClick={() => setTab(key)}
              className="relative flex flex-col items-center gap-1 px-4 py-1.5 rounded-2xl"
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-2xl"
                  style={{ background: "#2D3748" }}
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <span className="relative">
                <Icon
                  size={21}
                  strokeWidth={active ? 2.1 : 1.8}
                  style={{ color: active ? "#FFFFFF" : "#718096" }}
                />
                {badge > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full text-[9px] font-bold grid place-items-center"
                    style={{ background: "#81E6D9", color: "#0A0B0D" }}
                  >
                    {badge > 9 ? "9+" : badge}
                  </motion.span>
                )}
              </span>
              <span
                className="relative text-[10.5px] font-semibold tracking-wide"
                style={{ color: active ? "#FFFFFF" : "#718096" }}
              >
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>
      {/* iOS home indicator */}
      <div className="mx-auto mt-2.5 w-[120px] h-[5px] rounded-full bg-white/25" />
    </nav>
  );
}
