/**
 * Test suite for build-registry.ts version bumping logic
 * Run with: pnpm tsx scripts/test-build-registry.ts
 */

interface RegistryFile {
  version: string;
  templates: { id: string }[];
}

type BumpPart = 'major' | 'minor' | 'patch';

// Copy of bumpSemver from build-registry.ts
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

// Simulate the version calculation logic from build-registry.ts
function calculateNextVersion(
  liveRegistry: RegistryFile | null,
  localTemplateIds: string[],
  bumpPart: BumpPart = 'minor'
): { baseVersion: string; nextVersion: string; newIds: string[] } {
  const prevIds = new Set((liveRegistry?.templates || []).map((t) => t.id));
  const newIds = localTemplateIds.filter((id) => !prevIds.has(id));
  const baseVersion = liveRegistry?.version || '1.0.0';
  const nextVersion = newIds.length > 0 ? bumpSemver(baseVersion, bumpPart) : baseVersion;

  return { baseVersion, nextVersion, newIds };
}

// Test runner
let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
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
      `${message || 'Assertion failed'}\n   Expected: ${JSON.stringify(expected)}\n   Actual:   ${JSON.stringify(actual)}`
    );
  }
}

// ============ TESTS ============

console.log('\n🧪 Testing bumpSemver function\n');

test('bumpSemver: minor bump from 1.0.0', () => {
  assertEqual(bumpSemver('1.0.0', 'minor'), '1.1.0');
});

test('bumpSemver: minor bump from 1.1.0', () => {
  assertEqual(bumpSemver('1.1.0', 'minor'), '1.2.0');
});

test('bumpSemver: patch bump from 1.1.0', () => {
  assertEqual(bumpSemver('1.1.0', 'patch'), '1.1.1');
});

test('bumpSemver: major bump from 1.1.0', () => {
  assertEqual(bumpSemver('1.1.0', 'major'), '2.0.0');
});

test('bumpSemver: handles invalid version', () => {
  assertEqual(bumpSemver('invalid', 'minor'), '1.0.0');
});

test('bumpSemver: handles empty string', () => {
  assertEqual(bumpSemver('', 'minor'), '1.0.0');
});

test('bumpSemver: handles prerelease version', () => {
  assertEqual(bumpSemver('1.2.3-beta.1', 'minor'), '1.3.0');
});

console.log('\n🧪 Testing version calculation logic\n');

test('No live registry (fresh start) -> uses 1.0.0', () => {
  const result = calculateNextVersion(null, ['template-a', 'template-b'], 'minor');
  assertEqual(result.baseVersion, '1.0.0');
  assertEqual(result.nextVersion, '1.1.0'); // new templates detected
  assertEqual(result.newIds, ['template-a', 'template-b']);
});

test('No new templates -> keeps same version', () => {
  const liveRegistry: RegistryFile = {
    version: '1.5.0',
    templates: [{ id: 'homepage' }, { id: 'jellyfin-server' }],
  };
  const result = calculateNextVersion(liveRegistry, ['homepage', 'jellyfin-server'], 'minor');
  assertEqual(result.baseVersion, '1.5.0');
  assertEqual(result.nextVersion, '1.5.0'); // no change
  assertEqual(result.newIds, []);
});

test('One new template -> bumps minor', () => {
  const liveRegistry: RegistryFile = {
    version: '1.1.0',
    templates: [{ id: 'homepage' }, { id: 'jellyfin-server' }],
  };
  const result = calculateNextVersion(liveRegistry, ['homepage', 'jellyfin-server', 'new-template'], 'minor');
  assertEqual(result.baseVersion, '1.1.0');
  assertEqual(result.nextVersion, '1.2.0');
  assertEqual(result.newIds, ['new-template']);
});

test('Multiple new templates -> bumps once', () => {
  const liveRegistry: RegistryFile = {
    version: '2.0.0',
    templates: [{ id: 'homepage' }],
  };
  const result = calculateNextVersion(liveRegistry, ['homepage', 'new-a', 'new-b', 'new-c'], 'minor');
  assertEqual(result.baseVersion, '2.0.0');
  assertEqual(result.nextVersion, '2.1.0'); // only bumps once regardless of count
  assertEqual(result.newIds, ['new-a', 'new-b', 'new-c']);
});

test('New template with patch bump', () => {
  const liveRegistry: RegistryFile = {
    version: '1.1.0',
    templates: [{ id: 'homepage' }],
  };
  const result = calculateNextVersion(liveRegistry, ['homepage', 'new-template'], 'patch');
  assertEqual(result.baseVersion, '1.1.0');
  assertEqual(result.nextVersion, '1.1.1');
});

test('Template removed (not in local) -> still keeps version (removals dont trigger bump)', () => {
  const liveRegistry: RegistryFile = {
    version: '1.3.0',
    templates: [{ id: 'homepage' }, { id: 'old-template' }],
  };
  // Local only has 'homepage', 'old-template' was removed
  const result = calculateNextVersion(liveRegistry, ['homepage'], 'minor');
  assertEqual(result.baseVersion, '1.3.0');
  assertEqual(result.nextVersion, '1.3.0'); // no bump for removals
  assertEqual(result.newIds, []);
});

test('Empty live registry templates array -> all local are new', () => {
  const liveRegistry: RegistryFile = {
    version: '1.0.0',
    templates: [],
  };
  const result = calculateNextVersion(liveRegistry, ['template-a'], 'minor');
  assertEqual(result.nextVersion, '1.1.0');
  assertEqual(result.newIds, ['template-a']);
});

console.log('\n🧪 Testing against real live registry\n');

test('Fetch live registry and compare with local templates', async () => {
  const LIVE_URL = 'https://registry.getarcane.app/registry.json';

  console.log(`   Fetching ${LIVE_URL}...`);
  const res = await fetch(LIVE_URL);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

  const liveRegistry = (await res.json()) as RegistryFile;
  console.log(`   Live version: ${liveRegistry.version}`);
  console.log(`   Live templates: ${liveRegistry.templates.map((t) => t.id).join(', ')}`);

  // Simulate current local templates (read from actual templates dir)
  const { promises: fs } = await import('node:fs');
  const path = await import('node:path');
  const templatesDir = path.join(process.cwd(), 'templates');
  const entries = await fs.readdir(templatesDir, { withFileTypes: true });
  const localIds = entries.filter((e) => e.isDirectory()).map((e) => e.name.toLowerCase().replace(/[^a-z0-9-]/g, '-'));

  console.log(`   Local templates: ${localIds.join(', ')}`);

  const result = calculateNextVersion(liveRegistry, localIds, 'minor');

  console.log(`   New templates: ${result.newIds.length > 0 ? result.newIds.join(', ') : '(none)'}`);
  console.log(`   Version: ${result.baseVersion} -> ${result.nextVersion}`);

  // This test just verifies the calculation runs without error
  if (typeof result.nextVersion !== 'string' || !result.nextVersion.match(/^\d+\.\d+\.\d+$/)) {
    throw new Error(`Invalid version format: ${result.nextVersion}`);
  }
});

// ============ SUMMARY ============

console.log('\n' + '='.repeat(50));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
}
