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
const { lastModified } = require('./lib/seo-copy');

const SITE_URL = 'https://3d.devanshutak.xyz';
const SITE_DIR = path.join(__dirname, '..', '_site');

function exists(rel) {
  return fs.existsSync(path.join(SITE_DIR, rel));
}

// <lastmod> = newest added_at / url_last_verified / pricing_last_verified over the page's
// entries (seo-copy.lastModified), so it only moves when the page's data does. Hubs and the
// homepage take the catalog-wide max. <changefreq>/<priority> are omitted: Google ignores both.
function main() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [];
  const subs = seo.subsectionPages();
  const all = [...catalog.iterEntries()].map(x => x.entry).filter(e => !e.deprecated);
  const siteDate = lastModified(all) || today;

  // Root.
  urls.push({ loc: `${SITE_URL}/`, lastmod: siteDate });

  // Sections hub.
  if (exists(path.join('sections', 'index.html'))) {
    urls.push({ loc: `${SITE_URL}/sections/`, lastmod: siteDate });
  }

  // Section pages (12).
  for (const s of catalog.loadSections().sections) {
    if (!exists(path.join('sections', s.slug, 'index.html'))) continue;
    const entries = subs.filter(p => p.sectionSlug === s.slug).flatMap(p => p.entries);
    urls.push({ loc: `${SITE_URL}/sections/${s.slug}/`, lastmod: lastModified(entries) || siteDate });
  }

  // Subsection drill-down pages (indexable + on disk).
  for (const sub of subs) {
    if (!sub.indexable) continue;
    if (!exists(path.join('sections', sub.sectionSlug, sub.subSlug, 'index.html'))) continue;
    urls.push({ loc: `${SITE_URL}/sections/${sub.sectionSlug}/${sub.subSlug}/`, lastmod: lastModified(sub.entries) || siteDate });
  }

  // Studio directories.
  for (const kind of catalog.STUDIO_KINDS) {
    if (exists(path.join(kind, 'index.html'))) {
      urls.push({ loc: `${SITE_URL}/${kind}/`, lastmod: lastModified(catalog.loadStudios(kind)) || siteDate });
    }
  }

  // Tag index pages (indexable + on disk). data.json may not exist on a partial build.
  const dataJson = path.join(SITE_DIR, 'data.json');
  if (fs.existsSync(dataJson)) {
    if (exists(path.join('tags', 'index.html'))) {
      urls.push({ loc: `${SITE_URL}/tags/`, lastmod: siteDate });
    }
    // data.json rows carry no dates; look them up by URL.
    const byUrl = new Map(all.map(e => [String(e.url).toLowerCase(), e]));
    for (const tag of seo.tagPages(dataJson)) {
      if (!tag.indexable) continue;
      if (!exists(path.join('tags', tag.group, tag.tagSlug, 'index.html'))) continue;
      const entries = tag.entries.map(e => byUrl.get(String(e.url).toLowerCase())).filter(Boolean);
      urls.push({ loc: `${SITE_URL}/tags/${tag.pathSlug}/`, lastmod: lastModified(entries) || siteDate });
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
  </url>`).join('\n')}
</urlset>
`;

  fs.mkdirSync(SITE_DIR, { recursive: true });
  fs.writeFileSync(path.join(SITE_DIR, 'sitemap.xml'), sitemap);
  console.log(`Wrote sitemap.xml (${urls.length} URLs)`);
}

main();
