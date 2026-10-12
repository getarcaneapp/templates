import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

import { exists } from "../../lib/registry.js";
import type { Rule } from "../types.js";

let dockerAvailable: boolean | undefined;

export function hasDockerCompose(): boolean {
  dockerAvailable ??= spawnSync("docker", ["compose", "version"]).status === 0;
  return dockerAvailable;
}

export const composeConfig: Rule = {
  id: "compose-config",
  severity: "error",
  description: "`docker compose config -q` accepts the template with .env.example as its .env.",
  async check(template) {
    if (!template.composeFile || template.envRaw === null || !hasDockerCompose()) return [];

    // Compose reads .env from the project directory; stand in .env.example when none exists.
    const envPath = path.join(template.dir, ".env");
    const createdEnv = !(await exists(envPath));
    if (createdEnv) await fs.writeFile(envPath, template.envRaw, "utf8");

    try {
      const result = spawnSync(
        "docker",
        [
          "compose",
          "--project-directory",
          template.dir,
          "-f",
          path.join(template.dir, template.composeFile),
          "--env-file",
          envPath,
          "config",
          "-q",
        ],
        { cwd: template.dir, encoding: "utf8" },
      );
      if (result.status === 0) return [];
      const output = [result.stdout, result.stderr].join("\n").trim();
      return [{ message: `docker compose config failed: ${output}` }];
    } finally {
      if (createdEnv) await fs.rm(envPath, { force: true });
    }
  },
};
