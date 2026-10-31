#!/usr/bin/env node
// Build _site/studios/index.html: one filterable directory of studios.
// Cards are server-rendered (crawlable); assets/js/studios.js adds search + filters.
// Data: data/studios/ via catalog.loadStudios(). Schema: schema/studio.schema.json.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const catalog = require('./lib/catalog');
const { pageShell, SITE_URL, REPO_URL, escHtml } = require('./lib/page-shell');
const { isSafeHref } = require('./lib/html-safe');
const { DISCIPLINES, SIZES, REGIONS, regionOf, studioSlugs, placeLabel } = require('./lib/studios');

const OUT_DIR = path.join(__dirname, '..', '_site', 'studios');
const SUGGEST_URL = `${REPO_URL}/issues/new?template=suggest-studio.yml`;
const SOM_URL = 'https://schoolofmotion.com/landing-page/500-studios';
const SOCIAL_LABEL = {
  instagram: 'Instagram', linkedin: 'LinkedIn', vimeo: 'Vimeo', youtube: 'YouTube',
  x: 'X', behance: 'Behance', artstation: 'ArtStation'
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

function extLink(u, label, icon) {
  const i = icon ? `<i class="mdi ${icon}" aria-hidden="true"></i>` : '';
  return `<a href="${href(u)}" target="_blank" rel="noopener noreferrer">${i}${escHtml(label)}</a>`;
}

function cardHtml(s, id) {
  const disc = s.disciplines.map(d => `<span class="disc-pill">${escHtml(DISCIPLINES[d] || d)}</span>`).join('');
  const size = s.size ? `<span class="studio-fact">${escHtml(SIZES[s.size])}</span>` : '';
  const founded = s.founded ? `<span class="studio-fact">Est. ${s.founded}</span>` : '';
  const notable = (s.notable || []).length
    ? `\n        <p class="studio-notable"><span>Notable:</span> ${s.notable.map(escHtml).join(', ')}</p>` : '';
  const offices = (s.offices || []).length
    ? `\n        <p class="studio-offices"><span>Also in:</span> ${s.offices.map(o => escHtml(placeLabel(o))).join(' · ')}</p>` : '';
  const links = [extLink(s.url, 'Site', 'mdi-web')];
  if (s.careers) links.push(extLink(s.careers, 'Careers', 'mdi-briefcase-outline'));
  if (s.reel) links.push(extLink(s.reel, 'Reel', 'mdi-play-circle-outline'));
  for (const k of Object.keys(SOCIAL_LABEL)) {
    if (s.social && s.social[k]) links.push(extLink(s.social[k], SOCIAL_LABEL[k]));
  }
  const countries = [...new Set([s.hq, ...(s.offices || [])].map(p => p.country))];
  const regions = [...new Set(countries.map(regionOf).filter(Boolean))];
  return `      <article class="studio-card" id="${id}" data-d="${escHtml(s.disciplines.join(' '))}" data-c="${escHtml(countries.join('|'))}" data-r="${escHtml(regions.join(' '))}" data-s="${escHtml(s.size || '')}" data-j="${s.careers ? 1 : 0}">
        <div class="studio-head">
          <h2 class="studio-name">${extLink(s.url, s.name)}</h2>
          <span class="studio-loc">${escHtml(placeLabel(s.hq))}</span>
        </div>
        <p class="studio-meta">${disc}${size}${founded}</p>
        <p class="studio-desc">${escHtml(s.description)}</p>${notable}${offices}
        <p class="studio-links">${links.join('')}</p>
      </article>`;
}

function countBy(list, keyFn) {
  const m = new Map();
  for (const x of list) for (const k of keyFn(x)) m.set(k, (m.get(k) || 0) + 1);
  return m;
}

function filterFormHtml(studios) {
  const discCounts = countBy(studios, s => s.disciplines);
  const chips = Object.keys(DISCIPLINES).filter(d => discCounts.has(d)).map(d =>
    `<button type="button" class="filter-chip" data-group="d" data-value="${d}" aria-pressed="false">${escHtml(DISCIPLINES[d])} <small>${discCounts.get(d)}</small></button>`
  ).join('\n            ');

  const countryCounts = countBy(studios, s => new Set([s.hq, ...(s.offices || [])].map(p => p.country)));
  const regionGroups = Object.keys(REGIONS).map(r => {
    const cs = [...countryCounts.keys()].filter(c => regionOf(c) === r).sort();
    if (!cs.length) return '';
    const total = studios.filter(s => [s.hq, ...(s.offices || [])].some(p => regionOf(p.country) === r)).length;
    const opts = cs.map(c => `<option value="c:${escHtml(c)}">${escHtml(c)} (${countryCounts.get(c)})</option>`).join('');
    return `<optgroup label="${escHtml(REGIONS[r])}"><option value="r:${r}">All ${escHtml(REGIONS[r])} (${total})</option>${opts}</optgroup>`;
  }).join('');

  const sizeCounts = countBy(studios, s => s.size ? [s.size] : []);
  const sizeChips = Object.keys(SIZES).filter(k => sizeCounts.has(k)).map(k =>
    `<button type="button" class="filter-chip" data-group="size" data-value="${k}" aria-pressed="false">${escHtml(SIZES[k])} <small>${sizeCounts.get(k)}</small></button>`
  ).join('\n            ');

  return `<form id="studio-filters" class="studio-filters" role="search" aria-label="Filter studios" hidden>
        <input type="search" id="studio-q" name="q" placeholder="Search studios, cities, projects…" aria-label="Search studios" autocomplete="off">
        <div class="filter-row"><span class="filter-label" id="studio-d-label">Discipline</span>
          <div class="filter-chips" role="group" aria-labelledby="studio-d-label">
            ${chips}
          </div>
        </div>
        <div class="filter-row"><label class="filter-label" for="studio-loc">Location</label>
          <select id="studio-loc" name="loc"><option value="">All locations</option>${regionGroups}</select>
        </div>
        ${sizeChips ? `<div class="filter-row"><span class="filter-label" id="studio-size-label">Size</span>
          <div class="filter-chips" role="group" aria-labelledby="studio-size-label">
            ${sizeChips}
          </div>
        </div>` : ''}
        <div class="studio-filter-foot">
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
        // Kept minimal (like tag pages): the cards already carry descriptions; full objects doubled the page.
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
  const countries = new Set(studios.flatMap(s => [s.hq, ...(s.offices || [])].map(p => p.country)));
  const n = studios.length.toLocaleString('en-US');
  const canonicalUrl = `${SITE_URL}/studios/`;
  const desc = `${n} animation, VFX, motion design, CG, game and arch viz studios in ${countries.size} countries, with careers pages and notable work.`;

  const htmlBody = `<h1>Studios directory</h1>
      <p class="studio-intro">${escHtml(desc)} Filter by discipline, location or size. Missing a studio? <a href="${SUGGEST_URL}">Suggest one</a>.</p>
      <p class="studio-credit">Started from School of Motion's <a href="${SOM_URL}" rel="noopener">500 Studios</a> (Vol. 1). Descriptions are our own.</p>
      ${filterFormHtml(studios)}
      <div class="studio-grid" id="studio-grid">
${studios.map((s, i) => cardHtml(s, ids[i])).join('\n')}
      </div>
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

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html);
  console.log(`Wrote /studios/ (${studios.length} studios, ${countries.size} countries, ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);
}

main();
