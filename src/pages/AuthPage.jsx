import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

const shellInlineStyle = {
  width: "100%",
  maxWidth: "460px",
  margin: "0 auto",
  display: "grid",
  gap: "16px",
};

const helperCardStyle = {
  borderRadius: "20px",
  padding: "14px 16px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
};

const helperTitleStyle = {
  fontSize: "13px",
  fontWeight: 800,
  color: "var(--textStrong)",
  marginBottom: "4px",
};

const helperTextStyle = {
  fontSize: "13px",
  color: "var(--muted)",
  lineHeight: 1.45,
};

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

  function setInfo(text) {
    setMsg({ type: "info", text });
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
    <div className="auth-page-bg">
      <div className="page" style={{ paddingBottom: 24 }}>
        <div className="auth-shell" style={shellInlineStyle}>
          <div className="auth-card">
            <div className="auth-head">
              <div className="auth-kicker">
                {isLogin ? "Acceso" : "Crear cuenta"}
              </div>
              <h1 style={{ margin: 0 }}>
                {isLogin ? "Iniciar sesión" : "Empieza tu perfil deportivo"}
              </h1>
              <p className="auth-copy" style={{ margin: 0 }}>
                {isLogin
                  ? "Accede a tu perfil, grupos, mensajes y actividades."
                  : "Crea tu cuenta y pasa directamente al onboarding para dejar listo tu perfil."}
              </p>
            </div>

            <div className="neutral-tabs" role="tablist" aria-label="Autenticación">
              <button
                type="button"
                className={`neutral-tab ${isLogin ? "active" : ""}`}
                onClick={() => {
                  resetMsg();
                  setTab("login");
                  setInfo("Introduce tu email y contraseña.");
                }}
                disabled={loading}
              >
                Login
              </button>

              <button
                type="button"
                className={`neutral-tab ${!isLogin ? "active" : ""}`}
                onClick={() => {
                  resetMsg();
                  setTab("register");
                  setInfo("Crea tu cuenta y continúa con el onboarding.");
                }}
                disabled={loading}
              >
                Registro
              </button>
            </div>

            <form className="stack auth-form" onSubmit={handleSubmit}>
              <input
                className="auth-trapInput"
                type="email"
                tabIndex={-1}
                autoComplete="username"
                value=""
                readOnly
                aria-hidden="true"
              />

              <label className="auth-label">
                <span className="auth-labelText">Email</span>
                <input
                  className="auth-input"
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

              <label className="auth-label">
                <span className="auth-labelText">Contraseña</span>
                <input
                  className="auth-input"
                  type="password"
                  placeholder="Introduce tu contraseña"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </label>

              {!isLogin && (
                <label className="auth-label">
                  <span className="auth-labelText">Repite contraseña</span>
                  <input
                    className="auth-input"
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
                <div className={`auth-msg auth-msg--${msg.type || "info"}`}>
                  {msg.text}
                </div>
              )}

              <button className="auth-primary" type="submit" disabled={loading}>
                {loading
                  ? "Enviando…"
                  : isLogin
                  ? "Entrar"
                  : "Crear cuenta y continuar"}
              </button>
            </form>
          </div>

          <div style={helperCardStyle}>
            <div style={helperTitleStyle}>
              {isLogin ? "Qué ocurre después" : "Siguiente paso"}
            </div>
            <div style={helperTextStyle}>
              {isLogin
                ? "Si tu perfil todavía no está completo, la app te llevará automáticamente al onboarding."
                : "Tras crear la cuenta entrarás directamente al onboarding para verificar tu email y completar tu identidad deportiva."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
