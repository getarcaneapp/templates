import type { Rule } from "../types.js";

export const slug: Rule = {
  id: "slug",
  severity: "error",
  description: "The template directory name is lowercase letters, digits and hyphens.",
  check(template) {
    return /^[a-z0-9-]+$/.test(template.id)
      ? []
      : [{ message: `directory name "${template.id}" must match ^[a-z0-9-]+$` }];
  },
};
