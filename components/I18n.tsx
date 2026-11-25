"use client";

import { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { DICTS, LANG_NAMES, LANGS, LOCALE, type Lang } from "@/lib/i18n";

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
    <label className="lang lang-select" title={t.footer.language}>
      <span className="sr-only">{t.footer.language}</span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z" fill="none" stroke="currentColor" strokeWidth="1.7" /></svg>
      <b aria-hidden="true">{lang.toUpperCase()}</b>
      <select value={lang} onChange={(e) => set(e.target.value as Lang)} aria-label={t.footer.language}>
        {LANGS.map((l) => <option key={l} value={l}>{LANG_NAMES[l]}</option>)}
      </select>
    </label>
  );
}
