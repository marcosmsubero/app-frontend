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
  let variant = "";
  if (done) variant = " app-badge--success";
  else if (active) variant = " app-badge--primary";

  return <span className={`app-badge${variant}`}>{done ? "✓" : number} · {label}</span>;
}

export default function ProfileOnboardingPage() {
  const nav = useNavigate();
  const location = useLocation();
  const { token, me, refreshMe, logout } = useAuth();

  const isNewProfile = !me?.onboarding_completed;
  const cameFromRegister = !!location.state?.fromRegister;

  const initial = useMemo(
    () => ({
      handle: me?.handle || "",
      full_name: me?.full_name || "",
      bio: me?.bio || "",
      role: me?.role || "athlete",
      location: me?.location || "",
      avatar_url: me?.avatar_url || "",
      disciplines: Array.isArray(me?.disciplines) ? me.disciplines : [],
      links: {
        strava: me?.links?.strava || "",
        instagram: me?.links?.instagram || "",
        website: me?.links?.website || "",
      },
    }),
    [me]
  );

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const isEmailVerified = !!(me?.email_verified ?? me?.is_verified);
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
      await logout();
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
      await refreshMe();
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
          await refreshMe();
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
      onboarding_completed: true,
    };

    setSaving(true);

    try {
      await apiUpdateProfile(payload, token);
      await refreshMe();
      nav("/perfil", { replace: true });
    } catch (e) {
      setError(e?.message || "No se pudo guardar el perfil.");
    } finally {
      setSaving(false);
    }
  }

  const title = isNewProfile ? "Completa tu perfil" : "Actualizar perfil";
  const subtitle = cameFromRegister
    ? "Tu cuenta ya está creada. Solo faltan unos pasos para entrar."
    : "Configura tu identidad deportiva y deja tu perfil listo.";

  return (
    <section className="onboardingSimple">
      <div className="onboardingSimple__shell">
        <div className="onboardingSimple__layout">
          <div className="onboardingSimple__intro">
            <span className="app-kicker">{isNewProfile ? "Primer acceso" : "Perfil"}</span>
            <h1 className="onboardingSimple__title">{title}</h1>
            <p className="onboardingSimple__subtitle">{subtitle}</p>

            <div className="onboardingSimple__steps">
              <StepPill active={step === 1} done={step > 1} number={1} label="Cuenta" />
              <StepPill active={step === 2} done={false} number={2} label="Perfil" />
            </div>

            <div className="onboardingSimple__status">
              <div className="onboardingSimple__statusItem">
                <span className="app-badge app-badge--primary">Cuenta</span>
                <strong>{me?.email || location.state?.registeredEmail || "Email no disponible"}</strong>
                <p>{isEmailVerified ? "Email verificado" : "Email pendiente de verificación"}</p>
              </div>

              <div className="onboardingSimple__statusItem">
                <span className={`app-badge${isLocVerified ? " app-badge--success" : ""}`}>
                  Ubicación
                </span>
                <strong>{isLocVerified ? "Verificada" : "Opcional"}</strong>
                <p>Ayuda a mostrar mejor tu actividad y tus planes cercanos.</p>
              </div>
            </div>

            {msg.text ? (
              <div
                className={`onboardingSimple__message ${
                  msg.type === "error"
                    ? "onboardingSimple__message--error"
                    : "onboardingSimple__message--info"
                }`}
              >
                {msg.text}
              </div>
            ) : null}
          </div>

          <div className="onboardingSimple__panel app-section">
            {step === 1 ? (
              <div className="onboardingSimple__formWrap">
                <div className="onboardingSimple__head">
                  <h2 className="onboardingSimple__panelTitle">Cuenta e identidad</h2>
                  <p className="onboardingSimple__panelText">
                    Define tu usuario y completa los datos básicos.
                  </p>
                </div>

                {!isEmailVerified ? (
                  <div className="onboardingSimple__verify">
                    <div className="onboardingSimple__verifyHead">
                      <strong>Verifica tu email</strong>
                      <p>Necesitas completar esta verificación antes de continuar.</p>
                    </div>

                    <div className="onboardingSimple__verifyActions">
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
                  <div className="onboardingSimple__verified">
                    <span className="app-badge app-badge--success">Email verificado</span>
                  </div>
                )}

                <div className="onboardingSimple__form">
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

                  <div className="onboardingSimple__inlineActions">
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

                <div className="onboardingSimple__footer">
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
              <div className="onboardingSimple__formWrap">
                <div className="onboardingSimple__head">
                  <h2 className="onboardingSimple__panelTitle">Perfil deportivo</h2>
                  <p className="onboardingSimple__panelText">
                    Añade solo lo necesario para dar contexto a tu perfil.
                  </p>
                </div>

                <div className="onboardingSimple__form">
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
                      placeholder="Qué deporte practicas o qué buscas en la app."
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
                    <div className="onboardingSimple__chips">
                      {DISCIPLINES.map((discipline) => {
                        const active = form.disciplines?.includes(discipline);
                        return (
                          <button
                            key={discipline}
                            type="button"
                            className={`onboardingSimple__chip${
                              active ? " onboardingSimple__chip--active" : ""
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

                  <div className="app-field">
                    <label className="app-label" htmlFor="link-strava">
                      Strava
                    </label>
                    <input
                      id="link-strava"
                      className="app-input"
                      value={form.links?.strava || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          links: { ...(prev.links || {}), strava: e.target.value },
                        }))
                      }
                      disabled={saving}
                      placeholder="https://www.strava.com/..."
                    />
                  </div>

                  <div className="app-field">
                    <label className="app-label" htmlFor="link-instagram">
                      Instagram
                    </label>
                    <input
                      id="link-instagram"
                      className="app-input"
                      value={form.links?.instagram || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          links: { ...(prev.links || {}), instagram: e.target.value },
                        }))
                      }
                      disabled={saving}
                      placeholder="https://instagram.com/..."
                    />
                  </div>

                  <div className="app-field">
                    <label className="app-label" htmlFor="link-website">
                      Web
                    </label>
                    <input
                      id="link-website"
                      className="app-input"
                      value={form.links?.website || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          links: { ...(prev.links || {}), website: e.target.value },
                        }))
                      }
                      disabled={saving}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="onboardingSimple__footer">
                  <button
                    type="button"
                    className="app-button app-button--ghost"
                    onClick={goBack}
                    disabled={saving}
                  >
                    Atrás
                  </button>

                  <button
                    type="button"
                    className="app-button app-button--primary"
                    onClick={finish}
                    disabled={saving}
                  >
                    {saving ? "Guardando…" : "Finalizar"}
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
