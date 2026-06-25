import path from "path";
const __dirname = import.meta.dirname;
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// devServer plugin is only loaded in dev mode so it doesn't interfere
// with the production Vite build (which Vercel runs).
const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL;

export default defineConfig(async () => {
  const plugins = [react()];

  if (!isProduction) {
    const { default: devServer } = await import("@hono/vite-dev-server");
    plugins.unshift(
      devServer({ entry: "api/boot.ts", exclude: [/^\/(?!api\/).*/] }),
    );
  }

  return {
    plugins,
    server: {
      port: 3000,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@contracts": path.resolve(__dirname, "./contracts"),
        "@db": path.resolve(__dirname, "./db"),
        db: path.resolve(__dirname, "./db"),
      },
    },
    envDir: path.resolve(__dirname),
    build: {
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
    },
  };
});
