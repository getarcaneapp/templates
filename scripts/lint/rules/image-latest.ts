import { isScalar, type Scalar } from "yaml";

import type { LoadedTemplate } from "../../lib/registry.js";
import { getServices, renderScalar, writeCompose } from "../compose.js";
import { CHANNEL_TAGS, findImageException } from "../image-exceptions.js";
import type { Issue, Rule } from "../types.js";

export interface ParsedImage {
  name: string;
  tag: string | null;
  digest: string | null;
}

export function parseImage(image: string): ParsedImage {
  const at = image.indexOf("@");
  const withoutDigest = at === -1 ? image : image.slice(0, at);
  const digest = at === -1 ? null : image.slice(at + 1);
  const slash = withoutDigest.lastIndexOf("/");
  const colon = withoutDigest.lastIndexOf(":");
  if (colon > slash) {
    return { name: withoutDigest.slice(0, colon), tag: withoutDigest.slice(colon + 1), digest };
  }
  return { name: withoutDigest, tag: null, digest };
}

/** `latest`, `stable`, `release`, and variants of them such as `latest-aio-cpu`. */
export function isChannelTag(tag: string): boolean {
  return CHANNEL_TAGS.some(
    (channel) => tag === channel || tag.startsWith(`${channel}-`) || tag.endsWith(`-${channel}`),
  );
}

interface ImageProblem {
  service: string;
  scalar: Scalar;
  image: ParsedImage;
  fixable: boolean;
  message: string;
}

function findProblems(template: LoadedTemplate): ImageProblem[] {
  const problems: ImageProblem[] = [];
  for (const { name: service, node } of getServices(template)) {
    const scalar = node.get("image", true);
    if (!isScalar(scalar) || typeof scalar.value !== "string") continue;

    const raw = scalar.value;
    if (raw.includes("$")) continue;

    const image = parseImage(raw);
    if (findImageException(image.name)) continue;

    if (!image.tag) {
      problems.push({
        service,
        scalar,
        image,
        fixable: true,
        message: `service "${service}": image ${raw} has no tag, use ${image.name}:latest`,
      });
    } else if (!isChannelTag(image.tag) || image.digest) {
      problems.push({
        service,
        scalar,
        image,
        fixable: true,
        message: `service "${service}": image ${raw} is pinned, templates track ${image.name}:latest (add an exception in scripts/lint/image-exceptions.ts if the pin is required)`,
      });
    }
  }
  return problems;
}

export const imageLatest: Rule = {
  id: "image-latest",
  severity: "error",
  description:
    "Images use :latest (or an upstream channel tag) unless listed in image-exceptions.ts.",
  check(template): Issue[] {
    return findProblems(template).map(({ message, fixable }) => ({ message, fixable }));
  },
  async fix(template) {
    // Replace from the end of the file so earlier ranges stay valid.
    const problems = findProblems(template).sort((a, b) => b.scalar.range![0] - a.scalar.range![0]);
    let source = template.composeRaw;
    for (const { scalar, image } of problems) {
      const [start, end] = scalar.range!;
      source =
        source.slice(0, start) + renderScalar(scalar, `${image.name}:latest`) + source.slice(end);
    }
    await writeCompose(template, source);
  },
};
