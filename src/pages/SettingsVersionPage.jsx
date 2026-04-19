import { useNavigate } from "react-router-dom";
import "../styles/settings.css";

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

export default function SettingsVersionPage() {
  const navigate = useNavigate();

  const buildInfo = {
    version: "v0.1.0",
    environment: import.meta.env.MODE || "development",
    apiBase: import.meta.env.VITE_API_BASE_URL || "No definida",
  };

  return (
    <section className="page settingsSubpage">
      <div className="settingsSubpage__header">
        <button
          type="button"
          className="settingsSubpage__back"
          onClick={() => navigate(-1)}
          aria-label="Volver"
        >
          <BackIcon />
        </button>
        <div>
          <h1 className="settingsSubpage__title">Versión de la app</h1>
          <p className="settingsSubpage__subtitle">
            Información técnica de esta instalación.
          </p>
        </div>
      </div>

      <div className="settingsCard settingsListSimple">
        <div>
          <h3 className="settingsSwitchRow__title">Versión</h3>
          <p className="settingsMuted">{buildInfo.version}</p>
        </div>

        <div>
          <h3 className="settingsSwitchRow__title">Entorno</h3>
          <p className="settingsMuted">{buildInfo.environment}</p>
        </div>

        <div>
          <h3 className="settingsSwitchRow__title">API base</h3>
          <p className="settingsMuted">{buildInfo.apiBase}</p>
        </div>
      </div>
    </section>
  );
}
