import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cropper from "react-easy-crop";
import { API_BASE } from "../services/api";

function initialsFromNameOrEmail(me) {
  const name = (me?.full_name || "").trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
  }
  return (me?.email?.[0] || "U").toUpperCase();
}

function roleLabel(role) {
  if (role === "athlete") return "Deportista";
  if (role === "coach") return "Entrenador";
  if (role === "group") return "Grupo";
  return "—";
}

async function getCroppedBlob(imageSrc, cropPixels) {
  const img = document.createElement("img");
  img.src = imageSrc;

  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
  });

  const canvas = document.createElement("canvas");
  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;
  const ctx = canvas.getContext("2d");

  ctx.drawImage(
    img,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height
  );

  return await new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
  });
}

function IconBell({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
      <path d="M9 17a3 3 0 0 0 6 0" />
    </svg>
  );
}

function IconMail({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function IconClose({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

function VerifiedCheck({ title = "Cuenta verificada" }) {
  return (
    <span className="vcheck" title={title} aria-label={title}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M20 7L10.5 16.5L4 10"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function ProfileCard({ me, token, onLogout }) {
  const nav = useNavigate();

  const initials = useMemo(() => initialsFromNameOrEmail(me), [me]);
  const disciplines = Array.isArray(me?.disciplines) ? me.disciplines : [];

  const followers = Number(me?.followers_count ?? 0);
  const following = Number(me?.following_count ?? 0);
  const posts = Number(me?.posts_count ?? 0);

  const isVerified = !!me?.is_verified;
  const locationText = String(me?.location || "").trim();
  const hasLocation = !!locationText;

  const fileRef = useRef(null);

  const [avatarLocal, setAvatarLocal] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.1);
  const [croppedPixels, setCroppedPixels] = useState(null);

  const [avatarSaving, setAvatarSaving] = useState(false);

  const currentAvatarSrc =
    avatarUrl ||
    (me?.avatar_url
      ? me.avatar_url.startsWith("http")
        ? me.avatar_url
        : `${API_BASE}${me.avatar_url}`
      : null);

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedPixels(croppedAreaPixels);
  }, []);

  function openPicker() {
    fileRef.current?.click();
  }

  async function onPickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 6 * 1024 * 1024) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarLocal(String(reader.result));
      setShowAvatarModal(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1.1);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function saveCroppedAvatar() {
    if (avatarSaving) return;
    setAvatarSaving(true);

    try {
      if (!avatarLocal || !croppedPixels) {
        setShowAvatarModal(false);
        return;
      }

      const blob = await getCroppedBlob(avatarLocal, croppedPixels);
      if (!blob) throw new Error("No se pudo procesar la imagen");

      const form = new FormData();
      form.append("file", blob, "avatar.jpg");

      const res = await fetch(`${API_BASE}/me/avatar`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "No se pudo subir el avatar");
      }

      const data = await res.json();
      const url = data.avatar_url?.startsWith("http")
        ? data.avatar_url
        : `${API_BASE}${data.avatar_url}`;

      setAvatarUrl(url);
      setShowAvatarModal(false);
    } catch (err) {
      console.error(err);
      setShowAvatarModal(false);
    } finally {
      setAvatarSaving(false);
    }
  }

  async function removeAvatar() {
    if (avatarSaving) return;
    setAvatarSaving(true);

    try {
      await fetch(`${API_BASE}/me/avatar`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setAvatarUrl(null);
      setAvatarLocal(null);
      setShowAvatarModal(false);
      setAvatarSaving(false);
    }
  }

  const roleText = roleLabel(me?.role);

  function openPosts() {
    nav("/perfil?tab=posts", { replace: false });
  }

  function openFollowers() {
    nav("/perfil/seguidores", { replace: false });
  }

  function openFollowing() {
    nav("/perfil/seguidos", { replace: false });
  }

  return (
    <div className="profile-card profile-card--compact">
      <div className="card-top-icons" aria-label="Accesos rápidos">
        <button
          type="button"
          className="icon-btn icon-btn--gold"
          title="Notificaciones"
          aria-label="Notificaciones"
          onClick={() => nav("/notificaciones")}
        >
          <IconBell />
        </button>

        <button
          type="button"
          className="icon-btn icon-btn--gold"
          title="Mensajes"
          aria-label="Mensajes"
          onClick={() => nav("/mensajes")}
        >
          <IconMail />
        </button>
      </div>

      <div className="card-header">
        <div className="card-avaWrap">
          <div
            className="card-avatar card-avatar--click"
            role="button"
            tabIndex={0}
            title={currentAvatarSrc ? "Cambiar foto" : "Añadir foto"}
            aria-label="Cambiar foto de perfil"
            onClick={openPicker}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? openPicker() : null)}
          >
            {currentAvatarSrc ? <img src={currentAvatarSrc} alt="avatar" /> : <span>{initials}</span>}
            <span className="avatar-badge" aria-hidden="true">
              ✎
            </span>
          </div>

          {hasLocation && (
            <div className="card-loc" title={locationText} aria-label={`Ubicación: ${locationText}`}>
              <span className="card-locIco" aria-hidden="true"></span>
              <span className="card-locTxt">{locationText}</span>
            </div>
          )}
        </div>

        <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} hidden />

        <div className="card-title">
          <div className="card-nameRow">
            <div className="card-name">{me?.full_name || "Tu nombre"}</div>
            {isVerified && <VerifiedCheck />}
          </div>

          <div className="card-handleRow" aria-label="Usuario y rol">
            <div className="card-handle">@{me?.handle || "handle"}</div>
            <span className="card-dot" aria-hidden="true">
              •
            </span>
            <div className="card-roleInline">{roleText}</div>
          </div>

          <div className="card-stats card-stats--inline" aria-label="Estadísticas">
            <button
              type="button"
              className="stat stat--btn"
              onClick={openPosts}
              aria-label="Ver publicaciones"
            >
              <div className="stat-n">{posts}</div>
              <div className="stat-l">Publicaciones</div>
            </button>

            <button
              type="button"
              className="stat stat--btn"
              onClick={openFollowers}
              aria-label="Ver seguidores"
            >
              <div className="stat-n">{followers}</div>
              <div className="stat-l">Seguidores</div>
            </button>

            <button
              type="button"
              className="stat stat--btn"
              onClick={openFollowing}
              aria-label="Ver seguidos"
            >
              <div className="stat-n">{following}</div>
              <div className="stat-l">Seguidos</div>
            </button>
          </div>
        </div>
      </div>

      <div className="card-bio">{me?.bio || "Añade una bio para que te conozcan mejor."}</div>

      <div className="card-chips">
        {(disciplines.length ? disciplines : ["sin disciplina"]).map((d) => (
          <span key={d} className="chip">
            {d}
          </span>
        ))}
      </div>

      <div className="card-edit">
        <button
          type="button"
          className="chip chip--mini chip--cta"
          onClick={() => nav("/onboarding")}
          title="Editar perfil"
          aria-label="Editar perfil"
        >
          Editar perfil
        </button>
      </div>

      {showAvatarModal && (
        <div className="avatar-modal" role="dialog" aria-modal="true">
          <div className="avatar-modal__panel">
            <div className="avatar-modal__head">
              <div className="avatar-modal__title">Ajustar foto</div>
              <button
                type="button"
                className="icon-btn icon-btn--gold"
                onClick={() => setShowAvatarModal(false)}
                aria-label="Cerrar"
                title="Cerrar"
                disabled={avatarSaving}
              >
                <IconClose />
              </button>
            </div>

            <div className="avatar-cropper">
              <Cropper
                image={avatarLocal}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="rect"
                showGrid={false}
                restrictPosition={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="avatar-modal__controls">
              <label className="avatar-zoom">
                Zoom
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  disabled={avatarSaving}
                />
              </label>

              <div className="avatar-modal__actions">
                {currentAvatarSrc && (
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={removeAvatar}
                    disabled={avatarSaving}
                  >
                    Eliminar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(false)}
                  disabled={avatarSaving}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={saveCroppedAvatar}
                  disabled={avatarSaving}
                >
                  {avatarSaving ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}