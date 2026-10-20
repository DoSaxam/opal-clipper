"use client";

import { motion, useSpring, useTransform } from "framer-motion";

/** Iridescent progress ring with springy stroke. */
export function ProgressRing({
  progress,
  size = 46,
  stroke = 3.5,
  children,
}: {
  progress: number; // 0..100
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const spring = useSpring(0, { stiffness: 70, damping: 20 });
  const offset = useTransform(
    spring,
    (v) => c - (Math.max(0, Math.min(100, v)) / 100) * c
  );

  if (Math.abs(spring.get() - progress) > 0.5) spring.set(progress);

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="opalRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4fd1c5" />
            <stop offset="50%" stopColor="#63b3ed" />
            <stop offset="100%" stopColor="#b794f4" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted-foreground/20"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#opalRing)"
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
