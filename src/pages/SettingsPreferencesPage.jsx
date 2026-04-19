import { useMemo } from "react";
import {
  PREFERENCE_FIELDS,
  fieldsBySection,
} from "../lib/preferencesContract";
import { useUserPreferences } from "../hooks/useUserPreferences";
import PreferenceField from "../components/ui/PreferenceField";
import "../styles/settings-preferences.css";

const SECTION_LABELS = {
  safety: "Seguridad",
  running: "Running",
  logistics: "Logística",
  vibe: "Vibe",
};

const SECTION_ORDER = ["safety", "running", "logistics", "vibe"];

export default function SettingsPreferencesPage() {
  const { preferences, loading, saving, error, setField } = useUserPreferences();
  const sections = useMemo(() => fieldsBySection(), []);

  return (
    <section className="page settingsPreferencesPage">
      <header className="settingsPreferences__header">
        <h1 className="settingsPreferences__title">Preferencias de matcheo</h1>
        <p className="settingsPreferences__subtitle">
          Cuanto más rellenes, mejores matches. Todos los campos son opcionales.
        </p>
        {error ? <p className="settingsPreferences__error">{error}</p> : null}
        {saving ? <p className="settingsPreferences__saving">Guardando…</p> : null}
      </header>

      {SECTION_ORDER.map((sectionId) => (
        <section key={sectionId} className="settingsPreferences__section">
          <h2 className="settingsPreferences__sectionTitle">
            {SECTION_LABELS[sectionId]}
          </h2>
          <div className="settingsPreferences__grid">
            {(sections[sectionId] || []).map((field) => (
              <PreferenceField
                key={field.id}
                field={field}
                entry={preferences[field.id]}
                onChange={(entry) => setField(field.id, entry)}
                disabled={loading || saving}
              />
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}
