import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

export default function AuthPage({ defaultTab = "login" }) {
  const { login, register, isAuthed } = useAuth();
  const location = useLocation();
  const nav = useNavigate();

  const initialTab = useMemo(() => {
    if (location.pathname === "/register") return "register";
    if (location.pathname === "/login") return "login";
    return defaultTab;
  }, [defaultTab, location.pathname]);

  const [tab, setTab] = useState(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    if (location.pathname === "/register") setTab("register");
    else setTab("login");
  }, [location.pathname]);

  useEffect(() => {
    setEmail("");
    setPassword("");
    setPassword2("");
    setMsg({ type: "", text: "" });
  }, [location.pathname, tab]);

  function resetMsg() {
    setMsg({ type: "", text: "" });
  }

  function setError(text) {
    setMsg({ type: "error", text });
  }

  function setSuccess(text) {
    setMsg({ type: "success", text });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    resetMsg();

    const cleanEmail = email.trim();

    if (!isValidEmail(cleanEmail)) {
      return setError("Introduce un email válido.");
    }

    if (!password) {
      return setError("Introduce contraseña.");
    }

    if (password.length < 4) {
      return setError("La contraseña debe tener al menos 4 caracteres.");
    }

    if (tab === "register") {
      if (!password2) {
        return setError("Repite la contraseña.");
      }

      if (password !== password2) {
        return setError("Las contraseñas no coinciden.");
      }
    }

    setLoading(true);

    try {
      if (tab === "login") {
        await login(cleanEmail, password);
        setSuccess("Acceso correcto.");
        nav("/perfil", { replace: true });
        return;
      }

      await register(cleanEmail, password);
      setSuccess("Cuenta creada.");
      nav("/onboarding", {
        replace: true,
        state: { fromRegister: true, registeredEmail: cleanEmail },
      });
    } catch (err) {
      const message = err?.message?.toLowerCase?.() || "";

      if (message.includes("invalid")) {
        setError("Email o contraseña incorrectos.");
      } else if (
        message.includes("network") ||
        message.includes("conectar") ||
        message.includes("fetch")
      ) {
        setError("No se puede conectar con el servidor.");
      } else {
        setError(
          err?.message ||
            (tab === "login"
              ? "Error al iniciar sesión."
              : "Error al registrar la cuenta.")
        );
      }
    } finally {
      setLoading(false);
    }
  }

  if (isAuthed) {
    return <Navigate to="/perfil" replace />;
  }

  const isLogin = tab === "login";

  return (
    <section className="authSimple">
      <div className="authSimple__shell">
        <div className="authSimple__layout">
          <div className="authSimple__intro">
            <span className="app-kicker">App social deportiva</span>
            <h1 className="authSimple__title">
              {isLogin
                ? "Accede a tu comunidad deportiva."
                : "Crea tu cuenta y entra sin fricción."}
            </h1>
            <p className="authSimple__subtitle">
              Grupos, quedadas, mensajes y perfil deportivo en una interfaz más limpia,
              rápida y consistente.
            </p>
          </div>

          <div className="authSimple__panel app-section">
            <div className="authSimple__tabs" role="tablist" aria-label="Autenticación">
              <button
                type="button"
                role="tab"
                aria-selected={isLogin}
                className={`authSimple__tab${isLogin ? " authSimple__tab--active" : ""}`}
                onClick={() => {
                  resetMsg();
                  setTab("login");
                  nav("/login", { replace: true });
                }}
                disabled={loading}
              >
                Login
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={!isLogin}
                className={`authSimple__tab${!isLogin ? " authSimple__tab--active" : ""}`}
                onClick={() => {
                  resetMsg();
                  setTab("register");
                  nav("/register", { replace: true });
                }}
                disabled={loading}
              >
                Registro
              </button>
            </div>

            <div className="authSimple__head">
              <h2 className="authSimple__panelTitle">
                {isLogin ? "Bienvenido" : "Nueva cuenta"}
              </h2>
              <p className="authSimple__panelText">
                {isLogin
                  ? "Accede a tu perfil, tus grupos y tus conversaciones."
                  : "Después del registro completarás tu perfil antes de entrar en la app."}
              </p>
            </div>

            <form className="authSimple__form" onSubmit={handleSubmit}>
              <div className="app-field">
                <label className="app-label" htmlFor="auth-email">
                  Email
                </label>
                <input
                  id="auth-email"
                  className="app-input"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="app-field">
                <label className="app-label" htmlFor="auth-password">
                  Contraseña
                </label>
                <input
                  id="auth-password"
                  className="app-input"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  placeholder="Introduce tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              {!isLogin ? (
                <div className="app-field">
                  <label className="app-label" htmlFor="auth-password-repeat">
                    Repite contraseña
                  </label>
                  <input
                    id="auth-password-repeat"
                    className="app-input"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repite tu contraseña"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    disabled={loading}
                  />
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

              <button
                type="submit"
                className="app-button app-button--primary app-button--lg app-button--block"
                disabled={loading}
              >
                {loading
                  ? "Procesando…"
                  : isLogin
                    ? "Entrar"
                    : "Crear cuenta"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
