import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    // Executar testes sequencialmente para evitar conflitos com banco de dados
    // Isso garante que testes que interagem com o banco não executem em paralelo
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
  },
});
