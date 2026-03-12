import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

export default function ProfileOnboardingPage() {
  const nav = useNavigate();
  const { token, me, refreshMe } = useAuth();

  const isNewProfile = !me?.handle;

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
    setForm((p) => ({ ...p, [k]: v }));
  }

  function toggleDiscipline(d) {
    setForm((p) => {
      const current = Array.isArray(p.disciplines) ? p.disciplines : [];
      const has = current.includes(d);
      const next = has ? current.filter((x) => x !== d) : [...current, d];
      return { ...p, disciplines: next };
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

  async function sendCode() {
    if (sendingCode || saving) return;
    clearMsg();
    setSendingCode(true);
    try {
      await apiVerifyEmailStart(token);
      setInfo("Código enviado. Revisa tu email.");
    } catch (e) {
      setError(e?.message || "No se pudo enviar el código");
    } finally {
      setSendingCode(false);
    }
  }

  async function confirmCode() {
    if (confirmingCode || saving) return;
    clearMsg();

    const c = String(code || "").trim();
    if (!c) return setError("Introduce el código.");

    setConfirmingCode(true);
    try {
      await apiVerifyEmailConfirm(c, token);
      await refreshMe(token);
      setInfo("Email verificado ✅");
    } catch (e) {
      setError(e?.message || "Código inválido");
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
          setInfo("Ubicación verificada ✅");
        } catch (e) {
          setError(e?.message || "No se pudo verificar la ubicación");
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

  async function goNext() {
    if (saving) return;
    clearMsg();

    const err = validateStep1();
    if (err) return setError(err);

    setField("handle", normalizeHandle(form.handle));
    setStep(2);
    setInfo("Añade tus disciplinas y enlaces.");
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
      setError(e?.message || "No se pudo guardar el perfil");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="onboarding-page-bg">
      <div className="page onboarding-page">
        <div className="onboarding-shell">
          <div className="neutral-card onboarding-card">
            <div className="onboarding-head">
              <div className="auth-kicker">{isNewProfile ? "Primer acceso" : "Editar perfil"}</div>
              <h2 className="m0">{isNewProfile ? "Completa tu perfil" : "Actualizar perfil"}</h2>
              <p className="auth-copy m0">
                Configura tu identidad, verifica tu cuenta y añade tus disciplinas.
              </p>
            </div>

            <div className="onboarding-stepbar" aria-label="Progreso">
              <div className={`onboarding-step ${step === 1 ? "active" : step > 1 ? "done" : ""}`}>
                <span>1</span>
                <strong>Perfil</strong>
              </div>
              <div className={`onboarding-step ${step === 2 ? "active" : ""}`}>
                <span>2</span>
                <strong>Redes</strong>
              </div>
            </div>

            <div className="card onboarding-verifyCard">
              <div className="stack onboarding-verifyStack">
                <div className="onboarding-blockTitle">Verificación</div>

                <div className="small-muted2">
                  {isEmailVerified ? (
                    <>
                      Email verificado <span className="v-check">✓</span>
                    </>
                  ) : (
                    "Verifica tu email (obligatorio)"
                  )}
                </div>

                <div className="small-muted2">
                  {isLocVerified ? (
                    <>
                      Ubicación verificada <span className="v-check">✓</span>
                    </>
                  ) : (
                    "Ubicación (opcional)"
                  )}
                </div>
              </div>

              {!isEmailVerified && (
                <div className="stack onboarding-verifyActions">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={sendCode}
                    disabled={sendingCode || saving}
                  >
                    {sendingCode ? "Enviando…" : "Enviar código"}
                  </button>

                  <input
                    placeholder="Código (6 dígitos)"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={confirmingCode || saving}
                  />

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={confirmCode}
                    disabled={confirmingCode || saving || !String(code || "").trim()}
                  >
                    {confirmingCode ? "Confirmando…" : "Confirmar código"}
                  </button>
                </div>
              )}

              <div className="row onboarding-verifyFooter">
                <button type="button" onClick={verifyLoc} disabled={verifyingLoc || saving}>
                  {verifyingLoc
                    ? "Verificando…"
                    : isLocVerified
                    ? "Re-verificar ubicación"
                    : "Verificar ubicación"}
                </button>
              </div>
            </div>

            {msg.text && (
              <div className={`auth-msg ${msg.type} onboarding-msg`} role="status" aria-live="polite">
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
                      placeholder="example"
                      value={form.handle}
                      onChange={(e) => setField("handle", e.target.value)}
                      disabled={saving}
                    />
                    <div className="small-muted">
                      {isEmailVerified ? "" : "Necesitas email verificado para continuar."}
                    </div>
                  </label>

                  <label className="auth-label">
                    <span className="auth-labelText">Nombre completo</span>
                    <input
                      className="auth-input"
                      placeholder="Nombre Apellido"
                      value={form.full_name}
                      onChange={(e) => setField("full_name", e.target.value)}
                      disabled={saving}
                    />
                  </label>

                  <label className="auth-label">
                    <span className="auth-labelText">Selección</span>
                    <select
                      className="auth-input"
                      value={form.role}
                      onChange={(e) => setField("role", e.target.value)}
                      disabled={saving}
                    >
                      <option value="" disabled>
                        Selecciona tu perfil
                      </option>
                      <option value="athlete">Deportista</option>
                      <option value="group">Grupo</option>
                      <option value="coach">Entrenador</option>
                    </select>
                  </label>

                  <label className="auth-label">
                    <span className="auth-labelText">Ubicación (texto)</span>
                    <input
                      className="auth-input"
                      placeholder="Ej: Madrid"
                      value={form.location}
                      onChange={(e) => setField("location", e.target.value)}
                      disabled={saving}
                    />
                    <div className="small-muted">
                      Opcional: tu ubicación se verá en el perfil si la rellenas.
                    </div>
                  </label>

                  <label className="auth-label">
                    <span className="auth-labelText">Descripción (bio)</span>
                    <textarea
                      className="auth-input"
                      rows={3}
                      placeholder="Cuéntanos sobre ti, tu historia deportiva, lo que te gusta…"
                      value={form.bio}
                      onChange={(e) => setField("bio", e.target.value)}
                      disabled={saving}
                    />
                  </label>
                </div>

                <div className="onboarding-actions">
                  <button className="auth-primary" onClick={goNext} disabled={saving}>
                    Siguiente →
                  </button>

                  <button
                    type="button"
                    className="auth-link"
                    onClick={() => nav("/perfil", { replace: true })}
                    disabled={saving}
                  >
                    Saltar
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="onboarding-stepPanel">
                <div className="stack auth-form">
                  <div>
                    <div className="auth-labelText onboarding-fieldLabel">Disciplina / modalidad</div>
                    <div className="onboarding-chipGrid">
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

                  <label className="auth-label">
                    <span className="auth-labelText">Strava</span>
                    <input
                      className="auth-input"
                      placeholder="https://www.strava.com/athletes/..."
                      value={form.links.strava}
                      onChange={(e) => setField("links", { ...form.links, strava: e.target.value })}
                      disabled={saving}
                    />
                  </label>

                  <label className="auth-label">
                    <span className="auth-labelText">Instagram</span>
                    <input
                      className="auth-input"
                      placeholder="https://instagram.com/..."
                      value={form.links.instagram}
                      onChange={(e) =>
                        setField("links", { ...form.links, instagram: e.target.value })
                      }
                      disabled={saving}
                    />
                  </label>

                  <label className="auth-label">
                    <span className="auth-labelText">Web</span>
                    <input
                      className="auth-input"
                      placeholder="https://..."
                      value={form.links.website}
                      onChange={(e) => setField("links", { ...form.links, website: e.target.value })}
                      disabled={saving}
                    />
                  </label>
                </div>

                <div className="onboarding-actions onboarding-actions--split">
                  <button type="button" className="auth-link" onClick={goBack} disabled={saving}>
                    ← Atrás
                  </button>
                  <button className="auth-primary" onClick={finish} disabled={saving}>
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