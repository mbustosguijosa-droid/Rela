/** Iconos de trazo (24×24, trazo 1.8, mismo peso en todos). Sustituyen a los símbolos de texto (★ ☺ ✉ ♪…). */
const P: Record<string, React.ReactNode> = {
  star: <path d="m12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />,
  users: <><circle cx="9" cy="8.5" r="3.2" /><path d="M3.5 19.5c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8" /><path d="M15.5 5.6a3 3 0 0 1 0 5.8M17.6 14.9c1.6.6 2.6 2.2 2.9 4.6" /></>,
  mail: <><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="m4.5 7.5 7.5 5.5 7.5-5.5" /></>,
  user: <><circle cx="12" cy="8.5" r="3.5" /><path d="M5 19.5c.8-3.4 3.6-5.3 7-5.3s6.2 1.9 7 5.3" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  play: <path d="M8 5.5v13l10.5-6.5z" />,
  music: <><path d="M9 18V6.5l10-2v11" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="15.5" r="2.5" /></>,
};

export function Icon({ name, size = 18, filled = false }: { name: keyof typeof P | string; size?: number; filled?: boolean }) {
  return (
    <svg className="ic" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false"
      fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {P[name]}
    </svg>
  );
}
