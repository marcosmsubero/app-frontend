import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  apiUpdateProfile,
  apiVerifyEmailStart,
  apiVerifyEmailConfirm,
  apiVerifyLocation,
} from "../services/api";

const DISCIPLINES = ["Running", "Ciclismo", "Montañismo", "Senderismo"];

function normalizeHandle(v) {
  return String(v || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/^@+/, "")
    .replace(/[^a-z0-9._-]/g, "");
}

const topInfoCardStyle = {
  borderRadius: "18px",
  padding: "12px 14px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
  display: "grid",
  gap: "6px",
  marginBottom: "14px",
};

const microLabelStyle = {
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.03em",
  color: "var(--muted)",
  textTransform: "uppercase",
};

const infoRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap",
};

const badgeStyle = (active) => ({
  display: "inline-flex",
  alignItems: "center",
  minHeight: "28px",
  padding: "0 10px",
  borderRadius: "999px",
  border: active
    ? "1px solid rgba(66, 193, 118, 0.28)"
    : "1px solid rgba(255,255,255,0.08)",
  background: active ? "rgba(66, 193, 118, 0.12)" : "rgba(255,255,255,0.04)",
  color: active ? "#9be7b4" : "var(--muted)",
  fontSize: "12px",
  fontWeight: 800,
});

const stepHintStyle = {
  fontSize: "13px",
  color: "var(--muted)",
  lineHeight: 1.45,
  marginTop: "-2px",
  marginBottom: "10px",
};

