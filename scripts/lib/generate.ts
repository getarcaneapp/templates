import { buildRegistry, writeRegistryFile } from "./registry.js";

export async function generateRegistryInternal(): Promise<void> {
  const registry = await buildRegistry();
  await writeRegistryFile(registry);
  console.log(
    `Generated registry.json with ${registry.templates.length} templates`,
  );
}
