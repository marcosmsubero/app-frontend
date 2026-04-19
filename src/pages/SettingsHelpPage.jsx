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

export default function SettingsHelpPage() {
  const navigate = useNavigate();

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
          <h1 className="settingsSubpage__title">Centro de ayuda</h1>
          <p className="settingsSubpage__subtitle">
            Respuestas rápidas a dudas frecuentes.
          </p>
        </div>
      </div>

      <div className="settingsCard settingsListSimple">
        <div>
          <h3 className="settingsSwitchRow__title">¿Cómo unirme a un evento?</h3>
          <p className="settingsMuted">Abre el evento en el feed o exploración y pulsa "Unirme al evento". Se agregará a tu calendario personal.</p>
        </div>

        <div>
          <h3 className="settingsSwitchRow__title">¿Cómo editar mi perfil?</h3>
          <p className="settingsMuted">Ve a Ajustes → Cuenta y pulsa "Editar perfil", o desde tu página de perfil toca el botón de edición.</p>
        </div>

        <div>
          <h3 className="settingsSwitchRow__title">¿Cómo funcionan los clubs?</h3>
          <p className="settingsMuted">Los clubs son grupos de corredores con intereses comunes. Descúbrelos en Explorar, únete a los que te interesan y participa en eventos exclusivos del club.</p>
        </div>

        <div>
          <h3 className="settingsSwitchRow__title">¿Cómo me comunico con otros usuarios?</h3>
          <p className="settingsMuted">Toca el icono de mensaje en el perfil de un usuario para iniciar un chat privado. Puedes controlar quién puede enviarte mensajes en Privacidad.</p>
        </div>

        <div>
          <h3 className="settingsSwitchRow__title">¿Cómo bloqueo a un usuario?</h3>
          <p className="settingsMuted">Desde el perfil de un usuario, toca el icono de menú (…) y selecciona "Bloquear". Los usuarios bloqueados no pueden verte ni interactuar contigo.</p>
        </div>

        <div>
          <h3 className="settingsSwitchRow__title">¿Cómo creo un evento?</h3>
          <p className="settingsMuted">Desde la pestaña Home, toca "Crear evento". Rellena la ruta, hora, nivel de dificultad y crea la carrera. Otros usuarios podrán descubrirla y unirse.</p>
        </div>

        <div>
          <h3 className="settingsSwitchRow__title">¿Qué son los retos?</h3>
          <p className="settingsMuted">Los retos son competiciones dentro de la app: correr una cierta distancia, mantener una racha de días, etc. Participa, compite con amigos y gana insignias.</p>
        </div>

        <div>
          <h3 className="settingsSwitchRow__title">¿Cómo funciona la privacidad de ubicación?</h3>
          <p className="settingsMuted">Puedes elegir mostrar ubicación precisa, aproximada (por zona) u oculta. Esto afecta cómo otros ven dónde corres en eventos y en tu perfil.</p>
        </div>

        <div>
          <h3 className="settingsSwitchRow__title">¿Puedo sincronizar mis carreras con otras apps?</h3>
          <p className="settingsMuted">Por ahora RunVibe guarda tus carreras localmente. Estamos preparando integraciones con Strava, Apple Health y Google Fit para futuros lanzamientos.</p>
        </div>

        <div>
          <h3 className="settingsSwitchRow__title">¿Qué hago si encuentro un error o tengo una sugerencia?</h3>
          <p className="settingsMuted">Usa Contactar soporte en esta sección para reportar errores o enviarnos sugerencias. Leemos todos los mensajes y queremos mejorar RunVibe con tu feedback.</p>
        </div>
      </div>
    </section>
  );
}
