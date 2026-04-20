import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

/* Routes on the backend that the frontend calls. We proxy them here so
   pages loaded over HTTPS (needed for getUserMedia on phones over LAN)
   can hit the plain-HTTP backend without a mixed-content block — the
   proxy upgrades the origin from the browser's perspective. Add new
   route prefixes here if the backend grows new top-level paths. */
const BACKEND_ROUTES = [
  "/auth",
  "/me",
  "/dm",
  "/users",
  "/events",
  "/follows",
  "/groups",
  "/meetups",
  "/meetups_upcoming",
  "/notifications",
  "/posts",
  "/favorites",
  "/challenges",
  "/clubs",
  "/analytics",
  "/sse",
  "/stream",
  "/settings",
];

const proxy = BACKEND_ROUTES.reduce((acc, path) => {
  acc[path] = {
    target: "http://127.0.0.1:8000",
    changeOrigin: true,
    secure: false,
  };
  return acc;
}, {});

export default defineConfig({
  // HTTPS in dev so browser APIs that require a secure context
  // (getUserMedia for the voice-message mic on phones over LAN)
  // are available. The plugin auto-generates a self-signed cert;
  // the first time you open the LAN URL on a phone, accept the
  // browser's "not trusted" prompt once.
  plugins: [react(), basicSsl()],
  base: "/app-frontend/",
  server: {
    https: true,
    proxy,
  },
});
