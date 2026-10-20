"use client";

import { motion, useSpring, useTransform } from "framer-motion";

/** Acid-lime progress ring with springy stroke. */
export function ProgressRing({
  progress,
  size = 46,
  stroke = 3.5,
  active = true,
  children,
}: {
  progress: number; // 0..100
  size?: number;
  stroke?: number;
  active?: boolean;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const spring = useSpring(0, { stiffness: 60, damping: 18 });
  const offset = useTransform(spring, (v) => c - (Math.max(0, Math.min(100, v)) / 100) * c);

  if (spring.get() !== progress) spring.set(progress);

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#23252A" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={active ? "#E4F222" : "#383B3F"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          style={{ strokeDashoffset: offset }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
