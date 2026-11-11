export const cls = (s: number | null | undefined) => (s == null ? "none" : s >= 8 ? "hi" : s >= 6 ? "mid" : "lo");
export const f1 = (s: number | null | undefined) => (s == null ? "–" : (Math.round(Number(s) * 10) / 10).toFixed(1));
export const nf = (n: number) => n.toLocaleString("es-ES");
export function timeAgo(iso: string) {
  const h = (Date.now() - new Date(iso).getTime()) / 3.6e6;
  if (h < 1) return "ahora";
  if (h < 24) return `hace ${Math.round(h)} h`;
  const d = Math.round(h / 24);
  return d < 30 ? `hace ${d} d` : d < 365 ? `hace ${Math.round(d / 30)} mes` : `hace ${Math.round(d / 365)} a`;
}
export const ACCENTS = ["#a77bff", "#ff6f91", "#ffb547", "#b6e35a", "#6cc4ff", "#ff8a4c"];