export default function ProfileOnboardingPage() {
  const nav = useNavigate();
  const location = useLocation();
  const { token, me, refreshMe, logout } = useAuth();

  const isNewProfile = !me?.handle;
  const cameFromRegister = !!location.state?.fromRegister;

  const initial = useMemo(
    () => ({
      handle: isNewProfile ? "" : me?.handle || "",
      full_name: isNewProfile ? "" : me?.full_name || "",
      bio: isNewProfile ? "" : me?.bio || "",
      role: isNewProfile ? "" : me?.role || "athlete",
      location: isNewProfile ? "" : me?.location || "",
      avatar_url: isNewProfile ? "" : me?.avatar_url || "",
      disciplines: isNewProfile
        ? []
        : Array.isArray(me?.disciplines)
        ? me.disciplines
        : [],
      links: {
        strava: isNewProfile ? "" : me?.links?.strava || "",
        instagram: isNewProfile ? "" : me?.links?.instagram || "",
        website: isNewProfile ? "" : me?.links?.website || "",
      },
    }),
    [me, isNewProfile]
  );

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const isEmailVerified = !!me?.is_verified;
  const isLocVerified = !!me?.location_verified;

  const [code, setCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [confirmingCode, setConfirmingCode] = useState(false);
  const [verifyingLoc, setVerifyingLoc] = useState(false);

  useEffect(() => {
    setForm(initial);
    setStep(1);
  }, [initial]);

  function setError(text) {
    setMsg({ type: "error", text });
  }

  function setInfo(text) {
    setMsg({ type: "info", text });
  }

  function clearMsg() {
    setMsg({ type: "", text: "" });
  }

  function setField(k, v) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function setLinkField(key, value) {
    setForm((prev) => ({
      ...prev,
      links: {
        ...(prev.links || {}),
        [key]: value,
      },
    }));
  }

  function toggleDiscipline(d) {
    setForm((prev) => {
      const current = Array.isArray(prev.disciplines) ? prev.disciplines : [];
      const has = current.includes(d);
      const next = has ? current.filter((x) => x !== d) : [...current, d];
      return { ...prev, disciplines: next };
    });
  }

  function validateStep1() {
    if (!isEmailVerified) return "Verifica tu email para continuar.";

    const h = normalizeHandle(form.handle);
    if (!h || h.length < 3) return "Tu @ debe tener al menos 3 caracteres.";
    if (h.length > 20) return "Tu @ no puede tener más de 20 caracteres.";
    if (!form.full_name?.trim()) return "Introduce tu nombre completo.";
    if (!form.role) return "Selecciona tu perfil (deportista/grupo/entrenador).";

    return "";
  }

  async function handleExit() {
    if (saving) return;
    clearMsg();

    if (isNewProfile) {
      logout();
      nav("/login", { replace: true });
      return;
    }

    nav("/perfil", { replace: true });
  }

  async function sendCode() {
    if (sendingCode || saving) return;

    clearMsg();
    setSendingCode(true);

    try {
      await apiVerifyEmailStart(token);
      setInfo("Código enviado. Revisa tu email.");
    } catch (e) {
      setError(e?.message || "No se pudo enviar el código.");
    } finally {
      setSendingCode(false);
    }
  }

  async function confirmCode() {
    if (confirmingCode || saving) return;

    clearMsg();
    const cleanCode = String(code || "").trim();

    if (!cleanCode) {
      return setError("Introduce el código.");
    }

    setConfirmingCode(true);

    try {
      await apiVerifyEmailConfirm(cleanCode, token);
      await refreshMe(token);
      setInfo("Email verificado.");
    } catch (e) {
      setError(e?.message || "Código inválido.");
    } finally {
      setConfirmingCode(false);
    }
  }

  async function verifyLoc() {
    if (verifyingLoc || saving) return;

    clearMsg();

    if (!("geolocation" in navigator)) {
      return setError("Tu navegador no soporta geolocalización.");
    }

    setVerifyingLoc(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude, accuracy } = pos.coords;
          await apiVerifyLocation(latitude, longitude, accuracy, token);
          await refreshMe(token);
          setInfo("Ubicación verificada.");
        } catch (e) {
          setError(e?.message || "No se pudo verificar la ubicación.");
        } finally {
          setVerifyingLoc(false);
        }
      },
      () => {
        setVerifyingLoc(false);
        setError("No se pudo obtener tu ubicación. Revisa permisos de GPS.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }

  function goNext() {
    if (saving) return;

    clearMsg();
    const err = validateStep1();

    if (err) {
      return setError(err);
    }

    setField("handle", normalizeHandle(form.handle));
    setStep(2);
    setInfo("Añade disciplinas y enlaces para terminar tu perfil.");
  }

  function goBack() {
    if (saving) return;
    clearMsg();
    setStep(1);
  }

  async function finish() {
    if (saving) return;

    clearMsg();

    if (!isEmailVerified) {
      setStep(1);
      return setError("Verifica tu email para continuar.");
    }

    const err1 = validateStep1();
    if (err1) {
      setStep(1);
      return setError(err1);
    }

    const payload = {
      handle: normalizeHandle(form.handle),
      full_name: form.full_name?.trim(),
      bio: form.bio?.trim() || "",
      role: form.role,
      location: form.location?.trim() || "",
      avatar_url: form.avatar_url?.trim() || "",
      disciplines: form.disciplines || [],
      links: {
        strava: form.links?.strava?.trim() || "",
        instagram: form.links?.instagram?.trim() || "",
        website: form.links?.website?.trim() || "",
      },
    };

    setSaving(true);

    try {
      await apiUpdateProfile(payload, token);
      await refreshMe(token);
      nav("/perfil", { replace: true });
    } catch (e) {
      setError(e?.message || "No se pudo guardar el perfil.");
    } finally {
      setSaving(false);
    }
  }

  const title = isNewProfile ? "Completa tu perfil" : "Actualizar perfil";
  const kicker = isNewProfile ? "Primer acceso" : "Editar perfil";
  const subtitle = cameFromRegister
    ? "Tu cuenta ya está creada. Solo faltan unos pasos para empezar a usar la app."
    : "Configura tu identidad, verifica tu cuenta y añade tus disciplinas.";

  return (
    <div className="onboarding-page-bg">
      <div className="page onboarding-page">
        <div className="onboarding-shell">
          <div className="onboarding-card">
            <div className="onboarding-head">
              <div className="auth-kicker">{kicker}</div>
              <h1 style={{ margin: 0 }}>{title}</h1>
              <p className="auth-copy" style={{ margin: 0 }}>
                {subtitle}
              </p>
            </div>

            <div style={topInfoCardStyle}>
              <div style={infoRowStyle}>
                <div>
                  <div style={microLabelStyle}>Cuenta actual</div>
                  <div style={{ fontWeight: 800, color: "var(--textStrong)" }}>
                    {me?.email || location.state?.registeredEmail || "Email no disponible"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <span style={badgeStyle(isEmailVerified)}>
                    {isEmailVerified ? "Email verificado" : "Email pendiente"}
                  </span>
                  <span style={badgeStyle(isLocVerified)}>
                    {isLocVerified ? "Ubicación verificada" : "Ubicación opcional"}
                  </span>
                </div>
              </div>
            </div>

            <div className="onboarding-stepbar">
              <div className={`onboarding-step ${step === 1 ? "done" : ""}`}>
                <span>1</span>
                <strong>Perfil</strong>
              </div>
              <div className={`onboarding-step ${step === 2 ? "done" : ""}`}>
                <span>2</span>
                <strong>Redes</strong>
              </div>
            </div>

            {!isEmailVerified && (
              <div className="stack auth-form" style={{ marginBottom: 16 }}>
                <div style={stepHintStyle}>
                  La verificación del email es obligatoria antes de continuar.
                </div>

                <div className="stack" style={{ gap: 10 }}>
                  <button
                    type="button"
                    className="auth-primary"
                    onClick={sendCode}
                    disabled={sendingCode || saving}
                  >
                    {sendingCode ? "Enviando…" : "Enviar código"}
                  </button>

                  <label className="auth-label">
                    <span className="auth-labelText">Código de verificación</span>
                    <input
                      className="auth-input"
                      placeholder="Introduce el código"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      disabled={confirmingCode || saving}
                    />
                  </label>

                  <button
                    type="button"
                    className="auth-link"
                    onClick={confirmCode}
                    disabled={confirmingCode || saving}
                  >
                    {confirmingCode ? "Confirmando…" : "Confirmar código"}
                  </button>
                </div>
              </div>
            )}

            <div className="stack auth-form" style={{ marginBottom: 16 }}>
              <div style={stepHintStyle}>
                La ubicación es opcional, pero puede ayudarte a mostrar mejor tu perfil y tus planes deportivos cercanos.
              </div>

              <button
                type="button"
                className="auth-link"
                onClick={verifyLoc}
                disabled={verifyingLoc || saving}
              >
                {verifyingLoc
                  ? "Verificando…"
                  : isLocVerified
                  ? "Re-verificar ubicación"
                  : "Verificar ubicación"}
              </button>
            </div>

            {msg.text && (
              <div className={`auth-msg auth-msg--${msg.type || "info"}`} style={{ marginBottom: 16 }}>
                {msg.text}
              </div>
            )}

            {step === 1 && (
              <div className="onboarding-stepPanel">
                <div className="stack auth-form">
                  <label className="auth-label">
                    <span className="auth-labelText">@ (único)</span>
                    <input
                      className="auth-input"
                      placeholder="@tuusuario"
                      value={form.handle}
                      onChange={(e) => setField("handle", e.target.value)}
                      disabled={saving}
                    />
                  </label>

                  {!isEmailVerified && (
                    <div style={stepHintStyle}>
                      Necesitas email verificado para continuar.
                    </div>
                  )}

                  <label className="auth-label">
                    <span className="auth-labelText">Nombre completo</span>
                    <input
                      className="auth-input"
                      placeholder="Tu nombre"
                      value={form.full_name}
                      onChange={(e) => setField("full_name", e.target.value)}
                      disabled={saving}
                    />
                  </label>

                  <label className="auth-label">
                    <span className="auth-labelText">Perfil</span>
                    <select
                      className="auth-input"
                      value={form.role}
                      onChange={(e) => setField("role", e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Selecciona tu perfil</option>
                      <option value="athlete">Deportista</option>
                      <option value="group">Grupo</option>
                      <option value="coach">Entrenador</option>
                    </select>
                  </label>

                  <label className="auth-label">
                    <span className="auth-labelText">Ubicación (texto)</span>
                    <input
                      className="auth-input"
                      placeholder="Alicante, Valencia, Madrid…"
                      value={form.location}
                      onChange={(e) => setField("location", e.target.value)}
                      disabled={saving}
                    />
                  </label>

                  <div style={stepHintStyle}>
                    Opcional: si rellenas la ubicación, podrá verse en tu perfil.
                  </div>

                  <label className="auth-label">
                    <span className="auth-labelText">Descripción</span>
                    <textarea
                      className="auth-input"
                      placeholder="Cuéntanos qué deportes practicas o qué buscas en la app"
                      value={form.bio}
                      onChange={(e) => setField("bio", e.target.value)}
                      disabled={saving}
                      rows={4}
                      style={{ resize: "vertical" }}
                    />
                  </label>
                </div>

                <div
                  className="onboarding-actions onboarding-actions--split"
                  style={{
                    display: "flex",
                    gap: 10,
                    justifyContent: "space-between",
                    marginTop: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    className="auth-link"
                    onClick={handleExit}
                    disabled={saving}
                  >
                    {isNewProfile ? "Cerrar sesión" : "Cancelar"}
                  </button>

                  <button
                    type="button"
                    className="auth-primary"
                    onClick={goNext}
                    disabled={saving}
                    style={{ width: "auto", minWidth: 140 }}
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="onboarding-stepPanel">
                <div className="stack auth-form">
                  <div>
                    <div className="auth-labelText" style={{ marginBottom: 8 }}>
                      Disciplina / modalidad
                    </div>

                    <div
                      className="onboarding-chipGrid"
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      {DISCIPLINES.map((d) => {
                        const current = Array.isArray(form.disciplines)
                          ? form.disciplines
                          : [];
                        const active = current.includes(d);

                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => toggleDiscipline(d)}
                            disabled={saving}
                            className={`chip ${active ? "is-active" : ""}`}
                          >
                            {d}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <label className="auth-label">
                    <span className="auth-labelText">Strava</span>
                    <input
                      className="auth-input"
                      placeholder="https://www.strava.com/athletes/..."
                      value={form.links?.strava || ""}
                      onChange={(e) => setLinkField("strava", e.target.value)}
                      disabled={saving}
                    />
                  </label>

                  <label className="auth-label">
                    <span className="auth-labelText">Instagram</span>
                    <input
                      className="auth-input"
                      placeholder="https://instagram.com/..."
                      value={form.links?.instagram || ""}
                      onChange={(e) => setLinkField("instagram", e.target.value)}
                      disabled={saving}
                    />
                  </label>

                  <label className="auth-label">
                    <span className="auth-labelText">Web</span>
                    <input
                      className="auth-input"
                      placeholder="https://..."
                      value={form.links?.website || ""}
                      onChange={(e) => setLinkField("website", e.target.value)}
                      disabled={saving}
                    />
                  </label>
                </div>

                <div
                  className="onboarding-actions onboarding-actions--split"
                  style={{
                    display: "flex",
                    gap: 10,
                    justifyContent: "space-between",
                    marginTop: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    className="auth-link"
                    onClick={goBack}
                    disabled={saving}
                  >
                    ← Atrás
                  </button>

                  <button
                    type="button"
                    className="auth-primary"
                    onClick={finish}
                    disabled={saving}
                    style={{ width: "auto", minWidth: 160 }}
                  >
                    {saving ? "Guardando…" : "Finalizar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
