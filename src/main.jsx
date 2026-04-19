import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App.jsx";
import { ToastProvider } from "./hooks/useToast.jsx";
import { AuthProvider } from "./hooks/useAuth";
import { I18nProvider } from "./i18n/index.jsx";
import "./styles/app.css";
import "./styles/ui-kit.css";
import "./styles/mobile-shell.css";
import "./styles/profile-calendar.css";
import "./styles/activity.css";

// --- Analytics ---
import { initAnalytics } from "./services/analytics";
initAnalytics();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <I18nProvider>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </I18nProvider>
    </HashRouter>
  </StrictMode>,
);
