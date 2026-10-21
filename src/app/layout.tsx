import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = localFont({
  src: [{ path: "../../public/fonts/Inter.woff2", weight: "300 800", style: "normal" }],
  variable: "--font-inter",
  display: "block",
  fallback: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
  preload: true,
});

export const metadata: Metadata = {
  title: "Opal — Video Clip Cutter",
  description:
    "Paste any video link, give timestamps, get frame-accurate clips. Premium quality downloads with quality selection and bulk ZIP export.",
  keywords: ["video clipper", "youtube clips", "timestamp cutter", "bulk download"],
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Opal",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0e0d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased" style={{ background: "#040605" }}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
