import { collectStrings, getServices } from "../compose.js";
import type { Issue, Rule } from "../types.js";

// ${VAR}, ${VAR:-default}, ${VAR-default}, ${VAR:?err}, ${VAR:+alt}, and bare $VAR. `$$` escapes.
const VARIABLE = /\$(?:\{([A-Za-z_][A-Za-z0-9_]*)(?:(:?[-?+=])[^}]*)?\}|([A-Za-z_][A-Za-z0-9_]*))/g;

export interface VariableUse {
  name: string;
  hasDefault: boolean;
}

export function findVariables(value: string): VariableUse[] {
  const uses: VariableUse[] = [];
  const unescaped = value.replace(/\$\$/g, "");
  for (const match of unescaped.matchAll(VARIABLE)) {
    const name = match[1] ?? match[3];
    if (!name) continue;
    const operator = match[2] ?? "";
    uses.push({
      name,
      hasDefault: operator.includes("-") || operator.includes("+") || operator.includes("="),
    });
  }
  return uses;
}

export const envCoverage: Rule = {
  id: "env-coverage",
  severity: "error",
  description:
    "Every compose variable without a default is defined in .env.example; unused variables are flagged.",
  check(template) {
    if (template.envRaw === null) return [{ message: "missing .env.example" }];
    if (!template.compose) return [];

    const issues: Issue[] = [];
    const used = new Set<string>();
    const reported = new Set<string>();
    for (const value of collectStrings(template.compose.contents)) {
      for (const { name, hasDefault } of findVariables(value)) {
        used.add(name);
        if (!hasDefault && !template.env.has(name) && !reported.has(name)) {
          reported.add(name);
          issues.push({
            message: `\${${name}} is used in compose but not defined in .env.example`,
          });
        }
      }
    }

    // Containers that load .env through env_file read every variable, so nothing is unused.
    const loadsEnvFile = getServices(template).some(({ node }) => node.has("env_file"));
    if (!loadsEnvFile) {
      for (const name of template.env.keys()) {
        if (!used.has(name)) {
          issues.push({
            message: `${name} is defined in .env.example but never used`,
            severity: "warn",
          });
        }
      }
    }
    return issues;
  },
};
