import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// base:'/ktype/' — workmate.tools/ktype 서브패스 정적 임베드용.
// 자산이 /ktype/assets/* 절대경로로 emit 되어 workmate 루트에서 404 나지 않는다.
export default defineConfig({
  base: "/ktype/",
  plugins: [react()],
  build: { outDir: "dist" },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
