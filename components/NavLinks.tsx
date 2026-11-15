"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; badge?: number; icon?: React.ReactNode };

/** Enlaces de navegación que marcan la sección en la que estás. */
export function NavLinks({ items, className }: { items: Item[]; className: string }) {
  const path = usePathname();
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href) || (href === "/perfil" && path.startsWith("/u/")));
  return (
    <>
      {items.map((it) => (
        <Link key={it.href} href={it.href} className={`${className} ${active(it.href) ? "on" : ""}`} aria-current={active(it.href) ? "page" : undefined}>
          {it.icon}
          <span>{it.label}</span>
          {!!it.badge && <span className="badge-n">{it.badge}</span>}
        </Link>
      ))}
    </>
  );
}
