import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import prettier from "prettier";

const ROOT = process.cwd();
export const TEMPLATES_DIR = path.join(ROOT, "templates");

export type BumpPart = "major" | "minor" | "patch";

export interface TemplateMeta {
  name: string;
  description: string;
  version: string;
  author: string;
  tags: string[];
}

export interface TemplateEntry extends TemplateMeta {
  id: string;
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
  name: process.env.REGISTRY_NAME || "Arcane Community Templates",
  description:
    process.env.REGISTRY_DESCRIPTION ||
    "Community Docker Compose Templates for Arcane",
  author: process.env.REGISTRY_AUTHOR || "getarcaneapp",
  url: process.env.REGISTRY_URL || "https://github.com/getarcaneapp/templates",
} satisfies Omit<RegistryFile, "version" | "templates">;

const PUBLIC_BASE =
  process.env.PUBLIC_BASE || "https://registry.getarcane.app/templates";
const DOCS_BASE =
  process.env.DOCS_BASE || `${REGISTRY.url}/tree/main/templates`;
const SCHEMA_URL =
  process.env.SCHEMA_URL || "https://registry.getarcane.app/schema.json";

export function parseBumpPart(
  value: string | undefined,
  fallback: BumpPart,
): BumpPart {
  const normalized = value?.toLowerCase();
  if (
    normalized === "major" ||
    normalized === "minor" ||
    normalized === "patch"
  ) {
    return normalized;
  }

  return fallback;
}

const BUMP_PART = parseBumpPart(process.env.BUMP_PART, "minor");
const CHANGED_TEMPLATE_BUMP_PART = parseBumpPart(
  process.env.CHANGED_TEMPLATE_BUMP_PART,
  "patch",
);
export const COMPOSE_CANDIDATES = [
  "compose.yaml",
  "docker-compose.yml",
  "docker-compose.yaml",
  "compose.yml",
] as const;

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

  let [major, minor, patch] = match
    .slice(1)
    .map((segment) => parseInt(segment, 10));
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

export async function loadLocalRegistry(
  log = true,
): Promise<RegistryFile | null> {
  const localRegistryPath = path.join(ROOT, "registry.json");

  if (await exists(localRegistryPath)) {
    try {
      const data = JSON.parse(
        await fs.readFile(localRegistryPath, "utf8"),
      ) as RegistryFile;
      if (log) {
        console.log(
          `Found local registry.json version: ${data.version} with ${data.templates?.length ?? 0} templates`,
        );
      }
      return data;
    } catch (error) {
      if (log) {
        console.warn(
          `Could not parse local registry.json: ${(error as Error).message}`,
        );
      }
    }
  } else if (log) {
    console.log("No local registry.json found, starting fresh");
  }

  return null;
}

export async function findComposeFile(templateDir: string): Promise<string> {
  for (const candidate of COMPOSE_CANDIDATES) {
    if (await exists(path.join(templateDir, candidate))) {
      return candidate;
    }
  }

  throw new Error(
    `No compose file found in ${path.relative(ROOT, templateDir)} (looked for ${COMPOSE_CANDIDATES.join(", ")})`,
  );
}

async function buildTemplateContentHashInternal(
  templateDir: string,
  composeFile: string,
): Promise<string> {
  const hash = createHash("sha256");
  const sources = [
    "template.json",
    composeFile,
    ".env.example",
    "README.md",
  ] as const;

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

export async function buildTemplateEntry(
  dir: string,
  templateDir: string,
): Promise<TemplateEntry> {
  const id = toSlug(dir);
  const metaPath = path.join(templateDir, "template.json");
  if (!(await exists(metaPath))) {
    throw new Error(`Missing ${path.relative(ROOT, metaPath)} (required)`);
  }

  const meta = JSON.parse(
    await fs.readFile(metaPath, "utf8"),
  ) as Partial<TemplateMeta>;
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
    content_hash: await buildTemplateContentHashInternal(
      templateDir,
      composeFile,
    ),
    tags: Array.isArray(meta.tags) ? meta.tags.map(String) : [],
  };

  for (const key of ["name", "description", "version", "author"] as const) {
    if (!item[key] || typeof item[key] !== "string") {
      throw new Error(
        `templates/${dir}/template.json missing/invalid "${key}"`,
      );
    }
  }

  if (!Array.isArray(item.tags) || item.tags.length === 0) {
    throw new Error(
      `templates/${dir}/template.json must include non-empty "tags"`,
    );
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
  const previousById = new Map(
    previousTemplates.map((template) => [template.id, template]),
  );
  const currentById = new Map(
    currentTemplates.map((template) => [template.id, template]),
  );
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

export async function collectTemplates(): Promise<TemplateEntry[]> {
  const entries = await fs.readdir(TEMPLATES_DIR, { withFileTypes: true });
  const templateDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const templates: TemplateEntry[] = [];
  for (const dir of templateDirs) {
    const templateDir = path.join(TEMPLATES_DIR, dir);
    templates.push(await buildTemplateEntry(dir, templateDir));
  }

  return templates.sort((left, right) => left.id.localeCompare(right.id));
}

export async function buildRegistry(
  options: BuildRegistryOptions = {},
): Promise<RegistryFile> {
  const { log = true } = options;
  const previousRegistry = await loadLocalRegistry(log);
  const templates = await collectTemplates();
  const baseVersion =
    previousRegistry?.version || process.env.REGISTRY_VERSION || "1.0.0";
  const changes = detectTemplateChanges(
    previousRegistry?.templates || [],
    templates,
  );
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
      console.log(
        `No template changes detected -> keeping version ${baseVersion}`,
      );
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

export async function writeRegistryFile(
  registry: RegistryFile,
): Promise<string> {
  const outputPath = path.join(ROOT, "registry.json");
  const formatted = await prettier.format(JSON.stringify(registry), {
    filepath: outputPath,
  });
  await fs.writeFile(outputPath, formatted, "utf8");
  return outputPath;
}
