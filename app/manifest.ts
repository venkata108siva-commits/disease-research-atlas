import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Research Atlas",
    short_name: "Research Atlas",
    description: "Any research topic or disease: peer-reviewed papers ranked standard-first and filtered by source, study type and stage.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0b1035",
    theme_color: "#0b1035",
    categories: ["education", "medical", "science", "reference"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
