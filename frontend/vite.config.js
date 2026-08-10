import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
    proxy: {
      // In dev, proxy /bff calls to the FastAPI backend
      "/bff": {
        target: "http://[::1]:8000",
        changeOrigin: true,
      },
    },
  },
});
