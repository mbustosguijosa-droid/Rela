/** Se ve al instante al tocar un enlace, mientras llega la página. */
export default function Loading() {
  return (
    <div className="wrap sk-page" aria-busy="true" aria-live="polite">
      <div className="sk sk-title" />
      <div className="sk sk-line" />
      <div className="row">{Array.from({ length: 6 }, (_, i) => <div key={i} className="poster"><div className="cover sk" /><div className="sk sk-t" /><div className="sk sk-a" /></div>)}</div>
      <div className="row" style={{ marginTop: 28 }}>{Array.from({ length: 6 }, (_, i) => <div key={i} className="poster"><div className="cover sk" /><div className="sk sk-t" /><div className="sk sk-a" /></div>)}</div>
    </div>
  );
}
