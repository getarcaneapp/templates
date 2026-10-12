import { marked } from "marked";
import { createHighlighter, type Highlighter } from "shiki";
import { isMap, isScalar, isSeq } from "yaml";

import {
  buildRegistry,
  loadTemplate,
  type RegistryFile,
  type TemplateEntry,
} from "../../../../scripts/lib/registry.js";
import { getServices } from "../../../../scripts/lint/compose.js";
import { loadTagVocabulary } from "../../../../scripts/lint/tags.js";
import type { ServiceSummary, TagInfo, TemplateDetail, TemplateSummary } from "../types.js";

const THEME = "github-dark-default";

let registryPromise: Promise<RegistryFile> | undefined;
let highlighterPromise: Promise<Highlighter> | undefined;

/** The same registry `vp run generate` writes, computed from templates/ at build time. */
export function getRegistry(): Promise<RegistryFile> {
  registryPromise ??= buildRegistry({ log: false });
  return registryPromise;
}

function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({ themes: [THEME], langs: ["yaml", "dotenv"] });
  return highlighterPromise;
}

export const toSummary = (entry: TemplateEntry): TemplateSummary => ({
  id: entry.id,
  name: entry.name,
  description: entry.description,
  version: entry.version,
  author: entry.author,
  icon_url: entry.icon_url,
  tags: entry.tags,
});

export async function getTemplateSummaries(): Promise<TemplateSummary[]> {
  const registry = await getRegistry();
  return registry.templates
    .map(toSummary)
    .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
}

export async function getTagInfo(): Promise<TagInfo[]> {
  const vocabulary = loadTagVocabulary();
  const templates = (await getRegistry()).templates;
  return Object.entries(vocabulary.tags).map(([tag, description]) => ({
    tag,
    description,
    count: templates.filter((template) => template.tags.includes(tag)).length,
  }));
}

function renderReadme(markdown: string): string {
  // The page header already shows the template name.
  const body = markdown.replace(/^#\s+.*\n+/, "");
  const html = marked.parse(body, { async: false, gfm: true });
  return html.replace(/<a href="(https?:)/g, '<a target="_blank" rel="noopener" href="$1');
}

function portsOf(value: unknown): string[] {
  if (!isSeq(value)) return [];
  return value.items.flatMap((item) => {
    if (isScalar(item)) return [String(item.value)];
    if (isMap(item)) {
      // Long syntax: { target: 80, published: "8080" }
      const { published, target } = item.toJSON() as {
        published?: string | number;
        target?: string | number;
      };
      return [published ? `${published}:${target}` : String(target)];
    }
    return [];
  });
}

export async function getTemplateDetail(id: string): Promise<TemplateDetail | null> {
  const entry = (await getRegistry()).templates.find((template) => template.id === id);
  if (!entry) return null;

  const template = await loadTemplate(id);
  const highlighter = await getHighlighter();
  const envRaw = template.envRaw ?? "";

  const services: ServiceSummary[] = getServices(template).map(({ name, node }) => {
    const image = node.get("image");
    return {
      name,
      image: typeof image === "string" ? image : null,
      ports: portsOf(node.get("ports")),
    };
  });

  const urls = template.compose?.getIn(["x-arcane", "urls"]);

  return {
    ...toSummary(entry),
    documentationUrl: entry.documentation_url,
    composeRaw: template.composeRaw,
    composeHtml: highlighter.codeToHtml(template.composeRaw, { lang: "yaml", theme: THEME }),
    envRaw,
    envHtml: highlighter.codeToHtml(envRaw, { lang: "dotenv", theme: THEME }),
    readmeHtml: template.readme ? renderReadme(template.readme) : null,
    urls: isSeq(urls) ? urls.items.map((item) => String(isScalar(item) ? item.value : item)) : [],
    services,
  };
}
