import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getPreferredLoginIdentifier, isOnboardingComplete } from "../lib/userContract";
import appLogo from "../assets/Logo.png";
import appIcon from "../assets/Icono.png";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function LoaderScreen() {
  return (
    <section className="page">
      <div className="stateCard">
        <h3 className="stateCard__title">Cargando</h3>
        <p className="stateCard__text">Estamos preparando tu sesión.</p>
      </div>
    </section>
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
      return setError(
        tab === "login" ? "Introduce tu email o usuario." : "Introduce un email válido."
      );
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
    return <LoaderScreen />;
  }

  if (isAuthed && meReady) {
    return <Navigate to={isOnboardingComplete(me) ? "/" : "/onboarding"} replace />;
  }

  const isLogin = tab === "login";

  return (
    <section className="page authPage">
      <section className="sectionBlock authBrandCard">
        <div className="authBrandCard__row">
          <img src={appIcon} alt="RunVibe" className="authBrandCard__icon" />
          <img src={appLogo} alt="RunVibe" className="authBrandCard__logo" />
        </div>
      </section>

      <section className="sectionBlock">
        <div className="app-section-header">
          <div>
            <div className="app-section-header__title">
              {isLogin ? "Accede a tu cuenta" : "Crea tu cuenta"}
            </div>
            <div className="app-section-header__subtitle">
              {isLogin
                ? "Entra con tu email o usuario para continuar."
                : "Regístrate y completa tu perfil después."}
            </div>
          </div>
        </div>
      </section>

      <section className="sectionBlock">
        <div className="tabBar" role="tablist" aria-label="Autenticación">
          <button
            type="button"
            role="tab"
            aria-selected={isLogin}
            className={`tabBar__item${isLogin ? " tabBar__item--active" : ""}`}
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
            className={`tabBar__item${!isLogin ? " tabBar__item--active" : ""}`}
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
      </section>

      <section className="sectionBlock">
        <form className="formCard" onSubmit={handleSubmit}>
          <div className="formRow">
            <label htmlFor="auth-identifier">
              {isLogin ? "Email o usuario" : "Email"}
            </label>
            <input
              id="auth-identifier"
              type={isLogin ? "text" : "email"}
              autoComplete={isLogin ? "username" : "email"}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={loading}
              placeholder={isLogin ? "email o @usuario" : "tu@email.com"}
            />
          </div>

          <div className="formRow">
            <label htmlFor="auth-password">Contraseña</label>
            <input
              id="auth-password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {!isLogin ? (
            <div className="formRow">
              <label htmlFor="auth-password-repeat">Repite contraseña</label>
              <input
                id="auth-password-repeat"
                type="password"
                autoComplete="new-password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                disabled={loading}
              />
            </div>
          ) : null}

          {msg.text ? (
            <div className="stateCard" style={{ padding: 14 }}>
              <h3 className="stateCard__title">
                {msg.type === "error" ? "Revisa los datos" : "Todo correcto"}
              </h3>
              <p className="stateCard__text">{msg.text}</p>
            </div>
          ) : null}

          <div className="formActions">
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? "Procesando..." : isLogin ? "Entrar" : "Crear cuenta"}
            </button>
          </div>
        </form>
      </section>
    </section>
  );
}
