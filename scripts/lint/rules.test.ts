import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vite-plus/test";
import { parseDocument } from "yaml";

import { type LoadedTemplate, parseEnv, type TemplateMeta } from "../lib/registry.js";
import { findImageException } from "./image-exceptions.js";
import { composeFilename } from "./rules/compose-filename.js";
import { envCoverage, findVariables } from "./rules/env-coverage.js";
import { iconSync } from "./rules/icon-sync.js";
import { imageLatest, isChannelTag, parseImage } from "./rules/image-latest.js";
import { noSecrets } from "./rules/no-secrets.js";
import { readme } from "./rules/readme.js";
import { restartPolicy } from "./rules/restart-policy.js";
import { slug } from "./rules/slug.js";
import { tagVocabulary } from "./rules/tag-vocabulary.js";

const ICON = "https://cdn.jsdelivr.net/gh/selfhst/icons@main/svg/demo.svg";

interface Fixture {
  id?: string;
  compose?: string;
  composeFile?: string;
  env?: string | null;
  meta?: Partial<TemplateMeta>;
  readme?: string | null;
  dir?: string;
}

function template(fixture: Fixture = {}): LoadedTemplate {
  const compose =
    fixture.compose ??
    `x-arcane:\n  icon: ${ICON}\n\nservices:\n  app:\n    image: demo/app:latest\n    restart: unless-stopped\n    labels:\n      com.getarcaneapp.arcane.icon: ${ICON}\n`;
  const env = fixture.env === undefined ? "" : fixture.env;
  return {
    id: fixture.id ?? "demo",
    dir: fixture.dir ?? "/nonexistent",
    meta: {
      name: "Demo",
      description: "Demo app",
      author: "me",
      icon_url: ICON,
      tags: ["tools"],
      ...fixture.meta,
    },
    composeFile: fixture.composeFile ?? "compose.yaml",
    composeRaw: compose,
    compose: parseDocument(compose),
    envRaw: env,
    env: parseEnv(env ?? ""),
    readme: fixture.readme === undefined ? "# Demo\n\n## Deployment\n" : fixture.readme,
  };
}

const messages = async (rule: { check(t: LoadedTemplate): unknown }, t: LoadedTemplate) =>
  ((await rule.check(t)) as { message: string }[]).map((issue) => issue.message);

const tempDirs: string[] = [];
async function onDisk(fixture: Fixture): Promise<LoadedTemplate> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "lint-"));
  tempDirs.push(dir);
  const t = template({ ...fixture, dir });
  await fs.writeFile(path.join(dir, t.composeFile!), t.composeRaw);
  return t;
}
afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe("slug", () => {
  it("rejects uppercase and underscores", async () => {
    expect(await messages(slug, template({ id: "my-app" }))).toEqual([]);
    expect(await messages(slug, template({ id: "My_App" }))).toHaveLength(1);
  });
});

describe("compose-filename", () => {
  it("flags legacy names and renames them", async () => {
    const t = await onDisk({ composeFile: "docker-compose.yml" });
    expect(await composeFilename.check(t)).toEqual([
      { message: "rename docker-compose.yml to compose.yaml", fixable: true },
    ]);
    await composeFilename.fix!(t);
    expect(await fs.readdir(t.dir)).toEqual(["compose.yaml"]);
  });
});

describe("image-latest", () => {
  it("parses registry ports, tags and digests", () => {
    expect(parseImage("localhost:5000/app")).toEqual({
      name: "localhost:5000/app",
      tag: null,
      digest: null,
    });
    expect(parseImage("redis:bookworm@sha256:abc")).toEqual({
      name: "redis",
      tag: "bookworm",
      digest: "sha256:abc",
    });
  });

  it("accepts channel tags and their variants", () => {
    for (const tag of ["latest", "stable", "release", "latest-aio-cpu", "alpine-latest"]) {
      expect(isChannelTag(tag)).toBe(true);
    }
    expect(isChannelTag("2.10.0")).toBe(false);
  });

  it("allows pinned databases through Docker Hub prefixes", () => {
    expect(findImageException("docker.io/library/postgres")).toBeDefined();
    expect(findImageException("docker.io/valkey/valkey")).toBeDefined();
    expect(findImageException("caddy")).toBeUndefined();
  });

  it("rewrites untagged and pinned images, keeping quotes and skipping variables", async () => {
    const compose = [
      "services:",
      "  a:",
      "    image: demo/a",
      "  b:",
      '    image: "caddy:2.10.0"',
      "  c:",
      "    image: postgres:16",
      "  d:",
      "    image: demo/d:${TAG:-1.0}",
      "",
    ].join("\n");
    const t = await onDisk({ compose });
    expect(await imageLatest.check(t)).toHaveLength(2);
    await imageLatest.fix!(t);
    const fixed = await fs.readFile(path.join(t.dir, "compose.yaml"), "utf8");
    expect(fixed).toContain("image: demo/a:latest");
    expect(fixed).toContain('image: "caddy:latest"');
    expect(fixed).toContain("image: postgres:16");
    expect(fixed).toContain("image: demo/d:${TAG:-1.0}");
  });
});

