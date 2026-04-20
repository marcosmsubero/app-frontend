import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

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
  },
});
