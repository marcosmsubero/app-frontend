export default function Card({ children, compact }) {
  return (
    <div className={`ui-card ${compact ? "ui-card--compact" : ""}`}>
      {children}
    </div>
  );
}
