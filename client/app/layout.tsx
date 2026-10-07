// app/layout.tsx
import "./globals.css";
import { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { OffloadProvider } from "@/context/offloadContext";
import PwaRegister from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "PETROS Admin",
  description: "Sales and Inventory Management System",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PETROS",
  },
  icons: {
    // The SVG is listed first so browsers that support it scale the mark
    // cleanly at any tab size; the PNGs and app/favicon.ico cover the rest.
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Next's appleWebApp.capable metadata field doesn't emit this tag in this Next version —
            without it iOS Safari opens the installed app inside browser chrome instead of standalone. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <AuthProvider>
          <OffloadProvider>{children}</OffloadProvider>
        </AuthProvider>
        <Toaster />
        <PwaRegister />
      </body>
    </html>
  );
}
