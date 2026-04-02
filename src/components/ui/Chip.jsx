export default function Chip({ children, active }) {
  return (
    <div className={`ui-chip ${active ? "ui-chip--active" : ""}`}>
      {children}
    </div>
  );
}
