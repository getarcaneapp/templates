import { buildRegistry, writeRegistryFile } from "./lib/registry.js";

async function build(): Promise<void> {
  const registry = await buildRegistry();
  await writeRegistryFile(registry);
  console.log(
    `Generated registry.json with ${registry.templates.length} templates`,
  );
}

build().catch((err) => {
  console.error((err as Error).message || err);
  process.exit(1);
});
