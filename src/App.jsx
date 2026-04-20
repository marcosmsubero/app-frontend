import { useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import SSEListener from "./components/SSEListener";
import { useAuth } from "./hooks/useAuth";
import { useAppliedTheme } from "./hooks/useAppliedTheme";
import { supabase } from "./lib/supabase";
import MobileShell, { MinimalShell } from "./layouts/MobileShell";

import ActivityPage from "./pages/ActivityPage";
import AuthPage from "./pages/AuthPage";
import EventsPage from "./pages/EventsPage";
import ChallengesPage from "./pages/ChallengesPage";
import ExplorarPage from "./pages/ExplorarPage";
import ChatThreadPage from "./pages/ChatThreadPage";
import ClubsPage from "./pages/ClubsPage";
import CreateEventPage from "./pages/CreateEventPage";
import DeleteAccountPage from "./pages/DeleteAccountPage";
import EventDetailPage from "./pages/EventDetailPage";
import EventDirectionsPage from "./pages/EventDirectionsPage";
import FollowersPage from "./pages/FollowersPage";
import FollowingPage from "./pages/FollowingPage";
import ProfileVisitsPage from "./pages/ProfileVisitsPage";
import MessagesPage from "./pages/MessagesPage";
import PlaceholderSettingsPage from "./pages/PlaceholderSettingsPage";
import ProfileOnboardingPage from "./pages/ProfileOnboardingPage";
import ProfilePage from "./pages/ProfilePage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ClubDetailPage from "./pages/ClubDetailPage";
import SettingsAccountPage from "./pages/SettingsAccountPage";
import SettingsPrivacyPage from "./pages/SettingsPrivacyPage";
import SettingsNotificationsPage from "./pages/SettingsNotificationsPage";
import SettingsPreferencesPage from "./pages/SettingsPreferencesPage";
import SettingsMatchingPreferencesPage from "./pages/SettingsMatchingPreferencesPage";
import SettingsPermissionsPage from "./pages/SettingsPermissionsPage";
import SettingsBlockedUsersPage from "./pages/SettingsBlockedUsersPage";
import SettingsHelpPage from "./pages/SettingsHelpPage";
import SettingsSupportPage from "./pages/SettingsSupportPage";
import SettingsLegalPage from "./pages/SettingsLegalPage";
import SettingsVersionPage from "./pages/SettingsVersionPage";
import { isOnboardingComplete } from "./lib/userContract";

function LoaderScreen({ label = "Cargando…" }) {
  return (
    <div className="app-loader-screen">
      <div className="app-loader-screen__inner">
        <div className="app-loader-screen__spinner" />
        <div className="app-loader-screen__label">{label}</div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { session, loading, meReady, me } = useAuth();

  if (loading || !meReady) {
    return <LoaderScreen />;
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
    return <LoaderScreen />;
  }

  if (session && isOnboardingComplete(me)) {
    return <Navigate to="/eventos" replace />;
  }

  if (session && !isOnboardingComplete(me)) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

function PasswordRecoveryListener() {
  const nav = useNavigate();

  useEffect(() => {
    if (!supabase) return;

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        nav("/reset-password", { replace: true });
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [nav]);

  return null;
}

function RootRedirect() {
  const { session, loading, meReady, me } = useAuth();

  if (loading || !meReady) {
    return <LoaderScreen />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!isOnboardingComplete(me)) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Navigate to="/eventos" replace />;
}

function ZoomBlocker() {
  useEffect(() => {
    const isInsideAllowedMap = (target) => {
      if (!(target instanceof Element)) return false;
      return Boolean(
        target.closest(
          ".discoverMapView, .createEventMapPicker__map, .eventDirectionsMap"
        )
      );
    };

    const preventGestureOutsideMap = (event) => {
      if (!isInsideAllowedMap(event.target)) {
        event.preventDefault();
      }
    };

    let lastTouchEnd = 0;
    const preventDoubleTapZoomOutsideMap = (event) => {
      if (isInsideAllowedMap(event.target)) return;

      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener("gesturestart", preventGestureOutsideMap, {
      passive: false,
    });
    document.addEventListener("gesturechange", preventGestureOutsideMap, {
      passive: false,
    });
    document.addEventListener("gestureend", preventGestureOutsideMap, {
      passive: false,
    });
    document.addEventListener("touchend", preventDoubleTapZoomOutsideMap, {
      passive: false,
    });

    return () => {
      document.removeEventListener("gesturestart", preventGestureOutsideMap);
      document.removeEventListener("gesturechange", preventGestureOutsideMap);
      document.removeEventListener("gestureend", preventGestureOutsideMap);
      document.removeEventListener("touchend", preventDoubleTapZoomOutsideMap);
    };
  }, []);

  return null;
}

export default function App() {
  useAppliedTheme();

  return (
    <ErrorBoundary>
      <ZoomBlocker />
      <SSEListener />
      <PasswordRecoveryListener />

      <Routes>
        <Route element={<MinimalShell />}>
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
        </Route>

        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/" element={<RootRedirect />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MobileShell />
            </ProtectedRoute>
          }
        >
          <Route path="eventos" element={<EventsPage />} />

          <Route path="perfil" element={<ProfilePage />} />
          <Route path="perfil/:profileId" element={<ProfilePage />} />
          <Route path="perfil/handle/:handle" element={<ProfilePage />} />
          <Route path="perfil/seguidores" element={<FollowersPage />} />
          <Route path="perfil/seguidos" element={<FollowingPage />} />
          <Route path="perfil/visitas" element={<ProfileVisitsPage />} />

          <Route path="actividad" element={<ActivityPage />} />
          <Route path="evento/:eventId" element={<EventDetailPage />} />
          <Route
            path="evento/:eventId/como-llegar"
            element={<EventDirectionsPage />}
          />
          <Route path="crear-evento" element={<CreateEventPage />} />

          <Route path="mensajes" element={<MessagesPage />} />
          <Route path="mensajes/:threadId" element={<ChatThreadPage />} />

          <Route path="ajustes" element={<PlaceholderSettingsPage />} />
          <Route path="ajustes/cuenta" element={<SettingsAccountPage />} />
          <Route path="ajustes/privacidad" element={<SettingsPrivacyPage />} />
          <Route
            path="ajustes/notificaciones"
            element={<SettingsNotificationsPage />}
          />
          <Route
            path="ajustes/preferencias"
            element={<SettingsPreferencesPage />}
          />
          <Route
            path="ajustes/matcheo"
            element={<SettingsMatchingPreferencesPage />}
          />
          <Route path="ajustes/permisos" element={<SettingsPermissionsPage />} />
          <Route
            path="ajustes/bloqueados"
            element={<SettingsBlockedUsersPage />}
          />
          <Route path="ajustes/ayuda" element={<SettingsHelpPage />} />
          <Route path="ajustes/soporte" element={<SettingsSupportPage />} />
          <Route
            path="ajustes/privacidad-legal"
            element={<SettingsLegalPage mode="privacy" />}
          />
          <Route
            path="ajustes/terminos"
            element={<SettingsLegalPage mode="terms" />}
          />
          <Route path="ajustes/version" element={<SettingsVersionPage />} />

          <Route path="eliminar-cuenta" element={<DeleteAccountPage />} />

          <Route path="explorar" element={<ExplorarPage />} />
          <Route path="retos" element={<ChallengesPage />} />
          <Route path="clubs" element={<ClubsPage />} />
          <Route path="clubs/:clubId" element={<ClubDetailPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
