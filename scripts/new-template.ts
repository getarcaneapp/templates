/**
 * Scaffold a new template that passes `vp run lint:templates`.
 *
 *   vp run new my-app
 *   vp run new my-app --name "My App" --image ghcr.io/me/my-app --port 8080 --tags tools,files
 *
 * Any value not passed as a flag is prompted for. Pass --yes to accept defaults without prompting.
 */
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";

import { COMPOSE_FILE, exists, ROOT, TEMPLATES_DIR } from "./lib/registry.js";
import { writeFormatted } from "./lint/compose.js";
import { parseImage } from "./lint/rules/image-latest.js";
import { loadTagVocabulary } from "./lint/tags.js";

const SELFHST = "https://cdn.jsdelivr.net/gh/selfhst/icons@main/svg";

interface Answers {
  name: string;
  description: string;
  author: string;
  image: string;
  port: string;
  url: string;
  icon: string;
  tags: string[];
}

function parseFlags(argv: string[]): { id?: string; flags: Map<string, string>; yes: boolean } {
  const flags = new Map<string, string>();
  let id: string | undefined;
  let yes = false;
  // One iterator, so a flag can consume the value that follows it.
  const args = argv.values();
  for (const arg of args) {
    if (arg === "--yes" || arg === "-y") yes = true;
    else if (arg.startsWith("--")) flags.set(arg.slice(2), args.next().value ?? "");
    else id ??= arg;
  }
  return { id, flags, yes };
}

const titleCase = (id: string) =>
  id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

/** Strip any tag so the template tracks :latest. Variables are left alone. */
function latestImage(image: string): string {
  return image.includes("$") ? image : `${parseImage(image).name}:latest`;
}

async function iconExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

function gitUser(): string {
  const result = spawnSync("git", ["config", "user.name"], { encoding: "utf8" });
  return result.stdout.trim() || "getarcaneapp";
}

async function collectAnswers(
  id: string,
  flags: Map<string, string>,
  yes: boolean,
): Promise<Answers> {
  const vocabulary = loadTagVocabulary();
  const rl = yes ? null : createInterface({ input: process.stdin, output: process.stdout });
  const ask = async (key: string, question: string, fallback: string): Promise<string> => {
    if (flags.has(key)) return flags.get(key)!;
    if (!rl) return fallback;
    const answer = (await rl.question(`${question}${fallback ? ` (${fallback})` : ""}: `)).trim();
    return answer || fallback;
  };

  try {
    const name = await ask("name", "Display name", titleCase(id));
    const description = await ask("description", "One-line description", `${name} on Docker.`);
    const author = await ask("author", "Author", gitUser());
    const image = latestImage(
      await ask("image", "Image (any tag is replaced with :latest)", `${id}/${id}`),
    );
    const port = await ask("port", "Container port of the web UI", "8080");
    const url = await ask("url", "Project or documentation URL", `https://github.com/${id}/${id}`);
    const icon = await ask("icon", "Icon URL", `${SELFHST}/${id}.svg`);

    if (rl) console.log(`\nTags: ${Object.keys(vocabulary.tags).join(", ")}`);
    const tags = (await ask("tags", "Tags, comma-separated", "tools"))
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const unknown = tags.filter((tag) => !(tag in vocabulary.tags));
    if (unknown.length > 0)
      throw new Error(`Unknown tag(s): ${unknown.join(", ")} (see tags.json)`);

    return { name, description, author, image, port, url, icon, tags };
  } finally {
    rl?.close();
  }
}

function render(id: string, answers: Answers) {
  const { name, description, author, image, port, url, icon, tags } = answers;

  const templateJson = `${JSON.stringify(
    { name, description, author, icon_url: icon, tags },
    null,
    2,
  )}\n`;

  const compose = `x-arcane:
  icon: ${icon}
  urls:
    - ${url}

services:
  ${id}:
    image: ${image}
    restart: unless-stopped
    ports:
      - "\${APP_PORT:-${port}}:${port}"
    user: "\${PUID:-1000}:\${PGID:-1000}"
    environment:
      TZ: \${TZ:-Etc/UTC}
    volumes:
      - \${BASE_PATH}/config:/config
    labels:
      com.getarcaneapp.arcane.icon: ${icon}
`;

  const env = `APP_PORT=${port}
BASE_PATH=/data/compose/${id}

PUID=1000
PGID=1000
TZ=Etc/UTC
`;

  const readme = `# ${name}

${description}

## Deployment

Copy \`.env.example\` to \`.env\` (or enter its values in Arcane), set paths and credentials, and deploy \`compose.yaml\`. Open \`http://HOST:APP_PORT\` (default \`${port}\`).

Create \`\${BASE_PATH}/config\` writable by \`PUID:PGID\`.

<!-- Describe first-run steps, persisted data, and anything the template deliberately leaves out. -->

## Upstream documentation

- [${name}](${url})
`;

  return {
    "template.json": templateJson,
    [COMPOSE_FILE]: compose,
    ".env.example": env,
    "README.md": readme,
  };
}

async function main(): Promise<void> {
  const { id, flags, yes } = parseFlags(process.argv.slice(2));
  if (!id)
    throw new Error(
      "Usage: vp run new <id> [--name ...] [--image ...] [--port ...] [--tags a,b] [--yes]",
    );
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error(`Template id "${id}" must match ^[a-z0-9-]+$`);

  const dir = path.join(TEMPLATES_DIR, id);
  if (await exists(dir)) throw new Error(`templates/${id} already exists`);

  const answers = await collectAnswers(id, flags, yes);
  if (!(await iconExists(answers.icon))) {
    console.warn(
      `\nWarning: ${answers.icon} did not load; set icon_url in template.json to a working icon.`,
    );
  }

  await fs.mkdir(dir, { recursive: true });
  for (const [file, contents] of Object.entries(render(id, answers))) {
    const filePath = path.join(dir, file);
    if (file === ".env.example") await fs.writeFile(filePath, contents, "utf8");
    else await writeFormatted(filePath, contents);
  }

  console.log(`\nCreated templates/${id}/. Checking it:\n`);
  const lint = spawnSync(process.execPath, [...process.execArgv, "scripts/lint-templates.ts", id], {
    cwd: ROOT,
    stdio: "inherit",
  });
  console.log(
    `\nNext: edit templates/${id}/compose.yaml for the app's real volumes and settings, fill in README.md, then run \`vp run lint:templates ${id}\`.`,
  );
  process.exit(lint.status ?? 1);
}

main().catch((error) => {
  console.error((error as Error).message || error);
  process.exit(1);
});
