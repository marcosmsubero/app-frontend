import { Navigate, Route, Routes, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

import AppChrome from "./components/AppChrome";
import BottomNav from "./components/BottomNav";
import SSEListener from "./components/SSEListener";

import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
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

function FullPageLoader() {
  return (
    <div className="app-loader-screen">
      <div className="app-loader-screen__inner">
        <div className="app-loader-screen__spinner" />
        <div className="app-loader-screen__label">Cargando…</div>
      </div>
    </div>
  );
}

function needsOnboarding(me) {
  return !me?.onboarding_completed;
}

function RequireAuth({ children }) {
  const { isAuthed, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function RequireGuest({ children }) {
  const { isAuthed, loading, me } = useAuth();

  if (loading) return <FullPageLoader />;

  if (isAuthed) {
    return <Navigate to={needsOnboarding(me) ? "/onboarding" : "/"} replace />;
  }

  return children;
}

function RequireCompletedProfile({ children }) {
  const { isAuthed, loading, me } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (needsOnboarding(me)) {
    return <Navigate to="/onboarding" replace state={{ from: location }} />;
  }

  return children;
}

function ProtectedAppLayout() {
  const { me } = useAuth();

  return (
    <div className="app-root">
      <SSEListener />

      <div className="app-shell app-shell--withChrome">
        <AppChrome me={me} />

        <main className="app-main app-main--withChrome">
          <div className="app-main__inner">
            <Outlet />
          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RequireGuest>
            <AuthPage defaultTab="login" />
          </RequireGuest>
        }
      />

      <Route
        path="/register"
        element={
          <RequireGuest>
            <AuthPage defaultTab="register" />
          </RequireGuest>
        }
      />

      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <ProfileOnboardingPage />
          </RequireAuth>
        }
      />

      <Route
        element={
          <RequireCompletedProfile>
            <ProtectedAppLayout />
          </RequireCompletedProfile>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/explorar" element={<BlaBlaRunPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/groups/:groupId" element={<GroupPage />} />
        <Route path="/notificaciones" element={<NotificationsPage />} />
        <Route path="/mensajes" element={<MessagesPage />} />
        <Route path="/mensajes/:threadId" element={<ChatThreadPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/perfil/seguidores" element={<FollowersPage />} />
        <Route path="/perfil/siguiendo" element={<FollowingPage />} />
        <Route path="/ajustes" element={<PlaceholderSettingsPage />} />
        <Route path="/eliminar-cuenta" element={<DeleteAccountPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}