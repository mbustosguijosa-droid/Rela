export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <path d="M7 19.5V16a9 9 0 0 1 18 0v3.5" fill="none" stroke="var(--logo-line)" strokeWidth="5" strokeLinecap="round" />
      <path d="M7 19.5V16a9 9 0 0 1 18 0v3.5" fill="none" stroke="var(--logo)" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="2.8" y="16.2" width="8.4" height="12.6" rx="4.2" fill="var(--logo)" stroke="var(--logo-line)" strokeWidth="1.6" />
      <rect x="20.8" y="16.2" width="8.4" height="12.6" rx="4.2" fill="var(--logo)" stroke="var(--logo-line)" strokeWidth="1.6" />
      <rect x="7.6" y="18.6" width="2" height="7.8" rx="1" fill="var(--logo-shade)" />
      <rect x="22.4" y="18.6" width="2" height="7.8" rx="1" fill="var(--logo-shade)" />
      <path d="M4.9 19.6v2.6M22.9 19.6v2.6" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" opacity=".85" />
      <path d="M11.6 9.6a7 7 0 0 1 3-1.9" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity=".7" />
    </svg>
  );
}
