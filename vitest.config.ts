import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
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
