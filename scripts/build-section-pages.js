#!/usr/bin/env node
// Generate per-section + per-subsection HTML pages.
//   /sections/<slug>/index.html           — one per section (12)
//   /sections/<slug>/<sub-slug>/index.html — one per subsection (~151, drill-down)
// Each page is independently indexable; the root index.html keeps the full
// single-page catalog as the canonical experience. Subsection pages with fewer
// than seo.THIN_THRESHOLD entries are emitted for navigation but marked noindex
// and kept out of sitemap.xml (handled by build-sitemap.js via the same enumerator).
//
// Pipeline mirrors build-html.js: render markdown → marked → heading ID injection
// → external-link hygiene → wrap in a scoped template with JSON-LD.

const { marked } = require('marked');
const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');
const catalog = require('./lib/catalog');
const render = require('./render');
const seo = require('./lib/seo-pages');
const { slugify } = require('./lib/slugify');
const { pageShell, SITE_URL, REPO_URL, escHtml } = require('./lib/page-shell');
const { entriesToJsonLd } = require('./lib/entry-schema');

function lastUpdatedDate() {
  try {
    return execSync('git log -1 --format=%cs HEAD', { encoding: 'utf8' }).trim()
      || new Date().toISOString().slice(0, 10);
  } catch (_) { return new Date().toISOString().slice(0, 10); }
}

const SECTION_ICONS = {
  'assets--libraries': 'package-variant',
  'modeling-sculpting--texturing': 'cube-outline',
  'animation--rigging': 'vector-curve',
  'lighting-rendering--shaders': 'lightbulb-outline',
  'vfx-compositing--virtual-production': 'creation',
  'motion-graphics--video': 'play-box-outline',
  'game-development': 'gamepad-variant-outline',
  'art-design--visual-storytelling': 'palette-outline',
  'ai--machine-learning-for-cg': 'brain',
  'tools-pipeline--utilities': 'tools',
  'learning-community--industry': 'school-outline',
  'software-reference': 'application-outline'
};

// Render a whole section's markdown via render.js (software tables, references,
// mirror blocks). renderSection isn't exported (it appends mirror blocks + a
// trailing rule), so shell out to preserve the exact main-site markup.
function renderSectionMarkdown(sectionFile) {
  return execFileSync('node', ['scripts/render.js', sectionFile], {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024
  });
}

// Post-process passes lifted from build-html.js (kept in sync deliberately).
// `editTargetFile` non-null adds an Edit-on-GitHub link on the matching H2.
function postProcessHtml(html, anchor, editTargetFile) {
  // Heading IDs + tabindex + icon on the H2.
  html = html.replace(/<(h[1-6])>(.*?)<\/\1>/g, (m, tag, inner) => {
    const textOnly = inner.replace(/<[^>]+>/g, '');
    const id = slugify(textOnly);
    const extra = (tag === 'h2' || tag === 'h3') ? ' tabindex="-1"' : '';
    let body = inner;
    if (tag === 'h2' && SECTION_ICONS[id]) {
      body = `<i class="mdi mdi-${SECTION_ICONS[id]} section-icon" aria-hidden="true"></i>${inner}`;
    }
    return `<${tag} id="${id}"${extra}>${body}</${tag}>`;
  });

  // Edit-on-GitHub link on the section H2 (section pages only).
  if (editTargetFile) {
    const ghUrl = `${REPO_URL}/blob/main/data/${editTargetFile}`;
    const editLink = `<a class="edit-on-gh" href="${ghUrl}" target="_blank" rel="noopener noreferrer" aria-label="Edit this section on GitHub"><i class="mdi mdi-pencil-outline" aria-hidden="true"></i><span>Edit</span></a>`;
    html = html.replace(new RegExp(`<h2 id="${anchor}"([^>]*)>([\\s\\S]*?)</h2>`), (m, attrs, inner) => {
      return `<h2 id="${anchor}"${attrs}>${inner}${editLink}</h2>`;
    });
  }

  // External link hygiene.
  const SITE_HOST = new URL(SITE_URL).hostname;
  html = html.replace(/<a\s+([^>]*?)href="(https?:\/\/[^"]+)"([^>]*)>/g, (full, pre, href, post) => {
    let host;
    try { host = new URL(href).hostname; } catch (_) { return full; }
    if (host === SITE_HOST) return full;
    const all = pre + ' ' + post;
    const hasTarget = /\btarget\s*=/.test(all);
    const hasRel = /\brel\s*=/.test(all);
    let extra = '';
    if (!hasTarget) extra += ' target="_blank"';
    if (!hasRel) extra += ' rel="noopener noreferrer"';
    if (!extra) return full;
    return `<a ${pre}href="${href}"${post}${extra}>`;
  });

  return html;
}

