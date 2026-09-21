import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { toSlug } from "./lib/registry.js";

const COMPOSE_FILES = ["compose.yaml", "compose.yml", "docker-compose.yaml", "docker-compose.yml"];

export interface GeneratorOptions {
  input: string;
  outputDir: string;
  id?: string;
  name?: string;
  description?: string;
  author?: string;
  tags?: string[];
  force?: boolean;
}

interface TemplateMeta {
  name: string;
  description: string;
  version: string;
  author: string;
  tags: string[];
}

interface PortainerEntry {
  title?: string;
  name?: string;
  description?: string;
  note?: string;
  categories?: string[];
  logo?: string;
  repository?: { url?: string; stackfile?: string; composeFilePath?: string; branch?: string };
  composeFile?: string;
  composeFileUrl?: string;
  stackfile?: string;
  env?: Array<{ name?: string; label?: string; default?: string | number | boolean; description?: string }>;
}

const isUrl = (value: string): boolean => /^https?:\/\//i.test(value);
const isInside = (root: string, target: string): boolean => {
  const relative = path.relative(root, target);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
};

export function parseGeneratorArgs(argv: string[]): GeneratorOptions {
  const values = new Map<string, string>();
  const tags: string[] = [];
  let force = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--force") {
      force = true;
      continue;
    }
    if (!argument.startsWith("--") || index + 1 >= argv.length) {
      throw new Error(`Unknown or incomplete argument: ${argument}`);
    }
    const key = argument.slice(2);
    const value = argv[++index];
    if (key === "tag") {
      tags.push(...value.split(",").map((tag) => toSlug(tag)).filter(Boolean));
    } else {
      values.set(key, value);
    }
  }

  const input = values.get("input");
  if (!input) throw new Error("--input is required");
  return {
    input,
    outputDir: values.get("output") || path.join(process.cwd(), "templates"),
    id: values.get("id"),
    name: values.get("name"),
    description: values.get("description"),
    author: values.get("author"),
    tags: tags.length > 0 ? [...new Set(tags)] : undefined,
    force,
  };
}

async function readSource(input: string): Promise<string> {
  if (isUrl(input)) {
    const response = await fetch(input);
    if (!response.ok) throw new Error(`Could not download ${input}: HTTP ${response.status}`);
    return response.text();
  }
  return fs.readFile(input, "utf8");
}

async function findComposeFile(directory: string): Promise<string | undefined> {
  for (const filename of COMPOSE_FILES) {
    try {
      await fs.access(path.join(directory, filename));
      return filename;
    } catch {
      // Try the next conventional compose filename.
    }
  }
  return undefined;
}

function githubCloneUrl(input: string): string | undefined {
  const match = input.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/tree\/[^/?#]+)?(?:[#?].*)?$/i,
  );
  return match ? `https://github.com/${match[1]}/${match[2]}.git` : undefined;
}

async function materializeInput(input: string): Promise<{ directory: string; cleanup: () => Promise<void> }> {
  if (!isUrl(input)) {
    const stat = await fs.stat(input);
    if (stat.isDirectory()) return { directory: path.resolve(input), cleanup: async () => undefined };
    const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "arcane-template-"));
    const content = await fs.readFile(input, "utf8");
    if (path.extname(input).toLowerCase() === ".json") {
      try {
        JSON.parse(content);
        await fs.writeFile(path.join(temporary, "compose.yaml"), content, "utf8");
      } catch {
        await fs.copyFile(input, path.join(temporary, path.basename(input)));
      }
    } else {
      await fs.copyFile(input, path.join(temporary, path.basename(input)));
    }
    return { directory: temporary, cleanup: () => fs.rm(temporary, { recursive: true, force: true }) };
  }

  const cloneUrl = githubCloneUrl(input);
  if (!cloneUrl) throw new Error("URL input must be a GitHub repository or a Portainer registry JSON URL");
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "arcane-template-"));
  try {
    execFileSync("git", ["clone", "--depth", "1", cloneUrl, temporary], { stdio: "ignore" });
  } catch {
    await fs.rm(temporary, { recursive: true, force: true });
    throw new Error(`Could not clone GitHub repository ${input}`);
  }
  return { directory: temporary, cleanup: () => fs.rm(temporary, { recursive: true, force: true }) };
}

function metadataFromPortainer(entry: PortainerEntry, options: GeneratorOptions): TemplateMeta {
  const name = options.name || entry.title || entry.name || "Docker Compose application";
  const tags = options.tags || (entry.categories || []).map(toSlug).filter(Boolean);
  return {
    name,
    description: options.description || entry.description || entry.note || `${name} Docker Compose application`,
    version: "1.0.0",
    author: options.author || "Portainer community",
    tags: tags.length > 0 ? [...new Set(tags)] : ["docker", "compose"],
  };
}

function envExample(env: PortainerEntry["env"]): string {
  return (env || [])
    .filter((item) => item.name)
    .map((item) => `# ${item.description || item.label || item.name}\n${item.name}=${item.default ?? ""}`)
    .join("\n\n") + ((env || []).length > 0 ? "\n" : "");
}

