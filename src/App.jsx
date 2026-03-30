import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import AppChrome from "./components/AppChrome";
import { useAuth } from "./hooks/useAuth";
import { isOnboardingComplete } from "./lib/userContract";

import AuthPage from "./pages/AuthPage";
import BlaBlaRunPage from "./pages/BlaBlaRunPage";
import ChatThreadPage from "./pages/ChatThreadPage";
import ExplorePage from "./pages/ExplorePage";
import GroupDetailPage from "./pages/GroupDetailPage";
import GroupPage from "./pages/GroupPage";
import MessagesPage from "./pages/MessagesPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfileOnboardingPage from "./pages/ProfileOnboardingPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";

function FullScreenLoader({ label = "Cargando…" }) {
  return (
    <div className="app-loader-screen">
      <div className="app-loader-screen__inner">
        <div className="app-loader-screen__spinner" />
        <div className="app-loader-screen__label">{label}</div>
      </div>
    </div>
  );
}

function RequireAuth() {
  const { isAuthed, loading, meReady } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullScreenLoader label="Cargando sesión…" />;
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!meReady) {
    return <FullScreenLoader label="Cargando perfil…" />;
  }

  return <Outlet />;
}

function RequireCompletedOnboarding() {
  const { me, meReady } = useAuth();

  if (!meReady) {
    return <FullScreenLoader label="Preparando cuenta…" />;
  }

  if (!isOnboardingComplete(me)) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

function RedirectAuthenticatedUser() {
  const { isAuthed, loading, me, meReady } = useAuth();

  if (loading) {
    return <FullScreenLoader label="Cargando…" />;
  }

  if (!isAuthed) {
    return <Outlet />;
  }

  if (!meReady) {
    return <FullScreenLoader label="Preparando cuenta…" />;
  }

  return <Navigate to={isOnboardingComplete(me) ? "/" : "/onboarding"} replace />;
}

function AppLayout() {
  return (
    <AppChrome>
      <Outlet />
    </AppChrome>
  );
}

function RootRedirect() {
  const { isAuthed, loading, me, meReady } = useAuth();

  if (loading) {
    return <FullScreenLoader label="Cargando…" />;
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  if (!meReady) {
    return <FullScreenLoader label="Preparando cuenta…" />;
  }

  if (!isOnboardingComplete(me)) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Navigate to="/explorar" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<RedirectAuthenticatedUser />}>
        <Route path="/login" element={<AuthPage defaultTab="login" />} />
        <Route path="/register" element={<AuthPage defaultTab="register" />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="/onboarding" element={<ProfileOnboardingPage />} />

        <Route element={<RequireCompletedOnboarding />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/explorar" element={<ExplorePage />} />
            <Route path="/grupos" element={<GroupPage />} />
            <Route path="/grupos/:groupId" element={<GroupDetailPage />} />
            <Route path="/mensajes" element={<MessagesPage />} />
            <Route path="/mensajes/:threadId" element={<ChatThreadPage />} />
            <Route path="/notificaciones" element={<NotificationsPage />} />
            <Route path="/blablarun" element={<BlaBlaRunPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
            <Route path="/ajustes" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
