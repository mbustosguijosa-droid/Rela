/** Color secundario de la web, elegido por cada persona (se guarda en una cookie). */
export const ACCENT_COOKIE = "accent";
export const DEFAULT_ACCENT = "#ff6a3d";
export const ACCENT_PRESETS: { hex: string; k: string }[] = [
  { hex: "#ff6a3d", k: "coral" }, { hex: "#8b5cf6", k: "purple" }, { hex: "#ec4899", k: "pink" }, { hex: "#ef4444", k: "red" }, { hex: "#f97316", k: "orange" },
  { hex: "#f59e0b", k: "amber" }, { hex: "#a3e635", k: "lime" }, { hex: "#22c55e", k: "green" }, { hex: "#14b8a6", k: "teal" },
  { hex: "#38bdf8", k: "sky" }, { hex: "#3b82f6", k: "blue" },
];
export const isHex = (v: unknown): v is string => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);

/** Texto blanco o casi negro según lo claro que sea el color (para que se lea encima). */
export function inkFor(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const lin = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  // contraste con blanco vs. con casi negro: gana el mayor
  return (1.05 / (L + 0.05)) >= ((L + 0.05) / 0.06) ? "#ffffff" : "#120e16";
}
