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
require('./lib/html-safe').useSafeLinks(marked);
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const catalog = require('./lib/catalog');
const render = require('./render');
render.setLinkMode('pages');
const seo = require('./lib/seo-pages');
const { slugify } = require('./lib/slugify');
const { pageShell, SITE_URL, REPO_URL, escHtml } = require('./lib/page-shell');
const { entriesToJsonLd } = require('./lib/entry-schema');
const { labelTableCells } = require('./lib/table-labels');
const copy = require('./lib/seo-copy');

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

// Render a whole section's markdown (software tables, references, mirror
// blocks) in-process; render.setLinkMode('pages') above points cross-links at
// standalone subsection pages.
function renderSectionMarkdown(sectionFile) {
  return render.renderSectionFile(sectionFile);
}

// Post-process passes lifted from build-html.js (kept in sync deliberately).
function postProcessHtml(html) {
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

  // Column labels for the stacked mobile table layout.
  html = labelTableCells(html);

  return html;
}

// --- Page header (h1, updated date, intro, tag links) ------------------------

// The rendered markdown opens with the page's own heading (## section / ### subsection)
// and its description paragraph. Both are replaced by pageHeaderHtml; the heading id is
// kept on the <h1> so existing #fragment links still land.
function stripLeadHeading(html, hasDescription) {
  const m = html.match(/^\s*<h[23] id="([^"]*)"[^>]*>[\s\S]*?<\/h[23]>\s*/);
  if (!m) return { id: null, html };
  let rest = html.slice(m[0].length);
  if (hasDescription) rest = rest.replace(/^<p>[\s\S]*?<\/p>\s*/, '');
  return { id: m[1], html: rest };
}

