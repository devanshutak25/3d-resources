// Table-driven tests locking quality-score factors. Run: node scripts/lib/quality-score.test.js

const assert = require('assert');
const { qualityScore } = require('./quality-score');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log(`  ok  ${name}`); pass++; }
  catch (e) { console.error(`  FAIL ${name}\n    ${e.message}`); fail++; }
}

// Baseline: bare entry, broken URL → all zeros except path_depth (root path → 20) and no_query (5).
t('bare entry with root URL: path_depth=20, no_query=5, rest=0', () => {
  const { score, factors } = qualityScore({ url: 'https://example.com/' });
  assert.strictEqual(factors.url_status, 0);
  assert.strictEqual(factors.path_depth, 20);
  assert.strictEqual(factors.no_query, 5);
  assert.strictEqual(factors.description, 0);
  assert.strictEqual(factors.tags, 0);
  assert.strictEqual(factors.readme_tags, 0);
  assert.strictEqual(factors.license, 0);
  assert.strictEqual(score, 25);
});

t('url_status ok adds exactly 50', () => {
  const a = qualityScore({ url: 'https://x/', url_status: 'ok' }).score;
  const b = qualityScore({ url: 'https://x/' }).score;
  assert.strictEqual(a - b, 50);
});

t('path_depth: each segment costs 5, floor 0', () => {
  assert.strictEqual(qualityScore({ url: 'https://x/' }).factors.path_depth, 20);
  assert.strictEqual(qualityScore({ url: 'https://x/a' }).factors.path_depth, 15);
  assert.strictEqual(qualityScore({ url: 'https://x/a/b' }).factors.path_depth, 10);
  assert.strictEqual(qualityScore({ url: 'https://x/a/b/c' }).factors.path_depth, 5);
  assert.strictEqual(qualityScore({ url: 'https://x/a/b/c/d' }).factors.path_depth, 0);
  assert.strictEqual(qualityScore({ url: 'https://x/a/b/c/d/e/f' }).factors.path_depth, 0);
});

t('trailing slash does not change path_depth', () => {
  assert.strictEqual(
    qualityScore({ url: 'https://x/a/b' }).factors.path_depth,
    qualityScore({ url: 'https://x/a/b/' }).factors.path_depth
  );
});

t('query string costs 5', () => {
  assert.strictEqual(qualityScore({ url: 'https://x/' }).factors.no_query, 5);
  assert.strictEqual(qualityScore({ url: 'https://x/?ref=foo' }).factors.no_query, 0);
});

t('description: length/4, capped at 30', () => {
  assert.strictEqual(qualityScore({ url: 'https://x/', description: '' }).factors.description, 0);
  assert.strictEqual(qualityScore({ url: 'https://x/', description: 'abcd' }).factors.description, 1);
  assert.strictEqual(qualityScore({ url: 'https://x/', description: 'a'.repeat(40) }).factors.description, 10);
  assert.strictEqual(qualityScore({ url: 'https://x/', description: 'a'.repeat(120) }).factors.description, 30);
  assert.strictEqual(qualityScore({ url: 'https://x/', description: 'a'.repeat(500) }).factors.description, 30);
});

t('tags: 3 per group key', () => {
  assert.strictEqual(qualityScore({ url: 'https://x/', tags: {} }).factors.tags, 0);
  assert.strictEqual(qualityScore({ url: 'https://x/', tags: { workflow: ['a'] } }).factors.tags, 3);
  assert.strictEqual(
    qualityScore({ url: 'https://x/', tags: { workflow: ['a'], output: ['b'], platform: ['c'] } }).factors.tags,
    9
  );
});

t('readme_tags: 1 per item', () => {
  assert.strictEqual(qualityScore({ url: 'https://x/', readme_tags: [] }).factors.readme_tags, 0);
  assert.strictEqual(qualityScore({ url: 'https://x/', readme_tags: ['a', 'b', 'c'] }).factors.readme_tags, 3);
});

t('license adds exactly 2', () => {
  assert.strictEqual(qualityScore({ url: 'https://x/', license: 'MIT' }).factors.license, 2);
  assert.strictEqual(qualityScore({ url: 'https://x/' }).factors.license, 0);
});

t('broken url falls back to depth=99 → path_depth=0, no_query=0', () => {
  const { factors } = qualityScore({ url: 'not a url' });
  assert.strictEqual(factors.path_depth, 0);
  assert.strictEqual(factors.no_query, 0);
});

t('full-loaded entry: factors sum to score', () => {
  const e = {
    url: 'https://example.com/lib/widget',
    url_status: 'ok',
    description: 'Solid description, definitely longer than thirty chars total.',
    tags: { workflow: ['a'], output: ['b'] },
    readme_tags: ['x', 'y'],
    license: 'MIT',
  };
  const { score, factors } = qualityScore(e);
  assert.strictEqual(score, Object.values(factors).reduce((a, b) => a + b, 0));
  assert(score > 80, `expected loaded entry score > 80, got ${score}`);
});

t('comparison: deeper path loses to root on otherwise equal entries', () => {
  const root = qualityScore({ url: 'https://x/', url_status: 'ok' }).score;
  const deep = qualityScore({ url: 'https://x/a/b/c/d', url_status: 'ok' }).score;
  assert(root > deep);
});

t('comparison: query-string variant loses to clean variant', () => {
  const clean = qualityScore({ url: 'https://x/page' }).score;
  const dirty = qualityScore({ url: 'https://x/page?utm=foo' }).score;
  assert(clean > dirty);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
