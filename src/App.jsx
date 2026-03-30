import { Navigate, Route, Routes } from "react-router-dom";
import AppChrome from "./components/AppChrome";
import SSEListener from "./components/SSEListener";
import Toasts from "./components/Toasts";
import { useAuth } from "./hooks/useAuth";

import ActivityPage from "./pages/ActivityPage";
import AuthPage from "./pages/AuthPage";
import BlaBlaRunPage from "./pages/BlaBlaRunPage";
import ChatThreadPage from "./pages/ChatThreadPage";
import DeleteAccountPage from "./pages/DeleteAccountPage";
import FollowersPage from "./pages/FollowersPage";
import FollowingPage from "./pages/FollowingPage";
import GroupPage from "./pages/GroupPage";
import GroupsPage from "./pages/GroupsPage";
import MessagesPage from "./pages/MessagesPage";
import NotificationsPage from "./pages/NotificationsPage";
import PlaceholderSettingsPage from "./pages/PlaceholderSettingsPage";
import ProfileOnboardingPage from "./pages/ProfileOnboardingPage";
import ProfilePage from "./pages/ProfilePage";
import { isOnboardingComplete } from "./lib/userContract";

function ProtectedRoute({ children }) {
  const { session, loading, meReady, me } = useAuth();

  if (loading || !meReady) {
    return (
      <div className="app-loader-screen">
        <div className="app-loader-screen__inner">
          <div className="app-loader-screen__spinner" />
          <div className="app-loader-screen__label">Cargando…</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!isOnboardingComplete(me)) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

function AuthOnlyRoute({ children }) {
  const { session, loading, meReady, me } = useAuth();

  if (loading || !meReady) {
    return (
      <div className="app-loader-screen">
        <div className="app-loader-screen__inner">
          <div className="app-loader-screen__spinner" />
          <div className="app-loader-screen__label">Cargando…</div>
        </div>
      </div>
    );
  }

  if (session && isOnboardingComplete(me)) {
    return <Navigate to="/" replace />;
  }

  if (session && !isOnboardingComplete(me)) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

function RootRedirect() {
  const { session, loading, meReady, me } = useAuth();

  if (loading || !meReady) {
    return (
      <div className="app-loader-screen">
        <div className="app-loader-screen__inner">
          <div className="app-loader-screen__spinner" />
          <div className="app-loader-screen__label">Cargando…</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!isOnboardingComplete(me)) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Navigate to="/explorar" replace />;
}

export default function App() {
  return (
    <>
      <SSEListener />
      <Routes>
        <Route
          path="/login"
          element={
            <AuthOnlyRoute>
              <AuthPage mode="login" />
            </AuthOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <AuthOnlyRoute>
              <AuthPage mode="register" />
            </AuthOnlyRoute>
          }
        />
        <Route path="/onboarding" element={<ProfileOnboardingPage />} />
        <Route path="/" element={<RootRedirect />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppChrome />
            </ProtectedRoute>
          }
        >
          <Route path="explorar" element={<GroupsPage />} />
          <Route path="grupos" element={<GroupsPage />} />
          <Route path="groups" element={<GroupsPage />} />
          <Route path="grupos/:groupId" element={<GroupPage />} />
          <Route path="groups/:groupId" element={<GroupPage />} />
          <Route path="actividad" element={<ActivityPage />} />
          <Route path="mensajes" element={<MessagesPage />} />
          <Route path="notificaciones" element={<NotificationsPage />} />
          <Route path="mensajes/:threadId" element={<ChatThreadPage />} />
          <Route path="blablarun" element={<BlaBlaRunPage />} />
          <Route path="perfil" element={<ProfilePage />} />
          <Route path="perfil/seguidores" element={<FollowersPage />} />
          <Route path="perfil/seguidos" element={<FollowingPage />} />
          <Route path="ajustes" element={<PlaceholderSettingsPage />} />
          <Route path="eliminar-cuenta" element={<DeleteAccountPage />} />
        </Route>
      </Routes>
      <Toasts />
    </>
  );
}
