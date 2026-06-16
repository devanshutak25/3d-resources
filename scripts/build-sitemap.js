#!/usr/bin/env node
// Build _site/sitemap.xml. Runs LAST in build.sh so every page artifact already
// exists on disk. Single writer of the sitemap (build-html.js no longer emits it).
//
// A URL is listed only if (a) the page file exists on disk AND (b) the shared
// seo-pages enumerator marks it indexable (>= THIN_THRESHOLD entries). This means
// noindex/thin pages and not-yet-generated page types are automatically excluded
// without any per-phase bookkeeping.

const fs = require('fs');
const path = require('path');
const catalog = require('./lib/catalog');
const seo = require('./lib/seo-pages');

const SITE_URL = 'https://3d.devanshutak.xyz';
const SITE_DIR = path.join(__dirname, '..', '_site');

function exists(rel) {
  return fs.existsSync(path.join(SITE_DIR, rel));
}

function main() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [];

  // Root.
  urls.push({ loc: `${SITE_URL}/`, priority: '1.0', changefreq: 'weekly' });

  // Sections hub.
  if (exists(path.join('sections', 'index.html'))) {
    urls.push({ loc: `${SITE_URL}/sections/`, priority: '0.8', changefreq: 'weekly' });
  }

  // Section pages (12).
  for (const s of catalog.loadSections().sections) {
    if (!exists(path.join('sections', s.slug, 'index.html'))) continue;
    urls.push({ loc: `${SITE_URL}/sections/${s.slug}/`, priority: '0.9', changefreq: 'weekly' });
  }

  // Subsection drill-down pages (indexable + on disk).
  for (const sub of seo.subsectionPages()) {
    if (!sub.indexable) continue;
    if (!exists(path.join('sections', sub.sectionSlug, sub.subSlug, 'index.html'))) continue;
    urls.push({ loc: `${SITE_URL}/sections/${sub.sectionSlug}/${sub.subSlug}/`, priority: '0.7', changefreq: 'weekly' });
  }

  // Tag index pages (indexable + on disk). data.json may not exist on a partial build.
  const dataJson = path.join(SITE_DIR, 'data.json');
  if (fs.existsSync(dataJson)) {
    if (exists(path.join('tags', 'index.html'))) {
      urls.push({ loc: `${SITE_URL}/tags/`, priority: '0.6', changefreq: 'weekly' });
    }
    for (const tag of seo.tagPages(dataJson)) {
      if (!tag.indexable) continue;
      if (!exists(path.join('tags', tag.group, tag.tagSlug, 'index.html'))) continue;
      urls.push({ loc: `${SITE_URL}/tags/${tag.pathSlug}/`, priority: '0.6', changefreq: 'weekly' });
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

  fs.mkdirSync(SITE_DIR, { recursive: true });
  fs.writeFileSync(path.join(SITE_DIR, 'sitemap.xml'), sitemap);
  console.log(`Wrote sitemap.xml (${urls.length} URLs)`);
}

main();
