// Minimal RSS 2.0 / Atom parser. No deps. Returns [{title, url, published, description}].

function decode(s) {
  return (s || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function extract(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const m = xml.match(re);
  if (!m) return null;
  let v = m[1];
  const cdata = v.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  if (cdata) v = cdata[1];
  return decode(v.trim());
}

function extractAttr(xml, tag, attr) {
  const re = new RegExp(`<${tag}[^>]*${attr}="([^"]+)"`, 'i');
  const m = xml.match(re);
  return m ? decode(m[1]) : null;
}

function splitItems(xml) {
  const items = [];
  const re = /<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) items.push(m[2]);
  return items;
}

function parseItem(chunk) {
  const title = extract(chunk, 'title');
  // RSS <link>url</link>, Atom <link href="url"/>
  let url = extract(chunk, 'link');
  if (!url || url.includes('<')) url = extractAttr(chunk, 'link', 'href');
  const published = extract(chunk, 'pubDate') || extract(chunk, 'published') || extract(chunk, 'updated');
  const description = extract(chunk, 'description') || extract(chunk, 'summary') || extract(chunk, 'content');
  const descClean = description ? description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400) : '';
  return { title, url, published, description: descClean };
}

async function fetchFeed(url, { ua = 'Mozilla/5.0 3d-resources-freshness', timeout = 20000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': ua, 'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml' } });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    return splitItems(xml).map(parseItem).filter(i => i.url && i.title);
  } catch (e) {
    clearTimeout(t);
    throw e;
  }
}

module.exports = { fetchFeed, parseItem, splitItems };
