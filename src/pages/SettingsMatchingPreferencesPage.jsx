import { useMemo } from "react";
import { fieldsBySection } from "../lib/preferencesContract";
import { useUserPreferences } from "../hooks/useUserPreferences";
import PreferenceField from "../components/ui/PreferenceField";
import "../styles/settings-matching-preferences.css";

const SECTION_LABELS = {
  safety: "Seguridad",
  running: "Running",
  logistics: "Logística",
  vibe: "Vibe",
};

const SECTION_ORDER = ["safety", "running", "logistics", "vibe"];

export default function SettingsMatchingPreferencesPage() {
  const { preferences, loading, saving, error, setField } = useUserPreferences();
  const sections = useMemo(() => fieldsBySection(), []);

  return (
    <section className="page settingsMatchingPreferencesPage">
      <header className="settingsMatchingPreferences__header">
        <h1 className="settingsMatchingPreferences__title">Preferencias de matcheo</h1>
        <p className="settingsMatchingPreferences__subtitle">
          Cuanto más rellenes, mejores matches. Todos los campos son opcionales.
        </p>
        {error ? <p className="settingsMatchingPreferences__error">{error}</p> : null}
        {saving ? <p className="settingsMatchingPreferences__saving">Guardando…</p> : null}
      </header>

      {SECTION_ORDER.map((sectionId) => (
        <section key={sectionId} className="settingsMatchingPreferences__section">
          <h2 className="settingsMatchingPreferences__sectionTitle">
            {SECTION_LABELS[sectionId]}
          </h2>
          <div className="settingsMatchingPreferences__grid">
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
