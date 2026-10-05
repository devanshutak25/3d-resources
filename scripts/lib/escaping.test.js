// Regression tests for untrusted catalog data reaching generated HTML.
// Run: node scripts/lib/escaping.test.js

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv/dist/2020');
const addFormats = require('ajv-formats');
const { marked } = require('marked');
const { escText, safeJsonLd, isSafeHref, useSafeLinks } = require('./html-safe');
const { renderSoftwareTable, processDescription } = require('../render');

useSafeLinks(marked);

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log(`  ok  ${name}`); pass++; }
  catch (e) { console.error(`  FAIL ${name}\n    ${e.message}`); fail++; }
}

const schema = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'schema', 'entry.schema.json'), 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validateEntry = ajv.compile(schema);
const base = { name: 'X', description: 'Y.', added_at: '2026-10-05T00:00:00Z' };

const XSS = 'Hi <img src=x onerror=alert(2)> </script><script>alert(3)</script>';

t('schema rejects javascript: and data: URLs', () => {
  assert.strictEqual(validateEntry({ ...base, url: 'javascript:alert(1)' }), false);
  assert.strictEqual(validateEntry({ ...base, url: 'data:text/html,hi' }), false);
});

t('schema accepts http and https URLs', () => {
  assert.strictEqual(validateEntry({ ...base, url: 'https://example.com/' }), true);
  assert.strictEqual(validateEntry({ ...base, url: 'http://guerillarender.com/' }), true);
});

t('isSafeHref allows http(s), mailto, fragment, relative', () => {
  for (const h of ['https://a.b/', 'HTTP://a', 'mailto:x@y.z', '#sec', '/sections/x/', 'rel/path']) {
    assert.ok(isSafeHref(h), h);
  }
});

t('isSafeHref blocks script schemes, incl. obfuscated', () => {
  for (const h of ['javascript:alert(1)', 'JaVaScRiPt:1', 'java\tscript:1', ' javascript:1', 'data:text/html,x', 'vbscript:x']) {
    assert.ok(!isSafeHref(h), JSON.stringify(h));
  }
});

t('safeJsonLd keeps </script> inside the JSON block and round-trips', () => {
  const obj = { description: XSS };
  const out = safeJsonLd(obj);
  assert.ok(!out.includes('</script>'));
  assert.ok(!out.includes('<'));
  assert.deepStrictEqual(JSON.parse(out), obj);
});

t('escText escapes tags but keeps existing entities', () => {
  assert.strictEqual(escText('a <b> & c &amp; d'), 'a &lt;b&gt; &amp; c &amp; d');
});

t('processDescription output renders inert through marked', () => {
  const html = marked.parse(processDescription(XSS));
  assert.ok(!/<img/i.test(html), html);
  assert.ok(!/<script/i.test(html), html);
});

t('software table row with hostile name/url/description renders inert', () => {
  const entry = {
    name: 'Evil <svg onload=alert(1)>', url: 'javascript:alert(document.domain)',
    description: XSS, entry_type: 'software', best_for: '<b>x</b> | y', readme_tags: ['<i>t</i>']
  };
  const html = marked.parse(renderSoftwareTable([entry], null).join('\n'));
  assert.ok(!/<svg|<img|<script|<b>|<i>/i.test(html), html);
  assert.ok(!/href="javascript:/i.test(html), html);
});

t('markdown link in a description cannot carry a javascript: href', () => {
  const html = marked.parse(processDescription('see [here](javascript:alert(1))'));
  assert.ok(!/href="javascript:/i.test(html), html);
});

t('pipe in name/best_for does not add table columns', () => {
  const entry = { name: 'A | B', url: 'https://a.b/', description: 'd', entry_type: 'software', best_for: 'x | y' };
  const html = marked.parse(renderSoftwareTable([entry], null).join('\n'));
  const row = html.split('<tbody>')[1].split('</tr>')[0];
  assert.strictEqual((row.match(/<td/g) || []).length, 5, row);
});

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
