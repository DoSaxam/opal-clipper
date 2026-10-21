"use client";

import React from "react";

/* ------------------------------------------------------------------ *
 *  Hand-drawn SVG icon set — every glyph traced from the reference    *
 *  screen so the UI stays razor sharp at any device pixel ratio.      *
 *  Clipper-specific glyphs (scissors, download, clock, link, shield,  *
 *  zip, trash, back) are traced in the very same rounded style.       *
 * ------------------------------------------------------------------ */

export type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

/* ---------- status bar ---------- */

export function SignalBars(props: IconProps) {
  return (
    <svg viewBox="0 0 20 12" fill="none" aria-hidden="true" {...props}>
      <rect x="0" y="8.4" width="3.1" height="3.6" rx="1" fill="currentColor" />
      <rect x="5.2" y="6.2" width="3.1" height="5.8" rx="1" fill="currentColor" />
      <rect x="10.4" y="3.5" width="3.1" height="8.5" rx="1" fill="currentColor" />
      <rect x="15.6" y="0.6" width="3.1" height="11.4" rx="1" fill="currentColor" />
    </svg>
  );
}

export function WifiIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 18 13" fill="none" aria-hidden="true" {...props}>
      <path
        d="M1.1 4.2A11.6 11.6 0 0 1 9 1.3c3 0 5.8 1.1 7.9 2.9"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M3.9 7.5A7.8 7.8 0 0 1 9 5.5c2 0 3.8.7 5.2 2"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M6.6 10.7a4 4 0 0 1 4.9 0"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BatteryIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 27 13" fill="none" aria-hidden="true" {...props}>
      <rect
        x="0.7"
        y="0.7"
        width="22.4"
        height="11.6"
        rx="3.6"
        stroke="currentColor"
        strokeOpacity="0.42"
        strokeWidth="1.2"
      />
      <rect x="2.3" y="2.3" width="19.4" height="8.4" rx="2.4" fill="currentColor" />
      <path
        d="M25 4.4v4.2c.9-.3 1.5-1.1 1.5-2.1S25.9 4.7 25 4.4Z"
        fill="currentColor"
        fillOpacity="0.42"
      />
    </svg>
  );
}

/* ---------- brand ---------- */

