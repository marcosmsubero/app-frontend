import { useEffect, useState } from "react";
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

function PermissionCard({ title, value, text }) {
  return (
    <div className="settingsSwitchRow">
      <div className="settingsSwitchRow__copy">
        <h3 className="settingsSwitchRow__title">{title}</h3>
        <p className="settingsSwitchRow__text">{text}</p>
      </div>
      <span className="settingsBadge">{value}</span>
    </div>
  );
}

export default function SettingsPermissionsPage() {
  const navigate = useNavigate();
  const [geoPermission, setGeoPermission] = useState("Desconocido");
  const [notifPermission, setNotifPermission] = useState("Desconocido");

  useEffect(() => {
    async function readPermissions() {
      try {
        if (navigator?.permissions?.query) {
          const geo = await navigator.permissions.query({ name: "geolocation" });
          setGeoPermission(geo.state);
        }
      } catch {
        setGeoPermission("No disponible");
      }

      try {
        if (typeof Notification !== "undefined") {
          setNotifPermission(Notification.permission);
        } else {
          setNotifPermission("No disponible");
        }
      } catch {
        setNotifPermission("No disponible");
      }
    }

    readPermissions();
  }, []);

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
          <h1 className="settingsSubpage__title">Permisos del dispositivo</h1>
          <p className="settingsSubpage__subtitle">
            Consulta el estado de los permisos relevantes.
          </p>
        </div>
      </div>

      <div className="settingsCard settingsListSimple">
        <PermissionCard
          title="Ubicación"
          value={geoPermission}
          text="Necesaria para mostrar eventos cercanos, mapas y rutas."
        />
        <PermissionCard
          title="Notificaciones"
          value={notifPermission}
          text="Usadas para mensajes, recordatorios y cambios de eventos."
        />
        <PermissionCard
          title="Calendario"
          value="Pendiente"
          text="Preparado para una futura integración con el calendario."
        />
      </div>

      <div className="settingsCard">
        <p className="settingsMuted">
          En web, algunos permisos dependen del navegador y del sistema operativo.
          Si algo no funciona, revisa los ajustes del navegador o vuelve a conceder permiso cuando la app lo solicite.
        </p>
      </div>
    </section>
  );
}
