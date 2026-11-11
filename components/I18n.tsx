"use client";

import { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { DICTS, LOCALE, type Lang } from "@/lib/i18n";

const Ctx = createContext<Lang>("es");

export function I18nProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <Ctx.Provider value={lang}>{children}</Ctx.Provider>;
}

export function useT() {
  const lang = useContext(Ctx);
  return { lang, t: DICTS[lang], locale: LOCALE[lang] };
}

export function LangSwitch() {
  const { lang, t } = useT();
  const router = useRouter();
  const set = (l: Lang) => {
    document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = l;
    router.refresh();
  };
  return (
    <div className="lang" role="group" aria-label={t.footer.language}>
      {(["es", "en"] as Lang[]).map((l) => (
        <button key={l} type="button" className={l === lang ? "on" : ""} aria-pressed={l === lang} onClick={() => set(l)}>{l.toUpperCase()}</button>
      ))}
    </div>
  );
}
