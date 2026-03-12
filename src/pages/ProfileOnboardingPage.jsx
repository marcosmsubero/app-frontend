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
  return (
    <div className={`onboardingStepPill ${active ? "is-active" : ""} ${done ? "is-done" : ""}`}>
      <span>{number}</span>
      <strong>{label}</strong>
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
  const subtitle = cameFromRegister
    ? "Tu cuenta ya está creada. Solo faltan unos pasos para entrar a la app con el perfil listo."
    : "Configura tu identidad, verifica tu cuenta y añade tus disciplinas.";

  return (
    <div className="onboardingScreen">
      <div className="onboardingLayout">
        <section className="onboardingIntroCard">
          <div className="authKicker">{isNewProfile ? "Primer acceso" : "Perfil"}</div>
          <h1 className="onboardingTitle">{title}</h1>
          <p className="onboardingSubtitle">{subtitle}</p>

          <div className="onboardingAccountCard">
            <div>
              <span className="onboardingAccountLabel">Cuenta actual</span>
              <strong>{me?.email || location.state?.registeredEmail || "Email no disponible"}</strong>
            </div>

            <div className="onboardingBadges">
              <span className={`miniBadge ${isEmailVerified ? "is-positive" : ""}`}>
                {isEmailVerified ? "Email verificado" : "Email pendiente"}
              </span>
              <span className={`miniBadge ${isLocVerified ? "is-positive" : ""}`}>
                {isLocVerified ? "Ubicación verificada" : "Ubicación opcional"}
              </span>
            </div>
          </div>

          <div className="onboardingStepBar">
            <StepPill number="1" label="Perfil" active={step === 1} done={step > 1} />
            <StepPill number="2" label="Intereses" active={step === 2} done={false} />
          </div>
        </section>

        <section className="onboardingCard">
          {!isEmailVerified && (
            <div className="verificationPanel">
              <div className="verificationPanel__header">
                <h2>Verifica tu email</h2>
                <p>Necesitas completar esta verificación antes de continuar.</p>
              </div>

              <div className="verificationPanel__actions">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={sendCode}
                  disabled={sendingCode || saving}
                >
                  {sendingCode ? "Enviando…" : "Enviar código"}
                </button>

                <label className="field field--compact">
                  <span className="field__label">Código</span>
                  <input
                    className="field__input"
                    placeholder="Introduce el código"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={confirmingCode || saving}
                  />
                </label>

                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={confirmCode}
                  disabled={confirmingCode || saving}
                >
                  {confirmingCode ? "Confirmando…" : "Confirmar código"}
                </button>
              </div>
            </div>
          )}

          <div className="verificationPanel verificationPanel--soft">
            <div className="verificationPanel__header">
              <h2>Ubicación</h2>
              <p>
                Es opcional, pero ayuda a mostrar mejor tu perfil y tus planes deportivos cercanos.
              </p>
            </div>

            <button
              type="button"
              className="btn btn--ghost"
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
            <div className={`statusMessage statusMessage--${msg.type || "info"}`}>
              {msg.text}
            </div>
          )}

          {step === 1 && (
            <div className="onboardingForm">
              <label className="field">
                <span className="field__label">@ único</span>
                <input
                  className="field__input"
                  placeholder="@tuusuario"
                  value={form.handle}
                  onChange={(e) => setField("handle", e.target.value)}
                  disabled={saving}
                />
              </label>

              <label className="field">
                <span className="field__label">Nombre completo</span>
                <input
                  className="field__input"
                  placeholder="Tu nombre"
                  value={form.full_name}
                  onChange={(e) => setField("full_name", e.target.value)}
                  disabled={saving}
                />
              </label>

              <label className="field">
                <span className="field__label">Perfil</span>
                <select
                  className="field__input"
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

              <label className="field">
                <span className="field__label">Ubicación</span>
                <input
                  className="field__input"
                  placeholder="Alicante, Valencia, Madrid…"
                  value={form.location}
                  onChange={(e) => setField("location", e.target.value)}
                  disabled={saving}
                />
              </label>

              <label className="field">
                <span className="field__label">Descripción</span>
                <textarea
                  className="field__input field__input--textarea"
                  placeholder="Qué deportes practicas, qué buscas o cómo entrenas."
                  value={form.bio}
                  onChange={(e) => setField("bio", e.target.value)}
                  disabled={saving}
                  rows={4}
                />
              </label>

              <div className="onboardingActions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={handleExit}
                  disabled={saving}
                >
                  {isNewProfile ? "Cerrar sesión" : "Cancelar"}
                </button>

                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={goNext}
                  disabled={saving}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="onboardingForm">
              <div className="field">
                <span className="field__label">Disciplina / modalidad</span>
                <div className="chipGrid">
                  {DISCIPLINES.map((d) => {
                    const current = Array.isArray(form.disciplines) ? form.disciplines : [];
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

              <label className="field">
                <span className="field__label">Strava</span>
                <input
                  className="field__input"
                  placeholder="https://www.strava.com/athletes/..."
                  value={form.links?.strava || ""}
                  onChange={(e) => setLinkField("strava", e.target.value)}
                  disabled={saving}
                />
              </label>

              <label className="field">
                <span className="field__label">Instagram</span>
                <input
                  className="field__input"
                  placeholder="https://instagram.com/..."
                  value={form.links?.instagram || ""}
                  onChange={(e) => setLinkField("instagram", e.target.value)}
                  disabled={saving}
                />
              </label>

              <label className="field">
                <span className="field__label">Web</span>
                <input
                  className="field__input"
                  placeholder="https://..."
                  value={form.links?.website || ""}
                  onChange={(e) => setLinkField("website", e.target.value)}
                  disabled={saving}
                />
              </label>

              <div className="onboardingActions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={goBack}
                  disabled={saving}
                >
                  Atrás
                </button>

                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={finish}
                  disabled={saving}
                >
                  {saving ? "Guardando…" : "Finalizar perfil"}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
