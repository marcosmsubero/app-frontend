import { useMemo } from "react";
import { fieldsBySection } from "../lib/preferencesContract";
import { useUserPreferences } from "../hooks/useUserPreferences";
import PreferenceField from "../components/ui/PreferenceField";
import { useToast } from "../hooks/useToast";
import "../styles/settings-matching-preferences.css";

const SECTION_LABELS = {
  safety: "Seguridad",
  running: "Running",
  logistics: "Logística",
  vibe: "Vibe",
};

const SECTION_ORDER = ["safety", "running", "logistics", "vibe"];

export default function SettingsMatchingPreferencesPage() {
  const {
    draft,
    isDirty,
    loading,
    saving,
    error,
    setField,
    save,
    discard,
  } = useUserPreferences();
  const { showToast } = useToast();
  const sections = useMemo(() => fieldsBySection(), []);

  async function handleSave() {
    try {
      await save();
      showToast("Preferencias guardadas", { variant: "success" });
    } catch {
      // error state is already set by the hook; toast as fallback UX.
      showToast("No se pudieron guardar las preferencias", { variant: "error" });
    }
  }

  return (
    <section className="page settingsMatchingPreferencesPage">
      <header className="settingsMatchingPreferences__header">
        <h1 className="settingsMatchingPreferences__title">Preferencias de matcheo</h1>
        <p className="settingsMatchingPreferences__subtitle">
          Cuanto más rellenes, mejores matches. Todos los campos son opcionales.
        </p>
        {error ? <p className="settingsMatchingPreferences__error">{error}</p> : null}
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
                entry={draft[field.id]}
                onChange={(entry) => setField(field.id, entry)}
                disabled={loading || saving}
              />
            ))}
          </div>
        </section>
      ))}

      {/* Bottom-sticky action bar. Only renders when the draft diverges
          from the server state so it doesn't take vertical space while
          the user is reviewing their saved prefs. */}
      {isDirty ? (
        <div className="settingsMatchingPreferences__actions">
          <button
            type="button"
            className="app-button app-button--ghost app-button--sm"
            onClick={discard}
            disabled={saving}
          >
            Descartar
          </button>
          <button
            type="button"
            className="app-button app-button--primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
