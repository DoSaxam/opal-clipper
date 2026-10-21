"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect } from "react";
import { ClockGlyph, DownloadGlyph, ScissorsGlyph } from "./icons";

const EASE = [0.16, 1, 0.3, 1] as const;

/** arc geometry, clockwise from 12 o'clock, in degrees */
type Arc = { start: number; len: number };

export type Metric = {
  id: string;
  label: string;
  value: number;
  /** decorative arc start from the reference (sleep 354.5 · focus 25 · rest 0) */
  arcStart: number;
  /** capsule size + centre as a fraction of the 393 reference width */
  w: number;
  h: number;
  cxPct: number;
  cy: number;
  iconW: number;
  iconH: number;
  gap: number;
  contentShift: number;
  icon: (p: { width?: number; height?: number; style?: React.CSSProperties }) => React.ReactNode;
};

/** Capsule outline, starting at 12 o'clock and running clockwise (local space). */
function capsulePath(w: number, h: number) {
  const r = h / 2;
  const half = (w - h) / 2;
  const cx = w / 2;
  const cy = h / 2;
  const f = (n: number) => Number(n.toFixed(2));
  return [
    `M${f(cx)} ${f(cy - r)}`,
    `H${f(cx + half)}`,
    `A${f(r)} ${f(r)} 0 0 1 ${f(cx + half + r)} ${f(cy)}`,
    `A${f(r)} ${f(r)} 0 0 1 ${f(cx + half)} ${f(cy + r)}`,
    `H${f(cx - half)}`,
    `A${f(r)} ${f(r)} 0 0 1 ${f(cx - half - r)} ${f(cy)}`,
    `A${f(r)} ${f(r)} 0 0 1 ${f(cx - half)} ${f(cy - r)}`,
    "Z",
  ].join(" ");
}

function Ring({
  metric,
  index,
  active,
  onSelect,
}: {
  metric: Metric;
  index: number;
  active: boolean;
  onSelect: () => void;
}) {
  const reduce = useReducedMotion();
  const { w, h, arcStart } = metric;
  const d = capsulePath(w, h);
  const PERIM = 1000;
  /** arc length is data-driven: value capped at 100 → share of the loop */
  const len = Math.max(0, Math.min(100, metric.value)) / 100 * 360;
  const visible = (len / 360) * PERIM;
  const hidden = PERIM - visible;
  const dashArray = visible > 0.5 ? `${visible.toFixed(2)} ${hidden.toFixed(2)}` : "0 1000";
  const dashOffset = (((360 - arcStart) % 360) / 360) * PERIM;

  const count = useMotionValue(reduce ? metric.value : 0);
  const shown = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    if (reduce) {
      count.set(metric.value);
      return;
    }
    count.set(0);
    animate(count, metric.value, { duration: 1.5, ease: EASE, delay: 0.75 + index * 0.1 });
  }, [count, index, metric.value, reduce]);

  return (
    <motion.button
      type="button"
      aria-label={`${metric.label}: ${metric.value}`}
      aria-pressed={active}
      onClick={onSelect}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE, delay: 0.5 + index * 0.08 }}
      whileTap={{ scale: 0.955 }}
      whileHover={{ scale: 1.02 }}
      style={{
        position: "absolute",
        left: `${metric.cxPct}%`,
        top: metric.cy,
        transform: "translateX(-50%)",
        width: w,
        height: h + 30,
        cursor: "pointer",
        borderRadius: h / 2,
        pointerEvents: "auto",
      }}
    >
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        fill="none"
        style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id={`ring-${metric.id}`}
            x1={w * 0.08}
            y1={0}
            x2={w * 0.92}
            y2={h}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#DBFFD2" />
            <stop offset="0.45" stopColor="#C8FBE6" />
            <stop offset="1" stopColor="#BDF8EE" />
          </linearGradient>
        </defs>

        <path d={d} stroke="#191e1c" strokeWidth={2.6} strokeLinecap="round" fill="none" />

        <motion.path
          d={d}
          stroke={`url(#ring-${metric.id})`}
          strokeWidth={2.5}
          strokeLinecap="round"
          fill="none"
          pathLength={1000}
          strokeDasharray={dashArray}
          initial={{ opacity: 0, strokeDashoffset: dashOffset + PERIM }}
          animate={{ opacity: 1, strokeDashoffset: dashOffset }}
          transition={{ duration: 1.2, ease: EASE, delay: 0.6 + index * 0.1 }}
          className={active ? "ring-glow is-active" : "ring-glow"}
        />
      </svg>

      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: w,
          height: h,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: metric.gap,
          transform: `translateX(${metric.contentShift}px)`,
          pointerEvents: "none",
        }}
      >
        <span style={{ display: "flex", width: metric.iconW, height: metric.iconH }}>
          {metric.icon({ width: metric.iconW, height: metric.iconH })}
        </span>
        <motion.span
          className="t-ring-value"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
          style={{ display: "block" }}
        >
          {shown}
        </motion.span>
      </span>

      <span
        className="t-ring-label"
        style={{
          position: "absolute",
          left: -24,
          width: w + 48,
          top: h + 10,
          display: "block",
          lineHeight: "13px",
        }}
      >
        {metric.label}
      </span>
    </motion.button>
  );
}

/** Three capsule rings traced from the reference — values wired to lifetime stats. */
export function Rings({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="relative w-full" style={{ height: 96 }} aria-label="Daily metrics" role="group">
      {metrics.map((m, i) => (
        <Ring
          key={m.id}
          metric={m}
          index={i}
          active={false}
          onSelect={() => {
            /* rings are decorative in the clipper — tap gives spring feedback */
          }}
        />
      ))}
    </div>
  );
}

/** Reference metric geometry for the clipper (Clips / Downloads / Saved). */
export function clipperMetrics(input: {
  clips: number;
  downloads: number;
  savedMinutes: number;
}): Metric[] {
  return [
    {
      id: "clips",
      label: "Clips",
      value: input.clips,
      arcStart: 354.5,
      w: 62.5,
      h: 41,
      cxPct: 24.1,
      cy: 24,
      iconW: 12.8,
      iconH: 12.8,
      gap: 7,
      contentShift: -4.4,
      icon: (p) => <ScissorsGlyph {...p} />,
    },
    {
      id: "downloads",
      label: "Downloads",
      value: input.downloads,
      arcStart: 25,
      w: 72,
      h: 41.9,
      cxPct: 50,
      cy: 24,
      iconW: 15.4,
      iconH: 15.4,
      gap: 6.8,
      contentShift: 0.4,
      icon: (p) => <DownloadGlyph {...p} />,
    },
    {
      id: "saved",
      label: "Saved",
      value: input.savedMinutes,
      arcStart: 0,
      w: 72,
      h: 41.9,
      cxPct: 76.9,
      cy: 24,
      iconW: 16,
      iconH: 16,
      gap: 11,
      contentShift: -1.4,
      icon: (p) => <ClockGlyph {...p} />,
    },
  ];
}
