import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

import Ajv from "ajv";
import addFormats from "ajv-formats";

import {
  buildRegistry,
  exists,
  findComposeFile,
  TEMPLATES_DIR,
} from "./lib/registry.js";

const ROOT = process.cwd();

function fail(message: string): never {
  throw new Error(message);
}

function run(command: string, args: string[], cwd: string): void {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: process.env,
  });

  if (result.status === 0) {
    return;
  }

  const output = [result.stdout, result.stderr]
    .filter((chunk) => chunk && chunk.trim().length > 0)
    .join("\n")
    .trim();

  fail(
    `${command} ${args.join(" ")} failed in ${path.relative(ROOT, cwd) || "."}\n${output}`,
  );
}

async function validateSchema(): Promise<void> {
  const schemaPath = path.join(ROOT, "schema.json");
  const schema = JSON.parse(await fs.readFile(schemaPath, "utf8")) as {
    $schema?: string;
  };
  const registry = await buildRegistry({ log: false });
  if (schema.$schema === "https://json-schema.org/draft-07/schema") {
    schema.$schema = "http://json-schema.org/draft-07/schema";
  }

  const ajv = new Ajv({
    allErrors: true,
    strict: false,
  });
  addFormats(ajv);

  const validate = ajv.compile(schema);
  if (!validate(registry)) {
    const details = (validate.errors || [])
      .map(
        (error) =>
          `${error.instancePath || "/"} ${error.message || "validation failed"}`,
      )
      .join("\n");
    fail(`Generated registry.json does not match schema.json\n${details}`);
  }

  console.log(
    `Schema validation passed for ${registry.templates.length} templates`,
  );
}

async function validateComposeFiles(): Promise<void> {
  const dockerCheck = spawnSync("docker", ["compose", "version"], {
    cwd: ROOT,
    encoding: "utf8",
    env: process.env,
  });
  if (dockerCheck.status !== 0) {
    fail("docker compose is required for compose validation");
  }

  const entries = await fs.readdir(TEMPLATES_DIR, { withFileTypes: true });
  const templateDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const dir of templateDirs) {
    const templateDir = path.join(TEMPLATES_DIR, dir);
    const composeFile = await findComposeFile(templateDir);
    const composePath = path.join(templateDir, composeFile);
    const envPath = path.join(templateDir, ".env");
    const envExamplePath = path.join(templateDir, ".env.example");
    const hasEnvFile = await exists(envPath);

    if (!hasEnvFile) {
      const envExample = await fs.readFile(envExamplePath, "utf8");
      await fs.writeFile(envPath, envExample, "utf8");
    }

    try {
      run(
        "docker",
        [
          "compose",
          "--project-directory",
          templateDir,
          "-f",
          composePath,
          "--env-file",
          envPath,
          "config",
          "-q",
        ],
        templateDir,
      );
      console.log(
        `Compose validation passed for templates/${dir}/${composeFile}`,
      );
    } finally {
      if (!hasEnvFile && (await exists(envPath))) {
        await fs.rm(envPath);
      }
    }
  }
}

async function main(): Promise<void> {
  await validateSchema();
  await validateComposeFiles();
}

main().catch((error) => {
  console.error((error as Error).message || error);
  process.exit(1);
});
