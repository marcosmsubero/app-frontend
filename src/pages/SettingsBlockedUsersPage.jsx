import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/useToast";
import { apiListMyBlocks, apiUnblockUser } from "../services/api";
import { useBlockedIds } from "../hooks/useBlockedIds";
import "../styles/settings.css";

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function initialOf(name) {
  const clean = String(name || "").trim();
  if (!clean) return "?";
  return clean[0].toUpperCase();
}

export default function SettingsBlockedUsersPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { refresh: refreshBlocks } = useBlockedIds();

  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await apiListMyBlocks();
      setBlocked(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err?.message || "No se pudieron cargar los usuarios bloqueados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUnblock(userId) {
    if (!userId) return;
    setPendingId(userId);
    try {
      await apiUnblockUser(userId);
      setBlocked((prev) => prev.filter((item) => item.user_id !== userId));
      refreshBlocks().catch(() => {});
      toast?.success?.("Usuario desbloqueado.");
    } catch (err) {
      toast?.error?.(err?.message || "No se pudo desbloquear.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="page settingsSubpage">
      <div className="settingsSubpage__header">
        <button type="button" className="settingsSubpage__back" onClick={() => navigate(-1)} aria-label="Volver">
          <BackIcon />
        </button>
        <div>
          <h1 className="settingsSubpage__title">Usuarios bloqueados</h1>
          <p className="settingsSubpage__subtitle">
            Cuando bloqueas a alguien, deja de ver tu perfil y no puede contactarte. Tampoco verás su contenido.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="settingsCard">
          <p className="settingsMuted">Cargando…</p>
        </div>
      ) : error ? (
        <div className="settingsCard">
          <p className="settingsMuted">{error}</p>
          <button type="button" className="feedCard__action" onClick={load} style={{ marginTop: 12 }}>
            Reintentar
          </button>
        </div>
      ) : blocked.length === 0 ? (
        <div className="settingsCard">
          <p className="settingsMuted">
            No tienes usuarios bloqueados. Puedes bloquear a alguien desde su perfil.
          </p>
        </div>
      ) : (
        <div className="settingsCard">
          <div className="settingsListSimple">
            {blocked.map((user) => (
              <div key={user.user_id} className="settingsBlockedUser">
                <div className="settingsBlockedUser__left">
                  <div className="settingsBlockedUser__avatar">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt=""
                        style={{ width: "100%", height: "100%", borderRadius: "999px", objectFit: "cover" }}
                      />
                    ) : (
                      initialOf(user.display_name || user.handle)
                    )}
                  </div>
                  <div>
                    <h3 className="settingsBlockedUser__name">
                      {user.display_name || user.handle || "Usuario"}
                    </h3>
                    {user.handle ? (
                      <p className="settingsBlockedUser__handle">@{user.handle}</p>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  className="feedCard__action"
                  onClick={() => handleUnblock(user.user_id)}
                  disabled={pendingId === user.user_id}
                >
                  {pendingId === user.user_id ? "…" : "Desbloquear"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
