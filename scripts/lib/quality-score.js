// Single quality ranker for entries. Used wherever code needs to compare
// entries (dedupe tiebreaker, low-quality flagging). Each caller picks its
// own threshold; nobody redefines factors.
//
// Returns { score, factors } so callers can also explain the score.

function pathDepth(u) {
  try {
    const p = new URL(u).pathname.replace(/\/+$/, '');
    return p === '' ? 0 : p.split('/').length - 1;
  } catch (e) {
    return 99;
  }
}

function hasQuery(u) {
  try { return !!new URL(u).search; } catch (e) { return null; }
}

function qualityScore(entry) {
  const q = hasQuery(entry.url);
  const factors = {
    url_status: entry.url_status === 'ok' ? 50 : 0,
    path_depth: Math.max(0, 20 - pathDepth(entry.url) * 5),
    no_query: q === false ? 5 : 0,
    description: Math.min(30, (entry.description || '').length / 4),
    tags: Object.keys(entry.tags || {}).length * 3,
    readme_tags: (entry.readme_tags || []).length,
    license: entry.license ? 2 : 0,
  };
  const score = Object.values(factors).reduce((a, b) => a + b, 0);
  return { score, factors };
}

module.exports = { qualityScore, pathDepth, hasQuery };
