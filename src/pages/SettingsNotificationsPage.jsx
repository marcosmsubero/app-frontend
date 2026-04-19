import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/useToast";
import { useUserSettings } from "../hooks/useUserSettings";
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

export default function SettingsNotificationsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { settings, loading, updateSection } = useUserSettings();

  async function toggle(key) {
    try {
      await updateSection("notifications", {
        [key]: !settings.notifications[key],
      });
      toast?.success?.("Ajuste guardado.");
    } catch {
      toast?.error?.("No se pudo guardar.");
    }
  }

  if (loading) {
    return (
      <section className="page settingsSubpage">
        <div className="settingsCard">Cargando ajustes…</div>
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
          <h1 className="settingsSubpage__title">Notificaciones</h1>
          <p className="settingsSubpage__subtitle">
            Elige qué avisos quieres recibir.
          </p>
        </div>
      </div>

      <div className="settingsCard settingsListSimple">
        <SwitchRow
          title="Mensajes"
          text="Avisos cuando recibas mensajes privados."
          checked={settings.notifications.messages}
          onToggle={() => toggle("messages")}
        />
        <SwitchRow
          title="Recordatorios de eventos"
          text="Recordatorios antes de un evento al que te has unido."
          checked={settings.notifications.event_reminders}
          onToggle={() => toggle("event_reminders")}
        />
        <SwitchRow
          title="Cambios o cancelaciones"
          text="Avisos cuando un evento cambie o se cancele."
          checked={settings.notifications.event_changes}
          onToggle={() => toggle("event_changes")}
        />
        <SwitchRow
          title="Clubs"
          text="Actividad e invitaciones relacionadas con clubs."
          checked={settings.notifications.clubs}
          onToggle={() => toggle("clubs")}
        />
        <SwitchRow
          title="Retos"
          text="Progreso, invitaciones y novedades de retos."
          checked={settings.notifications.challenges}
          onToggle={() => toggle("challenges")}
        />
        <SwitchRow
          title="Resumen semanal"
          text="Resumen de tu actividad y sugerencias relevantes."
          checked={settings.notifications.weekly_summary}
          onToggle={() => toggle("weekly_summary")}
        />
      </div>
    </section>
  );
}
