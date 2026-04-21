import { generateRegistryInternal } from "./lib/generate.js";

generateRegistryInternal().catch((err) => {
  console.error((err as Error).message || err);
  process.exit(1);
});
