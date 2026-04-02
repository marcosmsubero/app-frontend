export default function Button({ children, variant = "primary" }) {
  return (
    <button className={`ui-button ui-button--${variant}`}>
      {children}
    </button>
  );
}
