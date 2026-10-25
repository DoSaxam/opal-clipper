"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useOpal, startPolling } from "@/lib/clipper/store";
import { HomeScreen } from "./home-screen";
import { CutScreen } from "./cut-screen";
import { ProgressScreen } from "./progress-screen";
import { ClipsScreen } from "./clips-screen";
import { ToastHost } from "./toast";
import { ThemeToggle } from "./theme";
import { screenIn } from "./anim";

/**
 * Opal Clipper — app shell.
 * Sticky header with 3-step progress bars, theme toggle, animated step router,
 * fixed bottom dock (per screen), toast host. Working engine underneath
 * (store + API routes) is untouched.
 */
export function OpalApp() {
  const step = useOpal((s) => s.step);
  const go = useOpal((s) => s.go);

  useEffect(() => {
    startPolling();
    void useOpal.getState().refresh();
  }, []);

  const filled = step === 0 ? 1 : step < 3 ? 2 : 3;

  return (
    <>
      <ToastHost />
      <div className="app">
        <header>
          <button
            className={step === 0 || step === 2 ? "ib h" : "ib"}
            aria-label="Back"
            onClick={() => go(step === 3 ? 1 : 0)}
          >
            <ChevronLeft className="lucide" />
          </button>
          <div className="steps">
            {[0, 1, 2].map((i) => (
              <i key={i} style={{ "--f": i < filled ? 1 : 0 } as React.CSSProperties} />
            ))}
          </div>
          <ThemeToggle />
        </header>
        <main>
          <AnimatePresence mode="wait">
            <motion.div key={step} variants={screenIn} initial="hidden" animate="show" exit="exit">
              {step === 0 && <HomeScreen />}
              {step === 1 && <CutScreen />}
              {step === 2 && <ProgressScreen />}
              {step === 3 && <ClipsScreen />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}
