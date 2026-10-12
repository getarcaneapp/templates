import { promises as fs } from "node:fs";
import path from "node:path";
import { format } from "vite-plus/fmt";
import { isMap, isScalar, isSeq, type Node, type Pair, type Scalar, type YAMLMap } from "yaml";

import type { LoadedTemplate } from "../lib/registry.js";

export const ICON_LABEL = "com.getarcaneapp.arcane.icon";

export interface ServiceNode {
  name: string;
  node: YAMLMap;
}

export function getServices(template: LoadedTemplate): ServiceNode[] {
  const services = template.compose?.get("services");
  if (!isMap(services)) return [];

  return services.items.flatMap((pair) => {
    const name = isScalar(pair.key) ? String(pair.key.value) : "";
    return isMap(pair.value) ? [{ name, node: pair.value }] : [];
  });
}

export function getPair(map: YAMLMap, key: string): Pair | undefined {
  return map.items.find((pair) => isScalar(pair.key) && pair.key.value === key) as Pair | undefined;
}

/** Render a string the same way the existing scalar was quoted. */
export function renderScalar(scalar: Scalar, value: string): string {
  if (scalar.type === "QUOTE_DOUBLE") return JSON.stringify(value);
  if (scalar.type === "QUOTE_SINGLE") return `'${value.replace(/'/g, "''")}'`;
  return value;
}

export function columnOf(source: string, offset: number): number {
  return offset - (source.lastIndexOf("\n", offset - 1) + 1);
}

export function replaceNode(source: string, node: Node, text: string): string {
  const [start, end] = node.range!;
  return source.slice(0, start) + text + source.slice(end);
}

/** Insert whole lines directly after the last line of a block node's value. */
export function insertAfterNode(source: string, node: Node, lines: string): string {
  let end = node.range![1];
  while (end > 0 && /\s/.test(source[end - 1] ?? "")) end--;
  const lineEnd = source.indexOf("\n", end);
  if (lineEnd === -1) return `${source}\n${lines}`;
  return source.slice(0, lineEnd + 1) + lines + source.slice(lineEnd + 1);
}

/** Collect every string scalar (keys and values) in the compose document. */
export function collectStrings(node: unknown, out: string[] = []): string[] {
  if (isScalar(node)) {
    if (typeof node.value === "string") out.push(node.value);
  } else if (isMap(node)) {
    for (const pair of node.items) {
      collectStrings(pair.key, out);
      collectStrings(pair.value, out);
    }
  } else if (isSeq(node)) {
    for (const item of node.items) collectStrings(item, out);
  }
  return out;
}

export async function writeFormatted(filePath: string, contents: string): Promise<void> {
  const result = await format(filePath, contents);
  if (result.errors.length > 0) {
    throw new Error(`Could not format ${filePath} with Oxfmt`);
  }
  await fs.writeFile(filePath, result.code, "utf8");
}

export async function writeCompose(template: LoadedTemplate, contents: string): Promise<void> {
  await writeFormatted(path.join(template.dir, template.composeFile!), contents);
}
