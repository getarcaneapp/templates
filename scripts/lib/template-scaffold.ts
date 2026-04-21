import { promises as fs } from "node:fs";
import path from "node:path";
import prettier from "prettier";

import {
  COMPOSE_CANDIDATES,
  TEMPLATES_DIR,
  exists,
  toSlug,
} from "./registry.js";

export interface CreateTemplateOptions {
  author: string;
  composeFileName: string;
  description: string;
  iconUrl: string;
  id: string;
  image: string;
  includeReadme: boolean;
  name: string;
  serviceName: string;
  tags: string[];
  websiteUrl: string;
}

export interface CreatedTemplateFile {
  path: string;
}

export function defaultTemplateNameInternal(id: string): string {
  return id
    .split("-")
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function normalizeTemplateIdInternal(value: string): string {
  return toSlug(value);
}

export function parseTagsInternal(values: string[]): string[] {
  const tags = values
    .flatMap((value) => value.split(","))
    .map((value) => toSlug(value))
    .filter((value) => value.length > 0);

  return [...new Set(tags)];
}

function validateCreateTemplateOptionsInternal(
  options: CreateTemplateOptions,
): void {
  if (options.id.length === 0) {
    throw new Error("Template id is required");
  }

  if (options.id !== toSlug(options.id)) {
    throw new Error("Template id must be lowercase and hyphenated");
  }

  if (
    !COMPOSE_CANDIDATES.some(
      (candidate) => candidate === options.composeFileName,
    )
  ) {
    throw new Error(
      `compose file must be one of: ${COMPOSE_CANDIDATES.join(", ")}`,
    );
  }

  if (options.tags.length === 0) {
    throw new Error("At least one tag is required");
  }
}

async function formatFileInternal(
  content: string,
  targetPath: string,
): Promise<string> {
  try {
    return await prettier.format(content, { filepath: targetPath });
  } catch {
    return content;
  }
}

function buildComposeFileInternal(options: CreateTemplateOptions): string {
  return `x-arcane:
  icon: ${options.iconUrl}
  urls:
    - ${options.websiteUrl}

services:
  ${options.serviceName}:
    image: ${options.image}
    container_name: ${options.serviceName}
    env_file: .env
    ports:
      - 3000:3000
    volumes:
      - /path/to/data:/data
    restart: unless-stopped
    labels:
      com.getarcaneapp.arcane.icon: ${options.iconUrl}
`;
}

function buildEnvExampleInternal(): string {
  return `PUID=1000
PGID=1000
TZ=America/Chicago
`;
}

function buildReadmeInternal(options: CreateTemplateOptions): string {
  return `# ${options.name}

${options.description}

[Official Website](${options.websiteUrl})
`;
}

export async function createTemplateInternal(
  options: CreateTemplateOptions,
): Promise<CreatedTemplateFile[]> {
  validateCreateTemplateOptionsInternal(options);

  const templateDir = path.join(TEMPLATES_DIR, options.id);
  if (await exists(templateDir)) {
    throw new Error(`templates/${options.id} already exists`);
  }

  await fs.mkdir(templateDir, { recursive: true });

  const files = [
    {
      path: path.join(templateDir, "template.json"),
      content: JSON.stringify(
        {
          name: options.name,
          description: options.description,
          version: "1.0.0",
          author: options.author,
          tags: options.tags,
        },
        null,
        2,
      ),
    },
    {
      path: path.join(templateDir, options.composeFileName),
      content: buildComposeFileInternal(options),
    },
    {
      path: path.join(templateDir, ".env.example"),
      content: buildEnvExampleInternal(),
    },
  ];

  if (options.includeReadme) {
    files.push({
      path: path.join(templateDir, "README.md"),
      content: buildReadmeInternal(options),
    });
  }

  for (const file of files) {
    const formatted = await formatFileInternal(file.content, file.path);
    await fs.writeFile(file.path, formatted, "utf8");
  }

  return files.map((file) => ({ path: file.path }));
}
