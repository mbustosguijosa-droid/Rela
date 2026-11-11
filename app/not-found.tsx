import Link from "next/link";
export default function NotFound() {
  return (
    <div className="wrap"><section className="hello"><h1>No encontramos esta página</h1><p>Puede que el disco ya no esté en el catálogo. <Link href="/buscar" style={{ color: "var(--accent-text)" }}>Busca otro</Link>.</p></section></div>
  );
}
