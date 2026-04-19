import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateSupabasePassword } from "../services/auth";
import { supabase } from "../lib/supabase";
import appLogo from "../assets/Logo.png";

export default function ResetPasswordPage() {
  const nav = useNavigate();

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Listen for the PASSWORD_RECOVERY event from Supabase
  useEffect(() => {
    if (!supabase) return;

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Also check if we already have a session (user clicked the link)
    supabase.auth.getSession().then(({ data: sessionData }) => {
      if (sessionData?.session) {
        setReady(true);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  function setError(text) {
    setMsg({ type: "error", text });
  }

  function setSuccess(text) {
    setMsg({ type: "success", text });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!password) {
      return setError("Introduce la nueva contraseña.");
    }

    if (password.length < 6) {
      return setError("La contraseña debe tener al menos 6 caracteres.");
    }

    if (!password2) {
      return setError("Repite la nueva contraseña.");
    }

    if (password !== password2) {
      return setError("Las contraseñas no coinciden.");
    }

    setLoading(true);

    try {
      await updateSupabasePassword(password);
      setSuccess("Contraseña actualizada correctamente. Redirigiendo...");

      setTimeout(() => {
        nav("/login", { replace: true });
      }, 2000);
    } catch (err) {
      const message = err?.message?.toLowerCase?.() || "";
      if (message.includes("same password") || message.includes("should be different")) {
        setError("La nueva contraseña debe ser diferente a la anterior.");
      } else if (message.includes("session") || message.includes("token")) {
        setError("El enlace ha expirado. Solicita uno nuevo desde la página de inicio de sesión.");
      } else {
        setError(err?.message || "No se pudo actualizar la contraseña.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="appChrome authChrome">
      <header className="appTopbar">
        <div className="appTopbar__inner">
          <img src={appLogo} alt="RunVibe" className="appTopbar__logo" />
        </div>
      </header>

      <div className="appChrome__frame authChrome__frame">
        <main className="appChrome__main">
          <div className="appChrome__content">
            <section className="page authPage">
              <section className="authIntro">
                <div className="authIntro__title">Restablecer contraseña</div>
                <div className="authIntro__subtitle">
                  {ready
                    ? "Elige tu nueva contraseña."
                    : "Verificando el enlace de recuperación..."}
                </div>
              </section>

              <section className="sectionBlock authFormShell">
                {ready ? (
                  <form className="formCard authFormCard" onSubmit={handleSubmit}>
                    <div className="formRow authFormRow">
                      <label>Nueva contraseña</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        placeholder=""
                        autoFocus
                      />
                    </div>

                    <div className="formRow authFormRow">
                      <label>Repite la contraseña</label>
                      <input
                        type="password"
                        value={password2}
                        onChange={(e) => setPassword2(e.target.value)}
                        disabled={loading}
                        placeholder=""
                      />
                    </div>

                    {msg.text && (
                      <div className={`stateCard authStateCard authStateCard--${msg.type}`}>
                        <p>{msg.text}</p>
                      </div>
                    )}

                    <div className="formActions authFormActions">
                      <button
                        type="submit"
                        className="btn btn--primary authSubmitBtn"
                        disabled={loading}
                      >
                        {loading ? "Actualizando..." : "Cambiar contraseña"}
                      </button>
                    </div>

                    <div className="authForgotLink">
                      <button
                        type="button"
                        className="authForgotLink__btn"
                        onClick={() => nav("/login", { replace: true })}
                      >
                        Volver al inicio de sesión
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="formCard authFormCard">
                    <div className="stateCard authStateCard authStateCard--error">
                      <p>
                        El enlace no es válido o ha expirado. Solicita uno nuevo desde la
                        página de inicio de sesión.
                      </p>
                    </div>
                    <div className="authForgotLink">
                      <button
                        type="button"
                        className="authForgotLink__btn"
                        onClick={() => nav("/login", { replace: true })}
                      >
                        Ir al inicio de sesión
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
