import type { Rule } from "../types.js";

export const readme: Rule = {
  id: "readme",
  severity: "warn",
  description: "README.md exists and has a ## Deployment section.",
  check(template) {
    if (template.readme === null) return [{ message: "missing README.md" }];
    if (!/^##\s+Deployment\b/m.test(template.readme)) {
      return [{ message: "README.md has no ## Deployment section" }];
    }
    return [];
  },
};
