import type { Rule } from "../types.js";
import { composeConfig } from "./compose-config.js";
import { composeFilename } from "./compose-filename.js";
import { envCoverage } from "./env-coverage.js";
import { iconSync } from "./icon-sync.js";
import { imageLatest } from "./image-latest.js";
import { noSecrets } from "./no-secrets.js";
import { readme } from "./readme.js";
import { restartPolicy } from "./restart-policy.js";
import { slug } from "./slug.js";
import { tagVocabulary } from "./tag-vocabulary.js";
import { templateJson } from "./template-json.js";

/** Order matters for --fix: renaming the compose file runs before rules that rewrite it. */
export const rules: Rule[] = [
  slug,
  templateJson,
  composeFilename,
  iconSync,
  imageLatest,
  tagVocabulary,
  envCoverage,
  noSecrets,
  restartPolicy,
  readme,
  composeConfig,
];
