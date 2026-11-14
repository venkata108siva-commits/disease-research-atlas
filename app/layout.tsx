import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  title: "Research Atlas · Any topic, every peer-reviewed study, ranked and filtered",
  description:
    "Search any research topic or browse human, animal and plant diseases and agricultural problems. Peer-reviewed papers ranked standard-first and filtered by source (plants, fungi, bacteria, endophytes, insects, viruses and more), study type, stage, year and country. Verified sources only.",
  applicationName: "Research Atlas",
  appleWebApp: { capable: true, title: "Research Atlas", statusBarStyle: "black-translucent" },
  openGraph: { title: "Research Atlas", description: "Any topic. Every peer-reviewed study. Ranked standard-first and filtered by source.", type: "website" },
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
