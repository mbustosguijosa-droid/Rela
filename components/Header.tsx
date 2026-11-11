import Link from "next/link";
import { LogoMark } from "./Logo";
import { Avatar } from "./Avatar";
import { getViewer } from "@/lib/auth";

export async function Header() {
  const { user, profile } = await getViewer();
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
          <Link href="/amigos">Amigos</Link>
          {user && <Link href="/perfil">Mi perfil</Link>}
        </nav>
        <form className="search" action="/buscar" role="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input name="q" type="search" placeholder="Álbumes, singles o artistas" aria-label="Buscar" autoComplete="off" />
        </form>
        {user ? (
          <Link href="/perfil" className="me-chip" aria-label="Mi perfil"><Avatar p={profile} size={34} /></Link>
        ) : (
          <Link href="/entrar" className="btn primary sm enter-btn">Entrar</Link>
        )}
      </div>
    </header>
  );
}

export async function TabBar() {
  const { user } = await getViewer();
  return (
    <nav className="tabs" aria-label="Pestañas">
      <Link href="/"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" /></svg>Inicio</Link>
      <Link href="/buscar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>Buscar</Link>
      <Link href="/amigos"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5" /><circle cx="17" cy="9" r="2.8" /><path d="M16 14.6c2.8-.3 4.8 1.4 5.6 4.4" /></svg>Amigos</Link>
      <Link href={user ? "/perfil" : "/entrar"}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>{user ? "Perfil" : "Entrar"}</Link>
    </nav>
  );
}
