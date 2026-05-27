import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  server: {
    port: 3000,
    open: false,
    proxy: {
      "/api": {
        target: "https://openrouter.ai",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/api/v1"),
      },
    },
  },

  build: {
    outDir: "dist",
    sourcemap: mode !== "production",
  },

  esbuild: {
    drop: mode === "production" ? ["console"] : [],
  },
}));
