#!/usr/bin/env node

import { createInterface } from "node:readline/promises";
import process from "node:process";

import { generateRegistryInternal } from "./lib/generate.js";
import {
  createTemplateInternal,
  defaultTemplateNameInternal,
  normalizeTemplateIdInternal,
  parseTagsInternal,
} from "./lib/template-scaffold.js";
import { COMPOSE_CANDIDATES, toSlug } from "./lib/registry.js";
import { stageBuildInternal } from "./lib/stage.js";
import {
  validateComposeFilesInternal,
  validateSchemaInternal,
} from "./lib/validation.js";

interface ParsedArgs {
  flags: Record<string, boolean | string | string[]>;
  positionals: string[];
}

function usageInternal(): string {
  return `arcane-templates

Usage:
  arcane-templates <command> [options]

Commands:
  create [id]       Scaffold a new template directory under templates/
  generate          Rebuild registry.json from templates/
  validate          Validate schema.json and docker compose files
  stage             Copy publishable assets into build/
  help              Show this help text

Create options:
  --name <value>            Human-readable template name
  --description <value>     Template description
  --author <value>          Template author (default: Community)
  --tag <value>             Tag value, repeatable or comma-separated
  --service <value>         Docker Compose service/container name
  --image <value>           Container image (default: ghcr.io/example/<id>:latest)
  --website <value>         Official website URL (default: https://example.com)
  --icon <value>            Arcane icon URL (default: https://example.com/icon.svg)
  --compose-file <value>    One of: ${COMPOSE_CANDIDATES.join(", ")}
  --readme / --no-readme    Include README.md scaffold (default: true)
  --yes                     Use defaults for any missing create values

Examples:
  pnpm run cli -- create my-awesome-template
  pnpm run cli -- create my-awesome-template --tag utility --tag dashboard
  pnpm run cli -- generate
`;
}

function addFlagValueInternal(
  flags: Record<string, boolean | string | string[]>,
  key: string,
  value: boolean | string,
): void {
  const existing = flags[key];
  if (existing === undefined) {
    flags[key] = value;
    return;
  }

  if (Array.isArray(existing)) {
    existing.push(String(value));
    return;
  }

  flags[key] = [String(existing), String(value)];
}

function parseArgsInternal(argv: string[]): ParsedArgs {
  const flags: Record<string, boolean | string | string[]> = {};
  const positionals: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) {
      positionals.push(value);
      continue;
    }

    if (value === "--") {
      positionals.push(...argv.slice(index + 1));
      break;
    }

    if (value.startsWith("--no-")) {
      flags[value.slice(5)] = false;
      continue;
    }

    const equalsIndex = value.indexOf("=");
    if (equalsIndex >= 0) {
      addFlagValueInternal(
        flags,
        value.slice(2, equalsIndex),
        value.slice(equalsIndex + 1),
      );
      continue;
    }

    const nextValue = argv[index + 1];
    if (nextValue && !nextValue.startsWith("--")) {
      addFlagValueInternal(flags, value.slice(2), nextValue);
      index += 1;
      continue;
    }

    flags[value.slice(2)] = true;
  }

  return { flags, positionals };
}

function readStringFlagInternal(
  parsed: ParsedArgs,
  name: string,
): string | undefined {
  const value = parsed.flags[name];
  if (Array.isArray(value)) {
    return value[value.length - 1];
  }
  if (typeof value === "string") {
    return value;
  }
  return undefined;
}

function readStringFlagsInternal(parsed: ParsedArgs, name: string): string[] {
  const value = parsed.flags[name];
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string") {
    return [value];
  }
  return [];
}

function readBooleanFlagInternal(
  parsed: ParsedArgs,
  name: string,
  fallback: boolean,
): boolean {
  const value = parsed.flags[name];
  if (typeof value === "boolean") {
    return value;
  }
  return fallback;
}

async function promptTextInternal(
  question: string,
  fallback: string,
): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const response = await rl.question(`${question} [${fallback}]: `);
    const trimmed = response.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  } finally {
    rl.close();
  }
}

async function promptBooleanInternal(
  question: string,
  fallback: boolean,
): Promise<boolean> {
  const suffix = fallback ? "Y/n" : "y/N";
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const response = await rl.question(`${question} [${suffix}]: `);
    const normalized = response.trim().toLowerCase();
    if (normalized.length === 0) {
      return fallback;
    }
    return normalized === "y" || normalized === "yes";
  } finally {
    rl.close();
  }
}

