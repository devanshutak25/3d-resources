#!/usr/bin/env node
// Build _site/studios/index.html + _site/studios/studios.json: one filterable directory of studios.
// The first FIRST cards are server-rendered (crawlable, no-JS fallback). studios.json carries every
// card pre-rendered as HTML plus filter fields; assets/js/studios.js filters, groups and renders the
// rest on scroll, so escaping stays here (html-safe) and there is one card template.
// Data: data/studios/ via catalog.loadStudios(). Schema: schema/studio.schema.json.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const catalog = require('./lib/catalog');
const { pageShell, SITE_URL, REPO_URL, escHtml } = require('./lib/page-shell');
const { isSafeHref } = require('./lib/html-safe');
const { DISCIPLINES, MARKETS, SIZES, REGIONS, regionOf, decadeOf, studioSlugs, placeLabel } = require('./lib/studios');

const OUT_DIR = path.join(__dirname, '..', '_site', 'studios');
const FIRST = 48;
const BUILD_YEAR = new Date().getFullYear();
const SUGGEST_URL = `${REPO_URL}/issues/new?template=suggest-studio.yml`;
const DATA_URL = `${REPO_URL}/tree/main/data/studios`;
const SOM_URL = 'https://schoolofmotion.com/landing-page/500-studios';
// [label, MDI icon or text mark]. MDI has no Behance or current X logo, so those get text marks.
const SOCIAL = {
  instagram: ['Instagram', 'mdi-instagram'], linkedin: ['LinkedIn', 'mdi-linkedin'], vimeo: ['Vimeo', 'mdi-vimeo'],
  youtube: ['YouTube', 'mdi-youtube'], x: ['X', 'X'], behance: ['Behance', 'Bē'], artstation: ['ArtStation', 'mdi-artstation']
};

function lastUpdatedDate() {
  try {
    return execSync('git log -1 --format=%cs HEAD', { encoding: 'utf8' }).trim()
      || new Date().toISOString().slice(0, 10);
  } catch (_) { return new Date().toISOString().slice(0, 10); }
}

function href(u) {
  return isSafeHref(u) ? escHtml(u) : '#';
}

function extLink(u, label, icon, cls) {
  const i = icon ? `<i class="mdi ${icon}" aria-hidden="true"></i>` : '';
  return `<a${cls ? ` class="${cls}"` : ''} href="${href(u)}" target="_blank" rel="noopener noreferrer">${i}${escHtml(label)}</a>`;
}

function socialLink(u, key) {
  const [label, icon] = SOCIAL[key];
  const mark = icon.startsWith('mdi-') ? `<i class="mdi ${icon}" aria-hidden="true"></i>` : `<span aria-hidden="true">${icon}</span>`;
  return `<a class="no-ext-icon" href="${href(u)}" target="_blank" rel="noopener noreferrer" aria-label="${label}" title="${label}">${mark}</a>`;
}

function row(label, html) {
  return `<p class="studio-row"><span class="studio-k">${label}</span> ${html}</p>`;
}

function cardHtml(s, id) {
  const disc = s.disciplines.map(d => `<li class="disc-pill d-${d}">${escHtml(DISCIPLINES[d] || d)}</li>`).join('');
  const facts = [];
  if (s.size) facts.push(`<span>${escHtml(SIZES[s.size])}</span>`);
  if (s.founded) {
    const age = BUILD_YEAR - s.founded;
    facts.push(`<span>Est. ${s.founded}${age > 0 ? ` (${age} yr${age === 1 ? '' : 's'})` : ''}</span>`);
  }
  const rows = [];
  if (facts.length) rows.push(`<p class="studio-facts">${facts.join('')}</p>`);
  if ((s.markets || []).length) rows.push(row('Works for', s.markets.map(m => escHtml(MARKETS[m] || m)).join(', ')));
  if ((s.notable || []).length) rows.push(row('Notable', s.notable.map(escHtml).join(', ')));
  if ((s.offices || []).length) {
    const all = s.offices.map(placeLabel);
    const short = s.offices.map(o => o.city || o.country);
    const shown = short.slice(0, 3).map(escHtml).join(' · ') + (all.length > 3 ? ` <span class="studio-more-n">+${all.length - 3}</span>` : '');
    rows.push(`<p class="studio-row" title="${escHtml(all.join(' · '))}"><span class="studio-k">Also in</span> ${shown}</p>`);
  }
  const main = [extLink(s.url, 'Site', 'mdi-web', 'no-ext-icon')];
  if (s.careers) main.push(extLink(s.careers, 'Careers', 'mdi-briefcase-outline', 'no-ext-icon'));
  if (s.reel) main.push(extLink(s.reel, 'Reel', 'mdi-play-circle-outline', 'no-ext-icon'));
  const social = Object.keys(SOCIAL).filter(k => s.social && s.social[k]).map(k => socialLink(s.social[k], k));
  return `<article class="studio-card" id="${id}">
  <h3 class="studio-name">${extLink(s.url, s.name)}</h3>
  <p class="studio-loc"><i class="mdi mdi-map-marker-outline" aria-hidden="true"></i>${escHtml(placeLabel(s.hq))}</p>
  <ul class="studio-discs" aria-label="Disciplines">${disc}</ul>
  ${rows.join('\n  ')}
  <div class="studio-links"><span>${main.join('')}</span>${social.length ? `<span class="studio-social">${social.join('')}</span>` : ''}</div>
</article>`;
}

