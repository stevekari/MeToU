import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  define: {
    global: "globalThis",
  },
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:10000",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:10000",
        changeOrigin: true,
        ws: true,
      },
      "/uploads": {
        target: "http://localhost:10000",
        changeOrigin: true,
      },
    },
    "/api": { target: "https://metou-yyau.onrender.com", changeOrigin: true },
    "/socket.io": {
      target: "https://metou-yyau.onrender.com",
      changeOrigin: true,
      ws: true,
    },
  },
});
