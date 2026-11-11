import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header, TabBar } from "@/components/Header";
import { I18nProvider, LangSwitch } from "@/components/I18n";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: { default: "Rela", template: "%s · Rela" }, description: t.meta.description };
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
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap" />
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
