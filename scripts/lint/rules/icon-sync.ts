import { isMap, isScalar, isSeq, parseDocument, type YAMLMap } from "yaml";

import type { LoadedTemplate } from "../../lib/registry.js";
import {
  columnOf,
  getPair,
  getServices,
  ICON_LABEL,
  insertAfterNode,
  renderScalar,
  replaceNode,
  writeCompose,
} from "../compose.js";
import type { Issue, Rule } from "../types.js";
import { parseImage } from "./image-latest.js";

const SELFHST = "https://cdn.jsdelivr.net/gh/selfhst/icons@main/svg";

/** Common sidecars get their own icon, matching what existing templates already do. */
const SIDECAR_ICONS: [RegExp, string][] = [
  [/(^|\/)(postgres|pgvector)$/, `${SELFHST}/postgresql.svg`],
  [/(^|\/)mariadb$/, `${SELFHST}/mariadb.svg`],
  [/(^|\/)mysql$/, `${SELFHST}/mysql.svg`],
  [/(^|\/)mongo$/, `${SELFHST}/mongodb.svg`],
  [/(^|\/)redis$/, `${SELFHST}/redis.svg`],
  [/(^|\/)valkey$/, `${SELFHST}/valkey.svg`],
  [/(^|\/)meilisearch$/, `${SELFHST}/meilisearch.svg`],
  [/(^|\/)clickhouse-server$/, `${SELFHST}/clickhouse.svg`],
];

function iconForService(service: YAMLMap, templateIcon: string): string {
  const image = service.get("image");
  if (typeof image !== "string") return templateIcon;
  const name = parseImage(image).name;
  return SIDECAR_ICONS.find(([pattern]) => pattern.test(name))?.[1] ?? templateIcon;
}

function hasIconLabel(labels: unknown): boolean {
  if (isMap(labels))
    return labels.items.some((pair) => isScalar(pair.key) && pair.key.value === ICON_LABEL);
  if (isSeq(labels)) {
    return labels.items.some(
      (item) => isScalar(item) && String(item.value).startsWith(`${ICON_LABEL}=`),
    );
  }
  return false;
}

/** Returns the source with one icon problem fixed, or null when nothing fixable is left. */
function fixOnce(template: LoadedTemplate, icon: string): string | null {
  const source = template.composeRaw;
  const doc = template.compose!;
  const xArcane = doc.get("x-arcane");

  if (!xArcane) {
    return `x-arcane:\n  icon: ${icon}\n\n${source}`;
  }
  if (isMap(xArcane)) {
    const iconPair = getPair(xArcane, "icon");
    const firstItem = xArcane.items[0];
    if (!iconPair && firstItem) {
      const first = firstItem.key as { range: [number, number, number] };
      const start = first.range[0];
      const indent = " ".repeat(columnOf(source, start));
      return `${source.slice(0, start)}icon: ${icon}\n${indent}${source.slice(start)}`;
    }
    if (iconPair && isScalar(iconPair.value) && iconPair.value.value !== icon) {
      return replaceNode(source, iconPair.value, renderScalar(iconPair.value, icon));
    }
  }

  for (const { node } of getServices(template)) {
    const serviceIcon = iconForService(node, icon);
    const labelsPair = getPair(node, "labels");
    if (!labelsPair) {
      const firstKey = node.items[0]?.key as { range: [number, number, number] } | undefined;
      if (!firstKey) continue;
      const indent = " ".repeat(columnOf(source, firstKey.range[0]));
      return insertAfterNode(
        source,
        node,
        `${indent}labels:\n${indent}  ${ICON_LABEL}: ${serviceIcon}\n`,
      );
    }

    const labels = labelsPair.value;
    if (hasIconLabel(labels)) continue;
    const firstLabel = isMap(labels) ? labels.items[0] : undefined;
    if (isMap(labels) && labels.flow !== true && firstLabel) {
      const firstKey = firstLabel.key as { range: [number, number, number] };
      const indent = " ".repeat(columnOf(source, firstKey.range[0]));
      return insertAfterNode(source, labels, `${indent}${ICON_LABEL}: ${serviceIcon}\n`);
    }
    if (isSeq(labels) && labels.flow !== true && labels.items.length > 0) {
      const first = labels.items[0] as { range: [number, number, number] };
      const indent = " ".repeat(Math.max(0, columnOf(source, first.range[0]) - 2));
      return insertAfterNode(source, labels, `${indent}- ${ICON_LABEL}=${serviceIcon}\n`);
    }
  }

  return null;
}

export const iconSync: Rule = {
  id: "icon-sync",
  severity: "error",
  description:
    "template.json icon_url is set, x-arcane.icon matches it, and every service has an icon label.",
  check(template) {
    const icon = template.meta?.icon_url;
    if (!template.compose) return [];
    if (!icon) return [{ message: "template.json is missing icon_url" }];

    const issues: Issue[] = [];
    const xIcon = template.compose.getIn(["x-arcane", "icon"]);
    if (xIcon !== icon) {
      issues.push({
        message: xIcon
          ? `x-arcane.icon (${JSON.stringify(xIcon)}) does not match template.json icon_url`
          : "x-arcane.icon is missing",
        fixable: true,
      });
    }

    for (const { name, node } of getServices(template)) {
      if (!hasIconLabel(node.get("labels"))) {
        issues.push({ message: `service "${name}" has no ${ICON_LABEL} label`, fixable: true });
      }
    }
    return issues;
  },
  async fix(template) {
    const icon = template.meta!.icon_url!;
    let current = template;
    for (let i = 0; i < 50; i++) {
      const next = fixOnce(current, icon);
      if (next === null) break;
      current = { ...current, composeRaw: next, compose: parseDocument(next) };
    }
    if (current !== template) await writeCompose(template, current.composeRaw);
  },
};
