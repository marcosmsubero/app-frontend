import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import ProfileOnboardingPage from "./pages/ProfileOnboardingPage";

import GroupsPage from "./pages/GroupsPage";
import GroupPage from "./pages/GroupPage";
import BlaBlaRunPage from "./pages/BlaBlaRunPage";
import PlaceholderSettingsPage from "./pages/PlaceholderSettingsPage";

import BottomNav from "./components/BottomNav";
import SSEListener from "./components/SSEListener";

import NotificationsPage from "./pages/NotificationsPage";
import MessagesPage from "./pages/MessagesPage";
import ChatThreadPage from "./pages/ChatThreadPage";
import DeleteAccountPage from "./pages/DeleteAccountPage";

import FollowersPage from "./pages/FollowersPage";
import FollowingPage from "./pages/FollowingPage";


export default function App() {
  const { isAuthed, loading, me } = useAuth();

  if (loading) {
    return (
      <div className="page" style={{ paddingBottom: 90 }}>
        <p className="muted">Cargando…</p>
      </div>
    );
  }

  // ✅ Si NO hay sesión: solo Auth (sin bottom nav, sin SSE)
  if (!isAuthed) {
  return (
    <div className="page">
      <Routes>
        {/* ✅ fuerza el entrypoint real */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<AuthPage defaultTab="login" />} />
        <Route path="/register" element={<AuthPage defaultTab="register" />} />

        {/* ✅ cualquier cosa rara => login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}


  // ✅ Gate: si hay sesión pero faltan campos clave del perfil → onboarding
  const needsOnboarding = !!me && (!me.handle || !me.role);

  // ✅ Con sesión: app normal + SSE + bottom nav
  return (
    <div className="page" style={{ paddingBottom: 90 }}>
      <SSEListener />

      <Routes>
        <Route path="/" element={<Navigate to="/perfil" replace />} />

        {/* ✅ Onboarding */}
        <Route path="/onboarding" element={<ProfileOnboardingPage />} />

        {/* ✅ Perfil: si falta onboarding → redirect */}
        <Route
          path="/perfil"
          element={
            needsOnboarding ? (
              <Navigate to="/onboarding" replace />
            ) : (
              <ProfilePage />
            )
          }
        />

        {/* ✅ Rutas privadas: también pasan por el gate */}
        <Route
          path="/groups"
          element={
            needsOnboarding ? (
              <Navigate to="/onboarding" replace />
            ) : (
              <GroupsPage />
            )
          }
        />
        <Route
          path="/groups/:groupId"
          element={
            needsOnboarding ? (
              <Navigate to="/onboarding" replace />
            ) : (
              <GroupPage />
            )
          }
        />

        <Route
          path="/explorar"
          element={
            needsOnboarding ? (
              <Navigate to="/onboarding" replace />
            ) : (
              <BlaBlaRunPage />
            )
          }
        />
        <Route
          path="/ajustes"
          element={
            needsOnboarding ? (
              <Navigate to="/onboarding" replace />
            ) : (
              <PlaceholderSettingsPage />
            )
          }
        />

        <Route
          path="/notificaciones"
          element={needsOnboarding ? <Navigate to="/onboarding" replace /> : <NotificationsPage />}
        />

        <Route
          path="/mensajes"
          element={needsOnboarding ? <Navigate to="/onboarding" replace /> : <MessagesPage />}
        />

        <Route
          path="/mensajes/:threadId"
          element={needsOnboarding ? <Navigate to="/onboarding" replace /> : <ChatThreadPage />}
        />

        <Route
          path="/mensajes/:threadId"
          element={needsOnboarding ? <Navigate to="/onboarding" replace /> : <ChatThreadPage />}
        />

        {/* Si estás logueado y entras a /login o /register por URL */}
        <Route path="/login" element={<Navigate to="/perfil" replace />} />
        <Route path="/register" element={<Navigate to="/perfil" replace />} />

        <Route path="*" element={<p>404 · Página no encontrada</p>} />

        <Route path="/account/delete" element={<DeleteAccountPage />} />

        <Route path="/perfil/seguidores" element={<FollowersPage />} />
        <Route path="/perfil/seguidos" element={<FollowingPage />} />
        
      </Routes>

      {/* ✅ PASAMOS 'me' PARA ICONO ZAPATILLA/BICI */}
      <BottomNav me={me} />
    </div>
  );
}
