import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";

export default function DeleteAccountPage() {
  const { me, deleteAccount, logout } = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  const [step, setStep] = useState(1); // 1 info, 2 confirm, 3 final
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const canContinue = useMemo(() => text.trim().toUpperCase() === "ELIMINAR", [text]);

  async function handleDelete() {
    if (loading) return;
    setLoading(true);
    try {
      await deleteAccount(); // backend: DELETE /me (o lo que implementemos)
      // higiene local por si acaso
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
    <div className="settings-page">
      <div className="settings-wrap">
        {/* Hero */}
        <div className="st-hero">
          <div className="st-hero__left">
            <div className="st-hero__txt">
              <div className="st-title">Eliminar cuenta</div>
              <div className="st-sub">{me?.email || "Centro de cuentas"}</div>
            </div>
          </div>
        </div>

        <div className="st-section">
          <div className="st-sectionHead">
            <div>
              <div className="st-sectionTitle">
                {step === 1 ? "Antes de continuar" : step === 2 ? "Confirmación" : "Eliminar definitivamente"}
              </div>
              <div className="st-sectionHint">
                {step === 1
                  ? "Revisa el impacto"
                  : step === 2
                  ? "Escribe la palabra exacta"
                  : "Este paso es irreversible"}
              </div>
            </div>
          </div>

          <div className="st-list">
            {step === 1 ? (
              <>
                <button type="button" className="st-row" disabled>
                  <div className="st-row__left">
                    <div className="st-row__title">Se borrará tu perfil</div>
                    <div className="st-row__sub">Nombre, bio, links, avatar…</div>
                  </div>
                </button>

                <button type="button" className="st-row" disabled>
                  <div className="st-row__left">
                    <div className="st-row__title">Saldrás de grupos y quedadas</div>
                    <div className="st-row__sub">Tus participaciones se eliminarán</div>
                  </div>
                </button>

                <button type="button" className="st-row" disabled>
                  <div className="st-row__left">
                    <div className="st-row__title">Quedadas creadas</div>
                    <div className="st-row__sub">
                      Si tiene participantes, ellos la seguirán viendo; se eliminará al finalizar
                    </div>
                  </div>
                </button>

                <div className="st-actions">
                  <button className="st-btn" type="button" onClick={() => nav(-1)} disabled={loading}>
                    Volver
                  </button>
                  <button className="st-btn btn-danger" type="button" onClick={() => setStep(2)} disabled={loading}>
                    Continuar
                  </button>
                </div>
              </>
            ) : step === 2 ? (
              <>
                <label className="auth-label">
                  Escribe <b>ELIMINAR</b> para continuar
                  <input
                    className="auth-input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="ELIMINAR"
                    autoComplete="off"
                    disabled={loading}
                  />
                </label>

                <div className="st-actions">
                  <button className="st-btn" type="button" onClick={() => setStep(1)} disabled={loading}>
                    Atrás
                  </button>
                  <button
                    className="st-btn btn-danger"
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!canContinue || loading}
                  >
                    Continuar
                  </button>
                </div>
              </>
            ) : (
              <>
                <button type="button" className="st-row" disabled>
                  <div className="st-row__left">
                    <div className="st-row__title">Último aviso</div>
                    <div className="st-row__sub">No podrás recuperar la cuenta</div>
                  </div>
                </button>

                <div className="st-actions">
                  <button className="st-btn" type="button" onClick={() => setStep(2)} disabled={loading}>
                    Atrás
                  </button>
                  <button className="st-btn btn-danger" type="button" onClick={handleDelete} disabled={loading}>
                    {loading ? "Eliminando…" : "Eliminar cuenta"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