// --- JSON-LD builders -------------------------------------------------------

function itemListElements(entries) {
  return entries.slice(0, 100).map((e, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: e.name,
    url: e.url
  }));
}

function buildSectionJsonLd(section, entries, canonicalUrl) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: section.title, item: canonicalUrl }
        ]
      },
      {
        '@type': 'CollectionPage',
        '@id': canonicalUrl,
        url: canonicalUrl,
        name: `${section.title} · 3D Resources`,
        description: section.description || '',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        inLanguage: 'en'
      },
      {
        '@type': 'ItemList',
        name: section.title,
        numberOfItems: entries.length,
        itemListElement: itemListElements(entries)
      },
      // Per-entry typed nodes (B3). Bounded to match itemListElements' cap so
      // large sections don't produce an oversized @graph.
      ...entriesToJsonLd(entries, 100)
    ]
  };
}

function buildSubsectionJsonLd(sub, sectionCanonical, subCanonical) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: sub.sectionTitle, item: sectionCanonical },
          { '@type': 'ListItem', position: 3, name: sub.subTitle, item: subCanonical }
        ]
      },
      {
        '@type': 'CollectionPage',
        '@id': subCanonical,
        url: subCanonical,
        name: `${sub.subTitle} · ${sub.sectionTitle} · 3D Resources`,
        description: sub.subDescription || '',
        isPartOf: { '@id': sectionCanonical },
        inLanguage: 'en'
      },
      {
        '@type': 'ItemList',
        name: sub.subTitle,
        numberOfItems: sub.entries.length,
        itemListElement: itemListElements(sub.entries)
      },
      // Per-entry typed nodes (B3). Subsections are <=50 by chunk cap, emit all.
      ...entriesToJsonLd(sub.entries)
    ]
  };
}

// Collect non-deprecated entries for a section (chunk-iteration order).
function entriesFor(sectionFile) {
  const out = [];
  const seen = new Set();
  for (const chunk of catalog.iterChunks()) {
    if (chunk.sectionFile !== sectionFile) continue;
    for (const e of chunk.entries) {
      if (e.deprecated) continue;
      if (!e.url || !e.name) continue;
      const k = e.url.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(e);
    }
  }
  return out;
}

// --- Page renderers ---------------------------------------------------------

function renderSectionPage({ sectionDoc, slug, description, htmlBody, subs, prev, next, jsonLd, lastUpdated }) {
  const canonicalUrl = `${SITE_URL}/sections/${slug}/`;
  const pageTitle = `${sectionDoc.title} · 3D Resources`;
  const desc = description || `Curated 3D resources for ${sectionDoc.title}.`;

  const prevLink = prev
    ? `<a class="section-nav-prev" href="/sections/${prev.slug}/">← ${prev.title}</a>`
    : '<span></span>';
  const nextLink = next
    ? `<a class="section-nav-next" href="/sections/${next.slug}/">${next.title} →</a>`
    : '<span></span>';

  // "Subsections in this section" — internal links to drill-down pages (crawl + UX).
  let subNavHtml = '';
  if (subs.length) {
    const items = subs.map(s =>
      `<li><a href="/sections/${slug}/${s.subSlug}/">${s.subTitle}</a> <small>(${s.entries.length})</small></li>`
    ).join('\n');
    subNavHtml = `      <nav class="subsection-index" aria-label="Subsections">
        <h2>Browse by subsection</h2>
        <ul>
${items}
        </ul>
      </nav>
`;
  }

  return pageShell({
    canonicalUrl, ogImage: `${SITE_URL}/assets/og/${slug}.png`, pageTitle, desc, noindex: false, jsonLd,
    breadcrumbHtml: `<a href="/">3D Resources</a> / <span>${sectionDoc.title}</span>`,
    headerHtml: `<p class="view"><a href="/">← All sections</a></p>\n      <p class="view"><a href="${REPO_URL}">View on GitHub</a></p>`,
    subNavHtml,
    htmlBody,
    navHtml: `${prevLink}\n      ${nextLink}`,
    lastUpdated
  });
}

