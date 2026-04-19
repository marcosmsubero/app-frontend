import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../hooks/useAuth";
import { apiCreateSupportTicket } from "../services/api";
import "../styles/settings.css";

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

export default function SettingsSupportPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const auth = useAuth() || {};
  const me = auth.me;

  const [category, setCategory] = useState("bug");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState(me?.email || "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      toast?.error?.("Por favor rellena asunto y mensaje.");
      return;
    }

    setSubmitting(true);
    try {
      await apiCreateSupportTicket({
        category,
        subject: subject.trim(),
        message: message.trim(),
        contact_email: contactEmail.trim() || null,
      });
      toast?.success?.("Solicitud enviada. Te responderemos pronto.");
      setSubject("");
      setMessage("");
      setCategory("bug");
    } catch (err) {
      toast?.error?.(err?.message || "No se pudo enviar. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page settingsSubpage">
      <div className="settingsSubpage__header">
        <button type="button" className="settingsSubpage__back" onClick={() => navigate(-1)} aria-label="Volver">
          <BackIcon />
        </button>
        <div>
          <h1 className="settingsSubpage__title">Contactar soporte</h1>
          <p className="settingsSubpage__subtitle">
            Descríbenos el problema o la sugerencia. Leemos cada mensaje y te respondemos en cuanto podamos.
          </p>
        </div>
      </div>

      <form className="settingsCard" onSubmit={handleSubmit}>
        <div className="settingsField">
          <label className="settingsField__label" htmlFor="support-category">Categoría</label>
          <select
            id="support-category"
            className="settingsSelect"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="bug">Error o fallo</option>
            <option value="account">Cuenta</option>
            <option value="suggestion">Sugerencia</option>
            <option value="privacy">Privacidad y datos</option>
            <option value="other">Otro</option>
          </select>
        </div>

        <div className="settingsField">
          <label className="settingsField__label" htmlFor="support-subject">Asunto</label>
          <input
            id="support-subject"
            className="settingsInput"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={200}
            placeholder="Resume el problema en una linea"
            required
          />
        </div>

        <div className="settingsField">
          <label className="settingsField__label" htmlFor="support-message">Mensaje</label>
          <textarea
            id="support-message"
            className="settingsTextarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={5000}
            placeholder="Qué ocurrió, qué esperabas y cómo reproducirlo"
            required
          />
          <p className="settingsField__help">
            {message.length}/5000 caracteres
          </p>
        </div>

        <div className="settingsField">
          <label className="settingsField__label" htmlFor="support-contact">Email de contacto</label>
          <input
            id="support-contact"
            className="settingsInput"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            maxLength={320}
            placeholder="donde podamos responderte"
          />
          <p className="settingsField__help">
            Opcional. Si lo dejas vacío, responderemos al email de tu cuenta.
          </p>
        </div>

        <div className="settingsActions">
          <button
            type="submit"
            className="feedCard__action feedCard__action--primary"
            disabled={submitting}
          >
            {submitting ? "Enviando…" : "Enviar"}
          </button>
        </div>

        <p className="settingsMuted" style={{ marginTop: 12 }}>
          Tu mensaje se envía al equipo de RunVibe y se guarda en nuestro sistema para poder hacer seguimiento. Puedes pedir su eliminación en cualquier momento desde Privacidad.
        </p>
      </form>
    </section>
  );
}
