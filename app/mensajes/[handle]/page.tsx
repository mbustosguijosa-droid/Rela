import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getViewer, type Profile } from "@/lib/auth";
import { getT } from "@/lib/i18n-server";
import { getThread } from "@/lib/messages";
import { Avatar } from "@/components/Avatar";
import { Chat } from "@/components/Chat";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params; const { t } = await getT();
  return { title: `${t.dm.title} · @${handle}`, robots: { index: false } };
}

export default async function Thread({ params }: Props) {
  const { handle } = await params;
  const [{ sb, user, profile }, { t }] = await Promise.all([getViewer(), getT()]);
  if (!sb || !user || !profile) redirect(`/entrar?next=/mensajes/${handle}`);
  const { data: peer } = await sb.from("profiles").select("*").eq("handle", handle.toLowerCase()).maybeSingle<Profile>();
  if (!peer) notFound();
  if (peer.id === user.id) redirect("/mensajes");
  const [messages, { data: block }] = await Promise.all([
    getThread(sb, user.id, peer.id),
    sb.from("blocks").select("blocked_id").eq("user_id", user.id).eq("blocked_id", peer.id).maybeSingle(),
  ]);
  await sb.from("messages").update({ read_at: new Date().toISOString() }).eq("recipient_id", user.id).eq("sender_id", peer.id).is("read_at", null);
  return (
    <div className="wrap chat-wrap">
      <div className="chat-head">
        <Link href="/mensajes" className="muted chat-back">{t.dm.back}</Link>
        <Link href={`/u/${peer.handle}`} className="who-l"><Avatar p={peer} size={40} /><span><b>{peer.name || peer.handle}</b><br /><span className="muted" style={{ fontSize: 13 }}>@{peer.handle}</span></span></Link>
      </div>
      <Chat
        me={{ id: user.id, name: profile.name, handle: profile.handle, avatar_url: profile.avatar_url, accent: profile.accent }}
        peer={{ id: peer.id, name: peer.name, handle: peer.handle, avatar_url: peer.avatar_url, accent: peer.accent }}
        initial={messages}
        initiallyBlocked={!!block}
      />
    </div>
  );
}
