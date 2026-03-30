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

  async function handleLogout() {
    await logout();
    toast?.info?.("Sesión cerrada");
    nav("/login", { replace: true });
  }

  function handleEditProfile() {
    nav("/onboarding?mode=edit", {
      state: { editProfile: true },
    });
  }

  return (
    <section className="page-shell settings-pageV2">
      <div className="page-shell__header settings-pageV2__header">
        <div>
          <span className="app-kicker">Cuenta</span>
          <h1 className="page-shell__title">Ajustes</h1>
          <p className="page-shell__subtitle">
            Gestiona tu perfil, privacidad, notificaciones y acceso a la cuenta.
          </p>
        </div>
      </div>

      <div className="profile-layout settings-pageV2__layout">
        <div className="profile-main settings-pageV2__main">
          <section className="app-section settings-profileCard">
            <div className="settings-profileCard__avatar">{initials}</div>

            <div className="settings-profileCard__meta">
              <div className="settings-profileCard__name">
                {me?.full_name || me?.handle || "Tu cuenta"}
              </div>
              <div className="settings-profileCard__email">{me?.email || "Sin email"}</div>
              {me?.handle ? (
                <div className="settings-profileCard__handle">@{me.handle}</div>
              ) : null}
            </div>
          </section>

          <section className="app-section settings-section">
            <div className="st-sectionHead">
              <div>
                <div className="st-sectionTitle">Cuenta</div>
                <div className="st-sectionHint">Perfil y seguridad</div>
              </div>
            </div>

            <div className="st-list">
              <Row
                title="Editar perfil"
                subtitle="Nombre, usuario, bio y ubicación visibles"
                right={<span className="st-chevron">›</span>}
                onClick={handleEditProfile}
              />
              <Row
                title="Cambiar contraseña"
                subtitle="Actualiza tus credenciales de acceso"
                right={<span className="st-chevron">›</span>}
                onClick={() => toast?.info?.("Cambio de contraseña próximamente")}
              />
            </div>
          </section>

          <section className="app-section settings-section">
            <div className="st-sectionHead">
              <div>
                <div className="st-sectionTitle">Notificaciones</div>
                <div className="st-sectionHint">Controla cómo quieres recibir avisos</div>
              </div>
            </div>

            <div className="st-list">
              <Row
                title="Notificaciones push"
                subtitle="Avisos inmediatos en tu dispositivo"
                right={<Toggle checked={pushNotifs} />}
                onClick={() => setPushNotifs((v) => !v)}
              />
              <Row
                title="Notificaciones por email"
                subtitle="Resumen y comunicaciones importantes"
                right={<Toggle checked={emailNotifs} />}
                onClick={() => setEmailNotifs((v) => !v)}
              />
            </div>
          </section>

          <section className="app-section settings-section">
            <div className="st-sectionHead">
              <div>
                <div className="st-sectionTitle">Privacidad</div>
                <div className="st-sectionHint">Controla la visibilidad de tu cuenta</div>
              </div>
            </div>

            <div className="st-list">
              <Row
                title="Cuenta privada"
                subtitle="Solo te verán las personas que apruebes"
                right={<Toggle checked={privateAccount} />}
                onClick={() => setPrivateAccount((v) => !v)}
              />
              <Row
                title="Mostrar ubicación"
                subtitle="Permite mostrar tu ciudad o zona"
                right={<Toggle checked={showLocation} />}
                onClick={() => setShowLocation((v) => !v)}
              />
            </div>
          </section>

          <section className="app-section settings-section">
            <div className="st-sectionHead">
              <div>
                <div className="st-sectionTitle">Ayuda</div>
                <div className="st-sectionHint">Soporte y documentación</div>
              </div>
            </div>

            <div className="st-list">
              <Row
                title="Reportar un problema"
                subtitle="Cuéntanos qué ha pasado"
                right={<span className="st-chevron">›</span>}
                onClick={() => toast?.info?.("Soporte próximamente")}
              />
              <Row
                title="Términos y privacidad"
                subtitle="Información legal y condiciones"
                right={<span className="st-chevron">›</span>}
                onClick={() => toast?.info?.("Sección legal próximamente")}
              />
            </div>
          </section>

          <section className="app-section settings-section">
            <div className="st-sectionHead">
              <div>
                <div className="st-sectionTitle">Centro de cuentas</div>
                <div className="st-sectionHint">Acciones avanzadas y permanentes</div>
              </div>
            </div>

            <div className="st-list">
              <Row
                title="Eliminar cuenta"
                subtitle="Inicia el proceso de eliminación"
                right={<span className="st-chevron">›</span>}
                onClick={() => nav("/eliminar-cuenta")}
                tone="danger"
              />
            </div>
          </section>

          <section className="app-section settings-section">
            <button
              type="button"
              className="app-button app-button--secondary app-button--block settings-pageV2__logout"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </section>
        </div>
      </div>
    </section>
  );
}
