import type { LoadedTemplate } from "../lib/registry.js";

export type Severity = "error" | "warn";

export interface Issue {
  message: string;
  /** Overrides the rule's default severity for this issue. */
  severity?: Severity;
  /** `--fix` can resolve this issue. */
  fixable?: boolean;
}

export interface Rule {
  id: string;
  severity: Severity;
  description: string;
  check(template: LoadedTemplate): Issue[] | Promise<Issue[]>;
  /** Applies fixes on disk. Only called when check() reported a fixable issue. */
  fix?(template: LoadedTemplate): Promise<void>;
}
