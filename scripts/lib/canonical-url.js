// Canonicalize a URL for comparison and storage.
// Rules locked in canonical-url.test.js.

const TRACKING_PARAMS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'ref', 'source', 'fbclid', 'gclid'
]);

function canonicalUrl(input) {
  if (!input) return '';
  let url;
  try { url = new URL(input); } catch { return input; }
  url.protocol = 'https:';
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.has(key.toLowerCase())) url.searchParams.delete(key);
  }
  if (url.pathname !== '/' && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.replace(/\/+$/, '');
  }
  return url.toString();
}

module.exports = { canonicalUrl, TRACKING_PARAMS };
