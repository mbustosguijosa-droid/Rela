import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header, TabBar } from "@/components/Header";

export const metadata: Metadata = {
  title: { default: "Rela", template: "%s · Rela" },
  description: "Puntúa tus discos canción a canción, lee lo que opina la gente y comparte tus notas.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap" />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <TabBar />
        <footer className="wrap">Rela · versión en desarrollo. Catálogo: Deezer.</footer>
      </body>
    </html>
  );
}