// One record per studio for studios.js: pre-rendered card + the fields filters/grouping need.
function record(s, id) {
  const places = [s.hq, ...(s.offices || [])];
  const countries = [...new Set(places.map(p => p.country))];
  const text = [
    s.name, ...places.map(placeLabel), ...s.disciplines.map(d => DISCIPLINES[d]),
    ...(s.markets || []).map(m => MARKETS[m]), ...(s.notable || []), s.description
  ].join(' ').toLowerCase().replace(/\s+/g, ' ');
  return {
    id, h: cardHtml(s, id), t: text,
    d: s.disciplines, m: s.markets || [], c: countries,
    r: [...new Set(countries.map(regionOf).filter(Boolean))],
    hc: s.hq.country, hr: regionOf(s.hq.country) || '',
    s: s.size || '', a: decadeOf(s.founded), j: s.careers ? 1 : 0
  };
}

function countBy(list, keyFn) {
  const m = new Map();
  for (const x of list) for (const k of keyFn(x)) m.set(k, (m.get(k) || 0) + 1);
  return m;
}

function chipRow(id, label, group, labels, counts, colored) {
  const chips = Object.keys(labels).filter(k => counts.has(k)).map(k =>
    `<button type="button" class="filter-chip${colored ? ` d-${k}` : ''}" data-group="${group}" data-value="${k}" aria-pressed="false">${escHtml(labels[k])} <small>${counts.get(k)}</small></button>`
  ).join('\n            ');
  if (!chips) return '';
  return `<div class="filter-row"><span class="filter-label" id="${id}">${label}</span>
          <div class="filter-chips" role="group" aria-labelledby="${id}">
            ${chips}
          </div>
        </div>`;
}

// Size chips sit under a "People" label, so "201+ people" shortens to "201+".
const SIZE_CHIPS = Object.fromEntries(Object.entries(SIZES).map(([k, v]) => [k, v.replace(' people', '')]));

function filterFormHtml(studios) {
  const countryCounts = countBy(studios, s => new Set([s.hq, ...(s.offices || [])].map(p => p.country)));
  const regionGroups = Object.keys(REGIONS).map(r => {
    const cs = [...countryCounts.keys()].filter(c => regionOf(c) === r).sort();
    if (!cs.length) return '';
    const total = studios.filter(s => [s.hq, ...(s.offices || [])].some(p => regionOf(p.country) === r)).length;
    const opts = cs.map(c => `<option value="c:${escHtml(c)}">${escHtml(c)} (${countryCounts.get(c)})</option>`).join('');
    return `<optgroup label="${escHtml(REGIONS[r])}"><option value="r:${r}">All ${escHtml(REGIONS[r])} (${total})</option>${opts}</optgroup>`;
  }).join('');

  return `<form id="studio-filters" class="studio-filters" role="search" aria-label="Filter studios" hidden>
        <div class="studio-search"><i class="mdi mdi-magnify" aria-hidden="true"></i><input type="search" id="studio-q" name="q" placeholder="Search studios, cities, projects…" aria-label="Search studios" autocomplete="off"></div>
        ${chipRow('studio-d-label', 'Discipline', 'd', DISCIPLINES, countBy(studios, s => s.disciplines), true)}
        <div class="studio-filter-pair">
        ${chipRow('studio-m-label', 'Works for', 'm', MARKETS, countBy(studios, s => s.markets || []), false)}
        ${chipRow('studio-size-label', 'People', 'size', SIZE_CHIPS, countBy(studios, s => s.size ? [s.size] : []), false)}
        </div>
        <div class="studio-filter-foot">
          <label class="studio-select">Location <select id="studio-loc" name="loc"><option value="">All locations</option>${regionGroups}</select></label>
          <label class="studio-select">Group by <select id="studio-group" name="g">
            <option value="">None</option><option value="r">Region</option><option value="c">Country</option><option value="s">Size</option><option value="a">Age</option>
          </select></label>
          <label class="studio-careers"><input type="checkbox" id="studio-careers"> Has a careers page</label>
          <p class="studio-count" id="studio-count" aria-live="polite"></p>
          <button type="button" class="studio-clear" id="studio-clear" hidden>Clear filters</button>
        </div>
      </form>`;
}

