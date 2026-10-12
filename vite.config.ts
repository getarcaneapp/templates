import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
    "templates/**": "vp run lint:templates --no-docker",
  },
  test: {
    include: ["scripts/**/*.test.ts"],
  },
  fmt: { svelte: true },
  lint: { options: { typeAware: true, typeCheck: true } },
});
