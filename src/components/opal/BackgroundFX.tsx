"use client";

/**
 * Ambient background: deep cave gradient, drifting aurora glows, vignette and
 * a whisper of film grain. Fixed to the viewport so it never scrolls.
 */
export function BackgroundFX() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-background" />

      {/* aurora — teal key light, top centre */}
      <div
        className="animate-drift absolute -top-40 left-1/2 h-[52vh] w-[120%] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, color-mix(in oklab, var(--brand-teal) 14%, transparent) 0%, color-mix(in oklab, var(--brand-blue) 7%, transparent) 42%, transparent 72%)",
          filter: "blur(40px)",
        }}
      />
      {/* aurora — violet fill, bottom left */}
      <div
        className="animate-drift absolute -bottom-48 -left-32 h-[60vh] w-[85%]"
        style={{
          animationDelay: "-7s",
          background:
            "radial-gradient(ellipse, color-mix(in oklab, var(--brand-violet) 14%, transparent) 0%, transparent 70%)",
          filter: "blur(48px)",
        }}
      />
      {/* aurora — cool rim, bottom right */}
      <div
        className="animate-drift absolute -bottom-40 -right-32 h-[55vh] w-[80%]"
        style={{
          animationDelay: "-3.5s",
          background:
            "radial-gradient(ellipse, color-mix(in oklab, var(--brand-blue) 10%, transparent) 0%, transparent 70%)",
          filter: "blur(44px)",
        }}
      />

      {/* vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 110% 78% at 50% 34%, transparent 38%, color-mix(in oklab, var(--background) 72%, transparent) 82%, var(--background) 100%)",
        }}
      />
      {/* grain */}
      <div className="opal-grain absolute inset-0" />
    </div>
  );
}
