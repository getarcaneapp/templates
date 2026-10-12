import { getTemplateSummaries } from "#lib/server/templates.js";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  return { templates: await getTemplateSummaries() };
};
