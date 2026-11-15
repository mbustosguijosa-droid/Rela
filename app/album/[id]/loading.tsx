export default function Loading() {
  return (
    <div className="wrap sk-page" aria-busy="true">
      <div className="sk-album">
        <div className="sk sk-cover" />
        <div style={{ flex: 1, minWidth: 0 }}><div className="sk sk-line" style={{ width: "30%" }} /><div className="sk sk-title" /><div className="sk sk-line" style={{ width: "45%" }} /></div>
      </div>
      {Array.from({ length: 8 }, (_, i) => <div key={i} className="sk sk-track" />)}
    </div>
  );
}
