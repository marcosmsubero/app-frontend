import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getPreferredLoginIdentifier, isOnboardingComplete } from "../lib/userContract";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function AuthPageLoader() {
  return (
    <div className="app-loader-screen">
      <div className="app-loader-screen__inner">
        <div className="app-loader-screen__spinner" />
        <div className="app-loader-screen__label">Cargando…</div>
      </div>
    </div>
  );
}

export default function AuthPage({ defaultTab = "login" }) {
  const { login, register, isAuthed, me, meReady } = useAuth();
  const location = useLocation();
  const nav = useNavigate();

  const initialTab = useMemo(() => {
    if (location.pathname === "/register") return "register";
    if (location.pathname === "/login") return "login";
    return defaultTab;
  }, [defaultTab, location.pathname]);

  const [tab, setTab] = useState(initialTab);
  const [identifier, setIdentifier] = useState(location.state?.registeredEmail || "");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({
    type: location.state?.emailConfirmationPending ? "success" : "",
    text: location.state?.emailConfirmationPending
      ? "Cuenta creada. Revisa tu email, confirma la cuenta y después inicia sesión."
      : "",
  });

  useEffect(() => {
    if (location.pathname === "/register") setTab("register");
    else setTab("login");
  }, [location.pathname]);

  useEffect(() => {
    setPassword("");
    setPassword2("");
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

    const cleanIdentifier = identifier.trim();

    if (!cleanIdentifier) {
      return setError(tab === "login" ? "Introduce tu email o usuario." : "Introduce un email válido.");
    }

    if (tab === "login") {
      const parsed = getPreferredLoginIdentifier(cleanIdentifier);
      if (parsed.type === "empty") {
        return setError("Introduce tu email o usuario.");
      }
    } else if (!isValidEmail(cleanIdentifier)) {
      return setError("Introduce un email válido.");
    }

    if (!password) {
      return setError("Introduce contraseña.");
    }

    if (password.length < 6) {
      return setError("La contraseña debe tener al menos 6 caracteres.");
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
        await login(cleanIdentifier, password);
        setSuccess("Acceso correcto.");
        nav("/", { replace: true });
        return;
      }

      const result = await register(cleanIdentifier, password);

      if (result?.requiresEmailConfirmation) {
        nav("/login", {
          replace: true,
          state: {
            registeredEmail: cleanIdentifier,
            emailConfirmationPending: true,
          },
        });
        return;
      }

      setSuccess("Cuenta creada. Continúa con tu onboarding.");
      nav("/onboarding", {
        replace: true,
        state: { fromRegister: true, registeredEmail: cleanIdentifier },
      });
    } catch (err) {
      const message = err?.message?.toLowerCase?.() || "";

      if (message.includes("invalid login credentials")) {
        setError("Usuario/email o contraseña incorrectos.");
      } else if (message.includes("email not confirmed")) {
        setError("Debes confirmar tu email antes de iniciar sesión.");
      } else if (message.includes("usuario no encontrado")) {
        setError("Ese usuario no existe.");
      } else if (message.includes("user already registered")) {
        setError("Ese email ya está registrado.");
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

  if (isAuthed && !meReady) {
    return <AuthPageLoader />;
  }

  if (isAuthed && meReady) {
    return <Navigate to={isOnboardingComplete(me) ? "/" : "/onboarding"} replace />;
  }

  const isLogin = tab === "login";

  return (
    <section className="authSimple">
      <div className="authSimple__shell">
        <div className="authSimple__layout">
          <div className="authSimple__intro">
            <h1 className="authSimple__title">
              {isLogin
                ? "Accede a tu comunidad runner"
                : "Crea tu cuenta y accede a nuestra comunidad runner"}
            </h1>
            <p className="authSimple__subtitle">
              Grupos, quedadas y viajes en una interfaz rápida y consistente.
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
                {isLogin ? "Bienvenid@" : "Nueva cuenta"}
              </h2>
              <p className="authSimple__panelText">
                {isLogin
                  ? "Accede a tu perfil, tus grupos y tus planes de running."
                  : "Tu cuenta quedará preparada para completar el onboarding runner."}
              </p>
            </div>

            <form className="authSimple__form" onSubmit={handleSubmit}>
              <div className="app-field">
                <label className="app-label" htmlFor="auth-identifier">
                  {isLogin ? "Email o usuario" : "Email"}
                </label>
                <input
                  id="auth-identifier"
                  className="app-input"
                  type={isLogin ? "text" : "email"}
                  autoComplete={isLogin ? "username" : "email"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                  placeholder={isLogin ? "email o @usuario" : "tu@email.com"}
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
                {loading ? "Procesando…" : isLogin ? "Entrar" : "Crear cuenta"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
