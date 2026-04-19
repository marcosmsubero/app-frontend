import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import "../styles/settings.css";

function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: 20, height: 20 }}
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

export default function DeleteAccountPage() {
  const { deleteAccount, logout } = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  const [step, setStep] = useState(1);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const canContinue = useMemo(
    () => text.trim().toUpperCase() === "ELIMINAR",
    [text]
  );

  async function handleDelete() {
    if (loading) return;

    setLoading(true);

    try {
      await deleteAccount();
      logout?.();
      toast?.success?.("Cuenta eliminada");
      nav("/", { replace: true });
    } catch (e) {
      toast?.error?.(e?.message || "No se pudo eliminar la cuenta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page settingsSubpage">
      <div className="settingsSubpage__header">
        <button
          type="button"
          className="settingsSubpage__back"
          onClick={() => nav(-1)}
          aria-label="Volver"
        >
          <BackIcon />
        </button>
        <div>
          <h1 className="settingsSubpage__title">Eliminar cuenta</h1>
          <p className="settingsSubpage__subtitle">
            Proceso irreversible. Revisa cada paso antes de continuar.
          </p>
        </div>
      </div>

      {step === 1 ? (
        <section className="sectionBlock">
          <div className="stateCard">
            <h3 className="stateCard__title">Antes de continuar</h3>
            <p className="stateCard__text">
              Se eliminarán permanentemente tu perfil, mensajes, participaciones, clubs, seguidores y todos tus datos del servidor. Tu email quedará libre para registrarte de nuevo si lo deseas.
            </p>
          </div>

          <div className="compactList card">
            <div className="compactListItem">
              <div className="compactListItem__copy">
                <h3 className="compactListItem__title">Perfil</h3>
                <p className="compactListItem__text">
                  Nombre, bio, avatar y datos visibles.
                </p>
              </div>
            </div>

            <div className="compactListItem">
              <div className="compactListItem__copy">
                <h3 className="compactListItem__title">Participación</h3>
                <p className="compactListItem__text">
                  Saldrás de grupos y quedadas vinculadas a tu cuenta.
                </p>
              </div>
            </div>

            <div className="compactListItem">
              <div className="compactListItem__copy">
                <h3 className="compactListItem__title">Acceso</h3>
                <p className="compactListItem__text">
                  No podrás volver a entrar con esta cuenta.
                </p>
              </div>
            </div>
          </div>

          <div className="formActions">
            <button type="button" className="btn btn--ghost" onClick={() => nav(-1)}>
              Volver
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setStep(2)}
            >
              Continuar
            </button>
          </div>
        </section>
      ) : step === 2 ? (
        <section className="sectionBlock">
          <div className="formCard">
            <h3 className="cardTitle">Confirmación</h3>
            <p className="cardSubtitle">
              Escribe <strong>ELIMINAR</strong> para continuar.
            </p>

            <div className="formRow">
              <label htmlFor="delete-account-confirm">Texto de confirmación</label>
              <input
                id="delete-account-confirm"
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="ELIMINAR"
                autoComplete="off"
                disabled={loading}
              />
            </div>
          </div>

          <div className="formActions">
            <button type="button" className="btn btn--ghost" onClick={() => setStep(1)}>
              Atrás
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setStep(3)}
              disabled={!canContinue || loading}
            >
              Continuar
            </button>
          </div>
        </section>
      ) : (
        <section className="sectionBlock">
          <div className="stateCard">
            <h3 className="stateCard__title">Último aviso</h3>
            <p className="stateCard__text">
              Esta acción es definitiva. Se borrarán todos tus datos del backend y de Supabase. No podrás recuperar la cuenta, pero podrás registrarte de nuevo con el mismo email.
            </p>
          </div>

          <div className="formActions">
            <button type="button" className="btn btn--ghost" onClick={() => setStep(2)}>
              Atrás
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Eliminando..." : "Eliminar cuenta"}
            </button>
          </div>
        </section>
      )}
    </section>
  );
}
