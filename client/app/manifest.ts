import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PETROS — Sales & Inventory Management",
    short_name: "PETROS",
    description: "Sales and Inventory Management System",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0A2540",
    theme_color: "#0A2540",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
