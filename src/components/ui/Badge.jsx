export default function Badge({ children, variant = "default" }) {
  return (
    <span className={`ui-badge ui-badge--${variant}`}>
      {children}
    </span>
  );
}
