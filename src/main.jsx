import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App.jsx";
import { ToastProvider } from "./hooks/useToast.jsx";
import { AuthProvider } from "./hooks/useAuth";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <HashRouter>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </HashRouter>
);