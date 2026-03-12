import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function FeaturePill({ children }) {
  return <span className="authFeaturePill">{children}</span>;
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
  const [emailRO, setEmailRO] = useState(true);

  useEffect(() => {
    if (location.pathname === "/register") setTab("register");
    else setTab("login");
  }, [location.pathname]);

  useEffect(() => {
    setEmail("");
    setPassword("");
    setPassword2("");
    setEmailRO(true);
    setMsg({ type: "", text: "" });
    const t = setTimeout(() => setEmail(""), 0);
    return () => clearTimeout(t);
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
        setEmail("");
        setPassword("");
        setPassword2("");
        setEmailRO(true);
        nav("/perfil", { replace: true });
        return;
      }

      await register(cleanEmail, password);
      setSuccess("Cuenta creada. Vamos a completar tu perfil.");
      setEmail("");
      setPassword("");
      setPassword2("");
      setEmailRO(true);

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
    <div className="authScreen">
      <div className="authLayout">
        <section className="authHeroCard">
          <div className="authHeroGlow" />
          <div className="authKicker">App social deportiva</div>
          <h1 className="authTitle">
            Encuentra gente para correr, rodar y salir a la montaña.
          </h1>
          <p className="authSubtitle">
            Una experiencia pensada para quedar, descubrir grupos, hablar por mensajes y
            crear una identidad deportiva sólida desde el primer minuto.
          </p>

          <div className="authFeatureGrid">
            <FeaturePill>Grupos y meetups</FeaturePill>
            <FeaturePill>Mensajes directos</FeaturePill>
            <FeaturePill>Notificaciones en tiempo real</FeaturePill>
            <FeaturePill>Perfil deportivo completo</FeaturePill>
          </div>

          <div className="authHeroStats">
            <div className="authHeroStat">
              <strong>Mobile-first</strong>
              <span>Interfaz pensada como app social real</span>
            </div>
            <div className="authHeroStat">
              <strong>Onboarding rápido</strong>
              <span>Cuenta, verificación y perfil en pocos pasos</span>
            </div>
          </div>
        </section>

        <section className="authCard">
          <div className="authTabs" role="tablist" aria-label="Autenticación">
            <button
              type="button"
              className={`authTabs__item ${isLogin ? "is-active" : ""}`}
              onClick={() => {
                resetMsg();
                setTab("login");
              }}
              disabled={loading}
            >
              Login
            </button>

            <button
              type="button"
              className={`authTabs__item ${!isLogin ? "is-active" : ""}`}
              onClick={() => {
                resetMsg();
                setTab("register");
              }}
              disabled={loading}
            >
              Registro
            </button>
          </div>

          <div className="authCard__header">
            <div className="authKicker">{isLogin ? "Acceso" : "Alta de usuario"}</div>
            <h2 className="authCard__title">
              {isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta"}
            </h2>
            <p className="authCard__copy">
              {isLogin
                ? "Accede a tu perfil, tus grupos y tus conversaciones."
                : "Regístrate y continúa directamente al onboarding para dejar tu perfil listo."}
            </p>
          </div>

          <form className="authForm" onSubmit={handleSubmit}>
            <input
              className="authTrapInput"
              type="email"
              tabIndex={-1}
              autoComplete="username"
              value=""
              readOnly
              aria-hidden="true"
            />

            <label className="field">
              <span className="field__label">Email</span>
              <input
                className="field__input"
                type="email"
                placeholder="tu@email.com"
                autoComplete="email"
                readOnly={emailRO}
                onFocus={() => setEmailRO(false)}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </label>

            <label className="field">
              <span className="field__label">Contraseña</span>
              <input
                className="field__input"
                type="password"
                placeholder="Introduce tu contraseña"
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </label>

            {!isLogin && (
              <label className="field">
                <span className="field__label">Repite contraseña</span>
                <input
                  className="field__input"
                  type="password"
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  disabled={loading}
                />
              </label>
            )}

            {msg.text && (
              <div className={`statusMessage statusMessage--${msg.type || "info"}`}>
                {msg.text}
              </div>
            )}

            <button className="btn btn--primary btn--block" type="submit" disabled={loading}>
              {loading
                ? "Procesando…"
                : isLogin
                ? "Entrar en la app"
                : "Crear cuenta y continuar"}
            </button>
          </form>

          <div className="authFootNote">
            {isLogin
              ? "Si tu perfil no está completo, te llevaremos automáticamente al onboarding."
              : "Después del registro verificarás tu email y completarás tu identidad deportiva."}
          </div>
        </section>
      </div>
    </div>
  );
}
