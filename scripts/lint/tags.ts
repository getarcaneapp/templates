import { readFileSync } from "node:fs";
import path from "node:path";

import { ROOT } from "../lib/registry.js";

export interface TagVocabulary {
  /** Allowed tag -> what it covers. */
  tags: Record<string, string>;
  /** Old or alternative spelling -> allowed tag, or null to drop it. */
  aliases: Record<string, string | null>;
}

export function loadTagVocabulary(): TagVocabulary {
  return JSON.parse(readFileSync(path.join(ROOT, "tags.json"), "utf8")) as TagVocabulary;
}

/** Map aliases onto allowed tags, dropping nulls and duplicates. Unknown tags are kept. */
export function normalizeTags(tags: string[], vocabulary: TagVocabulary): string[] {
  const result: string[] = [];
  for (const tag of tags) {
    const mapped = tag in vocabulary.aliases ? vocabulary.aliases[tag] : tag;
    if (mapped && !result.includes(mapped)) result.push(mapped);
  }
  return result;
}
