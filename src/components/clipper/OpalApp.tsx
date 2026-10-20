"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "sonner";
import { BackgroundFX } from "./BackgroundFX";
import { StatusBar } from "./StatusBar";
import { TabBar } from "./TabBar";
import { HomeScreen } from "./HomeScreen";
import { VideoScreen } from "./VideoScreen";
import { QueueScreen } from "./QueueScreen";
import { ClipsScreen } from "./ClipsScreen";
import { useOpal, startPolling } from "@/lib/clipper/store";

export function OpalApp() {
  const tab = useOpal((s) => s.tab);
  const screen = useOpal((s) => s.screen);
  const loaded = useOpal((s) => s.loaded);

  useEffect(() => {
    startPolling();
    useOpal.getState().bumpStats({}); // hydrate stats from localStorage
  }, []);

  return (
    <div className="min-h-dvh w-full grid place-items-center" style={{ background: "#050608" }}>
      {/* ambient glow behind the phone (desktop) */}
      <div
        className="fixed inset-0 pointer-events-none hidden md:block"
        style={{
          background:
            "radial-gradient(ellipse 60% 45% at 50% 30%, rgba(79,209,197,0.06) 0%, transparent 60%), radial-gradient(ellipse 45% 35% at 65% 75%, rgba(85,60,154,0.07) 0%, transparent 65%)",
        }}
      />

      {/* ===== the app (mobile-first frame) ===== */}
      <div
        className="relative w-full max-w-[430px] h-dvh md:h-[min(920px,96dvh)] md:rounded-[44px] md:my-4 overflow-hidden flex flex-col md:border md:shadow-[0_40px_120px_rgba(0,0,0,0.8)]"
        style={{
          borderColor: "rgba(45,55,72,0.7)",
          background: "#0A0B0D",
        }}
      >
        <BackgroundFX />
        <StatusBar />

        {/* content area */}
        <div className="relative flex-1 min-h-0 flex flex-col">
          <AnimatePresence mode="wait">
            {screen.kind === "video" ? (
              <VideoScreen key="video" video={screen.video} />
            ) : (
              <motion.main
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                className="flex-1 overflow-y-auto opal-scroll"
              >
                {!loaded && (
                  <div className="absolute inset-0 grid place-items-center z-10" style={{ background: "#0A0B0D" }}>
                    <motion.div
                      animate={{ scale: [1, 1.12, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                      className="w-3 h-3 rounded-full"
                      style={{ background: "#81E6D9", boxShadow: "0 0 24px rgba(129,230,217,0.8)" }}
                    />
                  </div>
                )}
                {tab === "home" && <HomeScreen />}
                {tab === "clips" && <ClipsScreen />}
                {tab === "queue" && <QueueScreen />}
              </motion.main>
            )}
          </AnimatePresence>
        </div>

        <TabBar />
      </div>

      <Toaster
        position="top-center"
        theme="dark"
        toastOptions={{
          style: {
            background: "rgba(26,32,44,0.92)",
            border: "1px solid rgba(45,55,72,0.9)",
            color: "#F7FAFC",
            backdropFilter: "blur(20px)",
            borderRadius: "18px",
            fontFamily: "inherit",
          },
        }}
      />
    </div>
  );
}
