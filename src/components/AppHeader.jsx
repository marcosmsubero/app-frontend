import { useNavigate } from "react-router-dom";

export default function AppHeader({
  title,
  subtitle,
  back = false,
  onBack,
  actions = null,
  eyebrow = null,
}) {
  const nav = useNavigate();

  function handleBack() {
    if (typeof onBack === "function") {
      onBack();
      return;
    }
    nav(-1);
  }

  return (
    <header className="sectionHeader">
      <div className="sectionHeader__main">
        {back && (
          <button
            type="button"
            className="iconButton"
            onClick={handleBack}
            aria-label="Volver"
            title="Volver"
          >
            ←
          </button>
        )}

        <div className="sectionHeader__copy">
          {eyebrow ? <div className="sectionHeader__eyebrow">{eyebrow}</div> : null}
          <h1 className="sectionHeader__title">{title}</h1>
          {subtitle ? <p className="sectionHeader__subtitle">{subtitle}</p> : null}
        </div>
      </div>

      {actions ? <div className="sectionHeader__actions">{actions}</div> : null}
    </header>
  );
}
