import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LogoMark } from "./Logo";
import { Avatar } from "./Avatar";
import { LangSwitch } from "./I18n";
import { AccentPicker } from "./AccentPicker";
import { cookies } from "next/headers";
import { ACCENT_COOKIE, DEFAULT_ACCENT } from "@/lib/accent";
import { NavLinks } from "./NavLinks";
import { getViewer } from "@/lib/auth";
import { getT } from "@/lib/i18n-server";
import { unreadCount } from "@/lib/messages";

const I = {
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" strokeLinejoin="round" /></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" /></svg>,
  friends: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5" /><circle cx="17" cy="9" r="2.8" /><path d="M16 14.6c2.8-.3 4.8 1.4 5.6 4.4" /></svg>,
  dm: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 5h16v11H9l-5 4z" strokeLinejoin="round" /></svg>,
  me: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>,
};

export async function Header() {
  const [{ sb, user, profile }, { t }] = await Promise.all([getViewer(), getT()]);
  const unread = sb && user ? await unreadCount(sb, user.id) : 0;
  const items = [
    { href: "/", label: t.nav.home },
    { href: "/buscar", label: t.nav.explore },
    { href: "/amigos", label: t.nav.friends },
    ...(user ? [{ href: "/mensajes", label: t.dm.nav, badge: unread }] : []),
  ];
  return (
    <header className="top">
      <div className="wrap">
        <div className="bar">
          <Link className="logo" href="/" aria-label={t.nav.homeLabel}><LogoMark tile size={30} /><span>{BRAND.short}<small className="logo-sub">{BRAND.sub.toLowerCase()}</small></span></Link>
          <nav className="nav" aria-label={t.nav.main}><NavLinks items={items} className="nav-link" /></nav>
          <form className="search" action="/buscar" role="search">
            {I.search}
            <input name="q" type="search" placeholder={t.nav.searchPh} aria-label={t.nav.searchLabel} autoComplete="off" />
          </form>
          <AccentPicker initial={decodeURIComponent((await cookies()).get(ACCENT_COOKIE)?.value ?? DEFAULT_ACCENT)} />
          <LangSwitch />
          {user ? (
            <Link href="/perfil" className="me-chip" aria-label={t.nav.myProfile}><Avatar p={profile} size={36} ring /></Link>
          ) : (
            <Link href="/entrar" className="btn primary sm enter-btn">{t.nav.enter}</Link>
          )}
        </div>
      </div>
    </header>
  );
}

export async function TabBar() {
  const [{ sb, user }, { t }] = await Promise.all([getViewer(), getT()]);
  const unread = sb && user ? await unreadCount(sb, user.id) : 0;
  const items = [
    { href: "/", label: t.nav.home, icon: I.home },
    { href: "/buscar", label: t.nav.search, icon: I.search },
    { href: "/amigos", label: t.nav.friends, icon: I.friends },
    ...(user ? [{ href: "/mensajes", label: t.dm.nav, icon: I.dm, badge: unread }] : []),
    { href: user ? "/perfil" : "/entrar", label: user ? t.nav.profile : t.nav.enter, icon: I.me },
  ];
  return <nav className="tabs" aria-label={t.nav.tabs}><NavLinks items={items} className="tab" /></nav>;
}
