// Shared GitHub-style anchor slugify. Single source of truth so section pages,
// tag pages, and sitemap stay in sync. Mirrors the historical inline copies in
// build-html.js / build-section-pages.js (Pattern A: strips &amp; first).
// NOTE: render.js keeps its own githubAnchor() for in-markdown heading anchors;
// the two agree for every value that does not contain a literal "&".

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/&amp;/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s/g, '-');
}

module.exports = { slugify };
