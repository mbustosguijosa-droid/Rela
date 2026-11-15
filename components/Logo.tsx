/**
 * Marca de Rela Music: unos cascos de una sola línea con tres barras de ecualizador
 * entre los auriculares (escuchar y puntuar). Monocromo: hereda el color del texto.
 */
export function LogoMark({ size = 32, tile = false }: { size?: number; tile?: boolean }) {
  const glyph = (
    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.2 18.2a7.8 7.8 0 0 1 15.6 0" strokeWidth="2.3" />
      <rect x="5.4" y="16.6" width="4.8" height="9.2" rx="2.4" fill="currentColor" stroke="none" />
      <rect x="21.8" y="16.6" width="4.8" height="9.2" rx="2.4" fill="currentColor" stroke="none" />
      <path d="M13.4 24.4v-2.6M16 24.4v-6M18.6 24.4v-3.8" strokeWidth="1.9" className="logo-eq" />
    </g>
  );
  if (!tile) return <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" className="logo-mark">{glyph}</svg>;
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" className="logo-mark tile">
      <defs><linearGradient id="lm-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#a47dff" /><stop offset="1" stopColor="#5b2bd6" /></linearGradient></defs>
      <rect width="32" height="32" rx="8.5" fill="url(#lm-g)" />
      <g color="#fff" transform="translate(0 -0.6)">{glyph}</g>
    </svg>
  );
}
