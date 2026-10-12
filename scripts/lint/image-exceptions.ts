/**
 * Templates track `:latest`. These are the only exceptions.
 *
 * Patterns match the image name with any Docker Hub prefix (`docker.io/`, `docker.io/library/`,
 * `index.docker.io/`) removed. `*` matches within one path segment.
 */

/** Rolling tags that upstream publishes in place of (or alongside) `latest`. */
export const CHANNEL_TAGS = ["latest", "stable", "release"];

export interface ImageException {
  pattern: string;
  reason: string;
}

const STATEFUL = "major upgrades change the on-disk data format";

export const PINNED_IMAGES: ImageException[] = [
  { pattern: "postgres", reason: STATEFUL },
  { pattern: "pgvector/pgvector", reason: STATEFUL },
  { pattern: "ghcr.io/immich-app/postgres", reason: STATEFUL },
  { pattern: "mariadb", reason: STATEFUL },
  { pattern: "mysql", reason: STATEFUL },
  { pattern: "mongo", reason: STATEFUL },
  { pattern: "redis", reason: STATEFUL },
  { pattern: "valkey/valkey", reason: STATEFUL },
  { pattern: "clickhouse/clickhouse-server", reason: STATEFUL },
  { pattern: "getmeili/meilisearch", reason: STATEFUL },
  {
    pattern: "louislam/uptime-kuma",
    reason: "`latest` still points at v1; moving a v2 install to it downgrades the database",
  },
  { pattern: "ghcr.io/recyclarr/recyclarr", reason: "upstream does not publish a `latest` tag" },
];

const DOCKER_HUB_PREFIX =
  /^(?:(?:docker\.io|index\.docker\.io|registry-1\.docker\.io)\/)(?:library\/)?/;

export function normalizeImageName(name: string): string {
  return name.replace(DOCKER_HUB_PREFIX, "");
}

const toRegExp = (pattern: string): RegExp =>
  new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]+")}$`);

export function findImageException(name: string): ImageException | undefined {
  const normalized = normalizeImageName(name);
  return PINNED_IMAGES.find((exception) => toRegExp(exception.pattern).test(normalized));
}
