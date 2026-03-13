import { Navigate, Route, Routes, useLocation } from "react-router-dom";
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
    const needsOnboarding = !me?.handle;
    return <Navigate to={needsOnboarding ? "/onboarding" : "/perfil"} replace />;
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

  if (!me?.handle && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

function AppShell({ children }) {
  const { isAuthed, me } = useAuth();
  const location = useLocation();

  const isAuthRoute =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/onboarding";

  const showChrome = isAuthed && !isAuthRoute;

  return (
    <div className="app-root">
      <div className="app-shell">
        {isAuthed ? <SSEListener /> : null}

        {showChrome ? <AppChrome me={me} /> : null}

        <div className="app-shell__inner">
          {showChrome ? (
            <aside className="app-desktop-sidebar-spacer app-desktop-sidebar" aria-hidden="true" />
          ) : null}

          <main className="app-main">{children}</main>
        </div>

        {showChrome ? <BottomNav me={me} /> : null}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />

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
          path="/perfil"
          element={
            <RequireCompletedProfile>
              <ProfilePage />
            </RequireCompletedProfile>
          }
        />

        <Route
          path="/explorar"
          element={
            <RequireCompletedProfile>
              <BlaBlaRunPage />
            </RequireCompletedProfile>
          }
        />

        <Route
          path="/groups"
          element={
            <RequireCompletedProfile>
              <GroupsPage />
            </RequireCompletedProfile>
          }
        />

        <Route
          path="/groups/:groupId"
          element={
            <RequireCompletedProfile>
              <GroupPage />
            </RequireCompletedProfile>
          }
        />

        <Route
          path="/notificaciones"
          element={
            <RequireCompletedProfile>
              <NotificationsPage />
            </RequireCompletedProfile>
          }
        />

        <Route
          path="/mensajes"
          element={
            <RequireCompletedProfile>
              <MessagesPage />
            </RequireCompletedProfile>
          }
        />

        <Route
          path="/mensajes/:threadId"
          element={
            <RequireCompletedProfile>
              <ChatThreadPage />
            </RequireCompletedProfile>
          }
        />

        <Route
          path="/seguidores"
          element={
            <RequireCompletedProfile>
              <FollowersPage />
            </RequireCompletedProfile>
          }
        />

        <Route
          path="/siguiendo"
          element={
            <RequireCompletedProfile>
              <FollowingPage />
            </RequireCompletedProfile>
          }
        />

        <Route
          path="/ajustes"
          element={
            <RequireCompletedProfile>
              <PlaceholderSettingsPage />
            </RequireCompletedProfile>
          }
        />

        <Route
          path="/eliminar-cuenta"
          element={
            <RequireCompletedProfile>
              <DeleteAccountPage />
            </RequireCompletedProfile>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
