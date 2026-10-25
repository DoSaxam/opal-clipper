import type { Metadata, Viewport } from "next";
import "./globals.css";

const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('opal-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}var e=document.documentElement;e.setAttribute('data-theme',t);if(t==='dark'){e.classList.add('dark')}else{e.classList.remove('dark')}}catch(e){}})();`;

export const metadata: Metadata = {
  title: "Opal Clipper — Clip any video",
  description:
    "Paste a link, pick timestamps, get frame-accurate clips up to 4K with the original audio track. History stays in your browser — the server is temporary.",
  keywords: ["video clipper", "youtube clips", "timestamp cutter", "bulk download", "4k clips"],
  icons: { icon: "/gem-icon.svg" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Opal Clipper",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f3f7" },
    { media: "(prefers-color-scheme: dark)", color: "#09090e" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
