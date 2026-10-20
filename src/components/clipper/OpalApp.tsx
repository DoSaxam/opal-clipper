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
    <div className="min-h-dvh w-full grid place-items-center" style={{ background: "#08090A" }}>
      {/* ambient acid-lime atmosphere behind the phone (desktop) */}
      <div
        className="fixed inset-0 pointer-events-none hidden md:block"
        style={{
          background:
            "radial-gradient(ellipse 55% 40% at 50% 22%, rgba(228,242,34,0.05) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 68% 82%, rgba(228,242,34,0.025) 0%, transparent 65%)",
        }}
      />
      {/* precision grid floor, fading up (desktop) */}
      <div
        className="fixed inset-x-0 bottom-0 h-[46vh] pointer-events-none hidden md:block grid-floor"
        style={{ maskImage: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)", WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)" }}
      />

      {/* ===== the app (mobile-first frame) ===== */}
      <div
        className="relative w-full max-w-[430px] h-dvh md:h-[min(920px,96dvh)] md:rounded-[40px] md:my-4 overflow-hidden flex flex-col md:border"
        style={{
          borderColor: "#23252A",
          background: "#08090A",
          boxShadow: "rgba(8,9,10,0.7) 0 40px 120px, #383B3F 0 0 0 1px",
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
                  <div className="absolute inset-0 grid place-items-center z-10" style={{ background: "#08090A" }}>
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                      className="w-2.5 h-2.5 rounded-[3px]"
                      style={{ background: "#E4F222", boxShadow: "0 0 20px rgba(228,242,34,0.7)" }}
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
            background: "rgba(15,16,17,0.92)",
            border: "1px solid #23252A",
            color: "#FFFFFF",
            backdropFilter: "blur(20px)",
            borderRadius: "12px",
            fontFamily: "inherit",
            fontSize: "13.5px",
            letterSpacing: "-0.011em",
          },
        }}
      />
    </div>
  );
}
