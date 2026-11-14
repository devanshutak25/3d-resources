// Page copy for the generated SEO pages: <title>/<h1> text, the answer-first intro
// above each table, meta descriptions, "Narrow it down" tag links and per-page
// modified dates. Pure: takes entries + metadata, returns plain strings (callers escape).
// Writing rules (CLAUDE.md "Writing style") apply to every string built here;
// seo-copy.test.js checks them against the real catalog.

const { slugify } = require('./slugify');
const { tagLabel } = require('./tag-labels');

const SITE_SUFFIX = ' | 3D Resources';
const TITLE_MAX = 60;
const DESC_MAX = 155;
const INTRO_MAX = 320;
const NAMES_PER_BUCKET = 3;

// entry_type -> noun group. A group names the page only when it covers most entries.
const TYPE_NOUN = {
  software: 'tools', tool: 'tools', plugin: 'tools',
  'asset-source': 'sites', marketplace: 'sites',
  tutorial: 'tutorials and channels', channel: 'tutorials and channels',
  book: 'books', paper: 'papers', community: 'communities', service: 'services',
  hardware: 'products', reference: 'references'
};
const SINGULAR = {
  tools: 'tool', sites: 'site', 'tutorials and channels': 'tutorial or channel', books: 'book',
  papers: 'paper', communities: 'community', services: 'service', products: 'product',
  references: 'reference', resources: 'resource'
};
const DOMINANT_SHARE = 0.6;

function nounFor(entries) {
  const counts = new Map();
  for (const e of entries) {
    const n = TYPE_NOUN[e.entry_type];
    if (n) counts.set(n, (counts.get(n) || 0) + 1);
  }
  let best = null, bestN = 0;
  for (const [n, c] of counts) if (c > bestN) { best = n; bestN = c; }
  return best && entries.length && bestN / entries.length >= DOMINANT_SHARE ? best : 'resources';
}

function countNoun(n, entries) {
  const noun = nounFor(entries);
  return `${n} ${n === 1 ? SINGULAR[noun] : noun}`;
}

// <h1> text. `page` = { title, seoTitle? }.
function heading(page, entries) {
  if (page.seoTitle) return page.seoTitle;
  return `${page.title}: ${countNoun(entries.length, entries)}`;
}

function tagHeading(group, value, entries) {
  return `${tagLabel(group, value)} resources: ${countNoun(entries.length, entries)}`;
}

// <title>: heading + site suffix, suffix dropped first when over 60 chars.
function titleTag(h) {
  if (h.length + SITE_SUFFIX.length <= TITLE_MAX) return h + SITE_SUFFIX;
  if (h.length <= TITLE_MAX) return h;
  return h.slice(0, TITLE_MAX).replace(/\s+\S*$/, '');
}

function sentence(s) {
  const t = String(s || '').trim();
  if (!t) return '';
  const cap = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?]$/.test(cap) ? cap : `${cap}.`;
}

function isAre(n) { return n === 1 ? 'is' : 'are'; }

// Order for naming entries: editorial picks first, then live links, then name.
function ranked(entries, picks) {
  const pickPos = new Map((picks || []).map((u, i) => [String(u).toLowerCase(), i]));
  return entries.slice().sort((a, b) => {
    const pa = pickPos.has(String(a.url).toLowerCase()) ? pickPos.get(String(a.url).toLowerCase()) : Infinity;
    const pb = pickPos.has(String(b.url).toLowerCase()) ? pickPos.get(String(b.url).toLowerCase()) : Infinity;
    if (pa !== pb) return pa - pb;
    const oa = a.url_status === 'ok' ? 0 : 1, ob = b.url_status === 'ok' ? 0 : 1;
    if (oa !== ob) return oa - ob;
    return String(a.name).localeCompare(String(b.name), 'en', { sensitivity: 'base' });
  });
}

function namesSentence(label, list) {
  if (!list.length) return '';
  return `${label}: ${list.slice(0, NAMES_PER_BUCKET).map(e => e.name).join(', ')}.`;
}

