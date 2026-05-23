import path from "node:path";

import dotenv from "dotenv";
import { defineConfig } from "vitest/config";

dotenv.config({ path: ".env.local" });
dotenv.config();

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    globals: false,
    testTimeout: 20_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
