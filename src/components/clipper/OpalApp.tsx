"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "sonner";
import { OpalMark } from "./icons";
import { StatusBar } from "./StatusBar";
import { NavBar } from "./NavBar";
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
    <div className="opal-stage min-h-dvh w-full">
      {/* ===== the app (mobile-first frame, phone shell on desktop) ===== */}
      <div
        className="opal-phone relative w-full max-w-[430px] h-dvh md:h-[min(900px,calc(100dvh-36px))] md:my-4 md:rounded-[52px] flex flex-col overflow-hidden"
        style={{
          ["boxShadow" as string]:
            "0 0 0 1.5px rgba(255,255,255,0.09), 0 0 0 10px #0a0c0b, 0 0 0 11px rgba(255,255,255,0.07), 0 34px 90px -18px rgba(0,0,0,0.9), 0 0 130px -30px rgba(120,255,205,0.22)",
        }}
      >
        {/* cave atmosphere — drifting mint breath over the stone gradient */}
        <div aria-hidden="true" className="opal-cave" />

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
                  <div className="absolute inset-0 grid place-items-center z-10" style={{ background: "#0b0e0d" }}>
                    <motion.div
                      animate={{ scale: [1, 1.12, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                      style={{ color: "#CDFCE2", filter: "drop-shadow(0 0 14px rgba(183,247,230,0.6))" }}
                    >
                      <OpalMark style={{ width: 30, height: 38 }} strokeWidth={2.4} />
                    </motion.div>
                  </div>
                )}
                {tab === "home" && <HomeScreen />}
                {tab === "clips" && <ClipsScreen />}
                {tab === "queue" && <QueueScreen />}
              </motion.main>
            )}
          </AnimatePresence>
        </div>

        <NavBar />

        {/* whisper grain over everything */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none z-30" style={{ borderRadius: "inherit" }}>
          <div className="noise-quiet absolute inset-0" style={{ borderRadius: "inherit" }} />
        </div>
      </div>

      <Toaster
        position="top-center"
        theme="dark"
        toastOptions={{
          style: {
            background: "rgba(16,18,17,0.92)",
            border: "1px solid #2b302e",
            color: "#FFFFFF",
            backdropFilter: "blur(20px)",
            borderRadius: "16px",
            fontFamily: "inherit",
            fontSize: "13.5px",
            letterSpacing: "-0.011em",
          },
        }}
      />
    </div>
  );
}
