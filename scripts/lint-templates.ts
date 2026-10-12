/**
 * Lint templates/ and validate the generated registry against schema.json.
 *
 *   vp run lint:templates                      lint every template
 *   vp run lint:templates pocket-id immich     lint specific templates (ids or file paths)
 *   vp run lint:templates --fix                apply automatic fixes first
 *   vp run lint:templates --quiet              hide warnings
 *   vp run lint:templates --no-docker          skip `docker compose config`
 */
import { promises as fs } from "node:fs";
import path from "node:path";

import Ajv from "ajv";
import addFormats from "ajv-formats";

import {
  buildRegistry,
  listTemplateDirs,
  loadTemplate,
  ROOT,
  TEMPLATES_DIR,
} from "./lib/registry.js";
import { hasDockerCompose } from "./lint/rules/compose-config.js";
import { rules } from "./lint/rules/index.js";
import type { Severity } from "./lint/types.js";

interface Result {
  rule: string;
  severity: Severity;
  message: string;
  fixable: boolean;
}

const args = process.argv.slice(2);
const fix = args.includes("--fix");
const quiet = args.includes("--quiet");
const skipDocker = args.includes("--no-docker");
const targets = args.filter((arg) => !arg.startsWith("--"));

const color = (code: number, text: string) =>
  process.stdout.isTTY ? `\x1b[${code}m${text}\x1b[0m` : text;

/** Accept template ids and paths such as templates/immich/compose.yaml (from staged hooks). */
async function resolveTargets(): Promise<string[]> {
  const all = await listTemplateDirs();
  if (targets.length === 0) return all;

  const ids = new Set<string>();
  for (const target of targets) {
    const isPath = target.includes("/");
    const relative = path.relative(TEMPLATES_DIR, path.resolve(ROOT, target));
    const id = isPath ? relative.split(path.sep)[0] : target;
    if (!id || id.startsWith("..")) continue;
    if (!all.includes(id)) {
      // A staged path can belong to a template that is being deleted.
      if (isPath) continue;
      throw new Error(`Unknown template "${id}"`);
    }
    ids.add(id);
  }
  return [...ids].sort();
}

async function lintTemplate(id: string): Promise<Result[]> {
  let template = await loadTemplate(id);
  const active = rules.filter((rule) => !(skipDocker && rule.id === "compose-config"));

  if (fix) {
    for (const rule of active) {
      if (!rule.fix) continue;
      const issues = await rule.check(template);
      if (issues.some((issue) => issue.fixable)) {
        await rule.fix(template);
        template = await loadTemplate(id);
      }
    }
  }

  const results: Result[] = [];
  for (const rule of active) {
    for (const issue of await rule.check(template)) {
      results.push({
        rule: rule.id,
        severity: issue.severity ?? rule.severity,
        message: issue.message,
        fixable: issue.fixable ?? false,
      });
    }
  }
  return results;
}

async function validateSchema(): Promise<string | null> {
  const schema = JSON.parse(await fs.readFile(path.join(ROOT, "schema.json"), "utf8")) as {
    $schema?: string;
  };
  if (schema.$schema === "https://json-schema.org/draft-07/schema") {
    schema.$schema = "http://json-schema.org/draft-07/schema";
  }

  let registry;
  try {
    registry = await buildRegistry({ log: false });
  } catch (error) {
    return `Could not build registry: ${(error as Error).message}`;
  }

  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (validate(registry)) return null;

  return `Generated registry does not match schema.json\n${(validate.errors || [])
    .map((error) => `  ${error.instancePath || "/"} ${error.message || "validation failed"}`)
    .join("\n")}`;
}

async function main(): Promise<void> {
  const ids = await resolveTargets();
  if (!skipDocker && !hasDockerCompose()) {
    console.warn(color(33, "docker compose is not available, skipping compose-config"));
  }

  let errors = 0;
  let warnings = 0;
  let fixable = 0;
  for (const id of ids) {
    const results = (await lintTemplate(id)).filter(
      (result) => !(quiet && result.severity === "warn"),
    );
    if (results.length === 0) continue;

    console.log(`\n${color(1, `templates/${id}`)}`);
    for (const result of results) {
      const label = result.severity === "error" ? color(31, "error") : color(33, "warn ");
      const suffix = result.fixable ? color(2, " (fixable)") : "";
      console.log(`  ${label}  ${color(2, result.rule.padEnd(16))} ${result.message}${suffix}`);
      if (result.severity === "error") errors++;
      else warnings++;
      if (result.fixable) fixable++;
    }
  }

  const schemaError = await validateSchema();
  if (schemaError) {
    console.log(`\n${color(31, "error")}  ${schemaError}`);
    errors++;
  }

  console.log(
    `\n${ids.length} template(s) checked: ${errors} error(s), ${warnings} warning(s)` +
      (fixable > 0 && !fix ? `, ${fixable} fixable with --fix` : ""),
  );
  if (errors > 0) process.exit(1);
}

main().catch((error) => {
  console.error((error as Error).message || error);
  process.exit(1);
});
