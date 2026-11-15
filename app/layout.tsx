import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header, TabBar } from "@/components/Header";
import { I18nProvider, LangSwitch } from "@/components/I18n";
import { getT } from "@/lib/i18n-server";
import { headers } from "next/headers";
import { BRAND } from "@/lib/brand";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return { metadataBase: new URL(`${proto}://${host}`), title: { default: `${BRAND.name} · ${t.meta.tagline}`, template: `%s · ${BRAND.name}` }, description: t.meta.description,
    applicationName: BRAND.name, appleWebApp: { title: BRAND.short, capable: true }, openGraph: { siteName: BRAND.name, type: "website" } };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang, t } = await getT();
  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,400..800,50..100;1,9..144,400..700,50..100&family=Figtree:wght@400;500;600;700;800&display=swap" />
      </head>
      <body>
        <I18nProvider lang={lang}>
          <Header />
          <main>{children}</main>
          <TabBar />
          <footer className="wrap" style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <span>{t.footer.beta}</span><a href="/privacidad">{t.footer.privacy}</a><a href="/terminos">{t.footer.terms}</a>
            <span style={{ marginLeft: "auto" }}><LangSwitch /></span>
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
