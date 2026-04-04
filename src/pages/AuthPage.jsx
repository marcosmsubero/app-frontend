import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { clearDraftSnapshot, readDraftSnapshot, useFormDraft } from "../hooks/useFormDraft";
import { getPreferredLoginIdentifier, isOnboardingComplete } from "../lib/userContract";
import appLogo from "../assets/Logo.png";
import heroImage from "../assets/PhotoAuth.png";

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

function getDraftKey(pathname, fallbackMode) {
  if (pathname === "/register") return "auth:register";
  if (pathname === "/login") return "auth:login";
  return fallbackMode === "register" ? "auth:register" : "auth:login";
}

function getInitialDraft(pathname, fallbackMode, locationState) {
  const draftKey = getDraftKey(pathname, fallbackMode);
  const fallbackIdentifier = locationState?.registeredEmail || "";
  const snapshot = readDraftSnapshot(
    draftKey,
    {
      identifier: fallbackIdentifier,
      password: "",
      password2: "",
    },
    1
  );

  return {
    draftKey,
    values: {
      identifier: snapshot?.identifier ?? fallbackIdentifier,
      password: snapshot?.password ?? "",
      password2: snapshot?.password2 ?? "",
    },
  };
}

export default function AuthPage({ mode = "login" }) {
  const { login, register, isAuthed, me, meReady } = useAuth();
  const location = useLocation();
  const nav = useNavigate();

  const initialTab = useMemo(() => {
    if (location.pathname === "/register") return "register";
    if (location.pathname === "/login") return "login";
    return mode;
  }, [mode, location.pathname]);

  const initialDraft = useMemo(
    () => getInitialDraft(location.pathname, mode, location.state),
    [location.pathname, location.state, mode]
  );

  const [tab, setTab] = useState(initialTab);
  const [identifier, setIdentifier] = useState(initialDraft.values.identifier);
  const [password, setPassword] = useState(initialDraft.values.password);
  const [password2, setPassword2] = useState(initialDraft.values.password2);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({
    type: location.state?.emailConfirmationPending ? "success" : "",
    text: location.state?.emailConfirmationPending
      ? "Cuenta creada. Revisa tu email, confirma la cuenta y después inicia sesión."
      : "",
  });

  const draftKey = useMemo(() => getDraftKey(location.pathname, mode), [location.pathname, mode]);

  useEffect(() => {
    if (location.pathname === "/register") setTab("register");
    else setTab("login");
  }, [location.pathname]);

  useEffect(() => {
    const nextDraft = getInitialDraft(location.pathname, mode, location.state);
    setIdentifier(nextDraft.values.identifier);
    setPassword(nextDraft.values.password);
    setPassword2(nextDraft.values.password2);
  }, [location.pathname, location.state, mode]);

  useFormDraft({
    storageKey: draftKey,
    value: {
      identifier,
      password,
      password2,
    },
    enabled: !loading,
  });

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
        clearDraftSnapshot("auth:login");
        setSuccess("Acceso correcto.");
        nav("/", { replace: true });
        return;
      }

      const result = await register(cleanIdentifier, password);
      clearDraftSnapshot("auth:register");

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

  if (isAuthed && !meReady) return <LoaderScreen />;

  if (isAuthed && meReady) {
    return <Navigate to={isOnboardingComplete(me) ? "/" : "/onboarding"} replace />;
  }

  const isLogin = tab === "login";

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
              <section className="sectionBlock authBrandCard authBrandCard--hero">
                <div className="authHeroImage">
                  <img src={heroImage} alt="Running experience" />
                </div>
              </section>

              <section className="authIntro">
                <div className="authIntro__title">
                  {isLogin ? "Accede a tu cuenta" : "Crea tu cuenta"}
                </div>
                <div className="authIntro__subtitle">
                  {isLogin
                    ? "Entra con tu email o usuario para continuar."
                    : "Regístrate y completa tu perfil después."}
                </div>
              </section>

              <section className="authSwitchSection">
                <div className="authSwitch" role="tablist">
                  <button
                    type="button"
                    className={`authSwitch__item ${isLogin ? "authSwitch__item--active" : ""}`}
                    onClick={() => {
                      resetMsg();
                      setTab("login");
                      nav("/login", { replace: true });
                    }}
                  >
                    Login
                  </button>

                  <button
                    type="button"
                    className={`authSwitch__item ${!isLogin ? "authSwitch__item--active" : ""}`}
                    onClick={() => {
                      resetMsg();
                      setTab("register");
                      nav("/register", { replace: true });
                    }}
                  >
                    Registro
                  </button>
                </div>
              </section>

              <section className="sectionBlock authFormShell">
                <form className="formCard authFormCard" onSubmit={handleSubmit}>
                  <div className="formRow authFormRow">
                    <label>Email o usuario</label>
                    <input
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      disabled={loading}
                      placeholder=""
                    />
                  </div>

                  <div className="formRow authFormRow">
                    <label>Contraseña</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      placeholder=""
                    />
                  </div>

                  {!isLogin && (
                    <div className="formRow authFormRow">
                      <label>Repite contraseña</label>
                      <input
                        type="password"
                        value={password2}
                        onChange={(e) => setPassword2(e.target.value)}
                        disabled={loading}
                        placeholder=""
                      />
                    </div>
                  )}

                  {msg.text && (
                    <div className={`stateCard authStateCard authStateCard--${msg.type}`}>
                      <p>{msg.text}</p>
                    </div>
                  )}

                  <div className="formActions authFormActions">
                    <button type="submit" className="btn btn--primary authSubmitBtn" disabled={loading}>
                      {loading ? "Procesando..." : isLogin ? "Entrar" : "Crear cuenta"}
                    </button>
                  </div>
                </form>
              </section>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