function pageHeaderHtml({ id, h1, icon, editFile, updated, introSentences, links }) {
  const iconHtml = icon ? `<i class="mdi mdi-${icon} section-icon" aria-hidden="true"></i>` : '';
  const editHtml = editFile
    ? `<a class="edit-on-gh" href="${REPO_URL}/blob/main/data/${editFile}" target="_blank" rel="noopener noreferrer" aria-label="Edit this section on GitHub"><i class="mdi mdi-pencil-outline" aria-hidden="true"></i><span>Edit</span></a>`
    : '';
  const idAttr = id ? ` id="${escHtml(id)}"` : '';
  const updatedHtml = updated
    ? `\n      <p class="page-updated"><small>Updated <time datetime="${updated}">${updated}</time></small></p>`
    : '';
  const linksHtml = links.length
    ? `\n      <nav class="narrow-links" aria-label="Narrow it down"><span>Narrow it down:</span> ${links.map(l =>
      `<a href="${escHtml(l.href)}">${escHtml(l.label)}</a> <small>(${l.count})</small>`).join(' · ')}</nav>`
    : '';
  return `<h1${idAttr} tabindex="-1">${iconHtml}${escHtml(h1)}${editHtml}</h1>${updatedHtml}
      <section class="page-intro"><p>${escHtml(introSentences.join(' '))}</p></section>${linksHtml}
`;
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

function buildSectionJsonLd(section, entries, canonicalUrl, pageCopy) {
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
        name: pageCopy.name,
        description: pageCopy.description,
        ...(pageCopy.dateModified ? { dateModified: pageCopy.dateModified } : {}),
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

function buildSubsectionJsonLd(sub, sectionCanonical, subCanonical, pageCopy) {
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
        name: pageCopy.name,
        description: pageCopy.description,
        ...(pageCopy.dateModified ? { dateModified: pageCopy.dateModified } : {}),
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

// Per-section OG card from build-og-images.js; the site-wide card if it is missing
// (generation failed or was skipped) so shared links never point at a 404 image.
function sectionOgImage(slug) {
  const png = path.join(__dirname, '..', '_site', 'assets', 'og', `${slug}.png`);
  return fs.existsSync(png) ? `${SITE_URL}/assets/og/${slug}.png` : `${SITE_URL}/assets/og-image.png`;
}

function renderSectionPage({ sectionDoc, slug, pageTitle, desc, headerBlock, htmlBody, subs, prev, next, jsonLd, lastUpdated }) {
  const canonicalUrl = `${SITE_URL}/sections/${slug}/`;

  const prevLink = prev
    ? `<a class="section-nav-prev" href="/sections/${prev.slug}/">← ${escHtml(prev.title)}</a>`
    : '<span></span>';
  const nextLink = next
    ? `<a class="section-nav-next" href="/sections/${next.slug}/">${escHtml(next.title)} →</a>`
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
    canonicalUrl, ogImage: sectionOgImage(slug), pageTitle, desc, noindex: false, jsonLd,
    breadcrumbHtml: `<a href="/">3D Resources</a> / <span>${escHtml(sectionDoc.title)}</span>`,
    headerHtml: `<p class="view"><a href="/">← All sections</a></p>\n      <p class="view"><a href="${REPO_URL}">View on GitHub</a></p>`,
    subNavHtml: '',
    htmlBody: `${headerBlock}${subNavHtml}      ${htmlBody}`,
    navHtml: `${prevLink}\n      ${nextLink}`,
    lastUpdated,
    analyticsContext: { pageType: 'section', section: slug }
  });
}

function renderSubsectionPage({ sub, pageTitle, desc, headerBlock, htmlBody, prev, next, jsonLd, lastUpdated }) {
  const sectionCanonical = `${SITE_URL}/sections/${sub.sectionSlug}/`;
  const subCanonical = `${sectionCanonical}${sub.subSlug}/`;

  const prevLink = prev
    ? `<a class="section-nav-prev" href="/sections/${sub.sectionSlug}/${prev.subSlug}/">← ${prev.subTitle}</a>`
    : '<span></span>';
  const nextLink = next
    ? `<a class="section-nav-next" href="/sections/${sub.sectionSlug}/${next.subSlug}/">${next.subTitle} →</a>`
    : '<span></span>';

  return pageShell({
    canonicalUrl: subCanonical, ogImage: sectionOgImage(sub.sectionSlug), pageTitle, desc,
    noindex: !sub.indexable, jsonLd,
    breadcrumbHtml: `<a href="/">3D Resources</a> / <a href="${sectionCanonical}">${escHtml(sub.sectionTitle)}</a> / <span>${escHtml(sub.subTitle)}</span>`,
    headerHtml: `<p class="view"><a href="/sections/${sub.sectionSlug}/">← ${sub.sectionTitle}</a></p>\n      <p class="view"><a href="${REPO_URL}">View on GitHub</a></p>`,
    subNavHtml: '',
    htmlBody: `${headerBlock}      ${htmlBody}`,
    navHtml: `${prevLink}\n      ${nextLink}`,
    lastUpdated,
    analyticsContext: {
      pageType: 'subsection',
      section: sub.sectionSlug,
      subsection: sub.subSlug
    }
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
    lastUpdated,
    analyticsContext: { pageType: 'sections-hub' }
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

  // Catalog-wide tag counts so "Narrow it down" only links indexable tag pages.
  const tagCounts = copy.tagCounts(allSubs.flatMap(s => s.entries));

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
    const anchor = slugify(sectionDoc.title);
    const stripped = stripLeadHeading(postProcessHtml(marked.parse(md)), !!sectionDoc.description);
    const html = stripped.html;

    const canonical = `${SITE_URL}/sections/${meta.slug}/`;
    const entries = entriesFor(meta.file);
    const secPage = {
      title: sectionDoc.title, seoTitle: sectionDoc.seo_title, intro: sectionDoc.intro,
      picks: sectionDoc.picks, description: sectionDoc.description || meta.description
    };
    const secH1 = copy.heading(secPage, entries);
    const secIntro = copy.intro(secPage, entries);
    const secDesc = copy.metaDescription(secIntro);
    const secModified = copy.lastModified(entries);
    const jsonLd = buildSectionJsonLd(sectionDoc, entries, canonical,
      { name: secH1, description: secDesc, dateModified: secModified });
    const secHeader = pageHeaderHtml({
      id: stripped.id || anchor, h1: secH1, icon: SECTION_ICONS[anchor], editFile: meta.file,
      updated: secModified, introSentences: secIntro,
      links: copy.narrowLinks(entries, tagCounts, seo.THIN_THRESHOLD)
    });

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
      sectionDoc, slug: meta.slug, pageTitle: copy.titleTag(secH1), desc: secDesc,
      headerBlock: secHeader, htmlBody: html, subs,
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
      const subStripped = stripLeadHeading(postProcessHtml(marked.parse(subMd)), !!sub.subDescription);

      const sectionCanonical = `${SITE_URL}/sections/${meta.slug}/`;
      const subCanonical = `${sectionCanonical}${sub.subSlug}/`;
      const subPageMeta = {
        title: sub.subTitle, seoTitle: sub.seoTitle, intro: sub.intro,
        picks: sub.picks, description: sub.subDescription
      };
      const subH1 = copy.heading(subPageMeta, sub.entries);
      const subIntro = copy.intro(subPageMeta, sub.entries);
      const subDesc = copy.metaDescription(subIntro);
      const subModified = copy.lastModified(sub.entries);
      const subJsonLd = buildSubsectionJsonLd(sub, sectionCanonical, subCanonical,
        { name: subH1, description: subDesc, dateModified: subModified });
      const subHeader = pageHeaderHtml({
        id: subStripped.id || sub.anchor, h1: subH1, updated: subModified, introSentences: subIntro,
        links: copy.narrowLinks(sub.entries, tagCounts, seo.THIN_THRESHOLD)
      });

      const prevSub = j > 0 ? subs[j - 1] : null;
      const nextSub = j < subs.length - 1 ? subs[j + 1] : null;

      const subPage = renderSubsectionPage({
        sub, pageTitle: copy.titleTag(subH1), desc: subDesc, headerBlock: subHeader,
        htmlBody: subStripped.html,
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
