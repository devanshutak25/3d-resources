// SEO page enumeration — single source of truth for "which subsection/tag pages
// exist and which are indexable". Both the page builders (build-section-pages.js,
// build-tag-pages.js) and the sitemap builder (build-sitemap.js) consume these
// so the emitted pages and the sitemap can never drift apart.

const fs = require('fs');
const catalog = require('./catalog');
const render = require('../render');
const { slugify } = require('./slugify');

// Pages with fewer than this many entries are emitted for navigation but get
// <meta robots="noindex,follow"> and are kept out of sitemap.xml (thin content).
const THIN_THRESHOLD = 3;

const TAG_GROUPS = ['workflow', 'output', 'platform', 'skill', 'tech'];

// Enumerate every subsection across all sections with its rendered entry set.
// entries come from render.loadSubEntries (primary + dual_listed mirrors, deduped,
// non-deprecated) so counts match the drill-down page that actually renders.
function subsectionPages() {
  const out = [];
  for (const meta of catalog.loadSections().sections) {
    let section;
    try { section = catalog.loadSection(meta.file); } catch (_) { continue; }
    for (const sub of section.subsections || []) {
      const entries = render
        .loadSubEntries(meta.file, sub.slug, section.slug)
        .filter(e => !e.deprecated && e.url && e.name);
      out.push({
        sectionFile: meta.file,
        sectionSlug: section.slug,
        sectionTitle: section.title,
        subSlug: sub.slug,
        subTitle: sub.title,
        subDescription: sub.description || '',
        anchor: render.githubAnchor(sub.title),
        entries,
        indexable: entries.length >= THIN_THRESHOLD
      });
    }
  }
  return out;
}

// Map "<sectionSlug>/<subSlug>" → { sectionSlug, sectionTitle, subTitle, anchor }
// for tag-page back-links (data.json carries slugs only, not titles/anchors).
function subsectionAnchorMap() {
  const map = new Map();
  for (const p of subsectionPages()) {
    map.set(`${p.sectionSlug}/${p.subSlug}`, {
      sectionSlug: p.sectionSlug,
      sectionTitle: p.sectionTitle,
      subTitle: p.subTitle,
      anchor: p.anchor
    });
  }
  return map;
}

// Group every distinct tag value (across all 5 groups) into a page descriptor.
// Reads the already-exported _site/data.json so tag pages reflect the same entry
// set the filter UI uses. Entries are deduped by URL within each tag.
function tagPages(dataJsonPath) {
  const data = JSON.parse(fs.readFileSync(dataJsonPath, 'utf8'));
  const anchors = subsectionAnchorMap();
  // key "<group>::<value>" → { group, value, entries: Map<url, entry> }
  const groups = new Map();

  for (const e of data.entries || []) {
    for (const group of TAG_GROUPS) {
      const values = (e.tags && e.tags[group]) || [];
      for (const value of values) {
        const key = `${group}::${value}`;
        if (!groups.has(key)) groups.set(key, { group, value, entries: new Map() });
        const bucket = groups.get(key).entries;
        if (bucket.has(e.url)) continue;
        const loc = anchors.get(`${e.section}/${e.subsection}`);
        bucket.set(e.url, {
          name: e.name,
          url: e.url,
          license: e.license || null,
          entry_type: e.entry_type || null,
          section: e.section,
          subsection: e.subsection,
          sectionTitle: loc ? loc.sectionTitle : e.section,
          subTitle: loc ? loc.subTitle : e.subsection,
          backAnchor: loc ? `/sections/${loc.sectionSlug}/#${loc.anchor}` : `/sections/${e.section}/`
        });
      }
    }
  }

  const out = [];
  for (const { group, value, entries } of groups.values()) {
    const list = [...entries.values()].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', 'en', { sensitivity: 'base' }));
    const tagSlug = slugify(value);
    out.push({
      group,
      value,
      tagSlug,
      // Namespaced by group so values shared across groups (e.g. `cloud` in both
      // platform and tech, `xr` in output and tech) don't collide on one URL.
      pathSlug: `${group}/${tagSlug}`,
      entries: list,
      indexable: list.length >= THIN_THRESHOLD
    });
  }
  // Stable order: group, then value.
  out.sort((a, b) =>
    a.group.localeCompare(b.group) || a.value.localeCompare(b.value));
  return out;
}

module.exports = {
  THIN_THRESHOLD,
  TAG_GROUPS,
  subsectionPages,
  subsectionAnchorMap,
  tagPages
};
