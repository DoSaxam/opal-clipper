"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BatteryIcon, SignalBars, WifiIcon } from "./icons";

/**
 * iOS status bar — traced from the reference:
 * time centred like a dynamic-island layout, icons optically centred on y ≈ 29.
 * Shows the real local time (updates every 10s). Desktop-only (hidden on touch).
 */
export function StatusBar() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const d = new Date();
      let h = d.getHours();
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      setTime(`${h}:${String(d.getMinutes()).padStart(2, "0")} ${ampm}`);
    };
    update();
    const t = setInterval(update, 10000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="opal-statusbar relative z-10 flex items-center justify-between select-none"
      style={{ left: 0, top: 0, width: "100%", height: 54 }}
      aria-hidden
    >
      <motion.span
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          top: 22,
          fontSize: 17.4,
          fontWeight: 600,
          letterSpacing: "-0.2px",
          lineHeight: 1,
          color: "#fff",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {time}
      </motion.span>

      <div
        className="flex items-center"
        style={{ position: "absolute", right: 36, top: 23, gap: 6.5, color: "#fff" }}
      >
        <SignalBars style={{ width: 20, height: 12 }} />
        <WifiIcon style={{ width: 17, height: 12.4, marginTop: -1 }} />
        <BatteryIcon style={{ width: 27, height: 13, marginLeft: 1 }} />
      </div>
    </div>
  );
}
