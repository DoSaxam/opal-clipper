"use client";

import { motion, useSpring, useTransform } from "framer-motion";

/** Iridescent progress ring with springy stroke. */
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

  // keep spring target in sync
  if (spring.get() !== progress) spring.set(progress);

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4FD1C5" />
            <stop offset="50%" stopColor="#63B3ED" />
            <stop offset="100%" stopColor="#B794F4" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2D3748" strokeWidth={stroke} opacity={0.55} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
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