async function writeTemplate(
  sourceDirectory: string,
  options: GeneratorOptions,
  entry?: PortainerEntry,
): Promise<string> {
  const composeFile = await findComposeFile(sourceDirectory);
  if (!composeFile) throw new Error(`No compose file found in ${sourceDirectory}`);

  const sourceMetaPath = path.join(sourceDirectory, "template.json");
  let sourceMeta: Partial<TemplateMeta> = {};
  try {
    sourceMeta = JSON.parse(await fs.readFile(sourceMetaPath, "utf8")) as Partial<TemplateMeta>;
  } catch {
    // Metadata is optional for imported compose projects.
  }

  const meta = entry
    ? metadataFromPortainer(entry, options)
    : {
        name: options.name || sourceMeta.name || path.basename(sourceDirectory),
        description:
          options.description || sourceMeta.description || `${options.name || path.basename(sourceDirectory)} Docker Compose application`,
        version: sourceMeta.version || "1.0.0",
        author: options.author || sourceMeta.author || "Community",
        tags: options.tags || sourceMeta.tags || ["docker", "compose"],
      };
  const id = toSlug(options.id || meta.name);
  if (!id) throw new Error("Could not derive a valid template id; pass --id");

  const destination = path.join(options.outputDir, id);
  if (!options.force) {
    try {
      await fs.access(destination);
      throw new Error(`Template ${id} already exists (use --force to replace it)`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  await fs.rm(destination, { recursive: true, force: true });
  await fs.mkdir(destination, { recursive: true });

  const compose = await fs.readFile(path.join(sourceDirectory, composeFile), "utf8");
  await fs.writeFile(path.join(destination, "compose.yaml"), compose, "utf8");
  const envPath = path.join(sourceDirectory, ".env.example");
  try {
    await fs.copyFile(envPath, path.join(destination, ".env.example"));
  } catch {
    await fs.writeFile(path.join(destination, ".env.example"), entry ? envExample(entry.env) : "", "utf8");
  }
  for (const filename of ["README.md"]) {
    try {
      await fs.copyFile(path.join(sourceDirectory, filename), path.join(destination, filename));
    } catch {
      // README is optional.
    }
  }
  await fs.writeFile(path.join(destination, "template.json"), `${JSON.stringify(meta, null, 2)}\n`, "utf8");
  return destination;
}

async function generatePortainerRegistry(input: string, options: GeneratorOptions): Promise<string[]> {
  const parsed = JSON.parse(await readSource(input)) as PortainerEntry[] | { templates?: PortainerEntry[] };
  const entries = Array.isArray(parsed) ? parsed : parsed.templates;
  if (!entries || entries.length === 0) throw new Error("Portainer registry does not contain a templates array");
  const generated: string[] = [];

  for (const [index, entry] of entries.entries()) {
    let directory: string | undefined;
    let cleanup: (() => Promise<void>) | undefined;
    try {
      const inlineCompose = entry.composeFile ?? entry.stackfile;
      if (inlineCompose) {
        const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "arcane-compose-"));
        directory = temporary;
        await fs.writeFile(path.join(temporary, "compose.yaml"), inlineCompose, "utf8");
        cleanup = () => fs.rm(temporary, { recursive: true, force: true });
      } else if (entry.composeFileUrl) {
        const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "arcane-compose-"));
        directory = temporary;
        await fs.writeFile(path.join(temporary, "compose.yaml"), await readSource(entry.composeFileUrl), "utf8");
        cleanup = () => fs.rm(temporary, { recursive: true, force: true });
      } else if (entry.repository?.url) {
        const repository = await materializeInput(entry.repository.url);
        cleanup = repository.cleanup;
        const composePath = entry.repository.stackfile || entry.repository.composeFilePath;
        if (composePath) {
          const sourceCompose = path.join(repository.directory, composePath);
          if (!isInside(repository.directory, sourceCompose)) {
            throw new Error(`Registry entry ${index + 1} points outside its cloned repository`);
          }
          const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "arcane-compose-"));
          cleanup = async () => {
            await repository.cleanup();
            await fs.rm(temporary, { recursive: true, force: true });
          };
          await fs.copyFile(sourceCompose, path.join(temporary, "compose.yaml"));
          directory = temporary;
        } else {
          directory = repository.directory;
        }
      } else {
        throw new Error(`Registry entry ${index + 1} has no composeFile, composeFileUrl, or repository`);
      }
      if (!directory) throw new Error(`Registry entry ${index + 1} could not be materialized`);
      generated.push(await writeTemplate(directory, { ...options, id: options.id && entries.length === 1 ? options.id : undefined }, entry));
    } finally {
      if (cleanup) await cleanup();
    }
  }
  return generated;
}

export async function generate(options: GeneratorOptions): Promise<string[]> {
  await fs.mkdir(options.outputDir, { recursive: true });
  const inputPath = isUrl(options.input) ? options.input : path.resolve(options.input);
  if (!githubCloneUrl(inputPath)) {
    try {
      const parsed = JSON.parse(await readSource(inputPath)) as unknown;
      if (Array.isArray(parsed) || (parsed && typeof parsed === "object" && "templates" in parsed)) {
        return generatePortainerRegistry(inputPath, options);
      }
    } catch {
      // A local JSON compose file is handled as a regular compose source below.
    }
  }

  const source = await materializeInput(inputPath);
  try {
    return [await writeTemplate(source.directory, options)];
  } finally {
    await source.cleanup();
  }
}

async function main(): Promise<void> {
  const generated = await generate(parseGeneratorArgs(process.argv.slice(2)));
  for (const directory of generated) console.log(`Generated ${path.relative(process.cwd(), directory)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error((error as Error).message || error);
    process.exitCode = 1;
  });
}
