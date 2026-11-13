import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  title: "Disease Research Atlas · Verified research for human, animal, plant and agricultural diseases",
  description:
    "Browse every human, animal and plant disease and agricultural problem, then filter peer-reviewed research by source (plants, fungi, bacteria, endophytes, insects, viruses and more), study type, stage, year and country. Verified sources only.",
  applicationName: "Disease Research Atlas",
  appleWebApp: { capable: true, title: "Research Atlas", statusBarStyle: "black-translucent" },
  openGraph: { title: "Disease Research Atlas", description: "Human · Animal · Plant · Agriculture. Every disease, every peer-reviewed study, filtered by source.", type: "website" },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0b1035" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
