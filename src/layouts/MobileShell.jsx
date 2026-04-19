import { Link, Outlet, useLocation, matchPath } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import "../styles/mobile-shell.css";

/* Inline SVG logo. One source, adapts to theme via `currentColor`:
   - "Run" inherits the surrounding text color (white on dark, near-black
     on light), so it reads correctly without a per-theme variant.
   - "Vibe" takes the brand gradient — stays green in both themes.
   - Accent underline under "Vibe" suggests motion without decoration.
   The SVG is intentionally small and optically aligned to the topbar
   baseline (y=24 on a 32px-tall viewBox). */
function RunVibeLogo() {
  return (
    <svg
      viewBox="0 0 160 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="appTopbar__logo"
      aria-label="RunVibe"
    >
      <defs>
        <linearGradient id="rvVibeGrad" x1="50" y1="4" x2="160" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8df2b6" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>

      {/* "Run" — inherits text color. Medium weight balances against the
          bolder "Vibe" and creates a two-step hierarchy. */}
      <text
        x="0"
        y="24"
        fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
        fontSize="22"
        fontWeight="500"
        letterSpacing="-0.02em"
        fill="currentColor"
      >
        Run
      </text>

      {/* "Vibe" — brand gradient. Bolder so it reads as the accented word
          without needing a larger size. */}
      <text
        x="44"
        y="24"
        fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
        fontSize="22"
        fontWeight="800"
        letterSpacing="-0.02em"
        fill="url(#rvVibeGrad)"
      >
        Vibe
      </text>

      {/* Soft underline under "Vibe" hints at motion. Short enough to not
          read as "text decoration", gradient-matched to the word above. */}
      <path
        d="M44 29 Q72 26 104 29"
        stroke="url(#rvVibeGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

/* Routes where the topbar is rendered. Every other route hides the
   header entirely — the page owns its full vertical space. Kept as a
   short allow-list because it's the minority case; adding a route
   here is an explicit opt-in. */
const HEADER_VISIBLE_PATTERNS = [
  "/perfil",
  "/perfil/:profileId",
  "/perfil/handle/:handle",
  "/perfil/seguidores",
  "/perfil/seguidos",
  "/perfil/visitas",
];

function isHeaderVisible(pathname) {
  return HEADER_VISIBLE_PATTERNS.some((pattern) => matchPath(pattern, pathname));
}

export default function MobileShell() {
  const location = useLocation();
  const isChatThreadPage = Boolean(matchPath("/mensajes/:threadId", location.pathname));
  const headerVisible = isHeaderVisible(location.pathname) && !isChatThreadPage;

  const frameModifier = isChatThreadPage
    ? " appChrome__frame--chat"
    : !headerVisible
      ? " appChrome__frame--noHeader"
      : "";

  return (
    <div className="appChrome">
      {/* Skip-link for keyboard and screen-reader users. Hidden visually
          until focused; lets the user jump past the topbar and nav. */}
      <a href="#appMainContent" className="appSkipLink">
        Saltar al contenido principal
      </a>

      {headerVisible && (
        <header className="appTopbar">
          <div className="appTopbar__inner">
            <RunVibeLogo />

            <Link to="/ajustes" className="appTopbar__settings" aria-label="Ir a ajustes">
              <IconSettings />
            </Link>
          </div>
        </header>
      )}

      <div className={`appChrome__frame${frameModifier}`}>
        <main id="appMainContent" className="appChrome__main" tabIndex={-1}>
          <div
            className="appChrome__content page-enter"
            key={location.pathname.split("/").slice(0, 2).join("/")}
          >
            <Outlet />
          </div>
        </main>
      </div>

      {!isChatThreadPage && <BottomNav />}
    </div>
  );
}

/* Logo-only shell for pre-auth / onboarding flows. Same top bar chrome as
   the main shell (so the app feels consistent) but with no settings button
   and no bottom navigation. */
export function MinimalShell() {
  const location = useLocation();

  return (
    <div className="appChrome">
      <header className="appTopbar appTopbar--minimal">
        <div className="appTopbar__inner appTopbar__inner--minimal">
          <RunVibeLogo />
        </div>
      </header>

      <div className="appChrome__frame appChrome__frame--minimal">
        <main className="appChrome__main">
          <div
            className="appChrome__content page-enter"
            key={location.pathname.split("/").slice(0, 2).join("/")}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