/** Rounded regular polygon path helper (used by the Opal mark + shield). */
export function roundedPolygon(
  points: Array<[number, number]>,
  radius: number,
): string {
  const n = points.length;
  const lerp = (a: [number, number], b: [number, number], t: number): [number, number] => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
  ];
  let d = "";
  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const cur = points[i];
    const next = points[(i + 1) % n];
    const l1 = Math.hypot(prev[0] - cur[0], prev[1] - cur[1]);
    const l2 = Math.hypot(next[0] - cur[0], next[1] - cur[1]);
    const t1 = Math.min(0.5, radius / l1);
    const t2 = Math.min(0.5, radius / l2);
    const p1 = lerp(cur, prev, t1);
    const p2 = lerp(cur, next, t2);
    d += `${i === 0 ? "M" : "L"}${p1[0].toFixed(2)},${p1[1].toFixed(2)}`;
    d += `Q${cur[0].toFixed(2)},${cur[1].toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d + "Z";
}

/** tall rounded hexagon (24 × 31) matching the Opal mark proportions */
const opalOuter: Array<[number, number]> = [
  [12.6, 1.7],
  [21.9, 8.9],
  [21.4, 22.4],
  [12.1, 29.4],
  [2.9, 23.1],
  [1.6, 10.3],
];

/** The Opal "stone" mark — a rounded hexagon ring. */
export function OpalMark({
  strokeWidth = 2.1,
  ...props
}: IconProps & { strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 31" fill="none" aria-hidden="true" {...props}>
      <path
        d={roundedPolygon(opalOuter, 2.6)}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------- top bar ---------- */

export function FlameIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 26" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id="flameGrad" x1="12" y1="0" x2="12" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFF6DC" />
          <stop offset="0.34" stopColor="#FFE3AC" />
          <stop offset="0.72" stopColor="#F7C477" />
          <stop offset="1" stopColor="#EFA855" />
        </linearGradient>
        <radialGradient id="flameCore" cx="0.5" cy="0.72" r="0.55">
          <stop offset="0" stopColor="#FFFBEA" stopOpacity="0.95" />
          <stop offset="1" stopColor="#FFE9BE" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g filter="url(#softFlameBlur)">
        <path
          d="M12.6 1.4c2.9 4.7 7.5 8.1 7.5 13.6 0 4.9-3.4 8.4-7.9 8.4S4.4 19.9 4.4 15c0-3.3 1.5-5.7 3.4-8.4.2 2.9 1.2 4.9 2.9 5.4.3-3.8.7-7.2 1.9-10.6Z"
          fill="url(#flameGrad)"
        />
        <path
          d="M12.6 1.4c2.9 4.7 7.5 8.1 7.5 13.6 0 4.9-3.4 8.4-7.9 8.4S4.4 19.9 4.4 15c0-3.3 1.5-5.7 3.4-8.4.2 2.9 1.2 4.9 2.9 5.4.3-3.8.7-7.2 1.9-10.6Z"
          fill="url(#flameCore)"
        />
      </g>
      <defs>
        <filter id="softFlameBlur" x="-60%" y="-40%" width="220%" height="200%">
          <feGaussianBlur stdDeviation="0.35" />
        </filter>
      </defs>
    </svg>
  );
}

export function PersonGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 22 22" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id="personGrad" x1="11" y1="2" x2="11" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#DFFEE0" />
          <stop offset="1" stopColor="#A9F4F1" />
        </linearGradient>
      </defs>
      <circle cx="11" cy="6.9" r="3.5" fill="url(#personGrad)" />
      <path
        d="M11 12.1c4.1 0 7.3 2.6 7.3 5.8 0 .9-.6 1.4-1.5 1.4H5.2c-.9 0-1.5-.5-1.5-1.4 0-3.2 3.2-5.8 7.3-5.8Z"
        fill="url(#personGrad)"
      />
    </svg>
  );
}

/** Pentagon-ish shield used behind the avatar. */
export function ProfileShield(props: IconProps) {
  const pts: Array<[number, number]> = [
    [19.4, 1.6],
    [35.2, 7.6],
    [35.9, 24.9],
    [20.6, 33.6],
    [4.4, 27.6],
    [1.4, 11.4],
  ];
  return (
    <svg viewBox="0 0 37 35" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id="shieldStroke" x1="4" y1="2" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#E7FFE4" />
          <stop offset="0.5" stopColor="#8DEFC9" />
          <stop offset="1" stopColor="#D9FFE1" />
        </linearGradient>
        <linearGradient id="shieldFill" x1="18" y1="2" x2="18" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2B332B" />
          <stop offset="1" stopColor="#1B211D" />
        </linearGradient>
      </defs>
      <path d={roundedPolygon(pts, 7.4)} fill="url(#shieldFill)" />
      <path
        d={roundedPolygon(pts, 7.4)}
        stroke="url(#shieldStroke)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------- metric icons ---------- */

export function MoonIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id="moonGrad" x1="6" y1="3" x2="18" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#E7FFC9" />
          <stop offset="1" stopColor="#B2F6F3" />
        </linearGradient>
        <mask id="moonCut">
          <rect width="24" height="24" fill="#fff" />
          <circle cx="17.4" cy="7.2" r="8.1" fill="#000" />
        </mask>
      </defs>
      <circle cx="12.2" cy="12.4" r="9.3" fill="url(#moonGrad)" mask="url(#moonCut)" />
    </svg>
  );
}

export function HourglassIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 24" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id="hgGrad" x1="8" y1="2" x2="8" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#EBFFD8" />
          <stop offset="0.5" stopColor="#BEF7DC" />
          <stop offset="1" stopColor="#AFF3F1" />
        </linearGradient>
      </defs>
      <path
        d="M3.1 1.9h9.8c1 0 1.7.8 1.7 1.7 0 .9-.7 1.6-1.6 1.6h-.4c0 2.6-1.3 4.4-3 5.6-.5.4-.5.8 0 1.2 1.7 1.2 3 3 3 5.6h.4c.9 0 1.6.7 1.6 1.6 0 .9-.7 1.7-1.7 1.7H3.1c-1 0-1.7-.8-1.7-1.7 0-.9.7-1.6 1.6-1.6h.4c0-2.6 1.3-4.4 3-5.6.5-.4.5-.8 0-1.2-1.7-1.2-3-3-3-5.6H3c-.9 0-1.6-.7-1.6-1.6 0-.9.7-1.7 1.7-1.7Z"
        fill="url(#hgGrad)"
      />
    </svg>
  );
}

export function TreeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 22" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id="treeGrad" x1="12" y1="0" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#E2FFC6" />
          <stop offset="1" stopColor="#A9F3EE" />
        </linearGradient>
      </defs>
      <g fill="url(#treeGrad)">
        <circle cx="7.1" cy="7.2" r="4" />
        <circle cx="12.2" cy="5.3" r="4.9" />
        <circle cx="17.2" cy="7.5" r="3.7" />
        <circle cx="4.5" cy="10.2" r="3" />
        <circle cx="19.9" cy="10.4" r="2.8" />
        <rect x="4.2" y="7.9" width="15.6" height="5" rx="2.5" />
        <path d="M11.1 11.9h1.8v7.9c0 .6-.4 1-.9 1s-.9-.4-.9-1v-7.9Z" />
        <path d="m11.3 15.4-3.3-2.6 1.1-1.4 2.7 2-.5 2Z" />
        <path d="m12.8 15.4 3.3-2.6-1.1-1.4-2.7 2 .5 2Z" />
      </g>
    </svg>
  );
}

export function BedIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 20" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id="bedGrad" x1="12" y1="1" x2="12" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#E9FFC9" />
          <stop offset="1" stopColor="#B4F6F0" />
        </linearGradient>
      </defs>
      <g fill="url(#bedGrad)">
        <path d="M3.4 3.2h17.2c1.2 0 2.2 1 2.2 2.2v2.5c0 .6-.5 1.1-1.1 1.1h-1.5v-1.7c0-.6-.5-1.1-1.1-1.1h-2.3c-.6 0-1.1.5-1.1 1.1v1.7h-3.4v-1.7c0-.6-.5-1.1-1.1-1.1H8.9c-.6 0-1.1.5-1.1 1.1v1.7H6.3v-1.7c0-.6-.5-1.1-1.1-1.1H3.9c-.6 0-1.1.5-1.1 1.1v1.7H1.7c-.5 0-.5-.4-.5-1V5.4c0-1.2 1-2.2 2.2-2.2Z" />
        <path d="M1.5 10.2h21c.7 0 1.3.6 1.3 1.3v4.9c0 .7-.6 1.3-1.3 1.3-.8 0-1.4-.6-1.4-1.4v-1.1H4.9v1.1c0 .8-.6 1.4-1.4 1.4-.7 0-1.3-.6-1.3-1.3v-4.9c0-.7.6-1.3 1.3-1.3Z" />
      </g>
    </svg>
  );
}

export function NightMoonIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id="nmGrad" x1="8" y1="12" x2="28" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#EEFFD0" />
          <stop offset="0.55" stopColor="#D6FEE6" />
          <stop offset="1" stopColor="#AFF2F6" />
        </linearGradient>
        <mask id="nmCut">
          <rect width="40" height="40" fill="#fff" />
          <circle cx="25.6" cy="12.6" r="11.4" fill="#000" />
        </mask>
      </defs>
      <circle cx="17.6" cy="23.4" r="13.2" fill="url(#nmGrad)" mask="url(#nmCut)" />
      <g fill="url(#nmGrad)" opacity="0.96">
        <path d="M21.4 5.2c.5 2 1.3 2.8 3.3 3.3-2 .5-2.8 1.3-3.3 3.3-.5-2-1.3-2.8-3.3-3.3 2-.5 2.8-1.3 3.3-3.3Z" />
        <path d="M31.1 13.4c.7 2.6 1.7 3.6 4.3 4.3-2.6.7-3.6 1.7-4.3 4.3-.7-2.6-1.7-3.6-4.3-4.3 2.6-.7 3.6-1.7 4.3-4.3Z" />
      </g>
    </svg>
  );
}

/* ---------- ui glyphs ---------- */

export function PlayGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 16 18" fill="none" aria-hidden="true" {...props}>
      <path
        d="M3.1 2.2 13 8.3c.8.5.8 1.4 0 1.9L3.1 16.3c-.8.5-1.6.1-1.6-.9V3.1c0-1 .8-1.4 1.6-.9Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function TriangleUp(props: IconProps) {
  return (
    <svg viewBox="0 0 16 14" fill="none" aria-hidden="true" {...props}>
      <path
        d="M6.5 1.7a1.7 1.7 0 0 1 3 0l5 8.6A1.7 1.7 0 0 1 13 12.9H3a1.7 1.7 0 0 1-1.5-2.6l5-8.6Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function EllipsisIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 5" fill="none" aria-hidden="true" {...props}>
      <circle cx="2.6" cy="2.5" r="1.85" fill="currentColor" />
      <circle cx="10" cy="2.5" r="1.85" fill="currentColor" />
      <circle cx="17.4" cy="2.5" r="1.85" fill="currentColor" />
    </svg>
  );
}

export function GridFourIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 22 22" fill="none" aria-hidden="true" {...props}>
      <circle cx="5.1" cy="5.1" r="5.1" fill="currentColor" />
      <circle cx="16.9" cy="5.1" r="5.1" fill="currentColor" />
      <circle cx="5.1" cy="16.9" r="5.1" fill="currentColor" />
      <circle cx="16.9" cy="16.9" r="5.1" fill="currentColor" />
    </svg>
  );
}

export function PlaySolidIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 19 20" fill="none" aria-hidden="true" {...props}>
      <path
        d="M2.4 2.6c0-1 1.1-1.6 1.9-1l12.2 7.4c.8.5.8 1.6 0 2L4.3 18.4c-.8.5-1.9-.1-1.9-1V2.6Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ChevronRight(props: IconProps) {
  return (
    <svg viewBox="0 0 9 16" fill="none" aria-hidden="true" {...props}>
      <path
        d="M1.4 1.6 7 8l-5.6 6.4"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronLeft(props: IconProps) {
  return (
    <svg viewBox="0 0 9 16" fill="none" aria-hidden="true" {...props}>
      <path
        d="M7.6 1.6 2 8l5.6 6.4"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronDown(props: IconProps) {
  return (
    <svg viewBox="0 0 16 9" fill="none" aria-hidden="true" {...props}>
      <path
        d="M1.6 1.4 8 7l6.4-5.6"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------- clipper glyphs (traced in the same hand-drawn style) ---------- */

/** Scissors — two rounded ovals + crossing blades, same rounded language. */
export function ScissorsGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id="scGrad" x1="3" y1="4" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#E7FFC9" />
          <stop offset="1" stopColor="#A9F3EE" />
        </linearGradient>
      </defs>
      <g stroke="url(#scGrad)" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M6.1 7.3 19.4 20.2" />
        <path d="M17.9 7.3 4.6 20.2" />
      </g>
      <circle cx="5" cy="4.6" r="2.9" stroke="url(#scGrad)" strokeWidth="2.1" fill="none" />
      <circle cx="19" cy="4.6" r="2.9" stroke="url(#scGrad)" strokeWidth="2.1" fill="none" />
    </svg>
  );
}

/** Download — rounded arrow dropping into an open tray. */
export function DownloadGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 22 22" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id="dlGrad" x1="11" y1="1" x2="11" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#E7FFC9" />
          <stop offset="1" stopColor="#AFF2F6" />
        </linearGradient>
      </defs>
      <g stroke="url(#dlGrad)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M11 2.6v12.2" />
        <path d="m5.9 10.3 5.1 5 5.1-5" />
        <path d="M3.4 18.9h15.2" />
      </g>
    </svg>
  );
}

/** Clock — circle with mint hands. */
export function ClockGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 22 22" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id="ckGrad" x1="3" y1="2" x2="19" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#E2FFC6" />
          <stop offset="1" stopColor="#A9F3EE" />
        </linearGradient>
      </defs>
      <circle cx="11" cy="11" r="8.8" stroke="url(#ckGrad)" strokeWidth="2.2" fill="none" />
      <g stroke="url(#ckGrad)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M11 6.2V11l3.4 2.2" />
      </g>
    </svg>
  );
}

/** Link — a broken chain, rounded. */
export function LinkGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M13.4 6.6 15.9 4.1a4.1 4.1 0 0 1 5.8 5.8l-2.5 2.5" />
        <path d="M10.6 17.4 8.1 19.9a4.1 4.1 0 0 1-5.8-5.8l2.5-2.5" />
        <path d="m9.5 14.5 5-5" />
      </g>
    </svg>
  );
}

/** Shield with a spark — tunnel / privacy. */
export function ShieldGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 22 24" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id="shGrad" x1="11" y1="1" x2="11" y2="23" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#E7FFE4" />
          <stop offset="1" stopColor="#8DEFC9" />
        </linearGradient>
      </defs>
      <path
        d="M11 1.9c2.6 1.5 5.3 2.4 8.3 2.5.3 0 .5.2.5.5-.2 6.5-2.6 12.7-8.3 17.3C6.8 17.6 4.4 11.4 4.2 4.9c0-.3.2-.5.5-.5 3-.1 5.7-1 8.3-2.5Z"
        stroke="url(#shGrad)"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M11 8.1c.4 1.7 1 2.3 2.7 2.7-1.7.4-2.3 1-2.7 2.7-.4-1.7-1-2.3-2.7-2.7 1.7-.4 2.3-1 2.7-2.7Z"
        fill="url(#shGrad)"
      />
    </svg>
  );
}

/** ZIP box — for bulk downloads. */
export function ZipGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 22 22" fill="none" aria-hidden="true" {...props}>
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M3.2 7.6 11 3.4l7.8 4.2v7.2L11 19l-7.8-4.2V7.6Z" />
        <path d="M3.2 7.6 11 12l7.8-4.4" />
        <path d="M11 12v7" />
        <path d="M11 6.1v1.4" />
      </g>
    </svg>
  );
}

/** Trash — rounded bin. */
export function TrashGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 22 22" fill="none" aria-hidden="true" {...props}>
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M4.2 6.4h13.6" />
        <path d="M9 3.6h4a1.4 1.4 0 0 1 1.4 1.4v1.4H7.6V5a1.4 1.4 0 0 1 1.4-1.4Z" />
        <path d="M6.4 6.4v10.2a2 2 0 0 0 2 2h5.2a2 2 0 0 0 2-2V6.4" />
        <path d="M9.6 10v5" />
        <path d="M12.4 10v5" />
      </g>
    </svg>
  );
}

/** Check — rounded tick (for select states). */
export function CheckGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 16 14" fill="none" aria-hidden="true" {...props}>
      <path
        d="M2.2 7.8 6 11.4l7.8-8.6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/** Close — rounded X (clear input). */
export function CloseGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <g stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" fill="none">
        <path d="m3.4 3.4 9.2 9.2" />
        <path d="M12.6 3.4 3.4 12.6" />
      </g>
    </svg>
  );
}

/** CircleCheck — solid mint disc with a tick (parsed row OK). */
export function CircleCheckGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <circle cx="10" cy="10" r="8.4" fill="rgba(183,247,230,0.16)" />
      <circle cx="10" cy="10" r="8.4" stroke="rgba(183,247,230,0.55)" strokeWidth="1.4" fill="none" />
      <path
        d="M6.2 10.3 9 13l4.8-6"
        stroke="#CDFCE2"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/** CircleX — soft red disc (parsed row error). */
export function CircleXGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <circle cx="10" cy="10" r="8.4" fill="rgba(235,87,87,0.14)" />
      <circle cx="10" cy="10" r="8.4" stroke="rgba(235,87,87,0.5)" strokeWidth="1.4" fill="none" />
      <g stroke="#EB5757" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="m7.2 7.2 5.6 5.6" />
        <path d="M12.8 7.2 7.2 12.8" />
      </g>
    </svg>
  );
}

/** Alert triangle — soft red (errors). */
export function AlertGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 22 20" fill="none" aria-hidden="true" {...props}>
      <path
        d="M9.2 2.6a1.9 1.9 0 0 1 3.6 0l7.6 13.2c.7 1.3-.3 2.2-1.7 2.2H3.3c-1.4 0-2.4-.9-1.7-2.2L9.2 2.6Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M11 7.2v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="11" cy="15.4" r="1.2" fill="currentColor" />
    </svg>
  );
}

/** Gauge — quality ladder. */
export function GaugeGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 22 22" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id="gaugeGrad" x1="3" y1="3" x2="19" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#E7FFC9" />
          <stop offset="1" stopColor="#AFF2F6" />
        </linearGradient>
      </defs>
      <path
        d="M3.6 16.4a9 9 0 1 1 14.8 0"
        stroke="url(#gaugeGrad)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M11 12.6 15.2 8"
        stroke="url(#gaugeGrad)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="11" cy="13.6" r="1.7" fill="url(#gaugeGrad)" />
    </svg>
  );
}

/** Audio waves — MP3 option. */
export function AudioGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 22 22" fill="none" aria-hidden="true" {...props}>
      <g stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" fill="none">
        <path d="M4 9v4" />
        <path d="M8 5.6v10.8" />
        <path d="M11.9 2.8v16.4" />
        <path d="M15.8 6.8v8.4" />
        <path d="M19.4 9.6v2.8" />
      </g>
    </svg>
  );
}

/** Square outline / filled — select-mode toggles. */
export function SquareOutlineGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <rect x="3" y="3" width="14" height="14" rx="4.5" stroke="currentColor" strokeWidth="1.9" fill="none" />
    </svg>
  );
}

export function SquareFilledGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <rect x="3" y="3" width="14" height="14" rx="4.5" fill="currentColor" />
      <path
        d="M6.6 10.2 9 12.6l4.6-5"
        stroke="#0b0e0d"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/* ---------- allowed-app icons ---------- */

export function MessagesAppIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id="msgBg" x1="4" y1="1" x2="36" y2="39" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7DF87F" />
          <stop offset="0.55" stopColor="#48DD5C" />
          <stop offset="1" stopColor="#2ECC4F" />
        </linearGradient>
        <linearGradient id="msgBubble" x1="20" y1="9" x2="20" y2="31" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E6FFE9" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="9.6" fill="url(#msgBg)" />
      <path
        d="M20 8.4c-7 0-12.6 4.6-12.6 10.3 0 3.3 1.9 6.2 4.9 8.1-.2 1.9-1 3.6-2.3 4.9 2.9-.2 5.4-1.3 7.3-2.9 0 0 0 0 0 0 1.4.3 2.9.5 4.4.5h.4c6.9-.2 12.4-4.8 12.4-10.5C32.6 13 27 8.4 20 8.4Z"
        fill="url(#msgBubble)"
        opacity="0.96"
      />
    </svg>
  );
}

export function WeatherAppIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id="wxBg" x1="4" y1="1" x2="36" y2="39" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4FA4F8" />
          <stop offset="0.5" stopColor="#2F7DE4" />
          <stop offset="1" stopColor="#1F5FD0" />
        </linearGradient>
        <linearGradient id="wxSun" x1="24" y1="6" x2="34" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFE89A" />
          <stop offset="1" stopColor="#FFC24B" />
        </linearGradient>
        <linearGradient id="wxCloud" x1="20" y1="14" x2="20" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#CFE3FA" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="9.6" fill="url(#wxBg)" />
      <circle cx="27.4" cy="14.2" r="5.6" fill="url(#wxSun)" />
      <path
        d="M13.6 30.6h12.9c3.4 0 6.1-2.6 6.1-5.9 0-3.1-2.4-5.6-5.5-5.9-.9-3-3.7-5.1-7-5.1-4 0-7.3 3-7.6 6.8-2.2.5-3.8 2.4-3.8 4.7 0 2.6 2.2 5.4 4.9 5.4Z"
        fill="url(#wxCloud)"
      />
    </svg>
  );
}

/* ---------- animated bits ---------- */

export function Sparkle({
  size = 8,
  color = "rgba(214,255,236,0.9)",
  ...props
}: IconProps & { color?: string }) {
  return (
    <svg viewBox="0 0 10 10" width={size} height={size} fill="none" aria-hidden="true" {...props}>
      <path
        d="M5 0c.35 2.6 1.4 3.65 4 4-2.6.35-3.65 1.4-4 4-.35-2.6-1.4-3.65-4-4 2.6-.35 3.65-1.4 4-4Z"
        fill={color}
      />
    </svg>
  );
}
