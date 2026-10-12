import { describe, expect, it } from "vite-plus/test";

import {
  applyAutoVersions,
  bumpSemver,
  detectTemplateChanges,
  parseBumpPart,
  parseEnv,
  type TemplateEntry,
} from "./lib/registry.js";

const makeTemplate = (id: string, overrides: Partial<TemplateEntry> = {}): TemplateEntry => ({
  id,
  name: id,
  description: `${id} description`,
  version: "1.0.0",
  author: "Arcane",
  compose_url: `https://example.com/${id}/compose.yaml`,
  env_url: `https://example.com/${id}/.env.example`,
  documentation_url: `https://example.com/${id}`,
  content_hash: `${id}`.padEnd(64, "0").slice(0, 64),
  tags: ["tools"],
  ...overrides,
});

describe("bumpSemver", () => {
  it.each([
    ["1.0.0", "minor", "1.1.0"],
    ["1.1.0", "minor", "1.2.0"],
    ["1.1.0", "patch", "1.1.1"],
    ["1.1.0", "major", "2.0.0"],
    ["invalid", "minor", "1.0.0"],
    ["", "minor", "1.0.0"],
    ["1.2.3-beta.1", "minor", "1.3.0"],
  ] as const)("%s + %s = %s", (version, part, expected) => {
    expect(bumpSemver(version, part)).toBe(expected);
  });
});

describe("parseBumpPart", () => {
  it("accepts patch", () => expect(parseBumpPart("patch", "minor")).toBe("patch"));
  it("falls back for invalid input", () => expect(parseBumpPart("banana", "patch")).toBe("patch"));
});

describe("detectTemplateChanges", () => {
  it("new templates trigger a minor bump", () => {
    const result = detectTemplateChanges(
      [],
      [makeTemplate("template-a"), makeTemplate("template-b")],
    );
    expect(result).toEqual({
      addedIds: ["template-a", "template-b"],
      updatedIds: [],
      removedIds: [],
      bumpPart: "minor",
    });
  });

  it("content changes to an existing template trigger a patch bump", () => {
    const result = detectTemplateChanges(
      [makeTemplate("homepage")],
      [makeTemplate("homepage", { content_hash: "f".repeat(64) })],
    );
    expect(result).toEqual({
      addedIds: [],
      updatedIds: ["homepage"],
      removedIds: [],
      bumpPart: "patch",
    });
  });

  it("removed templates trigger a patch bump", () => {
    const result = detectTemplateChanges(
      [makeTemplate("homepage"), makeTemplate("old-template")],
      [makeTemplate("homepage")],
    );
    expect(result).toEqual({
      addedIds: [],
      updatedIds: [],
      removedIds: ["old-template"],
      bumpPart: "patch",
    });
  });

  it("added templates win over patch-only changes", () => {
    const result = detectTemplateChanges(
      [makeTemplate("homepage"), makeTemplate("old-template")],
      [makeTemplate("homepage", { content_hash: "f".repeat(64) }), makeTemplate("new-template")],
    );
    expect(result).toEqual({
      addedIds: ["new-template"],
      updatedIds: ["homepage"],
      removedIds: ["old-template"],
      bumpPart: "minor",
    });
  });

  it("no changes keep the current version", () => {
    const templates = [makeTemplate("homepage"), makeTemplate("jellyfin-server")];
    expect(detectTemplateChanges(templates, templates).bumpPart).toBeNull();
  });
});

describe("applyAutoVersions", () => {
  const previous = [makeTemplate("homepage", { version: "1.4.2" })];

  it("starts new templates at 1.0.0", () => {
    expect(applyAutoVersions([makeTemplate("fresh", { version: "" })], previous)[0]?.version).toBe(
      "1.0.0",
    );
  });

  it("keeps the previous version when the content is unchanged", () => {
    expect(
      applyAutoVersions([makeTemplate("homepage", { version: "" })], previous)[0]?.version,
    ).toBe("1.4.2");
  });

  it("bumps the patch version when the content changed", () => {
    const changed = makeTemplate("homepage", { version: "", content_hash: "f".repeat(64) });
    expect(applyAutoVersions([changed], previous)[0]?.version).toBe("1.4.3");
  });

  it("lets an explicit template.json version win", () => {
    const explicit = makeTemplate("homepage", { version: "2.0.0", content_hash: "f".repeat(64) });
    expect(applyAutoVersions([explicit], previous)[0]?.version).toBe("2.0.0");
  });
});

describe("parseEnv", () => {
  it("handles quotes, comments and export", () => {
    const env = parseEnv(
      [
        "# comment",
        "A=1",
        'B="two # not a comment"',
        "export C='three'",
        "D=four # trailing",
        "E=",
      ].join("\n"),
    );
    expect([...env]).toEqual([
      ["A", "1"],
      ["B", "two # not a comment"],
      ["C", "three"],
      ["D", "four"],
      ["E", ""],
    ]);
  });
});
