type P = { name?: string | null; handle?: string | null; avatar_url?: string | null; accent?: string | null };

export function Avatar({ p, size = 32, ring = false }: { p: P | null | undefined; size?: number; ring?: boolean }) {
  const style: React.CSSProperties = {
    width: size, height: size, borderRadius: "50%", flex: "none", objectFit: "cover",
    boxShadow: ring ? `0 0 0 ${Math.max(2, size / 30)}px var(--bg), 0 0 0 ${Math.max(4, size / 15)}px ${p?.accent ?? "var(--accent)"}` : undefined,
  };
  if (p?.avatar_url)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={p.avatar_url} alt="" width={size} height={size} style={style} referrerPolicy="no-referrer" />;
  const letter = (p?.name || p?.handle || "?").trim()[0]?.toUpperCase() ?? "?";
  return (
    <span aria-hidden="true" style={{ ...style, display: "inline-grid", placeItems: "center", background: p?.accent ?? "var(--accent)", color: "#1b1424", fontFamily: "var(--f-display)", fontWeight: 800, fontSize: size * 0.45 }}>
      {letter}
    </span>
  );
}
