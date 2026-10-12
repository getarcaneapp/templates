import { createHash } from "node:crypto";
import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { format } from "vite-plus/fmt";
import { type Document, parseDocument } from "yaml";

// Walk up from the working directory so scripts run from the repo root and the site
// (which builds from site/) resolve the same templates directory.
function findRepoRoot(start: string): string {
  let dir = path.resolve(start);
  while (true) {
    if (existsSync(path.join(dir, "schema.json")) && existsSync(path.join(dir, "templates"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return path.resolve(start);
    dir = parent;
  }
}

export const ROOT = findRepoRoot(process.cwd());
export const TEMPLATES_DIR = path.join(ROOT, "templates");

export type BumpPart = "major" | "minor" | "patch";

export interface TemplateMeta {
  name: string;
  description: string;
  /** Optional: when omitted, the generator derives it from the previous registry entry. */
  version?: string;
  author: string;
  icon_url?: string;
  tags: string[];
}

export interface TemplateEntry extends TemplateMeta {
  id: string;
  version: string;
  compose_url: string;
  env_url: string;
  documentation_url: string;
  content_hash: string;
}

export interface RegistryFile {
  $schema?: string;
  name: string;
  description: string;
  version: string;
  author: string;
  url: string;
  templates: TemplateEntry[];
}

interface BuildRegistryOptions {
  log?: boolean;
}

const REGISTRY = {
  name: process.env["REGISTRY_NAME"] || "Arcane Community Templates",
  description:
    process.env["REGISTRY_DESCRIPTION"] || "Community Docker Compose Templates for Arcane",
  author: process.env["REGISTRY_AUTHOR"] || "getarcaneapp",
  url: process.env["REGISTRY_URL"] || "https://github.com/getarcaneapp/templates",
} satisfies Omit<RegistryFile, "version" | "templates">;

const PUBLIC_BASE = process.env["PUBLIC_BASE"] || "https://registry.getarcane.app/templates";
const DOCS_BASE = process.env["DOCS_BASE"] || `${REGISTRY.url}/tree/main/templates`;
const SCHEMA_URL = process.env["SCHEMA_URL"] || "https://registry.getarcane.app/schema.json";

export function parseBumpPart(value: string | undefined, fallback: BumpPart): BumpPart {
  const normalized = value?.toLowerCase();
  if (normalized === "major" || normalized === "minor" || normalized === "patch") {
    return normalized;
  }

  return fallback;
}

const BUMP_PART = parseBumpPart(process.env["BUMP_PART"], "minor");
const CHANGED_TEMPLATE_BUMP_PART = parseBumpPart(
  process.env["CHANGED_TEMPLATE_BUMP_PART"],
  "patch",
);
export const COMPOSE_FILE = "compose.yaml";
/** Older names the linter recognizes so `lint:templates --fix` can rename them. */
export const LEGACY_COMPOSE_FILES = ["compose.yml", "docker-compose.yml", "docker-compose.yaml"];

export const exists = async (targetPath: string): Promise<boolean> =>
  !!(await fs.stat(targetPath).catch(() => null));

export const toSlug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");

export function bumpSemver(version: string, part: BumpPart = "minor"): string {
  const match = String(version).match(/^(\d+)\.(\d+)\.(\d+)(?:[.-].*)?$/);
  if (!match) return "1.0.0";

  let major = Number(match[1]);
  let minor = Number(match[2]);
  let patch = Number(match[3]);
  if (part === "major") {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (part === "patch") {
    patch += 1;
  } else {
    minor += 1;
    patch = 0;
  }

  return `${major}.${minor}.${patch}`;
}

export async function loadLocalRegistry(log = true): Promise<RegistryFile | null> {
  const localRegistryPath = path.join(ROOT, "registry.json");

  if (await exists(localRegistryPath)) {
    try {
      const data = JSON.parse(await fs.readFile(localRegistryPath, "utf8")) as RegistryFile;
      if (log) {
        console.log(
          `Found local registry.json version: ${data.version} with ${data.templates?.length ?? 0} templates`,
        );
      }
      return data;
    } catch (error) {
      if (log) {
        console.warn(`Could not parse local registry.json: ${(error as Error).message}`);
      }
    }
  } else if (log) {
    console.log("No local registry.json found, starting fresh");
  }

  return null;
}

export async function findComposeFile(templateDir: string): Promise<string> {
  if (await exists(path.join(templateDir, COMPOSE_FILE))) {
    return COMPOSE_FILE;
  }

  const relative = path.relative(ROOT, templateDir);
  for (const legacy of LEGACY_COMPOSE_FILES) {
    if (await exists(path.join(templateDir, legacy))) {
      throw new Error(
        `${relative}/${legacy} must be named ${COMPOSE_FILE} (run \`vp run lint:templates --fix\`)`,
      );
    }
  }

  throw new Error(`No ${COMPOSE_FILE} found in ${relative}`);
}

export interface LoadedTemplate {
  id: string;
  dir: string;
  meta: Partial<TemplateMeta> | null;
  metaError?: string;
  /** Actual compose filename on disk, which may be a legacy name. */
  composeFile: string | null;
  composeRaw: string;
  compose: Document.Parsed | null;
  envRaw: string | null;
  env: Map<string, string>;
  readme: string | null;
}

const readOptional = (filePath: string): Promise<string | null> =>
  fs.readFile(filePath, "utf8").catch(() => null);

/** Parse a dotenv file: `KEY=value`, optional quotes, and ` #` trailing comments. */
export function parseEnv(raw: string): Map<string, string> {
  const env = new Map<string, string>();
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/);
    if (!match?.[1]) continue;

    let value = (match[2] ?? "").trim();
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.indexOf(quote, 1) > 0) {
      value = value.slice(1, value.indexOf(quote, 1));
    } else {
      value = value.replace(/(^|\s)#.*$/, "").trim();
    }
    env.set(match[1], value);
  }
  return env;
}

/** Read every source file of a template into one object for the linter and the site. */
export async function loadTemplate(dir: string): Promise<LoadedTemplate> {
  const templateDir = path.join(TEMPLATES_DIR, dir);
  const names = [COMPOSE_FILE, ...LEGACY_COMPOSE_FILES];
  let composeFile: string | null = null;
  for (const name of names) {
    if (await exists(path.join(templateDir, name))) {
      composeFile = name;
      break;
    }
  }

  let meta: Partial<TemplateMeta> | null = null;
  let metaError: string | undefined;
  const metaRaw = await readOptional(path.join(templateDir, "template.json"));
  if (metaRaw === null) {
    metaError = "template.json is missing";
  } else {
    try {
      meta = JSON.parse(metaRaw) as Partial<TemplateMeta>;
    } catch (error) {
      metaError = `template.json is not valid JSON: ${(error as Error).message}`;
    }
  }

  const composeRaw = composeFile
    ? await fs.readFile(path.join(templateDir, composeFile), "utf8")
    : "";
  const envRaw = await readOptional(path.join(templateDir, ".env.example"));

  return {
    id: dir,
    dir: templateDir,
    meta,
    metaError,
    composeFile,
    composeRaw,
    compose: composeFile ? parseDocument(composeRaw) : null,
    envRaw,
    env: parseEnv(envRaw ?? ""),
    readme: await readOptional(path.join(templateDir, "README.md")),
  };
}

export async function listTemplateDirs(): Promise<string[]> {
  const entries = await fs.readdir(TEMPLATES_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function buildTemplateContentHashInternal(
  templateDir: string,
  composeFile: string,
): Promise<string> {
  const hash = createHash("sha256");
  const sources = ["template.json", composeFile, ".env.example", "README.md"] as const;

  for (const source of sources) {
    const sourcePath = path.join(templateDir, source);
    if (!(await exists(sourcePath))) {
      continue;
    }

    const content = await fs.readFile(sourcePath, "utf8");
    hash.update(`${source}\n${content.length}\n`);
    hash.update(content);
    hash.update("\n");
  }

  return hash.digest("hex");
}

export async function buildTemplateEntry(dir: string, templateDir: string): Promise<TemplateEntry> {
  const id = toSlug(dir);
  const metaPath = path.join(templateDir, "template.json");
  if (!(await exists(metaPath))) {
    throw new Error(`Missing ${path.relative(ROOT, metaPath)} (required)`);
  }

  const meta = JSON.parse(await fs.readFile(metaPath, "utf8")) as Partial<TemplateMeta>;
  const composeFile = await findComposeFile(templateDir);
  const envExamplePath = path.join(templateDir, ".env.example");
  if (!(await exists(envExamplePath))) {
    throw new Error(`Missing ${path.relative(ROOT, envExamplePath)}`);
  }

  const item: TemplateEntry = {
    id,
    name: String(meta.name || ""),
    description: String(meta.description || ""),
    version: String(meta.version || ""),
    author: String(meta.author || ""),
    compose_url: `${PUBLIC_BASE}/${id}/${composeFile}`,
    env_url: `${PUBLIC_BASE}/${id}/.env.example`,
    documentation_url: `${DOCS_BASE}/${id}`,
    ...(meta.icon_url ? { icon_url: String(meta.icon_url) } : {}),
    content_hash: await buildTemplateContentHashInternal(templateDir, composeFile),
    tags: Array.isArray(meta.tags) ? meta.tags.map(String) : [],
  };

  for (const key of ["name", "description", "author"] as const) {
    if (!item[key] || typeof item[key] !== "string") {
      throw new Error(`templates/${dir}/template.json missing/invalid "${key}"`);
    }
  }

  if (!Array.isArray(item.tags) || item.tags.length === 0) {
    throw new Error(`templates/${dir}/template.json must include non-empty "tags"`);
  }

  return item;
}

export interface TemplateChangeSummary {
  addedIds: string[];
  updatedIds: string[];
  removedIds: string[];
  bumpPart: BumpPart | null;
}

export function detectTemplateChanges(
  previousTemplates: TemplateEntry[] = [],
  currentTemplates: TemplateEntry[],
): TemplateChangeSummary {
  const previousById = new Map(previousTemplates.map((template) => [template.id, template]));
  const currentById = new Map(currentTemplates.map((template) => [template.id, template]));
  const addedIds: string[] = [];
  const updatedIds: string[] = [];

  for (const template of currentTemplates) {
    const previousTemplate = previousById.get(template.id);
    if (!previousTemplate) {
      addedIds.push(template.id);
      continue;
    }

    if (previousTemplate.content_hash !== template.content_hash) {
      updatedIds.push(template.id);
    }
  }

  const removedIds = previousTemplates
    .map((template) => template.id)
    .filter((id) => !currentById.has(id));

  let bumpPart: BumpPart | null = null;
  if (addedIds.length > 0) {
    bumpPart = BUMP_PART;
  } else if (updatedIds.length > 0 || removedIds.length > 0) {
    bumpPart = CHANGED_TEMPLATE_BUMP_PART;
  }

  return { addedIds, updatedIds, removedIds, bumpPart };
}

/**
 * Fill in versions for templates whose template.json omits `version`: new templates start
 * at 1.0.0, changed templates get a patch bump over their previous registry version, and
 * unchanged templates keep it. A version written in template.json always wins.
 */
export function applyAutoVersions(
  templates: TemplateEntry[],
  previousTemplates: TemplateEntry[] = [],
): TemplateEntry[] {
  const previousById = new Map(previousTemplates.map((template) => [template.id, template]));
  return templates.map((template) => {
    if (template.version) return template;

    const previous = previousById.get(template.id);
    let version = "1.0.0";
    if (previous) {
      version =
        previous.content_hash === template.content_hash
          ? previous.version
          : bumpSemver(previous.version, "patch");
    }
    return { ...template, version };
  });
}

export async function collectTemplates(): Promise<TemplateEntry[]> {
  const templateDirs = await listTemplateDirs();

  const templates: TemplateEntry[] = [];
  for (const dir of templateDirs) {
    const templateDir = path.join(TEMPLATES_DIR, dir);
    templates.push(await buildTemplateEntry(dir, templateDir));
  }

  return templates.sort((left, right) => left.id.localeCompare(right.id));
}

export async function buildRegistry(options: BuildRegistryOptions = {}): Promise<RegistryFile> {
  const { log = true } = options;
  const previousRegistry = await loadLocalRegistry(log);
  const templates = applyAutoVersions(await collectTemplates(), previousRegistry?.templates || []);
  const baseVersion = previousRegistry?.version || process.env["REGISTRY_VERSION"] || "1.0.0";
  const changes = detectTemplateChanges(previousRegistry?.templates || [], templates);
  const nextVersion = changes.bumpPart
    ? bumpSemver(String(baseVersion), changes.bumpPart)
    : String(baseVersion);

  if (log) {
    if (changes.addedIds.length > 0) {
      const details = [
        `added ${changes.addedIds.length} template(s): ${changes.addedIds.join(", ")}`,
      ];
      if (changes.updatedIds.length > 0) {
        details.push(
          `updated ${changes.updatedIds.length} template(s): ${changes.updatedIds.join(", ")}`,
        );
      }
      if (changes.removedIds.length > 0) {
        details.push(
          `removed ${changes.removedIds.length} template(s): ${changes.removedIds.join(", ")}`,
        );
      }
      console.log(
        `Detected template changes -> ${details.join(" | ")} -> bumping ${changes.bumpPart} to ${nextVersion}`,
      );
    } else if (changes.updatedIds.length > 0 || changes.removedIds.length > 0) {
      const details = [];
      if (changes.updatedIds.length > 0) {
        details.push(
          `updated ${changes.updatedIds.length} template(s): ${changes.updatedIds.join(", ")}`,
        );
      }
      if (changes.removedIds.length > 0) {
        details.push(
          `removed ${changes.removedIds.length} template(s): ${changes.removedIds.join(", ")}`,
        );
      }
      console.log(
        `Detected template changes -> ${details.join(" | ")} -> bumping ${changes.bumpPart} to ${nextVersion}`,
      );
    } else {
      console.log(`No template changes detected -> keeping version ${baseVersion}`);
    }
  }

  return {
    $schema: SCHEMA_URL,
    name: previousRegistry?.name ?? REGISTRY.name,
    description: previousRegistry?.description ?? REGISTRY.description,
    author: previousRegistry?.author ?? REGISTRY.author,
    url: previousRegistry?.url ?? REGISTRY.url,
    version: nextVersion,
    templates,
  };
}

export async function writeRegistryFile(registry: RegistryFile): Promise<string> {
  const outputPath = path.join(ROOT, "registry.json");
  const result = await format(outputPath, `${JSON.stringify(registry, null, 2)}\n`);
  if (result.errors.length > 0) {
    throw new Error(`Could not format ${path.relative(ROOT, outputPath)} with Oxfmt`);
  }

  await fs.writeFile(outputPath, result.code, "utf8");
  return outputPath;
}
