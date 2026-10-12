import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

import { COMPOSE_FILE, ROOT } from "../../lib/registry.js";
import type { Rule } from "../types.js";

const isTracked = (filePath: string): boolean =>
  spawnSync("git", ["ls-files", "--error-unmatch", filePath], { cwd: ROOT }).status === 0;

export const composeFilename: Rule = {
  id: "compose-filename",
  severity: "error",
  description: `Every template has exactly one compose file named ${COMPOSE_FILE}.`,
  check(template) {
    if (!template.composeFile) {
      return [{ message: `missing ${COMPOSE_FILE}` }];
    }
    if (template.composeFile !== COMPOSE_FILE) {
      return [{ message: `rename ${template.composeFile} to ${COMPOSE_FILE}`, fixable: true }];
    }
    return [];
  },
  async fix(template) {
    const from = path.join(template.dir, template.composeFile!);
    const to = path.join(template.dir, COMPOSE_FILE);
    if (isTracked(from)) {
      const result = spawnSync("git", ["mv", from, to], { cwd: ROOT, encoding: "utf8" });
      if (result.status !== 0) throw new Error(result.stderr);
    } else {
      await fs.rename(from, to);
    }
  },
};
