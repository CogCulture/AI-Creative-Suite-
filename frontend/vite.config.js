import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,

    proxy: {
      // In dev, proxy /bff calls to the FastAPI backend
      "/bff": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
