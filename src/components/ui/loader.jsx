export default function Loader({ text = "Cargando…" }) {
  return (
    <div className="muted" style={{ padding: 16 }}>
      ⏳ {text}
    </div>
  );
}
