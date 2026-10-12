import { getServices } from "../compose.js";
import type { Rule } from "../types.js";

export const restartPolicy: Rule = {
  id: "restart-policy",
  severity: "warn",
  description: "Every service sets restart:.",
  check(template) {
    return getServices(template)
      .filter(({ node }) => !node.has("restart"))
      .map(({ name }) => ({ message: `service "${name}" has no restart policy` }));
  },
};
