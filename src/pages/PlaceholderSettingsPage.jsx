import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";

function initialsFromNameOrEmail(me) {
  const name = (me?.full_name || "").trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] || "";
    const b = parts[1]?.[0] || "";
    return (a + b).toUpperCase() || (me?.email?.[0] || "U").toUpperCase();
  }
  return (me?.email?.[0] || "U").toUpperCase();
}

function getLSBool(key, fallback = false) {
  const v = localStorage.getItem(key);
  if (v === null) return fallback;
  return v === "1" || v === "true";
}
function setLSBool(key, val) {
  localStorage.setItem(key, val ? "1" : "0");
}

function Row({ title, subtitle, right, onClick, disabled, tone = "default" }) {
  return (
    <button
      type="button"
      className={`st-row ${disabled ? "is-disabled" : ""} ${tone === "danger" ? "is-danger" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="st-row__left">
        <div className="st-row__title">{title}</div>
        {subtitle ? <div className="st-row__sub">{subtitle}</div> : null}
      </div>
      <div className="st-row__right">{right}</div>
    </button>
  );
}

function Toggle({ checked }) {
  return (
    <span className={`st-toggle ${checked ? "on" : ""}`} aria-hidden="true">
      <span className="st-toggle__dot" />
    </span>
  );
}

export default function PlaceholderSettingsPage() {
  const { me, logout } = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  const initials = useMemo(() => initialsFromNameOrEmail(me), [me]);

  const [pushNotifs, setPushNotifs] = useState(() => getLSBool("st_push", true));
  const [emailNotifs, setEmailNotifs] = useState(() => getLSBool("st_email", false));
  const [showLocation, setShowLocation] = useState(() => getLSBool("st_location", true));
  const [privateAccount, setPrivateAccount] = useState(() => getLSBool("st_private", false));

  useEffect(() => setLSBool("st_push", pushNotifs), [pushNotifs]);
  useEffect(() => setLSBool("st_email", emailNotifs), [emailNotifs]);
  useEffect(() => setLSBool("st_location", showLocation), [showLocation]);
  useEffect(() => setLSBool("st_private", privateAccount), [privateAccount]);

  function handleLogout() {
    logout();
    toast?.info?.("Sesión cerrada");
    nav("/", { replace: true });
  }

  return (
    <div className="settings-page">
      <div className="settings-wrap">
        {/* Hero */}
        <div className="st-hero">
          <div className="st-hero__left">
            <div className="st-hero__txt">
              <div className="st-title">Ajustes</div>
              <div className="st-sub"></div>
            </div>
          </div>
        </div>

        {/* Cuenta */}
        <div className="st-section">
          <div className="st-sectionHead">
            <div>
              <div className="st-sectionTitle">Cuenta</div>
              <div className="st-sectionHint">Perfil y seguridad</div>
            </div>
          </div>

          <div className="st-list">
            <Row
              title="Editar perfil"
              subtitle="Nombre, bio, disciplinas…"
              right={<span className="st-chevron">›</span>}
              onClick={() => nav("/onboarding")}
            />
            <Row
              title="Cambiar contraseña"
              subtitle="Actualiza tu contraseña"
              right={<span className="st-chevron">›</span>}
              onClick={() => toast?.info?.("Cambio de contraseña (próximamente)")}
            />
          </div>
        </div>

        {/* Notificaciones */}
        <div className="st-section">
          <div className="st-sectionHead">
            <div>
              <div className="st-sectionTitle">Notificaciones</div>
              <div className="st-sectionHint">Controla avisos</div>
            </div>
          </div>

          <div className="st-list">
            <Row
              title="Notificaciones push"
              subtitle="Avisos en el móvil"
              right={<Toggle checked={pushNotifs} />}
              onClick={() => setPushNotifs((v) => !v)}
            />
            <Row
              title="Notificaciones por email"
              subtitle="Resumen y avisos importantes"
              right={<Toggle checked={emailNotifs} />}
              onClick={() => setEmailNotifs((v) => !v)}
            />
          </div>
        </div>

        {/* Privacidad */}
        <div className="st-section">
          <div className="st-sectionHead">
            <div>
              <div className="st-sectionTitle">Privacidad</div>
              <div className="st-sectionHint">Visibilidad</div>
            </div>
          </div>

          <div className="st-list">
            <Row
              title="Cuenta privada"
              subtitle="Solo te ven quienes apruebes"
              right={<Toggle checked={privateAccount} />}
              onClick={() => setPrivateAccount((v) => !v)}
            />
            <Row
              title="Mostrar ubicación"
              subtitle="Permite ver tu ciudad"
              right={<Toggle checked={showLocation} />}
              onClick={() => setShowLocation((v) => !v)}
            />
          </div>
        </div>

        {/* Ayuda */}
        <div className="st-section">
          <div className="st-sectionHead">
            <div>
              <div className="st-sectionTitle">Ayuda</div>
              <div className="st-sectionHint">Soporte</div>
            </div>
          </div>

          <div className="st-list">
            <Row
              title="Reportar un problema"
              subtitle="Cuéntanos qué ha pasado"
              right={<span className="st-chevron">›</span>}
              onClick={() => toast?.info?.("Soporte (próximamente)")}
            />
            <Row
              title="Términos y privacidad"
              subtitle="Información legal"
              right={<span className="st-chevron">›</span>}
              onClick={() => toast?.info?.("Legal (próximamente)")}
            />
          </div>
        </div>

        {/* Centro de cuentas */}
        <div className="st-section">
          <div className="st-sectionHead">
            <div>
              <div className="st-sectionTitle">Centro de cuentas</div>
              <div className="st-sectionHint">Acciones avanzadas</div>
            </div>
          </div>

          <div className="st-list">
            <Row
              title="Eliminar cuenta"
              subtitle="Proceso de eliminación"
              right={<span className="st-chevron">›</span>}
              onClick={() => nav("/account/delete")}
              tone="danger"
            />
          </div>
        </div>

        {/* Logout */}
        <div className="st-section">
          <div className="st-card">
            <button type="button" className="st-logout" onClick={handleLogout}>
              ⏻ Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
