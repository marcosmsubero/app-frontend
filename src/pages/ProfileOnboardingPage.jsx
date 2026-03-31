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

function parseMemberHandles(raw = "") {
  return String(raw || "")
    .split(/[\n,]/)
    .map((item) => normalizeHandle(item))
    .filter(Boolean);
}

function stringifyMemberHandles(members = []) {
  if (!Array.isArray(members) || !members.length) return "";
  return members
    .map((member) => member?.handle)
    .filter(Boolean)
    .map((handle) => `@${normalizeHandle(handle)}`)
    .join("\n");
}

export default function ProfileOnboardingPage() {
  const { token, me, meReady, refreshMe } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const isEditMode =
    location.state?.editProfile === true || searchParams.get("mode") === "edit";

  const [form, setForm] = useState({
    profile_type: "individual",
    full_name: "",
    handle: "",
    bio: "",
    location: "",
    member_handles_text: "",
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const initialEmail = useMemo(() => {
    return location.state?.registeredEmail || me?.email || "";
  }, [location.state?.registeredEmail, me?.email]);

  useEffect(() => {
    if (!meReady) return;

    setForm({
      profile_type: me?.profile_type || "individual",
      full_name: me?.display_name || me?.full_name || "",
      handle: me?.handle || "",
      bio: me?.bio || "",
      location: me?.location || "",
      member_handles_text: stringifyMemberHandles(me?.members || []),
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

    const profile_type = form.profile_type === "group" ? "group" : "individual";
    const full_name = form.full_name.trim();
    const handle = normalizeHandle(form.handle);
    const bio = form.bio.trim();
    const locationValue = form.location.trim();
    const member_handles = profile_type === "group"
      ? parseMemberHandles(form.member_handles_text)
      : [];

    if (!full_name) {
      return setError(
        profile_type === "group"
          ? "Introduce el nombre del grupo."
          : "Introduce tu nombre."
      );
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
        profile_type,
        full_name,
        handle,
        bio: bio || null,
        location: locationValue || null,
        avatar_url: me?.avatar_url || null,
        onboarding_completed: true,
        member_handles,
      };

      await apiUpdateProfile(payload, token);
      const nextMe = await refreshMe(token);

      if (!nextMe?.onboarding_completed) {
        throw new Error("El backend no confirmó la finalización del onboarding.");
      }

      if (nextMe?.profile_type !== profile_type) {
        throw new Error("El backend no guardó correctamente el tipo de perfil.");
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

  const isGroup = form.profile_type === "group";

  return (
    <section className="app-shell app-shell--narrow">
      <div className="app-section">
        <div className="app-section__header">
          <div>
            <span className="app-eyebrow">{isEditMode ? "Perfil" : "Onboarding"}</span>
            <h1 className="app-title">
              {isEditMode ? "Editar perfil" : "Completa tu perfil"}
            </h1>
            <p className="app-subtitle">
              Elige si tu presencia en la app será individual o grupal.
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
            <label className="app-label">Tipo de perfil</label>
            <div className="authTabs" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
              <button
                type="button"
                className={form.profile_type === "individual" ? "authTab is-active" : "authTab"}
                onClick={() => updateField("profile_type", "individual")}
                disabled={saving}
              >
                Individual
              </button>
              <button
                type="button"
                className={form.profile_type === "group" ? "authTab is-active" : "authTab"}
                onClick={() => updateField("profile_type", "group")}
                disabled={saving}
              >
                Grupo
              </button>
            </div>
          </div>

          <div className="app-field">
            <label className="app-label" htmlFor="onboarding-full-name">
              {isGroup ? "Nombre del grupo" : "Nombre"}
            </label>
            <input
              id="onboarding-full-name"
              className="app-input"
              type="text"
              value={form.full_name}
              onChange={(e) => updateField("full_name", e.target.value)}
              disabled={saving}
              placeholder={isGroup ? "Nombre de tu grupo" : "Tu nombre"}
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
              placeholder={isGroup ? "gruporunning" : "tuusuario"}
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
              placeholder={
                isGroup
                  ? "Describe brevemente el grupo"
                  : "Cuéntanos algo sobre ti como runner"
              }
            />
            <small className="app-help">{form.bio.length}/280</small>
          </div>

          {isGroup ? (
            <div className="app-field">
              <label className="app-label" htmlFor="onboarding-members">
                Miembros del grupo
              </label>
              <textarea
                id="onboarding-members"
                className="app-textarea"
                rows={5}
                value={form.member_handles_text}
                onChange={(e) => updateField("member_handles_text", e.target.value)}
                disabled={saving}
                placeholder={"@marcos\n@ana\n@carlos"}
              />
              <small className="app-help">
                Añade un usuario por línea o separados por comas. Solo se pueden añadir usuarios
                que ya tengan perfil individual.
              </small>
            </div>
          ) : null}

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