function renderSubsectionPage({ sub, slug, htmlBody, prev, next, jsonLd, lastUpdated }) {
  const sectionCanonical = `${SITE_URL}/sections/${sub.sectionSlug}/`;
  const subCanonical = `${sectionCanonical}${sub.subSlug}/`;
  const pageTitle = `${sub.subTitle} · ${sub.sectionTitle} · 3D Resources`;
  const desc = sub.subDescription
    || `Curated ${sub.subTitle} resources in ${sub.sectionTitle}.`;

  const prevLink = prev
    ? `<a class="section-nav-prev" href="/sections/${sub.sectionSlug}/${prev.subSlug}/">← ${prev.subTitle}</a>`
    : '<span></span>';
  const nextLink = next
    ? `<a class="section-nav-next" href="/sections/${sub.sectionSlug}/${next.subSlug}/">${next.subTitle} →</a>`
    : '<span></span>';

  return pageShell({
    canonicalUrl: subCanonical, ogImage: `${SITE_URL}/assets/og/${sub.sectionSlug}.png`, pageTitle, desc,
    noindex: !sub.indexable, jsonLd,
    breadcrumbHtml: `<a href="/">3D Resources</a> / <a href="${sectionCanonical}">${sub.sectionTitle}</a> / <span>${sub.subTitle}</span>`,
    headerHtml: `<p class="view"><a href="/sections/${sub.sectionSlug}/">← ${sub.sectionTitle}</a></p>\n      <p class="view"><a href="${REPO_URL}">View on GitHub</a></p>`,
    subNavHtml: '',
    htmlBody,
    navHtml: `${prevLink}\n      ${nextLink}`,
    lastUpdated
  });
}

