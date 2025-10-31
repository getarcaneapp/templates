import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TEMPLATES_DIR = path.join(ROOT, 'templates');

type BumpPart = 'major' | 'minor' | 'patch';

interface TemplateMeta {
  name: string;
  description: string;
  version: string;
  author: string;
  tags: string[];
}

interface TemplateEntry extends TemplateMeta {
  id: string;
  compose_url: string;
  env_url: string;
  documentation_url: string;
}

interface RegistryFile {
  $schema?: string;
  name: string;
  description: string;
  version: string;
  author: string;
  url: string;
  templates: TemplateEntry[];
}

const REGISTRY = {
  name: process.env.REGISTRY_NAME || 'Arcane Community Templates',
  description: process.env.REGISTRY_DESCRIPTION || 'Community Docker Compose Templates for Arcane',
  author: process.env.REGISTRY_AUTHOR || 'getarcaneapp',
  url: process.env.REGISTRY_URL || 'https://github.com/getarcaneapp/templates',
} satisfies Omit<RegistryFile, 'version' | 'templates'>;

const PUBLIC_BASE = process.env.PUBLIC_BASE || 'https://registry.getarcane.app/templates';
const DOCS_BASE = process.env.DOCS_BASE || `${REGISTRY.url}/tree/main/templates`;
const SCHEMA_URL = process.env.SCHEMA_URL || 'https://registry.getarcane.app/schema.json';

const BUMP_PART: BumpPart = (process.env.BUMP_PART || 'minor').toLowerCase() as BumpPart;

const exists = async (p: string): Promise<boolean> => !!(await fs.stat(p).catch(() => null));

const toSlug = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');

function bumpSemver(v: string, part: BumpPart = 'minor'): string {
  const m = String(v).match(/^(\d+)\.(\d+)\.(\d+)(?:[.-].*)?$/);
  if (!m) return '1.0.0';
  let [major, minor, patch] = m.slice(1).map((n) => parseInt(n, 10));
  if (part === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (part === 'patch') {
    patch += 1;
  } else {
    minor += 1;
    patch = 0;
  }
  return `${major}.${minor}.${patch}`;
}

async function readPrevRegistry(): Promise<RegistryFile | null> {
  const p = path.join(ROOT, 'registry.json');
  if (!(await exists(p))) return null;
  try {
    return JSON.parse(await fs.readFile(p, 'utf8')) as RegistryFile;
  } catch {
    return null;
  }
}

async function build(): Promise<void> {
  const prev = await readPrevRegistry();

  const entries = await fs.readdir(TEMPLATES_DIR, { withFileTypes: true });
  const templateDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  const templates: TemplateEntry[] = [];
  for (const dir of templateDirs) {
    const id = toSlug(dir);
    const tdir = path.join(TEMPLATES_DIR, dir);

    // required metadata
    const metaPath = path.join(tdir, 'template.json');
    if (!(await exists(metaPath))) {
      throw new Error(`Missing ${path.relative(ROOT, metaPath)} (required)`);
    }
    const meta = JSON.parse(await fs.readFile(metaPath, 'utf8')) as Partial<TemplateMeta>;

    // required files and URLs
    const composeCandidates = ['compose.yaml', 'docker-compose.yml', 'docker-compose.yaml', 'compose.yml'];
    let composeFile: string | null = null;
    for (const c of composeCandidates) {
      if (await exists(path.join(tdir, c))) {
        composeFile = c;
        break;
      }
    }
    if (!composeFile) {
      throw new Error(`No compose file found in templates/${dir} (looked for ${composeCandidates.join(', ')})`);
    }
    const envExample = path.join(tdir, '.env.example');
    if (!(await exists(envExample))) {
      throw new Error(`Missing templates/${dir}/.env.example`);
    }

    const item: TemplateEntry = {
      id,
      name: String(meta.name || ''),
      description: String(meta.description || ''),
      version: String(meta.version || ''),
      author: String(meta.author || ''),
      compose_url: `${PUBLIC_BASE}/${id}/${composeFile}`,
      env_url: `${PUBLIC_BASE}/${id}/.env.example`,
      documentation_url: `${DOCS_BASE}/${id}`,
      tags: Array.isArray(meta.tags) ? meta.tags.map(String) : [],
    };

    // quick checks for schema-required fields
    for (const k of ['name', 'description', 'version', 'author'] as const) {
      if (!item[k] || typeof item[k] !== 'string') {
        throw new Error(`templates/${dir}/template.json missing/invalid "${k}"`);
      }
    }
    if (!Array.isArray(item.tags) || item.tags.length === 0) {
      throw new Error(`templates/${dir}/template.json must include non-empty "tags"`);
    }

    templates.push(item);
  }

  // Determine version bump (only when new template IDs appear)
  const prevIds = new Set((prev?.templates || []).map((t) => t.id));
  const newIds = templates.map((t) => t.id).filter((id) => !prevIds.has(id));
  const baseVersion = prev?.version || process.env.REGISTRY_VERSION || '1.0.0';
  const nextVersion = newIds.length > 0 ? bumpSemver(String(baseVersion), BUMP_PART) : String(baseVersion);

  if (newIds.length > 0) {
    console.log(`Detected ${newIds.length} new template(s): ${newIds.join(', ')} -> bumping ${BUMP_PART} to ${nextVersion}`);
  } else {
    console.log(`No new templates detected -> keeping version ${baseVersion}`);
  }

  const registry: RegistryFile = {
    $schema: SCHEMA_URL,
    name: prev?.name ?? REGISTRY.name,
    description: prev?.description ?? REGISTRY.description,
    author: prev?.author ?? REGISTRY.author,
    url: prev?.url ?? REGISTRY.url,
    version: nextVersion,
    templates: templates.sort((a, b) => a.id.localeCompare(b.id)),
  };

  const outPath = path.join(ROOT, 'registry.json');
  await fs.writeFile(outPath, JSON.stringify(registry, null, 2) + '\n', 'utf8');

  console.log(`Generated registry.json with ${templates.length} templates`);
}

build().catch((err) => {
  console.error((err as Error).message || err);
  process.exit(1);
});
