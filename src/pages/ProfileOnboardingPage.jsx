import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { isOnboardingComplete } from "../lib/userContract";
import { apiUpdateProfile } from "../services/api";

function normalizeHandle(value = "") {
  return String(value || "")
    .trim()
    .replace(/^@+/, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

export default function ProfileOnboardingPage() {
  const { token, me, meReady, refreshMe } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const isEditMode =
    location.state?.editProfile === true || searchParams.get("mode") === "edit";

  const [form, setForm] = useState({
    full_name: "",
    handle: "",
    bio: "",
    location: "",
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const initialEmail = useMemo(() => {
    return location.state?.registeredEmail || me?.email || "";
  }, [location.state?.registeredEmail, me?.email]);

  useEffect(() => {
    if (!meReady) return;

    setForm({
      full_name: me?.full_name || "",
      handle: me?.handle || "",
      bio: me?.bio || "",
      location: me?.location || "",
    });
  }, [me, meReady]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function setError(text) {
    setMsg({ type: "error", text });
  }

  function setSuccess(text) {
    setMsg({ type: "success", text });
  }

  function goBackAfterEdit() {
    nav("/perfil", { replace: true });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const full_name = form.full_name.trim();
    const handle = normalizeHandle(form.handle);
    const bio = form.bio.trim();
    const locationValue = form.location.trim();

    if (!full_name) {
      return setError("Introduce tu nombre.");
    }

    if (full_name.length < 2) {
      return setError("El nombre debe tener al menos 2 caracteres.");
    }

    if (!handle) {
      return setError("Introduce un nombre de usuario.");
    }

    if (!/^[a-z0-9._-]{3,30}$/.test(handle)) {
      return setError(
        "El usuario debe tener entre 3 y 30 caracteres y solo puede incluir letras, números, punto, guion y guion bajo."
      );
    }

    if (bio.length > 280) {
      return setError("La bio no puede superar los 280 caracteres.");
    }

    setSaving(true);
    setMsg({ type: "", text: "" });

    try {
      const payload = {
        full_name,
        handle,
        bio: bio || null,
        location: locationValue || null,
        disciplines: ["running"],
        avatar_url: me?.avatar_url || null,
        onboarding_completed: true,
      };

      await apiUpdateProfile(payload, token);
      const nextMe = await refreshMe(token);

      if (!nextMe?.onboarding_completed) {
        throw new Error("El backend no confirmó la finalización del onboarding.");
      }

      setSuccess(isEditMode ? "Perfil actualizado." : "Perfil completado.");
      nav(isEditMode ? "/perfil" : "/", { replace: true });
    } catch (err) {
      const message = String(err?.message || "").toLowerCase();

      if (
        message.includes("handle") &&
        (message.includes("exists") ||
          message.includes("taken") ||
          message.includes("duplic") ||
          message.includes("unique") ||
          message.includes("uso"))
      ) {
        setError("Ese nombre de usuario ya está en uso.");
      } else {
        setError(err?.message || "No se pudo guardar el perfil.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (!meReady) {
    return (
      <div className="app-loader-screen">
        <div className="app-loader-screen__inner">
          <div className="app-loader-screen__spinner" />
          <div className="app-loader-screen__label">
            {isEditMode ? "Cargando perfil…" : "Cargando onboarding…"}
          </div>
        </div>
      </div>
    );
  }

  if (isOnboardingComplete(me) && !isEditMode) {
    return <Navigate to="/" replace />;
  }

  return (
    <section className="app-shell app-shell--narrow">
      <div className="app-section">
        <div className="app-section__header">
          <div>
            <span className="app-eyebrow">{isEditMode ? "Perfil" : "Onboarding"}</span>
            <h1 className="app-title">
              {isEditMode ? "Editar perfil runner" : "Completa tu perfil runner"}
            </h1>
            <p className="app-subtitle">
              {isEditMode
                ? "Actualiza tu información principal desde la fuente de verdad del producto."
                : "Configura tu cuenta una sola vez para acceder a la comunidad."}
            </p>
          </div>
        </div>

        <form className="app-form" onSubmit={handleSubmit}>
          {initialEmail ? (
            <div className="app-field">
              <label className="app-label">Email</label>
              <input className="app-input" type="email" value={initialEmail} disabled readOnly />
            </div>
          ) : null}

          <div className="app-field">
            <label className="app-label" htmlFor="onboarding-full-name">
              Nombre
            </label>
            <input
              id="onboarding-full-name"
              className="app-input"
              type="text"
              value={form.full_name}
              onChange={(e) => updateField("full_name", e.target.value)}
              disabled={saving}
              placeholder="Tu nombre"
              autoComplete="name"
            />
          </div>

          <div className="app-field">
            <label className="app-label" htmlFor="onboarding-handle">
              Nombre de usuario
            </label>
            <input
              id="onboarding-handle"
              className="app-input"
              type="text"
              value={form.handle}
              onChange={(e) => updateField("handle", normalizeHandle(e.target.value))}
              disabled={saving}
              placeholder="tuusuario"
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="username"
            />
            <small className="app-help">Será tu identificador visible dentro de la app.</small>
          </div>

          <div className="app-field">
            <label className="app-label" htmlFor="onboarding-location">
              Ubicación
            </label>
            <input
              id="onboarding-location"
              className="app-input"
              type="text"
              value={form.location}
              onChange={(e) => updateField("location", e.target.value)}
              disabled={saving}
              placeholder="Ej. Alicante"
              autoComplete="address-level2"
            />
          </div>

          <div className="app-field">
            <label className="app-label" htmlFor="onboarding-bio">
              Bio
            </label>
            <textarea
              id="onboarding-bio"
              className="app-textarea"
              rows={4}
              value={form.bio}
              onChange={(e) => updateField("bio", e.target.value)}
              disabled={saving}
              placeholder="Cuéntanos algo sobre ti como runner"
            />
            <small className="app-help">{form.bio.length}/280</small>
          </div>

          {msg.text ? (
            <div
              className={`authSimple__message ${
                msg.type === "error"
                  ? "authSimple__message--error"
                  : "authSimple__message--success"
              }`}
            >
              {msg.text}
            </div>
          ) : null}

          <div className="app-actions">
            {isEditMode ? (
              <button
                type="button"
                className="app-button app-button--secondary"
                onClick={goBackAfterEdit}
                disabled={saving}
              >
                Cancelar
              </button>
            ) : null}

            <button type="submit" className="app-button app-button--primary" disabled={saving}>
              {saving ? "Guardando…" : isEditMode ? "Guardar cambios" : "Completar perfil"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
