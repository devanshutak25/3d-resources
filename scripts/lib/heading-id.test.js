// Parity: heading ids injected by build-html.js must equal render.githubAnchor,
// which every ToC / See-also / README link uses. Run: node scripts/lib/heading-id.test.js

const assert = require('assert');
const { marked } = require('marked');
const { headingId } = require('./heading-id');
const { githubAnchor } = require('../render');
const catalog = require('./catalog');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log(`  ok  ${name}`); pass++; }
  catch (e) { console.error(`  FAIL ${name}\n    ${e.message}`); fail++; }
}

// What build-html.js sees: the inner text of marked's <hN>.
const renderedText = title => marked.parse(`### ${title}`).replace(/^<h3[^>]*>|<\/h3>\s*$/g, '');

t('tricky titles: apostrophes, ampersands, quotes, angle brackets', () => {
  for (const title of ["Artist's Tools", 'Q&A', 'Learning & Community: "Pro" Picks', 'Houdini: Grooming', 'AI <beta> Tools']) {
    assert.strictEqual(headingId(renderedText(title.replace(/</g, '&lt;'))), githubAnchor(title), title);
  }
});

t('every real section and subsection title matches', () => {
  for (const meta of catalog.loadSections().sections) {
    const doc = catalog.loadSection(meta.file);
    for (const title of [doc.title, ...(doc.subsections || []).map(s => s.title)]) {
      assert.strictEqual(headingId(renderedText(title)), githubAnchor(title), title);
    }
  }
});

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
