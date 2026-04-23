import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
    },
  },
  server: {
    port: 3000,
    strictPort: true, // Fail if port 3000 is unavailable instead of auto-selecting
    proxy: {
      "/api": {
        // Any request that starts with /api will be forwarded to the backend.
        target: process.env.VITE_PROXY_TARGET || "http://127.0.0.1:5000",
        changeOrigin: true,
        //         Normally the request header would say:
        // Origin: http://localhost:5173
        // With changeOrigin: true, Vite changes it to:
        // Origin: http://127.0.0.1:5000
        secure: false,
        // This is related to HTTPS certificates.
        // It means:
        // Allow proxying even if the backend has an invalid SSL certificate.
      },
    },
  },
});
