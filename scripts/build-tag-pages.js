#!/usr/bin/env node
// Generate tag index pages for long-tail SEO.
//   /tags/index.html                  — hub listing every tag group + value
//   /tags/<group>/<value>/index.html  — one per distinct tag value (all 5 groups)
// Namespaced by group so values shared across groups (e.g. `cloud` in platform
// and tech) don't collide. Tags with fewer than seo.THIN_THRESHOLD entries are
// emitted for navigation but marked noindex + kept out of sitemap (build-sitemap.js).
//
// Reads the already-exported _site/data.json (same entry set the filter UI uses).
// Usage: node scripts/build-tag-pages.js _site/data.json _site/tags

const fs = require('fs');
const path = require('path');
const seo = require('./lib/seo-pages');
const { pageShell, SITE_URL, REPO_URL, escHtml } = require('./lib/page-shell');
const { execSync } = require('child_process');

const OG_IMAGE = `${SITE_URL}/assets/og-image.png`;

const GROUP_LABEL = {
  workflow: 'Workflow',
  output: 'Output',
  platform: 'Platform',
  skill: 'Skill level',
  tech: 'Tech'
};

function lastUpdatedDate() {
  try {
    return execSync('git log -1 --format=%cs HEAD', { encoding: 'utf8' }).trim()
      || new Date().toISOString().slice(0, 10);
  } catch (_) { return new Date().toISOString().slice(0, 10); }
}

// Entry list markup. Each row links out to the resource and back to its section
// anchor (internal link for crawl).
function entryListHtml(entries) {
  const items = entries.map(e => {
    const name = escHtml(e.name);
    const where = `<small class="tag-entry-where">in <a href="${escHtml(e.backAnchor)}">${escHtml(e.sectionTitle)} → ${escHtml(e.subTitle)}</a></small>`;
    return `        <li><a href="${escHtml(e.url)}" target="_blank" rel="noopener noreferrer">${name}</a> ${where}</li>`;
  }).join('\n');
  return `      <ul class="tag-entry-list">\n${items}\n      </ul>`;
}

function buildTagJsonLd(tag, canonicalUrl) {
  const items = tag.entries.slice(0, 100).map((e, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: e.name,
    url: e.url
  }));
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Tags', item: `${SITE_URL}/tags/` },
          { '@type': 'ListItem', position: 3, name: tag.value, item: canonicalUrl }
        ]
      },
      {
        '@type': 'CollectionPage',
        '@id': canonicalUrl,
        url: canonicalUrl,
        name: `${tag.value} · 3D Resources`,
        description: `Curated 3D resources tagged ${tag.value}.`,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        inLanguage: 'en'
      },
      {
        '@type': 'ItemList',
        name: tag.value,
        numberOfItems: tag.entries.length,
        itemListElement: items
      }
    ]
  };
}

function renderTagPage(tag, lastUpdated) {
  const canonicalUrl = `${SITE_URL}/tags/${tag.pathSlug}/`;
  const groupLabel = GROUP_LABEL[tag.group] || tag.group;
  const pageTitle = `${tag.value} · ${groupLabel} · 3D Resources`;
  const n = tag.entries.length;
  const desc = `${n} curated 3D resource${n === 1 ? '' : 's'} tagged ${tag.value} (${groupLabel}).`;

  const htmlBody = `<h1>Resources tagged: ${escHtml(tag.value)}</h1>
      <p class="tag-intro">${escHtml(desc)} <a href="/tags/">Browse all tags</a>.</p>
${entryListHtml(tag.entries)}`;

  return pageShell({
    canonicalUrl, ogImage: OG_IMAGE, pageTitle, desc,
    noindex: !tag.indexable,
    jsonLd: buildTagJsonLd(tag, canonicalUrl),
    breadcrumbHtml: `<a href="/">3D Resources</a> / <a href="/tags/">Tags</a> / <span>${escHtml(tag.value)}</span>`,
    headerHtml: `<p class="view"><a href="/tags/">← All tags</a></p>\n      <p class="view"><a href="${REPO_URL}">View on GitHub</a></p>`,
    subNavHtml: '',
    htmlBody,
    navHtml: `<a class="section-nav-prev" href="/tags/">← All tags</a>\n      <span></span>`,
    lastUpdated,
    analyticsContext: { pageType: 'tag', tagGroup: tag.group, tagValue: tag.value }
  });
}

function renderHubPage(tags, lastUpdated) {
  const canonicalUrl = `${SITE_URL}/tags/`;
  const pageTitle = 'Browse by tag · 3D Resources';
  const desc = 'Browse curated 3D resources by workflow, output, platform, skill level, and tech tags.';

  // Group → values, preserving the enumerator's (group, value) sort order.
  const byGroup = new Map();
  for (const t of tags) {
    if (!byGroup.has(t.group)) byGroup.set(t.group, []);
    byGroup.get(t.group).push(t);
  }

  const groupOrder = ['workflow', 'output', 'platform', 'skill', 'tech'];
  const sections = groupOrder.filter(g => byGroup.has(g)).map(g => {
    const label = GROUP_LABEL[g] || g;
    const links = byGroup.get(g).map(t =>
      `        <li><a href="/tags/${t.pathSlug}/">${escHtml(t.value)}</a> <small>(${t.entries.length})</small></li>`
    ).join('\n');
    return `      <h2 id="${g}">${escHtml(label)}</h2>\n      <ul class="tag-hub-list">\n${links}\n      </ul>`;
  }).join('\n');

  const htmlBody = `<h1>Browse by tag</h1>
      <p>${escHtml(desc)}</p>
${sections}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Tags', item: canonicalUrl }
        ]
      },
      {
        '@type': 'CollectionPage',
        '@id': canonicalUrl,
        url: canonicalUrl,
        name: pageTitle,
        description: desc,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        inLanguage: 'en'
      }
    ]
  };

  return pageShell({
    canonicalUrl, ogImage: OG_IMAGE, pageTitle, desc, noindex: false, jsonLd,
    breadcrumbHtml: `<a href="/">3D Resources</a> / <span>Tags</span>`,
    headerHtml: `<p class="view"><a href="/">← All sections</a></p>\n      <p class="view"><a href="${REPO_URL}">View on GitHub</a></p>`,
    subNavHtml: '',
    htmlBody,
    navHtml: `<a class="section-nav-prev" href="/">← Home</a>\n      <span></span>`,
    lastUpdated,
    analyticsContext: { pageType: 'tags-hub' }
  });
}

function main() {
  const dataJson = process.argv[2] || '_site/data.json';
  const outRoot = process.argv[3] || '_site/tags';
  if (!fs.existsSync(dataJson)) {
    console.error(`build-tag-pages: ${dataJson} not found (run export-data.js first)`);
    process.exit(1);
  }

  const lastUpdated = lastUpdatedDate();
  const tags = seo.tagPages(dataJson);

  fs.mkdirSync(outRoot, { recursive: true });
  fs.writeFileSync(path.join(outRoot, 'index.html'), renderHubPage(tags, lastUpdated));

  let count = 0, noindex = 0;
  for (const tag of tags) {
    const dir = path.join(outRoot, tag.group, tag.tagSlug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), renderTagPage(tag, lastUpdated));
    count++;
    if (!tag.indexable) noindex++;
  }

  console.log(`Wrote /tags/ hub + ${count} tag pages (${noindex} noindex).`);
}

main();
