// app/layout.tsx
import "./globals.css";
import { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import { OffloadProvider } from "@/context/offloadContext";

export const metadata = {
  title: "PETROS Admin",
  description: "Sales and Inventory Management System",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <OffloadProvider>{children}</OffloadProvider>
        </AuthProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
