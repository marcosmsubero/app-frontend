import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

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
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        color: "var(--color-text, #f8fafc)",
        background:
          "radial-gradient(circle at top, rgba(37,99,235,0.14), transparent 28%), linear-gradient(180deg, #0b1020 0%, #0a0f1d 100%)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 18,
            height: 18,
            margin: "0 auto 12px",
            borderRadius: "999px",
            border: "2px solid rgba(255,255,255,0.18)",
            borderTopColor: "#60a5fa",
            animation: "spin 0.9s linear infinite",
          }}
        />
        <div style={{ fontSize: 14, opacity: 0.8 }}>Cargando…</div>
      </div>

      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
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

  const hideBottomNav =
    !isAuthed ||
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/onboarding";

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background:
          "radial-gradient(circle at top, rgba(37,99,235,0.14), transparent 28%), linear-gradient(180deg, #0b1020 0%, #0a0f1d 100%)",
        color: "var(--color-text, #f8fafc)",
      }}
    >
      {isAuthed ? <SSEListener /> : null}

      <main
        style={{
          width: "100%",
          maxWidth: "560px",
          margin: "0 auto",
          paddingBottom: hideBottomNav ? 24 : 112,
        }}
      >
        {children}
      </main>

      {!hideBottomNav ? <BottomNav me={me} /> : null}
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
