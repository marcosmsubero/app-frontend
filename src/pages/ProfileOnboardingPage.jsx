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

function StepPill({ active, done, number, label }) {
  let variant = "neutral";
  if (done) variant = "success";
  else if (active) variant = "primary";

  return (
    <span className={`app-badge${variant !== "neutral" ? ` app-badge--${variant}` : ""}`}>
      {done ? "✓" : number} · {label}
    </span>
  );
}

function StatusCard({ badge, badgeVariant = "primary", title, copy }) {
  return (
    <div className="onboardingPage__statusCard">
      <span className={`app-badge${badgeVariant !== "neutral" ? ` app-badge--${badgeVariant}` : ""}`}>
        {badge}
      </span>
      <div className="onboardingPage__statusCopy">
        <strong>{title}</strong>
        <p>{copy}</p>
      </div>
    </div>
  );
}

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
    if (!form.role) return "Selecciona tu perfil.";

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
      setInfo("Código enviado. Revisa tu bandeja de entrada.");
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
      setInfo("Email verificado correctamente.");
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
    if (err) return setError(err);

    setField("handle", normalizeHandle(form.handle));
    setStep(2);
    setInfo("Añade disciplinas, bio y enlaces para terminar tu perfil.");
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
  const subtitle = cameFromRegister
    ? "Tu cuenta ya está creada. Solo faltan unos pasos para entrar en la app con una identidad deportiva clara y lista para usar."
    : "Configura tu identidad, verifica tu cuenta y deja tu perfil preparado para conectar con la comunidad.";

  return (
    <section className="onboardingPage">
      <div className="onboardingPage__shell">
        <div className="onboardingPage__layout">
          <div className="onboardingPage__content surface-panel">
            <div className="onboardingPage__hero">
              <span className="app-kicker">
                {isNewProfile ? "Primer acceso" : "Perfil"}
              </span>

              <h1 className="onboardingPage__title">{title}</h1>
              <p className="onboardingPage__subtitle">{subtitle}</p>
            </div>

            <div className="onboardingPage__steps">
              <StepPill active={step === 1} done={step > 1} number={1} label="Cuenta" />
              <StepPill active={step === 2} done={false} number={2} label="Perfil deportivo" />
            </div>

            <div className="onboardingPage__statusGrid">
              <StatusCard
                badge="Cuenta actual"
                badgeVariant="primary"
                title={me?.email || location.state?.registeredEmail || "Email no disponible"}
                copy={isEmailVerified ? "Email verificado correctamente." : "Email pendiente de verificación."}
              />

              <StatusCard
                badge="Ubicación"
                badgeVariant={isLocVerified ? "success" : "neutral"}
                title={isLocVerified ? "Ubicación verificada" : "Ubicación opcional"}
                copy="Ayuda a mostrar mejor tu perfil y tus planes deportivos cercanos."
              />
            </div>

            {msg.text ? (
              <div
                className={`onboardingPage__message ${
                  msg.type === "error"
                    ? "onboardingPage__message--error"
                    : "onboardingPage__message--info"
                }`}
              >
                {msg.text}
              </div>
            ) : null}
          </div>

          <div className="onboardingPage__panel surface-panel">
            {step === 1 ? (
              <div className="onboardingPage__formWrap">
                <div className="onboardingPage__panelHead">
                  <span className="onboardingPage__panelEyebrow">Paso 1</span>
                  <h2 className="onboardingPage__panelTitle">Cuenta e identidad</h2>
                  <p className="onboardingPage__panelText">
                    Valida tu cuenta y define la información base con la que se te verá dentro de la app.
                  </p>
                </div>

                {!isEmailVerified ? (
                  <div className="onboardingPage__verifyCard">
                    <div className="onboardingPage__verifyHead">
                      <strong>Verifica tu email</strong>
                      <p>Necesitas completar esta verificación antes de continuar.</p>
                    </div>

                    <div className="onboardingPage__verifyActions">
                      <button
                        type="button"
                        className="app-button app-button--secondary"
                        onClick={sendCode}
                        disabled={sendingCode || saving}
                      >
                        {sendingCode ? "Enviando…" : "Enviar código"}
                      </button>
                    </div>

                    <div className="app-field">
                      <label className="app-label" htmlFor="verify-code">
                        Código
                      </label>
                      <input
                        id="verify-code"
                        className="app-input"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        disabled={confirmingCode || saving}
                        placeholder="Introduce el código recibido"
                      />
                    </div>

                    <button
                      type="button"
                      className="app-button app-button--primary"
                      onClick={confirmCode}
                      disabled={confirmingCode || saving}
                    >
                      {confirmingCode ? "Confirmando…" : "Confirmar código"}
                    </button>
                  </div>
                ) : (
                  <div className="onboardingPage__verifiedOk">
                    <span className="app-badge app-badge--success">Email verificado</span>
                  </div>
                )}

                <div className="onboardingPage__form">
                  <div className="app-field">
                    <label className="app-label" htmlFor="handle">
                      Usuario (@)
                    </label>
                    <input
                      id="handle"
                      className="app-input"
                      value={form.handle}
                      onChange={(e) => setField("handle", normalizeHandle(e.target.value))}
                      disabled={saving}
                      placeholder="ejemplo_marcos"
                    />
                    <p className="onboardingPage__hint">
                      Solo letras, números, punto, guion o guion bajo.
                    </p>
                  </div>

                  <div className="app-field">
                    <label className="app-label" htmlFor="full_name">
                      Nombre completo
                    </label>
                    <input
                      id="full_name"
                      className="app-input"
                      value={form.full_name}
                      onChange={(e) => setField("full_name", e.target.value)}
                      disabled={saving}
                      placeholder="Tu nombre y apellidos"
                    />
                  </div>

                  <div className="app-field">
                    <label className="app-label" htmlFor="role">
                      Perfil
                    </label>
                    <select
                      id="role"
                      className="app-select"
                      value={form.role}
                      onChange={(e) => setField("role", e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Selecciona una opción</option>
                      <option value="athlete">Deportista</option>
                      <option value="coach">Entrenador</option>
                      <option value="organizer">Organizador</option>
                      <option value="club">Club</option>
                    </select>
                  </div>

                  <div className="app-field">
                    <label className="app-label" htmlFor="location">
                      Ubicación visible
                    </label>
                    <input
                      id="location"
                      className="app-input"
                      value={form.location}
                      onChange={(e) => setField("location", e.target.value)}
                      disabled={saving}
                      placeholder="Ej. Alicante"
                    />
                  </div>

                  <div className="onboardingPage__inlineActions">
                    <button
                      type="button"
                      className="app-button app-button--secondary"
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
                </div>

                <div className="onboardingPage__footerActions">
                  <button
                    type="button"
                    className="app-button app-button--ghost"
                    onClick={handleExit}
                    disabled={saving}
                  >
                    Salir
                  </button>

                  <button
                    type="button"
                    className="app-button app-button--primary"
                    onClick={goNext}
                    disabled={saving}
                  >
                    Continuar
                  </button>
                </div>
              </div>
            ) : (
              <div className="onboardingPage__formWrap">
                <div className="onboardingPage__panelHead">
                  <span className="onboardingPage__panelEyebrow">Paso 2</span>
                  <h2 className="onboardingPage__panelTitle">Perfil deportivo</h2>
                  <p className="onboardingPage__panelText">
                    Completa tu presentación con bio, disciplinas y enlaces para dar contexto real a tu perfil.
                  </p>
                </div>

                <div className="onboardingPage__form">
                  <div className="app-field">
                    <label className="app-label" htmlFor="bio">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      className="app-textarea"
                      value={form.bio}
                      onChange={(e) => setField("bio", e.target.value)}
                      disabled={saving}
                      placeholder="Cuéntanos qué deporte practicas, cómo entrenas o qué buscas en la app."
                    />
                  </div>

                  <div className="app-field">
                    <label className="app-label" htmlFor="avatar_url">
                      URL de avatar
                    </label>
                    <input
                      id="avatar_url"
                      className="app-input"
                      value={form.avatar_url}
                      onChange={(e) => setField("avatar_url", e.target.value)}
                      disabled={saving}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="app-field">
                    <label className="app-label">Disciplinas</label>
                    <div className="onboardingPage__chips">
                      {DISCIPLINES.map((discipline) => {
                        const active = form.disciplines?.includes(discipline);
                        return (
                          <button
                            key={discipline}
                            type="button"
                            className={`onboardingPage__chip ${
                              active ? "onboardingPage__chip--active" : ""
                            }`}
                            onClick={() => toggleDiscipline(discipline)}
                            disabled={saving}
                          >
                            {discipline}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="onboardingPage__linksGrid">
                    <div className="app-field">
                      <label className="app-label" htmlFor="strava">
                        Strava
                      </label>
                      <input
                        id="strava"
                        className="app-input"
                        value={form.links?.strava || ""}
                        onChange={(e) => setLinkField("strava", e.target.value)}
                        disabled={saving}
                        placeholder="https://www.strava.com/athletes/..."
                      />
                    </div>

                    <div className="app-field">
                      <label className="app-label" htmlFor="instagram">
                        Instagram
                      </label>
                      <input
                        id="instagram"
                        className="app-input"
                        value={form.links?.instagram || ""}
                        onChange={(e) => setLinkField("instagram", e.target.value)}
                        disabled={saving}
                        placeholder="https://instagram.com/..."
                      />
                    </div>

                    <div className="app-field">
                      <label className="app-label" htmlFor="website">
                        Web
                      </label>
                      <input
                        id="website"
                        className="app-input"
                        value={form.links?.website || ""}
                        onChange={(e) => setLinkField("website", e.target.value)}
                        disabled={saving}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>

                <div className="onboardingPage__footerActions">
                  <button
                    type="button"
                    className="app-button app-button--ghost"
                    onClick={goBack}
                    disabled={saving}
                  >
                    Volver
                  </button>

                  <button
                    type="button"
                    className="app-button app-button--primary"
                    onClick={finish}
                    disabled={saving}
                  >
                    {saving ? "Guardando…" : "Guardar y entrar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