function jsonLd(studios, canonicalUrl, desc) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Studios', item: canonicalUrl }
        ]
      },
      {
        '@type': 'CollectionPage',
        '@id': canonicalUrl,
        url: canonicalUrl,
        name: 'Studios directory · 3D Resources',
        description: desc,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        inLanguage: 'en'
      },
      {
        '@type': 'ItemList',
        name: 'Studios',
        numberOfItems: studios.length,
        // Kept minimal (like tag pages). Cards past FIRST load client-side, so this is the crawlable full list.
        itemListElement: studios.map((s, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: { '@type': 'Organization', name: s.name, url: s.url, address: { '@type': 'PostalAddress', addressCountry: s.hq.country } }
        }))
      }
    ]
  };
}

function main() {
  const studios = catalog.loadStudios()
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
  const ids = studioSlugs(studios);
  const records = studios.map((s, i) => record(s, ids[i]));
  const countries = new Set(studios.flatMap(s => [s.hq, ...(s.offices || [])].map(p => p.country)));
  const n = studios.length.toLocaleString('en-US');
  const canonicalUrl = `${SITE_URL}/studios/`;
  const desc = `${n} animation, VFX, motion design, CG, game and arch viz studios in ${countries.size} countries, with careers pages and notable work.`;

  const htmlBody = `<h1>Studios directory</h1>
      <p class="studio-intro">${n} animation, VFX, motion design, CG, game and arch viz studios in ${countries.size} countries.</p>
      <p class="studio-credit">Missing one? <a href="${SUGGEST_URL}">Suggest a studio</a>. Started from School of Motion's <a href="${SOM_URL}" rel="noopener">500 Studios</a> (Vol. 1).</p>
      ${filterFormHtml(studios)}
      <h2 class="sr-only" id="studio-all-h">All studios</h2>
      <div class="studio-grid" id="studio-grid" data-src="/studios/studios.json">
${records.slice(0, FIRST).map(r => r.h).join('\n')}
      </div>
      <div class="studio-sentinel" id="studio-sentinel"></div>
      <noscript><p class="studio-noscript">Showing the first ${FIRST} of ${n} studios. The full list needs JavaScript, or browse <a href="${DATA_URL}">the data on GitHub</a>.</p></noscript>
      <p class="studio-empty" id="studio-empty" hidden>No studios match. <button type="button" class="studio-clear" data-clear>Clear filters</button></p>
      <script defer src="/assets/js/studios.js"></script>`;

  const html = pageShell({
    canonicalUrl,
    ogImage: `${SITE_URL}/assets/og-image.png`,
    pageTitle: 'Studios directory: animation, VFX, motion and game studios · 3D Resources',
    desc,
    noindex: false,
    jsonLd: jsonLd(studios, canonicalUrl, desc),
    breadcrumbHtml: `<a href="/">3D Resources</a> / <span>Studios</span>`,
    headerHtml: `<p class="view"><a href="/">← All resources</a></p>\n      <p class="view"><a href="${REPO_URL}">View on GitHub</a></p>`,
    subNavHtml: '',
    htmlBody,
    navHtml: `<a class="section-nav-prev" href="/">← Home</a>\n      <a class="section-nav-next" href="/sections/">All sections →</a>`,
    lastUpdated: lastUpdatedDate(),
    analyticsContext: { pageType: 'studios' }
  });

  const json = JSON.stringify({ regions: REGIONS, sizes: SIZES, studios: records });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html);
  fs.writeFileSync(path.join(OUT_DIR, 'studios.json'), json);
  const kb = s => (Buffer.byteLength(s) / 1024).toFixed(0);
  console.log(`Wrote /studios/ (${studios.length} studios, ${countries.size} countries, page ${kb(html)} KB, json ${kb(json)} KB)`);
}

main();
