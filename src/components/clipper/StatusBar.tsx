"use client";

import { useEffect, useState } from "react";

/** iOS-style status bar (fake time like 9:41, signal/wifi/battery glyphs). Desktop-only. */
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
      className="opal-statusbar relative z-10 flex items-center justify-between px-8 pt-3 pb-1 text-[13px] font-semibold text-white/90 select-none"
      aria-hidden
    >
      <span className="tabular-nums" style={{ letterSpacing: "-0.01em" }}>
        {time}
      </span>
      {/* dynamic island hint */}
      <div className="w-24 h-[26px] rounded-full bg-black/90" />
      <div className="flex items-center gap-1.5">
        {/* signal */}
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
          <rect x="0" y="7" width="3" height="4" rx="1" />
          <rect x="4.6" y="5" width="3" height="6" rx="1" />
          <rect x="9.2" y="2.5" width="3" height="8.5" rx="1" />
          <rect x="13.8" y="0" width="3" height="11" rx="1" />
        </svg>
        {/* wifi */}
        <svg width="16" height="11" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M1 4.2C4.6 0.9 11.4 0.9 15 4.2" strokeLinecap="round" />
          <path d="M3.6 7C6 4.9 10 4.9 12.4 7" strokeLinecap="round" />
          <circle cx="8" cy="9.9" r="1.2" fill="currentColor" stroke="none" />
        </svg>
        {/* battery */}
        <div className="flex items-center gap-0.5">
          <div className="w-[22px] h-[11px] rounded-[3.5px] border border-white/45 p-[1.5px]">
            <div className="w-[72%] h-full rounded-[2px] bg-white/90" />
          </div>
          <div className="w-[1.5px] h-[4px] rounded-r bg-white/45" />
        </div>
      </div>
    </div>
  );
}
