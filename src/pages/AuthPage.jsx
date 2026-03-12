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

  useEffect(() => {
    if (location.pathname === "/register") setTab("register");
    else setTab("login");
  }, [location.pathname]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [emailRO, setEmailRO] = useState(true);

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

  useEffect(() => {
    setEmail("");
    setPassword("");
    setPassword2("");
    setEmailRO(true);
    resetMsg();

    const t = setTimeout(() => setEmail(""), 0);
    return () => clearTimeout(t);
  }, [location.pathname]);

  useEffect(() => {
    setEmail("");
    setPassword("");
    setPassword2("");
    setEmailRO(true);
    resetMsg();

    const t = setTimeout(() => setEmail(""), 0);
    return () => clearTimeout(t);
  }, [tab]);

  async function handleSubmit(e) {
    e.preventDefault();
    resetMsg();

    const e1 = email.trim();

    if (!isValidEmail(e1)) return setError("Introduce un email válido.");
    if (!password) return setError("Introduce contraseña.");
    if (password.length < 4) return setError("La contraseña debe tener al menos 4 caracteres.");

    if (tab === "register") {
      if (!password2) return setError("Repite la contraseña.");
      if (password !== password2) return setError("Las contraseñas no coinciden.");
    }

    setLoading(true);
    try {
      if (tab === "login") {
        await login(e1, password);
        setSuccess("✔ Login correcto");

        setEmail("");
        setPassword("");
        setPassword2("");
        setEmailRO(true);

        nav("/perfil");
        return;
      }

      await register(e1, password);
      setSuccess("✔ Cuenta creada");

      setEmail("");
      setPassword("");
      setPassword2("");
      setEmailRO(true);

      nav("/onboarding");
    } catch (e2) {
      const m = e2?.message?.toLowerCase?.() || "";
      if (m.includes("invalid")) setError("Email o contraseña incorrectos");
      else if (m.includes("network") || m.includes("conectar") || m.includes("fetch")) {
        setError("No se puede conectar con el servidor");
      } else {
        setError(e2?.message || (tab === "login" ? "Error al iniciar sesión" : "Error al registrar"));
      }
    } finally {
      setLoading(false);
    }
  }

  if (isAuthed) {
    return <Navigate to="/perfil" replace />;
  }

  return (
    <div className="auth-page-bg">
      <div className="auth-shell">
        <div className="auth-card neutral-card">
          <div className="auth-head">
            <h2 className="m0">{tab === "login" ? "Iniciar sesión" : "Crear cuenta"}</h2>
            <p className="auth-copy m0">
              {tab === "login"
                ? "Accede a tu perfil, publicaciones y actividades."
                : "Crea tu cuenta y completa tu perfil en pocos pasos."}
            </p>
          </div>

          <div className="neutral-tabs">
            <button
              type="button"
              className={`neutral-tab ${tab === "login" ? "active" : ""}`}
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
              className={`neutral-tab ${tab === "register" ? "active" : ""}`}
              onClick={() => {
                resetMsg();
                setTab("register");
                setInfo("Crea tu cuenta y entra directamente.");
              }}
              disabled={loading}
            >
              Registro
            </button>
          </div>

          <form
            className="stack auth-form"
            onSubmit={handleSubmit}
            autoComplete="off"
            key={`${tab}-${location.pathname}`}
          >
            <input
              type="text"
              name="fakeusernameremembered"
              autoComplete="username"
              tabIndex={-1}
              aria-hidden="true"
              className="auth-trapInput"
            />
            <input
              type="password"
              name="fakepasswordremembered"
              autoComplete="current-password"
              tabIndex={-1}
              aria-hidden="true"
              className="auth-trapInput"
            />

            <label className="auth-label">
              <span className="auth-labelText">Email</span>
              <input
                className="auth-input"
                type="email"
                name={`username_${tab}`}
                placeholder="user@example.com"
                value={email}
                inputMode="email"
                autoComplete="off"
                readOnly={emailRO}
                onFocus={() => setEmailRO(false)}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </label>

            <label className="auth-label">
              <span className="auth-labelText">Contraseña</span>
              <input
                className="auth-input"
                type="password"
                name={`password_${tab}`}
                placeholder="**********"
                value={password}
                autoComplete={tab === "login" ? "current-password" : "new-password"}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </label>

            {tab === "register" && (
              <label className="auth-label">
                <span className="auth-labelText">Repite contraseña</span>
                <input
                  className="auth-input"
                  type="password"
                  name="passwordConfirm"
                  placeholder="**********"
                  value={password2}
                  autoComplete="new-password"
                  onChange={(e) => setPassword2(e.target.value)}
                  disabled={loading}
                />
              </label>
            )}

            {msg.text && (
              <div className={`auth-msg ${msg.type}`} role="status" aria-live="polite">
                {msg.text}
              </div>
            )}

            <button className="auth-primary" disabled={loading}>
              {loading ? "Enviando…" : tab === "login" ? "Entrar" : "Registrarme"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}