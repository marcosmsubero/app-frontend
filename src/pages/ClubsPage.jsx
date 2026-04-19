import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { useI18n } from "../i18n/index.jsx";
import {
  apiClubsList,
  apiClubCreate,
  apiClubJoin,
} from "../services/api";
import { AnalyticsEvents } from "../services/analytics";
import "../styles/clubs.css";

function ClubRow({ club, onJoin, busy, t }) {
  const isMember = Boolean(club.is_member);

  return (
    <article className="clubCard">
      <div className="clubCard__avatar">
        {club.avatar_url ? (
          <img src={club.avatar_url} alt={club.display_name} />
        ) : (
          <div className="clubCard__avatarFallback">
            {(club.display_name || "C").slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>

      <div className="clubCard__body">
        <Link to={`/clubs/${club.id}`} className="clubCard__name">
          {club.display_name}
        </Link>
        {club.handle ? (
          <span className="clubCard__handle">@{club.handle}</span>
        ) : null}
        {club.bio ? <p className="clubCard__bio">{club.bio}</p> : null}
        <div className="clubCard__meta">
          {club.members_count || 0}{" "}
          {club.members_count === 1 ? t("clubs.member") : t("clubs.memberPlural")}
          {club.location ? ` · ${club.location}` : ""}
        </div>
      </div>

      {isMember ? (
        <Link
          to={`/clubs/${club.id}`}
          className="feedCard__action clubCard__joinBtn"
          style={{ textDecoration: "none" }}
        >
          Ver club
        </Link>
      ) : (
        <button
          type="button"
          className="feedCard__action feedCard__action--primary clubCard__joinBtn"
          disabled={busy}
          onClick={() => onJoin(club.id)}
        >
          {t("clubs.join")}
        </button>
      )}
    </article>
  );
}

export default function ClubsPage() {
  const { token } = useAuth();
  const toast = useToast();
  const { t } = useI18n();

  const [clubs, setClubs] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  // Create-club form
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formBio, setFormBio] = useState("");
  const [formLocation, setFormLocation] = useState("");

  async function load(q = "") {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const list = await apiClubsList(q, token);
      setClubs(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e?.message || t("general.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function onSearchSubmit(e) {
    e.preventDefault();
    load(query.trim());
  }

  async function handleJoin(clubId) {
    setBusyId(clubId);
    try {
      await apiClubJoin(clubId, token);
      AnalyticsEvents.clubJoined?.(clubId);
      toast?.success?.(t("clubs.join"));
      await load(query.trim());
    } catch (e) {
      toast?.error?.(e?.message || t("general.error"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!formName.trim()) return;

    setCreating(true);
    try {
      const created = await apiClubCreate(
        {
          display_name: formName.trim(),
          bio: formBio.trim() || null,
          location: formLocation.trim() || null,
        },
        token
      );
      AnalyticsEvents.clubCreated?.(created?.id);
      toast?.success?.(t("clubs.create"));
      setShowForm(false);
      setFormName("");
      setFormBio("");
      setFormLocation("");
      await load("");
    } catch (e) {
      toast?.error?.(e?.message || t("general.error"));
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="page clubsPage">
      <section className="sectionBlock">
        <div className="app-section-header">
          <div>
            <div className="app-section-header__title">{t("clubs.title")}</div>
            <div className="app-section-header__subtitle">
              {t("clubs.subtitle")}
            </div>
          </div>
          <button
            type="button"
            className="feedCard__action feedCard__action--primary"
            onClick={() => setShowForm((v) => !v)}
          >
            {t("clubs.create")}
          </button>
        </div>
      </section>

      {showForm ? (
        <section className="sectionBlock">
          <form className="clubCreateForm" onSubmit={handleCreate}>
            <input
              type="text"
              className="clubCreateForm__input"
              placeholder={t("clubs.namePlaceholder")}
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              maxLength={120}
            />
            <textarea
              className="clubCreateForm__textarea"
              placeholder={t("clubs.bioPlaceholder")}
              value={formBio}
              onChange={(e) => setFormBio(e.target.value)}
              maxLength={500}
              rows={2}
            />
            <input
              type="text"
              className="clubCreateForm__input"
              placeholder={t("clubs.locationPlaceholder")}
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              maxLength={120}
            />
            <div className="clubCreateForm__actions">
              <button
                type="button"
                className="feedCard__action"
                onClick={() => setShowForm(false)}
              >
                {t("general.cancel")}
              </button>
              <button
                type="submit"
                className="feedCard__action feedCard__action--primary"
                disabled={creating || !formName.trim()}
              >
                {creating ? t("general.loading") : t("clubs.create")}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="sectionBlock">
        <form className="clubsSearch" onSubmit={onSearchSubmit}>
          <input
            type="search"
            className="clubsSearch__input"
            placeholder={t("clubs.search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </section>

      <section className="sectionBlock">
        {loading ? (
          <div className="stateCard">
            <h3 className="stateCard__title">{t("general.loading")}</h3>
          </div>
        ) : error ? (
          <div className="stateCard">
            <h3 className="stateCard__title">{t("general.error")}</h3>
            <p className="stateCard__text">{error}</p>
          </div>
        ) : clubs.length === 0 ? (
          <div className="stateCard">
            <h3 className="stateCard__title">{t("clubs.empty")}</h3>
            <p className="stateCard__text">{t("clubs.emptyText")}</p>
          </div>
        ) : (
          <div className="clubsList">
            {clubs.map((c) => (
              <ClubRow
                key={c.id}
                club={c}
                onJoin={handleJoin}
                busy={busyId === c.id}
                t={t}
              />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
