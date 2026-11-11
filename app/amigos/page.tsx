import Link from "next/link";
import type { Metadata } from "next";
import { getViewer, type Profile } from "@/lib/auth";
import { getFollowing } from "@/lib/reviews";
import { releasesByIds } from "@/lib/releases";
import { Avatar } from "@/components/Avatar";
import { FollowButton } from "@/components/FollowButton";
import { CopyInvite } from "@/components/CopyInvite";

export const metadata: Metadata = { title: "Amigos" };

type Props = { searchParams: Promise<{ q?: string }> };

export default async function Amigos({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const { sb, user } = await getViewer();
  if (!sb) return <div className="wrap"><p className="empty" style={{ marginTop: 30 }}>Las cuentas todavía no están configuradas.</p></div>;
  const following = await getFollowing(sb, user?.id);
  const query = q.trim().replace(/[%,()]/g, "");

  const [{ data: found }, { data: followingProfiles }, { data: recent }] = await Promise.all([
    query ? sb.from("profiles").select("*").or(`handle.ilike.%${query}%,name.ilike.%${query}%,city.ilike.%${query}%`).not("handle", "like", "user\\_%").limit(24) : Promise.resolve({ data: null }),
    following.length ? sb.from("profiles").select("*").in("id", following) : Promise.resolve({ data: [] }),
    sb.from("profiles").select("*").not("handle", "like", "user\\_%").order("created_at", { ascending: false }).limit(30),
  ]);
  const suggestions = ((recent ?? []) as Profile[]).filter((p) => p.id !== user?.id && !following.includes(p.id)).slice(0, 12);
  const all = [...((found ?? []) as Profile[]), ...((followingProfiles ?? []) as Profile[]), ...suggestions];
  const covers = await releasesByIds(sb, [...new Set(all.flatMap((p) => (p.favorites ?? []).map(Number)))]);

  const card = (p: Profile) => {
    const favs = (p.favorites ?? []).map((id) => covers.get(Number(id))).filter(Boolean);
    const bg = p.banner_url ?? favs[0]?.cover_url;
    return (
      <div className="pcard" key={p.id}>
        <Link className="pb" href={`/u/${p.handle}`} style={bg ? { backgroundImage: `url('${bg}')` } : { background: `linear-gradient(120deg, ${p.accent}, var(--surface-2))` }} aria-label={`Perfil de ${p.name || p.handle}`} />
        <div className="pc">
          <Link href={`/u/${p.handle}`}><Avatar p={p} size={52} /></Link>
          <div style={{ minWidth: 0 }}><Link className="nm" href={`/u/${p.handle}`}>{p.name || p.handle}</Link><div className="hd">@{p.handle}{p.city ? ` · ${p.city}` : ""}</div></div>
          {favs.length > 0 && <div style={{ display: "flex", gap: 4 }}>{favs.map((f) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={f!.id} src={f!.cover_url ?? ""} alt="" style={{ width: "calc(25% - 3px)", aspectRatio: 1, borderRadius: 3, objectFit: "cover" }} />
          ))}</div>}
          <div className="row2"><span>{p.bio ? p.bio.slice(0, 50) + (p.bio.length > 50 ? "…" : "") : ""}</span>
            {p.id !== user?.id && <FollowButton userId={p.id} initial={following.includes(p.id)} loggedIn={!!user} small />}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="wrap">
      <section className="hello"><h1>Amigos</h1><p>Sigue a gente con buen oído, mira qué escuchan y compara tus notas con las suyas.</p></section>
      <section className="section">
        <form action="/amigos" className="field" style={{ maxWidth: 440 }}>
          <label className="lbl" htmlFor="pq">Buscar personas</label>
          <div style={{ display: "flex", gap: 8 }}><input id="pq" name="q" defaultValue={q} placeholder="Nombre, @usuario o ciudad" /><button className="btn primary">Buscar</button></div>
        </form>
      </section>
      {query && (
        <section className="section">
          <div className="sec-head"><h2>Resultados</h2><span>{found?.length ?? 0}</span></div>
          {found?.length ? <div className="people">{(found as Profile[]).map(card)}</div> : <p className="empty">Nadie coincide con “{q}”. Invítale con tu enlace.</p>}
        </section>
      )}
      {user ? (
        <section className="section">
          <div className="sec-head"><h2>Siguiendo</h2><span>{following.length}</span></div>
          {followingProfiles?.length ? <div className="people">{(followingProfiles as Profile[]).map(card)}</div> : <p className="empty">Todavía no sigues a nadie. Busca a tus amigos o mira las sugerencias.</p>}
        </section>
      ) : (
        <section className="section"><p className="empty"><Link className="linkbtn" href="/entrar?next=/amigos">Entra</Link> para seguir a tus amigos y ver sus notas en tu inicio.</p></section>
      )}
      <section className="section">
        <div className="sec-head"><h2>Gente nueva en Rela</h2></div>
        {suggestions.length ? <div className="people">{suggestions.map(card)}</div> : <p className="empty">Aún hay poca gente. Invita a tus amigos para empezar.</p>}
      </section>
      <section className="section">
        <div className="size-note" style={{ justifyContent: "space-between", flexWrap: "wrap", alignItems: "center" }}>
          <div><b>Invita a tus amigos</b><span className="muted">Rela es mejor con tu gente: comparte el enlace.</span></div>
          <CopyInvite />
        </div>
      </section>
    </div>
  );
}
