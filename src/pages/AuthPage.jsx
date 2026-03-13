import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function FeaturePill({ children, variant = "neutral" }) {
  const map = {
    neutral: "",
    primary: " app-badge--primary",
    success: " app-badge--success",
    warning: " app-badge--warning",
    danger: " app-badge--danger",
  };

  return <span className={`app-badge${map[variant] || ""}`}>{children}</span>;
}

function BenefitItem({ badge, badgeVariant = "primary", title, copy }) {
  return (
    <div className="authPage__benefit">
      <FeaturePill variant={badgeVariant}>{badge}</FeaturePill>
      <div className="authPage__benefitCopy">
        <strong>{title}</strong>
        <p>{copy}</p>
      </div>
    </div>
  );
}

function AuthMetric({ value, label }) {
  return (
    <div className="authPage__metric">
      <strong className="authPage__metricValue">{value}</strong>
      <span className="authPage__metricLabel">{label}</span>
    </div>
  );
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
        setEmail("");
        setPassword("");
        setPassword2("");
        nav("/perfil", { replace: true });
        return;
      }

      await register(cleanEmail, password);
      setSuccess("Cuenta creada. Vamos a completar tu perfil.");
      setEmail("");
      setPassword("");
      setPassword2("");

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
    <section className="authPage">
      <div className="authPage__shell">
        <div className="authPage__layout">
          <div className="authPage__brand surface-panel">
            <div className="authPage__brandTop">
              <span className="app-kicker">App social deportiva</span>

              <h1 className="authPage__title">
                Encuentra gente para correr, rodar y salir a la montaña con una
                experiencia realmente premium.
              </h1>

              <p className="authPage__subtitle">
                Arquitectura móvil-primero, flujo social limpio y una base de producto
                pensada para grupos, mensajes, quedadas y perfil deportivo desde el
                primer minuto.
              </p>
            </div>

            <div className="authPage__pills">
              <FeaturePill variant="primary">Grupos y meetups</FeaturePill>
              <FeaturePill variant="success">Mensajes directos</FeaturePill>
              <FeaturePill variant="warning">Actividad en tiempo real</FeaturePill>
              <FeaturePill>Perfil deportivo</FeaturePill>
            </div>

            <div className="authPage__benefits">
              <BenefitItem
                badge="Mobile-first"
                badgeVariant="primary"
                title="Interfaz clara y rápida"
                copy="Diseño pensado como producto social real, con navegación simple, jerarquía visual limpia y foco total en comunidad y actividad."
              />

              <BenefitItem
                badge="Onboarding"
                badgeVariant="success"
                title="Alta y perfil en pocos pasos"
                copy="Registro directo y continuación natural hacia la personalización del perfil para entrar en la app con tu identidad deportiva lista."
              />

              <BenefitItem
                badge="Escalable"
                badgeVariant="warning"
                title="Base preparada para crecer"
                copy="Sistema visual consistente, superficies reutilizables y arquitectura orientada a rendimiento y expansión de features."
              />
            </div>

            <div className="authPage__metrics">
              <AuthMetric value="1" label="Cuenta para entrar" />
              <AuthMetric value="2" label="Perfil para personalizar" />
              <AuthMetric value="3" label="Comunidad para activar" />
            </div>
          </div>

          <div className="authPage__panel surface-panel">
            <div className="authPage__panelHead">
              <span className="authPage__panelEyebrow">
                {isLogin ? "Acceso" : "Alta de usuario"}
              </span>

              <h2 className="authPage__panelTitle">
                {isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta"}
              </h2>

              <p className="authPage__panelText">
                {isLogin
                  ? "Accede a tu perfil, tus grupos y tus conversaciones desde una interfaz más limpia y rápida."
                  : "Regístrate y continúa directamente al onboarding para dejar tu perfil listo antes de entrar a la app."}
              </p>
            </div>

            <div className="authPage__tabs" role="tablist" aria-label="Autenticación">
              <button
                type="button"
                role="tab"
                aria-selected={isLogin}
                className={`authPage__tab${isLogin ? " authPage__tab--active" : ""}`}
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
                className={`authPage__tab${!isLogin ? " authPage__tab--active" : ""}`}
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

            <form className="authPage__form" onSubmit={handleSubmit}>
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
                  className={`authPage__message ${
                    msg.type === "error"
                      ? "authPage__message--error"
                      : msg.type === "success"
                        ? "authPage__message--success"
                        : ""
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
                    ? "Entrar en la app"
                    : "Crear cuenta y continuar"}
              </button>

              <p className="authPage__footnote">
                {isLogin
                  ? "Si tu perfil no está completo, te llevaremos automáticamente al onboarding."
                  : "Después del registro completarás tu identidad deportiva antes de entrar a la app."}
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
