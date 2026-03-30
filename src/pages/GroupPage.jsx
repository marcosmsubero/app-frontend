import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";

function initialsFromEmail(email = "") {
  const clean = String(email || "").trim();
  return (clean[0] || "U").toUpperCase();
}

export default function GroupPage() {
  const { groupId } = useParams();
  const nav = useNavigate();
  const { token } = useAuth();

  const gid = useMemo(() => Number(groupId), [groupId]);

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadGroup() {
      if (!gid) return;

      setLoading(true);
      setError("");

      try {
        const groupRes = await api(`/groups/${gid}`, { token });
        let membersRes = [];

        if (token) {
          try {
            membersRes = await api(`/groups/${gid}/members`, { token });
          } catch {
            membersRes = [];
          }
        }

        if (!cancelled) {
          setGroup(groupRes);
          setMembers(Array.isArray(membersRes) ? membersRes : []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "No se pudo cargar el grupo.");
          setGroup(null);
          setMembers([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadGroup();

    return () => {
      cancelled = true;
    };
  }, [gid, token]);

  if (loading) {
    return (
      <section className="page">
        <div className="app-card">
          <div className="app-card__body">
            <div className="app-empty">
              <div className="notificationsSimple__emptyBody">
                <strong>Cargando grupo</strong>
                <p>Estamos preparando el detalle.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !group) {
    return (
      <section className="page">
        <div className="app-card">
          <div className="app-card__body" style={{ display: "grid", gap: 14 }}>
            <button
              type="button"
              className="app-button app-button--secondary"
              onClick={() => nav(-1)}
              style={{ width: "fit-content" }}
            >
              Volver
            </button>

            <div className="app-empty">
              <div className="notificationsSimple__emptyBody">
                <strong>No se pudo cargar el grupo</strong>
                <p>{error || "Grupo no encontrado."}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="app-card">
        <div className="app-card__body" style={{ display: "grid", gap: 18 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <button
                type="button"
                className="app-button app-button--secondary"
                onClick={() => nav(-1)}
                style={{ width: "fit-content" }}
              >
                Volver
              </button>

              <div className="page__header" style={{ marginBottom: 0 }}>
                <span className="page__eyebrow">Grupo</span>
                <h1 className="page__title">{group.name}</h1>
                <p className="page__subtitle">
                  {group.city} · {group.is_private ? "Privado" : "Público"}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className="app-chip app-chip--soft">
                {group.members_count ?? members.length} miembros
              </span>
              <span className="app-chip app-chip--soft">Running</span>
            </div>
          </div>
        </div>
      </div>

      <div className="app-card">
        <div className="app-card__body" style={{ display: "grid", gap: 14 }}>
          <h3 style={{ margin: 0 }}>Miembros</h3>

          {!token ? (
            <div className="app-empty">
              <div className="notificationsSimple__emptyBody">
                <strong>Inicia sesión para ver miembros</strong>
                <p>El detalle del grupo es público, pero la lista de miembros requiere sesión.</p>
              </div>
            </div>
          ) : members.length === 0 ? (
            <div className="app-empty">
              <div className="notificationsSimple__emptyBody">
                <strong>No hay miembros visibles</strong>
                <p>Este grupo aún no muestra miembros o no tiene participantes.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {members.map((member) => (
                <article
                  key={member.user_id}
                  className="app-card"
                  style={{ background: "rgba(255,255,255,0.56)" }}
                >
                  <div
                    className="app-card__body"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: "50%",
                          display: "grid",
                          placeItems: "center",
                          background: "rgba(16,24,40,0.08)",
                          fontWeight: 700,
                          color: "var(--app-text)",
                        }}
                      >
                        {initialsFromEmail(member.email)}
                      </div>

                      <div style={{ display: "grid", gap: 4 }}>
                        <strong>{member.email}</strong>
                        <span style={{ color: "var(--app-text-muted)", fontSize: "var(--font-sm)" }}>
                          {member.role === "owner"
                            ? "Creador"
                            : member.role === "mod"
                            ? "Administrador"
                            : "Miembro"}
                        </span>
                      </div>
                    </div>

                    <span className="app-chip app-chip--soft">
                      {member.role === "owner"
                        ? "Creador"
                        : member.role === "mod"
                        ? "Admin"
                        : "Miembro"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
