import Link from "next/link";
import { getT } from "@/lib/i18n-server";

export default async function NotFound() {
  const { t } = await getT();
  return (
    <div className="wrap"><section className="hello"><h1>{t.notFound.title}</h1><p>{t.notFound.text} <Link href="/buscar" style={{ color: "var(--accent-text)" }}>{t.notFound.other}</Link>.</p></section></div>
  );
}
