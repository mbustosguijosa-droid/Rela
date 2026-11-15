import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { getT } from "@/lib/i18n-server";
import { getInbox } from "@/lib/messages";
import { Avatar } from "@/components/Avatar";
import { timeAgoT } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> { const { t } = await getT(); return { title: t.dm.title }; }

export default async function Inbox() {
  const [{ sb, user }, { t }] = await Promise.all([getViewer(), getT()]);
  if (!sb || !user) redirect("/entrar?next=/mensajes");
  const convs = await getInbox(sb, user.id);
  return (
    <div className="wrap" style={{ maxWidth: 760 }}>
      <section className="hello"><h1>{t.dm.title}</h1></section>
      <section className="section">
        {convs.length ? (
          <div className="inbox">
            {convs.map((c) => (
              <Link key={c.peer.id} className={`conv ${c.unread ? "unread" : ""}`} href={`/mensajes/${c.peer.handle}`}>
                <Avatar p={c.peer} size={48} />
                <div className="conv-main">
                  <div className="conv-top"><b>{c.peer.name || c.peer.handle}</b><span className="muted">@{c.peer.handle}</span><span className="conv-time">{timeAgoT(t, c.last.created_at)}</span></div>
                  <p>{c.last.sender_id === user.id ? <span className="muted">{t.dm.you} </span> : null}{c.last.body}</p>
                </div>
                {c.unread > 0 && <span className="badge-n" aria-label={t.dm.unread(c.unread)}>{c.unread}</span>}
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty" style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
            <b style={{ color: "var(--fg)" }}>{t.dm.empty}</b><span>{t.dm.emptyHint}</span>
            <Link className="btn primary sm" href="/amigos">{t.dm.findPeople}</Link>
          </div>
        )}
      </section>
    </div>
  );
}
