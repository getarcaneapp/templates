import { promises as fs } from "node:fs";
import path from "node:path";

import { exists } from "./registry.js";

const ROOT = process.cwd();

async function copyFileIntoBuildInternal(fileName: string): Promise<void> {
  await fs.copyFile(
    path.join(ROOT, fileName),
    path.join(ROOT, "build", fileName),
  );
}

export async function stageBuildInternal(): Promise<string> {
  const buildDir = path.join(ROOT, "build");
  const templatesDir = path.join(ROOT, "templates");
  const publicDir = path.join(ROOT, "public");

  await fs.rm(buildDir, { recursive: true, force: true });
  await fs.mkdir(path.join(buildDir, "templates"), { recursive: true });

  await copyFileIntoBuildInternal("registry.json");
  await copyFileIntoBuildInternal("schema.json");

  if (await exists(publicDir)) {
    await fs.cp(publicDir, buildDir, { recursive: true, force: true });
  }

  await fs.cp(templatesDir, path.join(buildDir, "templates"), {
    recursive: true,
    force: true,
  });

  return buildDir;
}
