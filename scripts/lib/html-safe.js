// HTML-safety helpers shared by every page builder.
//
// Catalog data arrives through contributor PRs, so no data string is trusted:
// - escText  : text going into markdown/HTML body (README tables, bullets).
// - escAttr  : text going inside a double-quoted attribute.
// - safeJsonLd: JSON for <script type="application/ld+json">; `<` is encoded so
//               a "</script>" inside a description cannot close the block.
// - isSafeHref + useSafeLinks: only http(s), mailto, fragment and relative links
//               survive markdown rendering; anything else (javascript:, data:,
//               vbscript:) becomes "#".

function escText(s) {
  return String(s == null ? '' : s)
    .replace(/&(?![a-zA-Z]+;|#\d+;|#x[0-9a-fA-F]+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escAttr(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// U+2028/U+2029 are legal in JSON but end a line in older JS parsers.
const LINE_SEP = new RegExp(String.fromCharCode(0x2028), 'g');
const PARA_SEP = new RegExp(String.fromCharCode(0x2029), 'g');

function safeJsonLd(obj, indent = 2) {
  return JSON.stringify(obj, null, indent)
    .replace(/</g, '\\u003c')
    .replace(LINE_SEP, '\\u2028')
    .replace(PARA_SEP, '\\u2029');
}

const SAFE_SCHEME = /^(https?:|mailto:)/i;
const HAS_SCHEME = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

function isSafeHref(href) {
  if (href == null) return false;
  // Browsers ignore embedded whitespace/control chars when parsing schemes.
  const h = String(href).replace(/[\x00-\x20]/g, '');
  if (!h) return false;
  if (SAFE_SCHEME.test(h)) return true;
  return !HAS_SCHEME.test(h); // fragment, absolute path or relative path
}

// Install a marked walkTokens hook that neutralises unsafe link/image targets.
// Idempotent per marked instance.
const _patched = new WeakSet();
function useSafeLinks(marked) {
  if (_patched.has(marked)) return marked;
  marked.use({
    walkTokens(token) {
      if ((token.type === 'link' || token.type === 'image') && !isSafeHref(token.href)) {
        token.href = '#';
      }
    }
  });
  _patched.add(marked);
  return marked;
}

module.exports = { escText, escAttr, safeJsonLd, isSafeHref, useSafeLinks };
