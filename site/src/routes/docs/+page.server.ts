import { getRegistry, getTagInfo } from "#lib/server/templates.js";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const registry = await getRegistry();
  return {
    registryVersion: registry.version,
    templateCount: registry.templates.length,
    tags: await getTagInfo(),
  };
};
