import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tracer — Editorial Automation für Radiologie & Bildgebung",
  description:
    "Tracer Studio generiert wöchentliche LinkedIn-Editorials für Praxen und MedTech-Firmen. Tracer Brief: der Newsletter zu KI in der Bildgebung.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
