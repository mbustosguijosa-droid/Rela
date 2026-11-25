import { cache } from "react";
import { cookies, headers } from "next/headers";
import { DICTS, isLang, LANGS, LOCALE, type Lang } from "./i18n";

/** Idioma de la visita: el que eligió (cookie) o, si no, el de su navegador. */
export const getLang = cache(async (): Promise<Lang> => {
  const c = (await cookies()).get("lang")?.value;
  if (isLang(c)) return c;
  // Primer idioma del navegador que tengamos (es-MX → es, pt-PT → pt…); si ninguno, inglés
  const accept = (await headers()).get("accept-language") ?? "";
  for (const part of accept.split(",")) {
    const code = part.trim().slice(0, 2).toLowerCase();
    if ((LANGS as string[]).includes(code)) return code as Lang;
  }
  return accept ? "en" : "es";
});

export async function getT() {
  const lang = await getLang();
  return { lang, t: DICTS[lang], locale: LOCALE[lang] };
}
