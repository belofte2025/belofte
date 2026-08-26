// app/layout.tsx
import "./globals.css";
import { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
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
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0A2540",
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
        <Toaster position="top-right" />
        <PwaRegister />
      </body>
    </html>
  );
}
