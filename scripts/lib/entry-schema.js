// Per-entry Schema.org JSON-LD nodes (Workstream B3).
// Pure: caller passes a catalog entry, gets back one schema.org node object
// (or null for entries too thin to describe). No catalog/IO here so it stays
// unit-testable. Consumed by build-section-pages.js, which appends the nodes
// to each page's @graph. NOT used by build-html.js (index.html stays lean).

// entry_type → schema.org @type
const TYPE_MAP = {
  software: 'SoftwareApplication',
  tool: 'SoftwareApplication',
  plugin: 'SoftwareApplication',
  book: 'Book',
  paper: 'ScholarlyArticle',
  channel: 'CreativeWork',
  tutorial: 'CreativeWork',
  'asset-source': 'WebSite',
  marketplace: 'WebSite',
  service: 'Organization'
  // reference / community / inspiration / hardware and anything unmapped → Thing
};

// platform enum → operatingSystem string
const OS_MAP = {
  win: 'Windows',
  mac: 'macOS',
  linux: 'Linux',
  ios: 'iOS',
  ipad: 'iPadOS',
  android: 'Android',
  web: 'Web Browser'
};

// Licenses we can honestly state a $0 offer for.
const FREE_LICENSES = new Set(['Free', 'Open Source', 'Free NC', 'Freemium']);

// Strip markdown link syntax + collapse whitespace so descriptions are plain text.
function plainText(s) {
  if (!s) return '';
  return String(s)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // [text](url) → text
    .replace(/[`*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Build one schema.org node for an entry, or null if it lacks the basics.
function entryToJsonLd(entry) {
  if (!entry || !entry.name || !entry.url) return null;

  const type = TYPE_MAP[entry.entry_type] || 'Thing';
  const node = {
    '@type': type,
    '@id': entry.url,
    name: entry.name,
    url: entry.url
  };

  const desc = plainText(entry.description);
  if (desc) node.description = desc;

  if (type === 'SoftwareApplication') {
    node.applicationCategory = 'MultimediaApplication';
    const platforms = (entry.tags && entry.tags.platform) || [];
    const os = platforms.map((p) => OS_MAP[p]).filter(Boolean);
    if (os.length) node.operatingSystem = os.join(', ');
    if (FREE_LICENSES.has(entry.license)) {
      node.offers = { '@type': 'Offer', price: '0', priceCurrency: 'USD' };
    }
  }

  return node;
}

// Map an array of entries to non-null nodes, optionally bounded.
function entriesToJsonLd(entries, limit) {
  const list = limit ? entries.slice(0, limit) : entries;
  return list.map(entryToJsonLd).filter(Boolean);
}

module.exports = { entryToJsonLd, entriesToJsonLd, TYPE_MAP, OS_MAP };
