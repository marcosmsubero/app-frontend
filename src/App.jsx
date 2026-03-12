import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import ProfileOnboardingPage from "./pages/ProfileOnboardingPage";
import GroupsPage from "./pages/GroupsPage";
import GroupPage from "./pages/GroupPage";
import BlaBlaRunPage from "./pages/BlaBlaRunPage";
import PlaceholderSettingsPage from "./pages/PlaceholderSettingsPage";
import NotificationsPage from "./pages/NotificationsPage";
import MessagesPage from "./pages/MessagesPage";
import ChatThreadPage from "./pages/ChatThreadPage";
import DeleteAccountPage from "./pages/DeleteAccountPage";
import FollowersPage from "./pages/FollowersPage";
import FollowingPage from "./pages/FollowingPage";

import BottomNav from "./components/BottomNav";
import SSEListener from "./components/SSEListener";

function LoadingScreen() {
  return (
    <div className="page" style={{ paddingBottom: 90 }}>
      <p className="muted">Cargando…</p>
    </div>
  );
}

function PublicRoutes() {
  return (
    <div className="page">
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AuthPage defaultTab="login" />} />
        <Route path="/register" element={<AuthPage defaultTab="register" />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

function WithOnboardingGate({ needsOnboarding, children }) {
  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

function PrivateRoutes({ me, needsOnboarding }) {
  const location = useLocation();
  const isOnboardingRoute = location.pathname === "/onboarding";

  return (
    <div
      className="page"
      style={{ paddingBottom: isOnboardingRoute ? 18 : 90 }}
    >
      <SSEListener />

      <Routes>
        <Route path="/" element={<Navigate to="/perfil" replace />} />

        <Route path="/onboarding" element={<ProfileOnboardingPage />} />

        <Route
          path="/perfil"
          element={
            <WithOnboardingGate needsOnboarding={needsOnboarding}>
              <ProfilePage />
            </WithOnboardingGate>
          }
        />

        <Route
          path="/groups"
          element={
            <WithOnboardingGate needsOnboarding={needsOnboarding}>
              <GroupsPage />
            </WithOnboardingGate>
          }
        />

        <Route
          path="/groups/:groupId"
          element={
            <WithOnboardingGate needsOnboarding={needsOnboarding}>
              <GroupPage />
            </WithOnboardingGate>
          }
        />

        <Route
          path="/explorar"
          element={
            <WithOnboardingGate needsOnboarding={needsOnboarding}>
              <BlaBlaRunPage />
            </WithOnboardingGate>
          }
        />

        <Route
          path="/ajustes"
          element={
            <WithOnboardingGate needsOnboarding={needsOnboarding}>
              <PlaceholderSettingsPage />
            </WithOnboardingGate>
          }
        />

        <Route
          path="/notificaciones"
          element={
            <WithOnboardingGate needsOnboarding={needsOnboarding}>
              <NotificationsPage />
            </WithOnboardingGate>
          }
        />

        <Route
          path="/mensajes"
          element={
            <WithOnboardingGate needsOnboarding={needsOnboarding}>
              <MessagesPage />
            </WithOnboardingGate>
          }
        />

        <Route
          path="/mensajes/:threadId"
          element={
            <WithOnboardingGate needsOnboarding={needsOnboarding}>
              <ChatThreadPage />
            </WithOnboardingGate>
          }
        />

        <Route path="/login" element={<Navigate to="/perfil" replace />} />
        <Route path="/register" element={<Navigate to="/perfil" replace />} />

        <Route
          path="/account/delete"
          element={
            <WithOnboardingGate needsOnboarding={needsOnboarding}>
              <DeleteAccountPage />
            </WithOnboardingGate>
          }
        />

        <Route
          path="/perfil/seguidores"
          element={
            <WithOnboardingGate needsOnboarding={needsOnboarding}>
              <FollowersPage />
            </WithOnboardingGate>
          }
        />

        <Route
          path="/perfil/seguidos"
          element={
            <WithOnboardingGate needsOnboarding={needsOnboarding}>
              <FollowingPage />
            </WithOnboardingGate>
          }
        />

        <Route path="*" element={<p>404 · Página no encontrada</p>} />
      </Routes>

      {!isOnboardingRoute && <BottomNav me={me} />}
    </div>
  );
}

export default function App() {
  const { isAuthed, loading, me } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthed) {
    return <PublicRoutes />;
  }

  const needsOnboarding = !!me && (!me.handle || !me.role);

  return <PrivateRoutes me={me} needsOnboarding={needsOnboarding} />;
}
