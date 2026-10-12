import { promises as fs } from "node:fs";
import path from "node:path";

import { writeFormatted } from "../compose.js";
import { loadTagVocabulary, normalizeTags } from "../tags.js";
import type { Issue, Rule } from "../types.js";

export const tagVocabulary: Rule = {
  id: "tag-vocabulary",
  severity: "error",
  description: "Tags come from tags.json.",
  check(template) {
    const tags = template.meta?.tags;
    if (!Array.isArray(tags)) return [];

    const vocabulary = loadTagVocabulary();
    const issues: Issue[] = [];
    for (const tag of tags) {
      if (tag in vocabulary.tags) continue;
      if (tag in vocabulary.aliases) {
        const target = vocabulary.aliases[tag];
        issues.push({
          message: target ? `tag "${tag}" should be "${target}"` : `tag "${tag}" should be removed`,
          fixable: true,
        });
      } else {
        issues.push({
          message: `tag "${tag}" is not in tags.json (allowed: ${Object.keys(vocabulary.tags).join(", ")})`,
        });
      }
    }
    if (tags.length > 0 && normalizeTags(tags, vocabulary).length === 0) {
      issues.push({ message: "no tags left after removing aliases; pick one from tags.json" });
    }
    return issues;
  },
  async fix(template) {
    const tags = normalizeTags(template.meta!.tags!, loadTagVocabulary());
    if (tags.length === 0) return;

    const filePath = path.join(template.dir, "template.json");
    const raw = await fs.readFile(filePath, "utf8");
    const updated = raw.replace(/"tags"\s*:\s*\[[^\]]*\]/, `"tags": ${JSON.stringify(tags)}`);
    await writeFormatted(filePath, updated);
  },
};
