"use client";

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { item, stagger } from "./anim";

/** Shown when the wizard points at clips the temporary server no longer has. */
export function ExpiredView({ onHome }: { onHome: () => void }) {
  return (
    <>
      <motion.div variants={stagger} initial="hidden" animate="show">
        <motion.h1 variants={item}>Clips expired</motion.h1>
        <motion.p className="sub" variants={item}>
          The server is temporary — clips disappear after a while and on restarts.
          Your history (kept only in this browser) remembers them.
        </motion.p>
      </motion.div>
      <div className="dock">
        <motion.button
          className="btn"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          onClick={onHome}
        >
          <ChevronLeft className="lucide" /> Back home
        </motion.button>
      </div>
    </>
  );
}
