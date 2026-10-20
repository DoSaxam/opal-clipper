"use client";

/** Linear atmosphere: void base, faint acid wash, hairline grid, whisper grain. */
export function BackgroundFX() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* base — void */}
      <div className="absolute inset-0" style={{ background: "#08090A" }} />

      {/* faint acid wash drifting near the top */}
      <div
        className="absolute -top-28 left-1/2 -translate-x-1/2 animate-aurora"
        style={{
          width: "120%",
          height: "42%",
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(228,242,34,0.055) 0%, rgba(228,242,34,0.015) 42%, transparent 70%)",
          filter: "blur(28px)",
        }}
      />

      {/* hairline grid floor fading up from the bottom */}
      <div
        className="absolute inset-x-0 bottom-0 h-[52%] grid-floor"
        style={{
          maskImage: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
          WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
        }}
      />

      {/* vignette — grounds the instrument in darkness */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 95% 70% at 50% 36%, transparent 40%, rgba(4,5,6,0.55) 80%, rgba(3,4,5,0.85) 100%)",
        }}
      />

      {/* whisper grain */}
      <div className="absolute inset-0 noise-quiet" />
    </div>
  );
}
