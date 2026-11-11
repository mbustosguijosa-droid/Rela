import Link from "next/link";
import { LogoMark } from "./Logo";

export function Header() {
  return (
    <header className="top">
      <div className="wrap">
        <Link className="logo" href="/" aria-label="Rela, inicio">
          <LogoMark />
          Rela
        </Link>
        <nav className="nav" aria-label="Principal">
          <Link href="/">Inicio</Link>
          <Link href="/buscar">Explorar</Link>
        </nav>
        <form className="search" action="/buscar" role="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input name="q" type="search" placeholder="Álbumes, singles o artistas" aria-label="Buscar" autoComplete="off" />
        </form>
      </div>
    </header>
  );
}

export function TabBar() {
  return (
    <nav className="tabs" aria-label="Pestañas">
      <Link href="/"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" /></svg>Inicio</Link>
      <Link href="/buscar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>Buscar</Link>
    </nav>
  );
}