async function collectCreateOptionsInternal(
  parsed: ParsedArgs,
): Promise<Parameters<typeof createTemplateInternal>[0]> {
  const allowPrompts =
    process.stdin.isTTY && !readBooleanFlagInternal(parsed, "yes", false);
  const rawId =
    parsed.positionals[1] ||
    readStringFlagInternal(parsed, "id") ||
    (allowPrompts ? await promptTextInternal("Template id", "") : "");
  const id = normalizeTemplateIdInternal(rawId);

  if (id.length === 0) {
    throw new Error("Template id is required");
  }

  if (rawId !== id) {
    console.log(`Normalized template id to ${id}`);
  }

  const defaultName = defaultTemplateNameInternal(id);
  const defaultDescription = `Template scaffold for ${defaultName}.`;
  const defaultAuthor = "Community";
  const defaultService = toSlug(id);
  const defaultImage = `ghcr.io/example/${id}:latest`;
  const defaultWebsite = "https://example.com";
  const defaultIcon = "https://example.com/icon.svg";
  const defaultComposeFile = "compose.yaml";
  const defaultTags = ["general"];

  const tagsFromFlags = parseTagsInternal(
    readStringFlagsInternal(parsed, "tag"),
  );
  const tags =
    tagsFromFlags.length > 0
      ? tagsFromFlags
      : parseTagsInternal([
          allowPrompts
            ? await promptTextInternal("Tags (comma-separated)", "general")
            : defaultTags.join(","),
        ]);

  const includeReadme = allowPrompts
    ? await promptBooleanInternal(
        "Create README.md scaffold",
        readBooleanFlagInternal(parsed, "readme", true),
      )
    : readBooleanFlagInternal(parsed, "readme", true);

  const composeFileName = readStringFlagInternal(parsed, "compose-file")
    ? String(readStringFlagInternal(parsed, "compose-file"))
    : allowPrompts
      ? await promptTextInternal("Compose file name", defaultComposeFile)
      : defaultComposeFile;

  return {
    id,
    name: readStringFlagInternal(parsed, "name")
      ? String(readStringFlagInternal(parsed, "name"))
      : allowPrompts
        ? await promptTextInternal("Template name", defaultName)
        : defaultName,
    description: readStringFlagInternal(parsed, "description")
      ? String(readStringFlagInternal(parsed, "description"))
      : allowPrompts
        ? await promptTextInternal("Description", defaultDescription)
        : defaultDescription,
    author: readStringFlagInternal(parsed, "author")
      ? String(readStringFlagInternal(parsed, "author"))
      : allowPrompts
        ? await promptTextInternal("Author", defaultAuthor)
        : defaultAuthor,
    tags,
    serviceName: readStringFlagInternal(parsed, "service")
      ? String(readStringFlagInternal(parsed, "service"))
      : allowPrompts
        ? await promptTextInternal("Service name", defaultService)
        : defaultService,
    image: readStringFlagInternal(parsed, "image")
      ? String(readStringFlagInternal(parsed, "image"))
      : allowPrompts
        ? await promptTextInternal("Container image", defaultImage)
        : defaultImage,
    websiteUrl: readStringFlagInternal(parsed, "website")
      ? String(readStringFlagInternal(parsed, "website"))
      : allowPrompts
        ? await promptTextInternal("Website URL", defaultWebsite)
        : defaultWebsite,
    iconUrl: readStringFlagInternal(parsed, "icon")
      ? String(readStringFlagInternal(parsed, "icon"))
      : allowPrompts
        ? await promptTextInternal("Icon URL", defaultIcon)
        : defaultIcon,
    composeFileName,
    includeReadme,
  };
}

async function runCreateInternal(parsed: ParsedArgs): Promise<void> {
  const options = await collectCreateOptionsInternal(parsed);
  const files = await createTemplateInternal(options);

  console.log(`Created templates/${options.id}`);
  for (const file of files) {
    console.log(`- ${file.path}`);
  }
  console.log(
    "Next steps: review the scaffold, then run generate and validate.",
  );
}

async function runValidateInternal(parsed: ParsedArgs): Promise<void> {
  const skipSchema = readBooleanFlagInternal(parsed, "skip-schema", false);
  const skipCompose = readBooleanFlagInternal(parsed, "skip-compose", false);

  if (!skipSchema) {
    await validateSchemaInternal();
  }
  if (!skipCompose) {
    await validateComposeFilesInternal();
  }
}

async function runStageInternal(): Promise<void> {
  const buildDir = await stageBuildInternal();
  console.log(`Staged publishable assets in ${buildDir}`);
}

async function main(): Promise<void> {
  const parsed = parseArgsInternal(process.argv.slice(2));
  const command = parsed.positionals[0] || "help";

  if (
    command === "help" ||
    command === "--help" ||
    command === "-h" ||
    readBooleanFlagInternal(parsed, "help", false)
  ) {
    console.log(usageInternal());
    return;
  }

  if (command === "create") {
    await runCreateInternal(parsed);
    return;
  }

  if (command === "generate") {
    await generateRegistryInternal();
    return;
  }

  if (command === "validate") {
    await runValidateInternal(parsed);
    return;
  }

  if (command === "stage") {
    await runStageInternal();
    return;
  }

  throw new Error(`Unknown command "${command}"\n\n${usageInternal()}`);
}

main().catch((error) => {
  console.error((error as Error).message || error);
  process.exit(1);
});
