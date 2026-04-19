import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../hooks/useToast";
import { useUserSettings } from "../hooks/useUserSettings";
import { apiExportMyData } from "../services/api";
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

export default function SettingsPrivacyPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { settings, loading, updateSection } = useUserSettings();
  const [exporting, setExporting] = useState(false);

  async function savePatch(patch) {
    try {
      await updateSection("privacy", patch);
      toast?.success?.("Ajuste guardado.");
    } catch {
      toast?.error?.("No se pudo guardar.");
    }
  }

  async function saveConsent(patch) {
    try {
      await updateSection("consent", patch);
      toast?.success?.("Preferencias de consentimiento actualizadas.");
    } catch {
      toast?.error?.("No se pudo guardar.");
    }
  }

  async function handleDownloadData() {
    setExporting(true);
    try {
      const data = await apiExportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      link.download = `runvibe-mis-datos-${ts}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast?.success?.("Descarga iniciada.");
    } catch (err) {
      toast?.error?.(err?.message || "No se pudo exportar. Inténtalo de nuevo.");
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <section className="page settingsSubpage">
        <div className="settingsCard">Cargando privacidad…</div>
      </section>
    );
  }

  return (
    <section className="page settingsSubpage">
      <div className="settingsSubpage__header">
        <button type="button" className="settingsSubpage__back" onClick={() => navigate(-1)} aria-label="Volver">
          <BackIcon />
        </button>
        <div>
          <h1 className="settingsSubpage__title">Privacidad</h1>
          <p className="settingsSubpage__subtitle">
            Controla qué se ve de ti, quién puede contactarte y cómo tratamos tus datos.
          </p>
        </div>
      </div>

      <div className="settingsCard">
        <div className="settingsField">
          <label className="settingsField__label" htmlFor="privacy-visibility">Visibilidad del perfil</label>
          <select
            id="privacy-visibility"
            className="settingsSelect"
            value={settings.privacy.profile_visibility}
            onChange={(e) => savePatch({ profile_visibility: e.target.value })}
          >
            <option value="public">Público</option>
            <option value="private">Privado</option>
          </select>
          <div className="settingsField__help">
            Un perfil privado limita qué pueden ver otros usuarios.
          </div>
        </div>

        <div className="settingsField">
          <label className="settingsField__label" htmlFor="privacy-location">Visibilidad de ubicación</label>
          <select
            id="privacy-location"
            className="settingsSelect"
            value={settings.privacy.location_visibility}
            onChange={(e) => savePatch({ location_visibility: e.target.value })}
          >
            <option value="precise">Precisa</option>
            <option value="approximate">Aproximada (por zona)</option>
            <option value="hidden">Oculta</option>
          </select>
          <div className="settingsField__help">
            Define cuánto detalle se muestra sobre tu ubicación en eventos y perfil.
          </div>
        </div>

        <div className="settingsField">
          <label className="settingsField__label" htmlFor="privacy-dm">Quién puede enviarte mensajes</label>
          <select
            id="privacy-dm"
            className="settingsSelect"
            value={settings.privacy.dm_policy}
            onChange={(e) => savePatch({ dm_policy: e.target.value })}
          >
            <option value="everyone">Cualquiera</option>
            <option value="following">Solo a quienes sigues</option>
            <option value="nobody">Nadie</option>
          </select>
        </div>
      </div>

      <div className="settingsCard settingsListSimple">
        <SwitchRow
          title="Mostrar asistencia a eventos"
          text="Permite que otros vean los eventos a los que te has unido."
          checked={settings.privacy.show_event_attendance}
          onToggle={() =>
            savePatch({
              show_event_attendance: !settings.privacy.show_event_attendance,
            })
          }
        />
      </div>

      {/* ─── GDPR: consent toggles ───────────────────────────────── */}
      <div className="settingsSubpage__header" style={{ marginTop: 8 }}>
        <div>
          <h2 className="settingsSubpage__title" style={{ fontSize: "1rem" }}>
            Consentimiento y datos
          </h2>
          <p className="settingsSubpage__subtitle">
            Puedes revocar estos consentimientos en cualquier momento (RGPD art. 7).
          </p>
        </div>
      </div>

      <div className="settingsCard settingsListSimple">
        <SwitchRow
          title="Analítica de uso anónima"
          text="Nos permite entender qué funciona y qué no. No se vende a terceros."
          checked={settings.consent?.analytics ?? false}
          onToggle={() =>
            saveConsent({ analytics: !(settings.consent?.analytics ?? false) })
          }
        />
        <SwitchRow
          title="Comunicaciones y novedades"
          text="Recibe por email noticias del producto y nuevos retos. Solo si lo activas."
          checked={settings.consent?.marketing_emails ?? false}
          onToggle={() =>
            saveConsent({
              marketing_emails: !(settings.consent?.marketing_emails ?? false),
            })
          }
        />
      </div>

      <div className="settingsCard">
        <div className="settingsField">
          <div className="settingsField__label">Tus derechos (RGPD)</div>
          <p className="settingsField__help">
            Tienes derecho a acceder, rectificar, portar y eliminar tus datos. Desde aquí puedes descargar tu información o solicitar la eliminación completa de tu cuenta.
          </p>
        </div>

        <div className="settingsField">
          <button
            type="button"
            className="feedCard__action"
            onClick={handleDownloadData}
            disabled={exporting}
          >
            {exporting ? "Preparando…" : "Descargar mis datos (JSON)"}
          </button>
          <p className="settingsField__help">
            Archivo completo con tu cuenta, perfiles, ajustes, bloqueos y tickets de soporte.
          </p>
        </div>

        <div className="settingsField">
          <Link to="/ajustes/cuenta" className="feedCard__action">
            Eliminar cuenta
          </Link>
          <p className="settingsField__help">
            La eliminación es permanente e incluye todos tus datos personales y contenido asociado.
          </p>
        </div>
      </div>

      <div className="settingsCard">
        <div className="settingsField">
          <div className="settingsField__label">Documentos legales</div>
          <Link to="/ajustes/legal/privacidad" className="feedCard__action">
            Política de privacidad
          </Link>
        </div>
        <div className="settingsField">
          <Link to="/ajustes/legal/terminos" className="feedCard__action">
            Términos y condiciones
          </Link>
        </div>
      </div>
    </section>
  );
}
