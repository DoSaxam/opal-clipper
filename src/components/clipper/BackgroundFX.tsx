"use client";

/** Cave ambience: deep vignette, drifting aurora glows, film grain. */
export function BackgroundFX() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* base */}
      <div className="absolute inset-0" style={{ background: "#0A0B0D" }} />
      {/* aurora glows */}
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 animate-aurora"
        style={{
          width: "130%",
          height: "48%",
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(79,209,197,0.10) 0%, rgba(99,179,237,0.05) 40%, transparent 70%)",
          filter: "blur(30px)",
        }}
      />
      <div
        className="absolute -bottom-32 -left-24 animate-aurora"
        style={{
          width: "80%",
          height: "42%",
          background: "radial-gradient(ellipse, rgba(85,60,154,0.12) 0%, transparent 70%)",
          filter: "blur(36px)",
          animationDelay: "-6s",
        }}
      />
      <div
        className="absolute -bottom-24 -right-24 animate-aurora"
        style={{
          width: "70%",
          height: "38%",
          background: "radial-gradient(ellipse, rgba(79,209,197,0.07) 0%, transparent 70%)",
          filter: "blur(32px)",
          animationDelay: "-3s",
        }}
      />
      {/* cave edges vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 92% 68% at 50% 38%, transparent 42%, rgba(6,7,9,0.62) 82%, rgba(4,5,6,0.9) 100%)",
        }}
      />
      {/* grain */}
      <div className="absolute inset-0 opal-noise" />
    </div>
  );
}
