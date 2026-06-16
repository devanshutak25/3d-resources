// Tests for per-entry JSON-LD mapping. Run: node scripts/lib/entry-schema.test.js

const assert = require('assert');
const { entryToJsonLd, entriesToJsonLd } = require('./entry-schema');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log(`  ok  ${name}`); pass++; }
  catch (e) { console.error(`  FAIL ${name}\n    ${e.message}`); fail++; }
}

t('null for entry missing name/url', () => {
  assert.strictEqual(entryToJsonLd(null), null);
  assert.strictEqual(entryToJsonLd({ name: 'x' }), null);
  assert.strictEqual(entryToJsonLd({ url: 'https://x/' }), null);
});

t('software → SoftwareApplication with @id/name/url', () => {
  const n = entryToJsonLd({ name: 'PackCAD', url: 'https://packcad.com/', entry_type: 'software' });
  assert.strictEqual(n['@type'], 'SoftwareApplication');
  assert.strictEqual(n['@id'], 'https://packcad.com/');
  assert.strictEqual(n.name, 'PackCAD');
  assert.strictEqual(n.url, 'https://packcad.com/');
  assert.strictEqual(n.applicationCategory, 'MultimediaApplication');
});

t('tool and plugin also map to SoftwareApplication', () => {
  assert.strictEqual(entryToJsonLd({ name: 'a', url: 'https://a/', entry_type: 'tool' })['@type'], 'SoftwareApplication');
  assert.strictEqual(entryToJsonLd({ name: 'b', url: 'https://b/', entry_type: 'plugin' })['@type'], 'SoftwareApplication');
});

t('platform → operatingSystem string', () => {
  const n = entryToJsonLd({ name: 'a', url: 'https://a/', entry_type: 'software', tags: { platform: ['win', 'mac', 'web'] } });
  assert.strictEqual(n.operatingSystem, 'Windows, macOS, Web Browser');
});

t('free-ish license → $0 Offer; paid → none', () => {
  const free = entryToJsonLd({ name: 'a', url: 'https://a/', entry_type: 'software', license: 'Freemium' });
  assert.deepStrictEqual(free.offers, { '@type': 'Offer', price: '0', priceCurrency: 'USD' });
  const paid = entryToJsonLd({ name: 'b', url: 'https://b/', entry_type: 'software', license: 'Paid' });
  assert.strictEqual(paid.offers, undefined);
});

t('book→Book, paper→ScholarlyArticle, channel/tutorial→CreativeWork', () => {
  assert.strictEqual(entryToJsonLd({ name: 'a', url: 'https://a/', entry_type: 'book' })['@type'], 'Book');
  assert.strictEqual(entryToJsonLd({ name: 'a', url: 'https://a/', entry_type: 'paper' })['@type'], 'ScholarlyArticle');
  assert.strictEqual(entryToJsonLd({ name: 'a', url: 'https://a/', entry_type: 'channel' })['@type'], 'CreativeWork');
  assert.strictEqual(entryToJsonLd({ name: 'a', url: 'https://a/', entry_type: 'tutorial' })['@type'], 'CreativeWork');
});

t('asset-source/marketplace→WebSite, service→Organization', () => {
  assert.strictEqual(entryToJsonLd({ name: 'a', url: 'https://a/', entry_type: 'asset-source' })['@type'], 'WebSite');
  assert.strictEqual(entryToJsonLd({ name: 'a', url: 'https://a/', entry_type: 'marketplace' })['@type'], 'WebSite');
  assert.strictEqual(entryToJsonLd({ name: 'a', url: 'https://a/', entry_type: 'service' })['@type'], 'Organization');
});

t('unmapped/missing entry_type → Thing', () => {
  assert.strictEqual(entryToJsonLd({ name: 'a', url: 'https://a/', entry_type: 'community' })['@type'], 'Thing');
  assert.strictEqual(entryToJsonLd({ name: 'a', url: 'https://a/' })['@type'], 'Thing');
});

t('description markdown stripped to plain text', () => {
  const n = entryToJsonLd({ name: 'a', url: 'https://a/', entry_type: 'reference', description: 'See [docs](https://d/) for `code`.' });
  assert.strictEqual(n.description, 'See docs for code.');
});

t('non-SoftwareApplication has no operatingSystem/offers', () => {
  const n = entryToJsonLd({ name: 'a', url: 'https://a/', entry_type: 'book', license: 'Free', tags: { platform: ['win'] } });
  assert.strictEqual(n.operatingSystem, undefined);
  assert.strictEqual(n.offers, undefined);
});

t('entriesToJsonLd filters nulls and respects limit', () => {
  const arr = [
    { name: 'a', url: 'https://a/', entry_type: 'software' },
    { name: 'no-url' },
    { name: 'b', url: 'https://b/', entry_type: 'book' }
  ];
  assert.strictEqual(entriesToJsonLd(arr).length, 2);
  assert.strictEqual(entriesToJsonLd(arr, 1).length, 1);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
