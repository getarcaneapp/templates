/**
 * Test suite for build-registry.ts version bumping logic.
 * Run with: pnpm tsx scripts/test-build-registry.ts
 */

import {
  bumpSemver,
  detectTemplateChanges,
  parseBumpPart,
  type TemplateEntry,
} from "./lib/registry.js";

// Test runner
let passed = 0;
let failed = 0;

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ ${name}`);
    console.error(`   ${(err as Error).message}`);
    failed++;
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${message || "Assertion failed"}\n   Expected: ${JSON.stringify(expected)}\n   Actual:   ${JSON.stringify(actual)}`,
    );
  }
}

const makeTemplate = (
  id: string,
  overrides: Partial<TemplateEntry> = {},
): TemplateEntry => ({
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

async function main(): Promise<void> {
  console.log("\n🧪 Testing bumpSemver function\n");

  await test("bumpSemver: minor bump from 1.0.0", () => {
    assertEqual(bumpSemver("1.0.0", "minor"), "1.1.0");
  });

  await test("bumpSemver: minor bump from 1.1.0", () => {
    assertEqual(bumpSemver("1.1.0", "minor"), "1.2.0");
  });

  await test("bumpSemver: patch bump from 1.1.0", () => {
    assertEqual(bumpSemver("1.1.0", "patch"), "1.1.1");
  });

  await test("bumpSemver: major bump from 1.1.0", () => {
    assertEqual(bumpSemver("1.1.0", "major"), "2.0.0");
  });

  await test("bumpSemver: handles invalid version", () => {
    assertEqual(bumpSemver("invalid", "minor"), "1.0.0");
  });

  await test("bumpSemver: handles empty string", () => {
    assertEqual(bumpSemver("", "minor"), "1.0.0");
  });

  await test("bumpSemver: handles prerelease version", () => {
    assertEqual(bumpSemver("1.2.3-beta.1", "minor"), "1.3.0");
  });

  console.log("\n🧪 Testing bump part parsing\n");

  await test("parseBumpPart: accepts patch", () => {
    assertEqual(parseBumpPart("patch", "minor"), "patch");
  });

  await test("parseBumpPart: falls back for invalid input", () => {
    assertEqual(parseBumpPart("banana", "patch"), "patch");
  });

  console.log("\n🧪 Testing template change detection\n");

  await test("New templates trigger a minor bump path", () => {
    const result = detectTemplateChanges(
      [],
      [makeTemplate("template-a"), makeTemplate("template-b")],
    );

    assertEqual(result.addedIds, ["template-a", "template-b"]);
    assertEqual(result.updatedIds, []);
    assertEqual(result.removedIds, []);
    assertEqual(result.bumpPart, "minor");
  });

  await test("Existing template content changes trigger a patch bump path", () => {
    const previous = [makeTemplate("homepage")];
    const current = [
      makeTemplate("homepage", { content_hash: "f".repeat(64) }),
    ];
    const result = detectTemplateChanges(previous, current);

    assertEqual(result.addedIds, []);
    assertEqual(result.updatedIds, ["homepage"]);
    assertEqual(result.removedIds, []);
    assertEqual(result.bumpPart, "patch");
  });

  await test("Removed templates also trigger a patch bump path", () => {
    const result = detectTemplateChanges(
      [makeTemplate("homepage"), makeTemplate("old-template")],
      [makeTemplate("homepage")],
    );

    assertEqual(result.addedIds, []);
    assertEqual(result.updatedIds, []);
    assertEqual(result.removedIds, ["old-template"]);
    assertEqual(result.bumpPart, "patch");
  });

  await test("Added templates win over patch-only changes", () => {
    const result = detectTemplateChanges(
      [makeTemplate("homepage"), makeTemplate("old-template")],
      [
        makeTemplate("homepage", { content_hash: "f".repeat(64) }),
        makeTemplate("new-template"),
      ],
    );

    assertEqual(result.addedIds, ["new-template"]);
    assertEqual(result.updatedIds, ["homepage"]);
    assertEqual(result.removedIds, ["old-template"]);
    assertEqual(result.bumpPart, "minor");
  });

  await test("No template changes keep the current version", () => {
    const result = detectTemplateChanges(
      [makeTemplate("homepage"), makeTemplate("jellyfin-server")],
      [makeTemplate("homepage"), makeTemplate("jellyfin-server")],
    );

    assertEqual(result.addedIds, []);
    assertEqual(result.updatedIds, []);
    assertEqual(result.removedIds, []);
    assertEqual(result.bumpPart, null);
  });

  console.log("\n" + "=".repeat(50));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error((error as Error).message || error);
  process.exit(1);
});
