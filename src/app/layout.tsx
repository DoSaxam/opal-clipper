import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ServiceWorkerRegister } from "@/components/opal/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "Opal — Video Clip Cutter",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  description:
    "Paste any video link, give timestamps, get frame-accurate clips up to 4K. Install it to your home screen and cut like a native app.",
  applicationName: "Opal",
  manifest: "/manifest.webmanifest",
  keywords: [
    "video clipper",
    "youtube clips",
    "timestamp cutter",
    "bulk download",
    "clip cutter",
    "PWA",
  ],
  appleWebApp: {
    capable: true,
    title: "Opal",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
  openGraph: {
    title: "Opal — Video Clip Cutter",
    description:
      "Paste a link, mark timestamps, download frame-accurate clips. Installable, offline-ready, and fully working.",
    type: "website",
    images: ["/icons/icon-512.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f9" },
    { media: "(prefers-color-scheme: dark)", color: "#07080a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* iOS Safari reads these (Next only emits the modern mobile-* variant) */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Opal" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="min-h-dvh antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="top-center"
            theme="system"
            toastOptions={{
              classNames: {
                toast:
                  "surface-glass !rounded-2xl !border-[var(--hairline)] !text-foreground !shadow-2xl",
                description: "!text-muted-foreground",
                actionButton: "!bg-primary !text-[#04191a] !rounded-full",
                cancelButton: "!bg-muted !text-muted-foreground !rounded-full",
              },
            }}
          />
        </ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
