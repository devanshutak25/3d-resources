// Heading id for marked-rendered <h1>-<h6> text in build-html.js.
// Must equal render.githubAnchor(title) for the raw title, since the ToC,
// README and See-also links are built with githubAnchor. marked hands us
// HTML-escaped text (&amp;, &#39;, &lt;), so entities are decoded first.

function decodeEntities(text) {
  return String(text)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function headingId(text) {
  return decodeEntities(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s/g, '-');
}

module.exports = { decodeEntities, headingId };
