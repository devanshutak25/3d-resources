// Tests for generated page copy. Run: node scripts/lib/seo-copy.test.js
// Unit cases first, then every real section/subsection/tag through the writing rules.

const assert = require('assert');
const copy = require('./seo-copy');
const seo = require('./seo-pages');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log(`  ok  ${name}`); pass++; }
  catch (e) { console.error(`  FAIL ${name}\n    ${e.message}`); fail++; }
}

// Template text only: entry names are data and are checked by validate.js, not here.
const BANNED = /—|\b(comprehensive|robust|powerful|seamless(ly)?|leverag(e|es|ed|ing)|utiliz(e|es|ed|ing)|cutting-edge|state-of-the-art|the ultimate|game-changing|unleash)\b|\b(and more|and beyond|and so much more)\.?$/i;
function withoutNames(text, entries) {
  let s = text;
  for (const e of entries) s = s.split(e.name).join('');
  return s;
}

const tool = (name, extra = {}) => ({ name, url: `https://${name.toLowerCase()}.test/`, entry_type: 'software', ...extra });

t('heading: count + dominant noun, singular, override', () => {
  assert.strictEqual(copy.heading({ title: '3D Generation' }, [tool('A'), tool('B')]), '3D Generation: 2 tools');
  assert.strictEqual(copy.heading({ title: 'X' }, [tool('A')]), 'X: 1 tool');
  assert.strictEqual(copy.heading({ title: 'X', seoTitle: 'Best X' }, [tool('A')]), 'Best X');
  const mixed = [tool('A'), { name: 'B', url: 'https://b/', entry_type: 'book' }];
  assert.strictEqual(copy.heading({ title: 'X' }, mixed), 'X: 2 resources');
});

t('titleTag: suffix kept when it fits, dropped first, then trimmed to 60', () => {
  assert.strictEqual(copy.titleTag('3D Generation: 55 tools'), '3D Generation: 55 tools | 3D Resources');
  const long = 'Lighting, Rendering & Shaders: Rendering Engines: 120 tools';
  assert.ok(long.length <= 60);
  assert.strictEqual(copy.titleTag(long), long);
  assert.ok(copy.titleTag('word '.repeat(20)).length <= 60);
});

t('intro: lead, counts, buckets; picks name first', () => {
  const entries = [
    tool('Zeta', { license: 'Open Source', url_status: 'ok' }),
    tool('Alpha', { license: 'Open Source' }),
    tool('Web1', { license: 'Freemium', tags: { platform: ['web'] } }),
    tool('Paid1', { license: 'Paid' })
  ];
  const s = copy.intro({ title: 'X', description: 'tools for x', picks: ['https://alpha.test/'] }, entries);
  assert.strictEqual(s[0], 'Tools for x.');
  assert.strictEqual(s[1], '4 tools listed. 3 are free or have a free tier, 2 are open source.');
  assert.strictEqual(s[2], 'Open source: Alpha, Zeta.');
  assert.strictEqual(s[3], 'Runs in the browser: Web1.');
  const o = copy.intro({ title: 'X', description: 'd', intro: 'Hand written' }, entries);
  assert.strictEqual(o[0], 'Hand written.');
});

t('metaDescription fits 155 chars', () => {
  assert.strictEqual(copy.metaDescription(['A.', 'B.']), 'A. B.');
  assert.ok(copy.metaDescription(['x '.repeat(200)]).length <= 155);
});

t('lastModified: newest date field, null when none', () => {
  assert.strictEqual(copy.lastModified([
    { added_at: '2026-01-02T00:00:00Z', url_last_verified: '2026-03-01' },
    { pricing_last_verified: '2026-02-01' }
  ]), '2026-03-01');
  assert.strictEqual(copy.lastModified([{}]), null);
});

t('narrowLinks: only tags at catalog threshold, top by local count', () => {
  const entries = [tool('A', { tags: { platform: ['web'], tech: ['rare'] } }), tool('B', { tags: { platform: ['web'], tech: ['rare'] } })];
  const counts = new Map([['platform::web', 10], ['tech::rare', 2]]);
  const links = copy.narrowLinks(entries, counts, 3);
  assert.deepStrictEqual(links, [{ href: '/tags/platform/web/', label: 'Web', count: 2 }]);
});

// --- Real catalog -----------------------------------------------------------

const subs = seo.subsectionPages();

t(`every subsection: title <=60, intro <=${copy.INTRO_MAX}, states count, no banned text`, () => {
  const bad = [];
  for (const s of subs) {
    const page = { title: s.subTitle, seoTitle: s.seoTitle, intro: s.intro, picks: s.picks, description: s.subDescription };
    const h1 = copy.heading(page, s.entries);
    const title = copy.titleTag(h1);
    const intro = copy.intro(page, s.entries);
    const text = intro.join(' ');
    const desc = copy.metaDescription(intro);
    const id = `${s.sectionSlug}/${s.subSlug}`;
    if (title.length > copy.TITLE_MAX) bad.push(`${id}: title ${title.length} chars`);
    if (desc.length > copy.DESC_MAX) bad.push(`${id}: description ${desc.length} chars`);
    if (text.length > copy.INTRO_MAX) bad.push(`${id}: intro ${text.length} chars`);
    if (!intro[1].startsWith(`${s.entries.length} `)) bad.push(`${id}: intro count "${intro[1]}" != ${s.entries.length}`);
    if (BANNED.test(withoutNames(`${h1} ${text}`, s.entries))) bad.push(`${id}: banned text`);
  }
  assert.deepStrictEqual(bad, []);
});

t('every section: title <=60, no banned text', () => {
  const bySection = new Map();
  for (const s of subs) {
    if (!bySection.has(s.sectionSlug)) bySection.set(s.sectionSlug, { title: s.sectionTitle, entries: [] });
    bySection.get(s.sectionSlug).entries.push(...s.entries);
  }
  const bad = [];
  for (const [slug, { title, entries }] of bySection) {
    const h1 = copy.heading({ title }, entries);
    if (copy.titleTag(h1).length > copy.TITLE_MAX) bad.push(`${slug}: title too long`);
    if (BANNED.test(h1)) bad.push(`${slug}: banned text`);
  }
  assert.deepStrictEqual(bad, []);
});

t('every tag heading: title <=60, no banned text', () => {
  const counts = copy.tagCounts(subs.flatMap(s => s.entries));
  const bad = [];
  for (const k of counts.keys()) {
    const [group, value] = k.split('::');
    const h1 = copy.tagHeading(group, value, [tool('A')]);
    if (copy.titleTag(h1).length > copy.TITLE_MAX) bad.push(`${k}: title too long`);
    if (BANNED.test(h1)) bad.push(`${k}: banned text`);
  }
  assert.deepStrictEqual(bad, []);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
