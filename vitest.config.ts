import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      "next/server": path.resolve("node_modules/next/server.js"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/actions/**", "src/lib/**"],
      exclude: ["src/lib/prisma.ts", "src/lib/mock-data.ts"],
    },
  },
})
