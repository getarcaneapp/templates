import { error } from "@sveltejs/kit";

import { getTemplateDetail, getTemplateSummaries } from "#lib/server/templates.js";
import type { EntryGenerator, PageServerLoad } from "./$types";

export const entries: EntryGenerator = async () =>
  (await getTemplateSummaries()).map(({ id }) => ({ id }));

export const load: PageServerLoad = async ({ params }) => {
  const template = await getTemplateDetail(params.id);
  if (!template) error(404, `No template named "${params.id}"`);
  return { template };
};
