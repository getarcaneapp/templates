import type { Issue, Rule } from "../types.js";

export const templateJson: Rule = {
  id: "template-json",
  severity: "error",
  description: "template.json exists, parses, and has name, description, author and tags.",
  check(template) {
    if (template.metaError) return [{ message: template.metaError }];

    const issues: Issue[] = [];
    for (const key of ["name", "description", "author"] as const) {
      const value = template.meta?.[key];
      if (typeof value !== "string" || value.trim() === "") {
        issues.push({ message: `template.json is missing "${key}"` });
      }
    }
    if (!Array.isArray(template.meta?.tags) || template.meta.tags.length === 0) {
      issues.push({ message: 'template.json needs at least one entry in "tags"' });
    }
    return issues;
  },
};