describe("icon-sync", () => {
  it("requires icon_url", async () => {
    expect(await messages(iconSync, template({ meta: { icon_url: undefined } }))).toEqual([
      "template.json is missing icon_url",
    ]);
  });

  it("syncs x-arcane.icon and adds missing labels with sidecar icons", async () => {
    const compose = [
      "x-arcane:",
      "  icon: https://example.com/old.svg",
      "  urls:",
      "    - https://example.com",
      "",
      "services:",
      "  app:",
      "    image: demo/app:latest",
      "    labels:",
      "      traefik.enable: true",
      "",
      "  # the database",
      "  db:",
      "    image: postgres:16",
      "    restart: unless-stopped",
      "",
    ].join("\n");
    const t = await onDisk({ compose });
    expect(await messages(iconSync, t)).toHaveLength(3);

    await iconSync.fix!(t);
    const fixed = await fs.readFile(path.join(t.dir, "compose.yaml"), "utf8");
    const doc = parseDocument(fixed);
    expect(doc.getIn(["x-arcane", "icon"])).toBe(ICON);
    expect(doc.getIn(["services", "app", "labels", "com.getarcaneapp.arcane.icon"])).toBe(ICON);
    expect(doc.getIn(["services", "app", "labels", "traefik.enable"])).toBe(true);
    expect(doc.getIn(["services", "db", "labels", "com.getarcaneapp.arcane.icon"])).toMatch(
      /postgresql\.svg$/,
    );
    expect(fixed).toContain("# the database");
    expect(await messages(iconSync, template({ compose: fixed }))).toEqual([]);
  });

  it("adds to list-style labels", async () => {
    const compose = `x-arcane:\n  icon: ${ICON}\n\nservices:\n  app:\n    image: demo/app:latest\n    labels:\n      - traefik.enable=true\n`;
    const t = await onDisk({ compose });
    await iconSync.fix!(t);
    const fixed = await fs.readFile(path.join(t.dir, "compose.yaml"), "utf8");
    expect(fixed).toContain(`- com.getarcaneapp.arcane.icon=${ICON}`);
  });
});

describe("env-coverage", () => {
  it("parses variable forms", () => {
    expect(findVariables("${A} ${B:-x} ${C:?err} $D $${E} ${F-y}")).toEqual([
      { name: "A", hasDefault: false },
      { name: "B", hasDefault: true },
      { name: "C", hasDefault: false },
      { name: "D", hasDefault: false },
      { name: "F", hasDefault: true },
    ]);
  });

  it("requires variables without defaults and warns on unused ones", async () => {
    const compose =
      "services:\n  app:\n    image: demo:${TAG:-latest}\n    ports:\n      - ${PORT}:80\n";
    const issues = await envCoverage.check(template({ compose, env: "UNUSED=1\n" }));
    expect(issues).toEqual([
      { message: "${PORT} is used in compose but not defined in .env.example" },
      { message: "UNUSED is defined in .env.example but never used", severity: "warn" },
    ]);
  });

  it("does not report unused variables when a service loads env_file", async () => {
    const compose = "services:\n  app:\n    image: demo:latest\n    env_file: .env\n";
    expect(await envCoverage.check(template({ compose, env: "UNUSED=1\n" }))).toEqual([]);
  });
});

describe("no-secrets", () => {
  it("accepts empty values and placeholders", async () => {
    const env =
      "DB_PASSWORD=\nAPI_TOKEN=change-me\nJWT_SECRET=replace-with-random\nTOKEN_EXPIRY=24h\n";
    expect(await messages(noSecrets, template({ env }))).toEqual([]);
  });

  it("rejects real-looking credentials", async () => {
    expect(await messages(noSecrets, template({ env: "DB_PASSWORD=hunter2\n" }))).toHaveLength(1);
  });
});

describe("tag-vocabulary", () => {
  it("accepts vocabulary tags and flags aliases and unknown tags", async () => {
    expect(await tagVocabulary.check(template({ meta: { tags: ["media"] } }))).toEqual([]);
    const issues = await tagVocabulary.check(template({ meta: { tags: ["SQL", "not-a-tag"] } }));
    expect(issues[0]).toEqual({ message: 'tag "SQL" should be "database"', fixable: true });
    expect(issues[1]?.message).toMatch(/^tag "not-a-tag" is not in tags.json/);
  });
});

describe("restart-policy and readme", () => {
  it("warns about services without restart and missing deployment docs", async () => {
    const compose = "services:\n  app:\n    image: demo:latest\n";
    expect(await messages(restartPolicy, template({ compose }))).toEqual([
      'service "app" has no restart policy',
    ]);
    expect(await messages(readme, template({ readme: null }))).toEqual(["missing README.md"]);
    expect(await messages(readme, template({ readme: "# Demo\n" }))).toHaveLength(1);
  });
});
