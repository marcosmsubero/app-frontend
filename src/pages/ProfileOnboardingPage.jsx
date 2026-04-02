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

function LoaderScreen({ isEditMode }) {
  return (
    <section className="page">
      <div className="stateCard">
        <h3 className="stateCard__title">
          {isEditMode ? "Cargando perfil" : "Cargando onboarding"}
        </h3>
        <p className="stateCard__text">Espera un momento.</p>
      </div>
    </section>
  );
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
    const member_handles =
      profile_type === "group" ? parseMemberHandles(form.member_handles_text) : [];

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
    return <LoaderScreen isEditMode={isEditMode} />;
  }

  if (isOnboardingComplete(me) && !isEditMode) {
    return <Navigate to="/" replace />;
  }

  const isGroup = form.profile_type === "group";

  return (
    <section className="page">
      <section className="sectionBlock">
        <div className="app-section-header">
          <div>
            <div className="app-section-header__title">
              {isEditMode ? "Editar perfil" : "Completa tu perfil"}
            </div>
            <div className="app-section-header__subtitle">
              {isGroup
                ? "Configura la identidad del grupo y sus miembros."
                : "Define tu perfil con un flujo compacto y directo."}
            </div>
          </div>

          <span className="app-badge app-badge--primary">
            {isGroup ? "Grupo" : "Individual"}
          </span>
        </div>
      </section>

      <section className="sectionBlock">
        <form className="formCard" onSubmit={handleSubmit}>
          {initialEmail ? (
            <div className="formRow">
              <label>Email</label>
              <input type="email" value={initialEmail} disabled readOnly />
            </div>
          ) : null}

          <div className="formRow">
            <label>Tipo de perfil</label>
            <div className="tabBar">
              <button
                type="button"
                className={`tabBar__item${
                  form.profile_type === "individual" ? " tabBar__item--active" : ""
                }`}
                onClick={() => updateField("profile_type", "individual")}
                disabled={saving}
              >
                Individual
              </button>

              <button
                type="button"
                className={`tabBar__item${
                  form.profile_type === "group" ? " tabBar__item--active" : ""
                }`}
                onClick={() => updateField("profile_type", "group")}
                disabled={saving}
              >
                Grupo
              </button>
            </div>
          </div>

          <div className="formRow">
            <label htmlFor="onboarding-full-name">
              {isGroup ? "Nombre del grupo" : "Nombre"}
            </label>
            <input
              id="onboarding-full-name"
              type="text"
              value={form.full_name}
              onChange={(e) => updateField("full_name", e.target.value)}
              disabled={saving}
              placeholder={isGroup ? "Nombre de tu grupo" : "Tu nombre"}
              autoComplete="name"
            />
          </div>

          <div className="formRow">
            <label htmlFor="onboarding-handle">Nombre de usuario</label>
            <input
              id="onboarding-handle"
              type="text"
              value={form.handle}
              onChange={(e) => updateField("handle", normalizeHandle(e.target.value))}
              disabled={saving}
              placeholder={isGroup ? "gruporunning" : "tuusuario"}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="username"
            />
            <p className="formHint">Será tu identificador visible dentro de la app.</p>
          </div>

          <div className="formRow">
            <label htmlFor="onboarding-location">Ubicación</label>
            <input
              id="onboarding-location"
              type="text"
              value={form.location}
              onChange={(e) => updateField("location", e.target.value)}
              disabled={saving}
              placeholder="Ej. Alicante"
              autoComplete="address-level2"
            />
          </div>

          <div className="formRow">
            <label htmlFor="onboarding-bio">Bio</label>
            <textarea
              id="onboarding-bio"
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
            <p className="formHint">{form.bio.length}/280</p>
          </div>

          {isGroup ? (
            <div className="formRow">
              <label htmlFor="onboarding-members">Miembros del grupo</label>
              <textarea
                id="onboarding-members"
                rows={5}
                value={form.member_handles_text}
                onChange={(e) => updateField("member_handles_text", e.target.value)}
                disabled={saving}
                placeholder={"@marcos\n@ana\n@carlos"}
              />
              <p className="formHint">
                Añade un usuario por línea o separados por comas. Solo se pueden añadir usuarios
                que ya tengan perfil individual.
              </p>
            </div>
          ) : null}

          {msg.text ? (
            <div className="stateCard" style={{ padding: 14 }}>
              <h3 className="stateCard__title">
                {msg.type === "error" ? "Revisa el formulario" : "Todo correcto"}
              </h3>
              <p className="stateCard__text">{msg.text}</p>
            </div>
          ) : null}

          <div className="formActions">
            {isEditMode ? (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={goBackAfterEdit}
                disabled={saving}
              >
                Cancelar
              </button>
            ) : null}

            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? "Guardando..." : isEditMode ? "Guardar cambios" : "Completar perfil"}
            </button>
          </div>
        </form>
      </section>
    </section>
  );
}