// Answer-first intro sentences. `page` = { title, description, intro?, picks? }.
// Lead sentence and the count sentence always stay; name lists drop from the end
// until the whole intro fits INTRO_MAX.
function intro(page, entries) {
  const n = entries.length;
  const lead = sentence(page.intro || page.description) || sentence(`Curated ${page.title} resources`);
  const lic = l => entries.filter(e => e.license === l);
  const os = lic('Open Source');
  const free = entries.filter(e => ['Free', 'Freemium', 'Free NC', 'Open Source'].includes(e.license));
  let count = `${countNoun(n, entries)} listed.`;
  if (free.length) {
    count += ` ${free.length} ${isAre(free.length)} free or ${free.length === 1 ? 'has' : 'have'} a free tier`;
    count += os.length ? `, ${os.length} ${isAre(os.length)} open source.` : '.';
  }
  count = sentence(count);

  const order = ranked(entries, page.picks);
  const inOrder = pred => order.filter(pred);
  const extras = [
    namesSentence('Open source', inOrder(e => e.license === 'Open Source')),
    namesSentence('Free', inOrder(e => e.license === 'Free')),
    namesSentence('Runs in the browser', inOrder(e => ((e.tags && e.tags.platform) || []).includes('web')))
  ].filter(Boolean);

  const out = [lead, count, ...extras];
  while (out.length > 2 && out.join(' ').length > INTRO_MAX) out.pop();
  return out;
}

// Meta description: intro sentences that fit DESC_MAX; first sentence cut at a word if alone too long.
function metaDescription(sentences) {
  let out = '';
  for (const s of sentences) {
    const next = out ? `${out} ${s}` : s;
    if (next.length > DESC_MAX) break;
    out = next;
  }
  if (!out) out = sentences[0].slice(0, DESC_MAX - 1).replace(/\s+\S*$/, '') + '.';
  return out;
}

// Top tag links for a page's entries. `tagCounts` = Map("<group>::<value>" -> catalog-wide count)
// so only tags whose /tags/ page is indexable are linked.
const LINK_GROUPS = ['workflow', 'output', 'platform', 'tech'];
function narrowLinks(entries, tagCounts, threshold, limit = 5) {
  const local = new Map();
  for (const e of entries) {
    for (const g of LINK_GROUPS) {
      for (const v of (e.tags && e.tags[g]) || []) {
        const k = `${g}::${v}`;
        local.set(k, (local.get(k) || 0) + 1);
      }
    }
  }
  return [...local.entries()]
    .filter(([k, c]) => c >= 2 && (tagCounts.get(k) || 0) >= threshold)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([k, c]) => {
      const [group, value] = k.split('::');
      return { href: `/tags/${group}/${slugify(value)}/`, label: tagLabel(group, value), count: c };
    });
}

// Catalog-wide tag counts by unique URL (matches seo.tagPages, which dedupes per tag).
function tagCounts(entries) {
  const seen = new Map();
  for (const e of entries) {
    for (const g of LINK_GROUPS) {
      for (const v of (e.tags && e.tags[g]) || []) {
        const k = `${g}::${v}`;
        if (!seen.has(k)) seen.set(k, new Set());
        seen.get(k).add(String(e.url).toLowerCase());
      }
    }
  }
  return new Map([...seen].map(([k, s]) => [k, s.size]));
}

// Newest of added_at / url_last_verified / pricing_last_verified over a page's entries (YYYY-MM-DD).
function lastModified(entries) {
  let max = '';
  for (const e of entries) {
    for (const f of ['added_at', 'url_last_verified', 'pricing_last_verified']) {
      const d = String(e[f] || '').slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(d) && d > max) max = d;
    }
  }
  return max || null;
}

module.exports = {
  TITLE_MAX, DESC_MAX, INTRO_MAX,
  nounFor, heading, tagHeading, titleTag, intro, metaDescription, narrowLinks, tagCounts, lastModified
};
