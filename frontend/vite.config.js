import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  define: {
    global: "globalThis",
  },
  css: {
    postcss: {},
  },
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
    proxy: {
      "/auth": {
        target: "http://localhost:10000",
        changeOrigin: true,
      },
      "/api": {
        target: "http://localhost:10000",
        changeOrigin: true,
      },
      "/ws": {
        target: "http://localhost:10000",
        changeOrigin: true,
        ws: true,
      },
      "/conversations": {
        target: "http://localhost:10000",
        changeOrigin: true,
      },
      "/users": {
        target: "http://localhost:10000",
        changeOrigin: true,
      },
      "/media": {
        target: "http://localhost:10000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:10000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
});

