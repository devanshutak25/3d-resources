// Parity between server tag labels (tag-labels.js) and the client copy in assets/js/filter.js.
// Run: node scripts/lib/tag-labels.test.js

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { LABELS, tagLabel } = require('./tag-labels');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log(`  ok  ${name}`); pass++; }
  catch (e) { console.error(`  FAIL ${name}\n    ${e.message}`); fail++; }
}

const src = fs.readFileSync(path.join(__dirname, '..', '..', 'assets', 'js', 'filter.js'), 'utf8');
function clientLabels(name) {
  const m = src.match(new RegExp(`const ${name} = (\\{[\\s\\S]*?\\});`));
  assert.ok(m, `${name} not found in filter.js`);
  return Function(`return ${m[1]}`)(); // object literal of string pairs from our own repo file
}

for (const [group, name] of [['skill', 'SKILL_LABELS'], ['platform', 'PLATFORM_LABELS'], ['workflow', 'WORKFLOW_LABELS'], ['output', 'OUTPUT_LABELS']]) {
  t(`${group} labels match filter.js ${name}`, () => {
    const client = clientLabels(name);
    for (const [k, v] of Object.entries(client)) assert.strictEqual(LABELS[group][k], v, `${group}.${k}`);
  });
}

t('fallback humanises slugs', () => {
  assert.strictEqual(tagLabel('tech', 'blender-addon'), 'Blender Addon');
  assert.strictEqual(tagLabel('workflow', 'ai-assist'), 'AI Assist');
  assert.strictEqual(tagLabel('platform', 'win'), 'Windows');
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
