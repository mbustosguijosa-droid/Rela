import type { SupabaseClient } from "@supabase/supabase-js";

export type Msg = { id: string; sender_id: string; recipient_id: string; body: string; created_at: string; read_at: string | null };
export type Peer = { id: string; handle: string; name: string; avatar_url: string | null; accent: string };
export type Conversation = { peer: Peer; last: Msg; unread: number };

/** Bandeja de entrada: última conversación con cada persona. */
export async function getInbox(sb: SupabaseClient, me: string): Promise<Conversation[]> {
  const { data, error } = await sb.from("messages").select("*").or(`sender_id.eq.${me},recipient_id.eq.${me}`).order("created_at", { ascending: false }).limit(500);
  if (error || !data) return [];
  const byPeer = new Map<string, { last: Msg; unread: number }>();
  for (const m of data as Msg[]) {
    const other = m.sender_id === me ? m.recipient_id : m.sender_id;
    const cur = byPeer.get(other) ?? { last: m, unread: 0 };
    if (m.recipient_id === me && !m.read_at) cur.unread++;
    byPeer.set(other, cur);
  }
  if (!byPeer.size) return [];
  const { data: peers } = await sb.from("profiles").select("id, handle, name, avatar_url, accent").in("id", [...byPeer.keys()]);
  return (peers ?? []).map((p: Peer) => ({ peer: p, ...byPeer.get(p.id)! })).sort((a, b) => b.last.created_at.localeCompare(a.last.created_at));
}

export async function getThread(sb: SupabaseClient, me: string, other: string, limit = 200): Promise<Msg[]> {
  const { data } = await sb.from("messages").select("*")
    .or(`and(sender_id.eq.${me},recipient_id.eq.${other}),and(sender_id.eq.${other},recipient_id.eq.${me})`)
    .order("created_at", { ascending: false }).limit(limit);
  return ((data ?? []) as Msg[]).reverse();
}

export async function unreadCount(sb: SupabaseClient, me: string) {
  const { count, error } = await sb.from("messages").select("*", { count: "exact", head: true }).eq("recipient_id", me).is("read_at", null);
  return error ? 0 : count ?? 0;
}
