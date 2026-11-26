import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FJA Conseils — Suivi Opérations",
    short_name: "FJA Conseils",
    description: "Tableau de bord commercial et suivi des ventes FJA Conseils",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#f59e0b",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