// /sections/ landing hub — lists all sections so the directory URL resolves to a
// real, themed page (otherwise Cloudflare 404s and the local server autoindexes).
// Mirrors the /tags/ hub structure; reuses .subsection-index + .section-icon.
function renderSectionsHubPage(cards, lastUpdated) {
  const canonicalUrl = `${SITE_URL}/sections/`;
  const pageTitle = 'All sections · 3D Resources';
  const total = cards.reduce((n, c) => n + c.count, 0);
  const desc = `Browse the full 3D resources catalog by section. ${cards.length} sections, ${total} curated resources.`;

  const items = cards.map(c => {
    const icon = c.icon ? `<i class="mdi mdi-${c.icon} section-icon" aria-hidden="true"></i>` : '';
    const blurb = c.description ? `<br><small>${escHtml(c.description)}</small>` : '';
    return `          <li>${icon}<a href="/sections/${c.slug}/">${escHtml(c.title)}</a> <small>(${c.count})</small>${blurb}</li>`;
  }).join('\n');

  const htmlBody = `<h1>All sections</h1>
      <p>${escHtml(desc)} <a href="/tags/">Browse by tag</a> or <a href="/">view the single-page catalog</a>.</p>
      <nav class="subsection-index" aria-label="Sections">
        <ul>
${items}
        </ul>
      </nav>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Sections', item: canonicalUrl }
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
      },
      {
        '@type': 'ItemList',
        name: 'Sections',
        numberOfItems: cards.length,
        itemListElement: cards.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: c.title,
          url: `${SITE_URL}/sections/${c.slug}/`
        }))
      }
    ]
  };

  return pageShell({
    canonicalUrl, ogImage: `${SITE_URL}/assets/og-image.png`, pageTitle, desc, noindex: false, jsonLd,
    breadcrumbHtml: `<a href="/">3D Resources</a> / <span>Sections</span>`,
    headerHtml: `<p class="view"><a href="/">← Home</a></p>\n      <p class="view"><a href="${REPO_URL}">View on GitHub</a></p>`,
    subNavHtml: '',
    htmlBody,
    navHtml: `<a class="section-nav-prev" href="/">← Home</a>\n      <a class="section-nav-next" href="/tags/">Browse by tag →</a>`,
    lastUpdated
  });
}

function main() {
  const lastUpdated = lastUpdatedDate();
  const sections = catalog.loadSections().sections;
  const outRoot = path.join(__dirname, '..', '_site', 'sections');
  fs.mkdirSync(outRoot, { recursive: true });

  // Pre-compute subsection descriptors (entries + indexable flag), grouped by section.
  const allSubs = seo.subsectionPages();
  const subsBySection = new Map();
  for (const s of allSubs) {
    if (!subsBySection.has(s.sectionSlug)) subsBySection.set(s.sectionSlug, []);
    subsBySection.get(s.sectionSlug).push(s);
  }

  let sectionCount = 0, subCount = 0, subNoindex = 0;
  const sectionCards = [];

  for (let i = 0; i < sections.length; i++) {
    const meta = sections[i];
    const sectionPath = path.join(catalog.DATA_DIR, meta.file);
    if (!fs.existsSync(sectionPath)) continue;
    const sectionDoc = catalog.loadSection(meta.file);
    const subs = subsBySection.get(meta.slug) || [];

    // --- Section page ---
    const md = renderSectionMarkdown(meta.file);
    let html = marked.parse(md);
    const anchor = slugify(sectionDoc.title);
    html = postProcessHtml(html, anchor, meta.file);

    const canonical = `${SITE_URL}/sections/${meta.slug}/`;
    const entries = entriesFor(meta.file);
    const jsonLd = buildSectionJsonLd(sectionDoc, entries, canonical);

    sectionCards.push({
      slug: meta.slug,
      title: sectionDoc.title,
      description: meta.description || sectionDoc.description || '',
      icon: SECTION_ICONS[slugify(sectionDoc.title)] || '',
      count: entries.length
    });

    const prev = i > 0 ? sections[i - 1] : null;
    const next = i < sections.length - 1 ? sections[i + 1] : null;

    const page = renderSectionPage({
      sectionDoc, slug: meta.slug, description: meta.description,
      htmlBody: html, subs,
      prev: prev ? { slug: prev.slug, title: prev.title } : null,
      next: next ? { slug: next.slug, title: next.title } : null,
      jsonLd, lastUpdated
    });

    const dir = path.join(outRoot, meta.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), page);
    sectionCount++;

    // --- Subsection pages ---
    for (let j = 0; j < subs.length; j++) {
      const sub = subs[j];
      const subMd = render.renderSubsectionMarkdown(meta.file, sub.subSlug);
      if (!subMd) continue;
      let subHtml = marked.parse(subMd);
      subHtml = postProcessHtml(subHtml, sub.anchor, null);

      const sectionCanonical = `${SITE_URL}/sections/${meta.slug}/`;
      const subCanonical = `${sectionCanonical}${sub.subSlug}/`;
      const subJsonLd = buildSubsectionJsonLd(sub, sectionCanonical, subCanonical);

      const prevSub = j > 0 ? subs[j - 1] : null;
      const nextSub = j < subs.length - 1 ? subs[j + 1] : null;

      const subPage = renderSubsectionPage({
        sub, slug: meta.slug, htmlBody: subHtml,
        prev: prevSub, next: nextSub, jsonLd: subJsonLd, lastUpdated
      });

      const subDir = path.join(dir, sub.subSlug);
      fs.mkdirSync(subDir, { recursive: true });
      fs.writeFileSync(path.join(subDir, 'index.html'), subPage);
      subCount++;
      if (!sub.indexable) subNoindex++;
    }

    console.log(`Wrote /sections/${meta.slug}/ + ${subs.length} subsection pages (${entries.length} entries)`);
  }

  fs.writeFileSync(path.join(outRoot, 'index.html'), renderSectionsHubPage(sectionCards, lastUpdated));
  console.log(`Wrote /sections/ hub (${sectionCards.length} sections).`);

  console.log(`Done: ${sectionCount} section pages, ${subCount} subsection pages (${subNoindex} noindex).`);
}

main();
