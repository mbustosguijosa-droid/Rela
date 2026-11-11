import { cache } from "react";
import { cookies, headers } from "next/headers";
import { DICTS, isLang, LOCALE, type Lang } from "./i18n";

/** Idioma de la visita: el que eligió (cookie) o, si no, el de su navegador. */
export const getLang = cache(async (): Promise<Lang> => {
  const c = (await cookies()).get("lang")?.value;
  if (isLang(c)) return c;
  const accept = (await headers()).get("accept-language") ?? "";
  return /^es\b|^es-/i.test(accept.trim()) || !/\ben\b|en-/i.test(accept) ? "es" : "en";
});

export async function getT() {
  const lang = await getLang();
  return { lang, t: DICTS[lang], locale: LOCALE[lang] };
}
