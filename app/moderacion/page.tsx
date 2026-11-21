import Link from "next/link";
import type { Metadata } from "next";
import { getViewer } from "@/lib/auth";
import { getT } from "@/lib/i18n-server";
import { timeAgoT } from "@/lib/i18n";
import { isAdmin } from "@/lib/community";
import { ModButtons } from "@/components/ModButtons";

export const metadata: Metadata = { title: "Moderación", robots: { index: false } };

type Rep = { id: string; reporter_id: string; target_type: "review" | "reply" | "profile" | "conversation"; target_id: string; reason: string; status: string; created_at: string };

export default async function Moderacion() {
  const [{ sb, user }, { t }] = await Promise.all([getViewer(), getT()]);
  if (!sb || !user || !(await isAdmin(sb, user.id))) return <div className="wrap"><section className="hello"><h1>{t.grow.mod}</h1><p>{t.grow.modNo}</p></section></div>;

  const { data } = await sb.from("reports").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(300);
  const reps = (data ?? []) as Rep[];
  // Agrupar por contenido denunciado
  const groups = new Map<string, Rep[]>();
  reps.forEach((r) => { const k = `${r.target_type}:${r.target_id}`; groups.set(k, [...(groups.get(k) ?? []), r]); });
  const ids = (type: string) => [...groups.values()].filter((g) => g[0].target_type === type).map((g) => g[0].target_id);
  const [{ data: rvs }, { data: rps }, { data: prs }] = await Promise.all([
    ids("review").length ? sb.from("reviews").select("id, body, hidden, user_id, release_id").in("id", ids("review")) : Promise.resolve({ data: [] }),
    ids("reply").length ? sb.from("replies").select("id, body, hidden, user_id, review_id").in("id", ids("reply")) : Promise.resolve({ data: [] }),
    sb.from("profiles").select("id, handle, name, bio").in("id", [...new Set([...ids("profile"), ...ids("conversation")])]),
  ]);
  const authorIds = [...(rvs ?? []), ...(rps ?? [])].map((x) => x.user_id);
  const { data: authors } = authorIds.length ? await sb.from("profiles").select("id, handle").in("id", authorIds) : { data: [] };
  const handleOf = (id: string) => (authors ?? []).find((a) => a.id === id)?.handle;

  return (
    <div className="wrap">
      <section className="hello"><h1>{t.grow.mod}</h1><p>{t.grow.modSub}</p></section>
      <section className="section">
        {!groups.size ? <p className="empty">{t.grow.modEmpty}</p> : (
          <ul className="mod-list">
            {[...groups.values()].sort((a, b) => b.length - a.length).map((g) => {
              const r = g[0];
              const item = r.target_type === "review" ? rvs?.find((x) => x.id === r.target_id) : r.target_type === "reply" ? rps?.find((x) => x.id === r.target_id) : prs?.find((x) => x.id === r.target_id);
              const reasons = [...new Set(g.map((x) => t.grow.reasons[x.reason] ?? x.reason).filter(Boolean))];
              return (
                <li key={r.target_type + r.target_id} className="mod-item">
                  <div className="mod-head">
                    <span className="pill">{r.target_type}</span>
                    <b>{t.grow.reportsN(g.length)}</b>
                    {item && "hidden" in item && item.hidden && <span className="pill hot">{t.grow.isHidden}</span>}
                    <span className="muted">{timeAgoT(t, r.created_at)}</span>
                  </div>
                  {reasons.length > 0 && <small className="muted">{reasons.join(" · ")}</small>}
                  {!item ? <p className="muted">{t.grow.gone}</p>
                    : "body" in item ? <>
                        <p className="mod-body">{item.body}</p>
                        <small>{handleOf(item.user_id) && <Link href={`/u/${handleOf(item.user_id)}`}>@{handleOf(item.user_id)}</Link>}{"release_id" in item && <> · <Link href={`/album/${item.release_id}`}>disco</Link></>}</small>
                      </>
                    : <p><Link href={`/u/${item.handle}`}><b>@{item.handle}</b></Link> {item.name} <span className="muted">{item.bio}</span></p>}
                  <ModButtons type={r.target_type} id={r.target_id} canHide={r.target_type === "review" || r.target_type === "reply"} hidden={!!(item && "hidden" in item && item.hidden)} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
