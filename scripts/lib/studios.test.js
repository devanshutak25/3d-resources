// Studios directory checks. Run: node scripts/lib/studios.test.js

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const studios = require('./studios');
const catalog = require('./catalog');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log(`  ok  ${name}`); pass++; }
  catch (e) { console.error(`  FAIL ${name}\n    ${e.message}`); fail++; }
}

const schema = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'schema', 'studio.schema.json'), 'utf8'));

t('every schema discipline has a label and vice versa', () => {
  assert.deepStrictEqual([...schema.properties.disciplines.items.enum].sort(), Object.keys(studios.DISCIPLINES).sort());
});

t('every size has a label', () => {
  assert.deepStrictEqual([...schema.properties.size.enum].sort(), Object.keys(studios.SIZES).sort());
});

t('every market has a label and vice versa', () => {
  assert.deepStrictEqual([...schema.properties.markets.items.enum].sort(), Object.keys(studios.MARKETS).sort());
});

t('decadeOf buckets founding years', () => {
  assert.strictEqual(studios.decadeOf(undefined), '');
  assert.strictEqual(studios.decadeOf(1972), 'pre-1980');
  assert.strictEqual(studios.decadeOf(1980), '1980s');
  assert.strictEqual(studios.decadeOf(2019), '2010s');
});

t('every country maps to a known region', () => {
  for (const [c, r] of Object.entries(studios.COUNTRY_REGION)) assert(studios.REGIONS[r], `${c} -> ${r}`);
});

t('studioSlugs are unique and suffix collisions', () => {
  const ids = studios.studioSlugs([{ name: 'Storm' }, { name: 'Storm' }, { name: 'A+C Studios' }, { name: 'Trollbäck+Company' }]);
  assert.deepStrictEqual(ids.slice(0, 2), ['s-storm', 's-storm-2']);
  assert.strictEqual(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^s-[a-z0-9-]+$/);
});

t('real studio data gives unique card ids', () => {
  const list = catalog.loadStudios();
  const ids = studios.studioSlugs(list);
  assert.strictEqual(new Set(ids).size, ids.length);
});

t('placeLabel handles missing city', () => {
  assert.strictEqual(studios.placeLabel({ country: 'Turkey' }), 'Turkey');
  assert.strictEqual(studios.placeLabel({ city: 'Paris', country: 'France' }), 'Paris, France');
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
