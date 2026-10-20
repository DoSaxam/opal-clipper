import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "Opal — Video Clip Cutter",
  description:
    "Paste any video link, give timestamps, get frame-accurate clips. Premium quality downloads with quality selection and bulk ZIP export.",
  keywords: ["video clipper", "youtube clips", "timestamp cutter", "bulk download"],
  icons: {
    icon: "/gem-icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Opal",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0B0D",
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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" style={{ background: "#050608" }}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
