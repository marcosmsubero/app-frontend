import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/useToast";
import { useUserSettings } from "../hooks/useUserSettings";
import { useI18n } from "../i18n/index.jsx";
import "../styles/settings.css";

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function SwitchRow({ title, text, checked, onToggle }) {
  return (
    <div className="settingsSwitchRow">
      <div className="settingsSwitchRow__copy">
        <h3 className="settingsSwitchRow__title">{title}</h3>
        {text ? <p className="settingsSwitchRow__text">{text}</p> : null}
      </div>
      <button
        type="button"
        className={`settingsSwitch${checked ? " is-on" : ""}`}
        onClick={onToggle}
        aria-pressed={checked}
      />
    </div>
  );
}

export default function SettingsPreferencesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { settings, loading, updateSection, resetSettings } = useUserSettings();
  const { setLocale } = useI18n();

  async function savePatch(patch) {
    try {
      await updateSection("preferences", patch);
      // Side-effects: settings must produce real effects.
      if (patch.language) setLocale(patch.language);
      toast?.success?.("Ajuste guardado.");
    } catch {
      toast?.error?.("No se pudo guardar.");
    }
  }

  async function handleReset() {
    try {
      await resetSettings();
      toast?.success?.("Preferencias restablecidas.");
    } catch {
      toast?.error?.("No se pudo restablecer.");
    }
  }

  if (loading) {
    return (
      <section className="page settingsSubpage">
        <div className="settingsCard">Cargando preferencias…</div>
      </section>
    );
  }

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
          <h1 className="settingsSubpage__title">Preferencias</h1>
          <p className="settingsSubpage__subtitle">
            Ajusta cómo quieres usar la app.
          </p>
        </div>
      </div>

      <div className="settingsCard">
        <div className="settingsField">
          <label className="settingsField__label" htmlFor="pref-language">Idioma</label>
          <select
            id="pref-language"
            className="settingsSelect"
            value={settings.preferences.language}
            onChange={(e) => savePatch({ language: e.target.value })}
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="settingsField">
          <label className="settingsField__label" htmlFor="pref-theme">Tema</label>
          <select
            id="pref-theme"
            className="settingsSelect"
            value={settings.preferences.theme}
            onChange={(e) => savePatch({ theme: e.target.value })}
          >
            <option value="system">Sistema</option>
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
          </select>
        </div>

        <div className="settingsField">
          <label className="settingsField__label" htmlFor="pref-distance">Unidad de distancia</label>
          <select
            id="pref-distance"
            className="settingsSelect"
            value={settings.preferences.distance_unit}
            onChange={(e) => savePatch({ distance_unit: e.target.value })}
          >
            <option value="km">Kilómetros</option>
          </select>
        </div>

        <div className="settingsField">
          <label className="settingsField__label" htmlFor="pref-radius">Radio de exploración</label>
          <select
            id="pref-radius"
            className="settingsSelect"
            value={String(settings.preferences.explore_radius_km)}
            onChange={(e) =>
              savePatch({ explore_radius_km: Number(e.target.value) })
            }
          >
            <option value="10">10 km</option>
            <option value="25">25 km</option>
            <option value="50">50 km</option>
            <option value="100">100 km</option>
          </select>
        </div>

        <div className="settingsField">
          <label className="settingsField__label" htmlFor="pref-default-level">Nivel por defecto al crear evento</label>
          <select
            id="pref-default-level"
            className="settingsSelect"
            value={settings.preferences.default_event_level}
            onChange={(e) => savePatch({ default_event_level: e.target.value })}
          >
            <option value="all">Todos</option>
            <option value="beginner">Principiante</option>
            <option value="intermediate">Intermedio</option>
            <option value="advanced">Avanzado</option>
          </select>
        </div>

        <div className="settingsField">
          <label className="settingsField__label" htmlFor="pref-map">Mapa por defecto</label>
          <select
            id="pref-map"
            className="settingsSelect"
            value={settings.preferences.default_map_app}
            onChange={(e) => savePatch({ default_map_app: e.target.value })}
          >
            <option value="internal">Mapa interno</option>
            <option value="google">Google Maps</option>
            <option value="apple">Apple Maps</option>
          </select>
        </div>
      </div>

      <div className="settingsCard settingsListSimple">
        <SwitchRow
          title="Sincronización con calendario"
          text="Prepara la app para integrar exportación o sincronización futura."
          checked={settings.preferences.calendar_sync_enabled}
          onToggle={() =>
            savePatch({
              calendar_sync_enabled:
                !settings.preferences.calendar_sync_enabled,
            })
          }
        />
      </div>

      <div className="settingsDangerBox">
        <h3 className="settingsDangerBox__title">Restablecer preferencias</h3>
        <p className="settingsDangerBox__text">
          Esto volverá a poner las preferencias de la app en sus valores por defecto.
        </p>
        <button
          type="button"
          className="feedCard__action"
          onClick={handleReset}
        >
          Restablecer
        </button>
      </div>
    </section>
  );
}
