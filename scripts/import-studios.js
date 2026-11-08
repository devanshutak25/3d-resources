#!/usr/bin/env node
// Studio discovery importer: research agents' out-*.json -> checked rows -> data/studios + data/game-studios.
// Method + agent brief: docs/playbooks/studio-discovery.md. Run from the repo root.
//   node scripts/import-studios.js <dir> --dump    write <dir>/existing.tsv + <dir>/countries.txt for agents
//   node scripts/import-studios.js <dir>           dry run: <dir>/merged.json + <dir>/rejects.json + summary
//   node scripts/import-studios.js <dir> --probe   also live-probe every URL (cached in <dir>/probe-cache.json)
//   node scripts/import-studios.js <dir> --write   append passing rows (implies --probe, uses the cache)
// <dir>/drop.txt and <dir>/force.txt (one studio name per line) override the checks after a manual review.
const fs = require('fs'), path = require('path');
const Ajv = require('ajv/dist/2020');
const addFormats = require('ajv-formats');
const c = require('./lib/catalog.js');
const { COUNTRY_REGION } = require('./lib/studios.js');

const R = process.argv[2];
if (!R || R.startsWith('--')) { console.error('usage: node scripts/import-studios.js <dir> [--dump|--probe|--write]'); process.exit(1); }
fs.mkdirSync(R, { recursive: true });
const WRITE = process.argv.includes('--write'), PROBE = WRITE || process.argv.includes('--probe');
const host = u => { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch { return null; } };

if (process.argv.includes('--dump')) {
  const rows = ['kind\tname\thost\tcountry\tcity'];
  for (const [k, t] of [['studios', 'S'], ['game-studios', 'G']]) for (const s of c.loadStudios(k)) rows.push([t, s.name, host(s.url) || '', s.hq.country, s.hq.city || ''].join('\t'));
  fs.writeFileSync(path.join(R, 'existing.tsv'), rows.join('\n'));
  fs.writeFileSync(path.join(R, 'countries.txt'), Object.keys(COUNTRY_REGION).sort().join('\n'));
  console.log(`existing.tsv ${rows.length - 1} studios, countries.txt ${Object.keys(COUNTRY_REGION).length} countries -> ${R}`);
  process.exit(0);
}

const BANNED = /—|–|\b(comprehensive|robust|powerful|seamless(ly)?|leverag(e|es|ed|ing)|utiliz(e|es|ed|ing)|cutting-edge|state-of-the-art|the ultimate|game-changing|unleash)\b|\b(and more|and beyond|and so much more)\.?$/i;
// False positives are common ("Judith", "prejudice", game titles, casino ad clients): review hits in context before dropping.
const SPAM = /(casino|slot gacor|judi|togel|poker online|viagra|domain (is )?for sale|buy this domain|parked|sedoparking|hugedomains|this domain may be for sale|account suspended)/i;
const ajv = new Ajv({ allErrors: true, strict: false }); addFormats(ajv);
const SCHEMA = { studios: require('../schema/studio.schema.json'), 'game-studios': require('../schema/game-studio.schema.json') };
const V = { studios: ajv.compile(SCHEMA.studios), 'game-studios': ajv.compile(SCHEMA['game-studios']) };
const ORDER = { studios: Object.keys(SCHEMA.studios.properties), 'game-studios': Object.keys(SCHEMA['game-studios'].properties) };

const norm = s => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '').replace(/^(the)/, '').replace(/(studios?|games|entertainment|interactive|animation|productions?|ltd|inc|llc|gmbh)$/, '');
const existing = ['studios', 'game-studios'].flatMap(k => c.loadStudios(k).map(s => ({ name: norm(s.name), host: host(s.url), country: s.hq.country })));
const hostSet = new Set(existing.map(e => e.host)), nameKey = new Set(existing.map(e => `${e.name}|${e.country}`));
// Shared hosts (one site for many studios) never count as a dupe by host alone.
const SHARED_HOSTS = new Set(['linkedin.com', 'instagram.com', 'facebook.com', 'behance.net', 'vimeo.com', 'artstation.com', 'itch.io', 'store.steampowered.com', 'sites.google.com', 'linktr.ee']);
const SOCIAL = ['instagram', 'linkedin', 'vimeo', 'youtube', 'x', 'behance', 'artstation'];

const list = f => fs.existsSync(path.join(R, f)) ? new Set(fs.readFileSync(path.join(R, f), 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean)) : new Set();
const DROP = list('drop.txt'), FORCE = list('force.txt');
const files = fs.readdirSync(R).filter(f => /^out-.*\.json$/.test(f));
const keep = [], rejects = [], seenHost = new Set(), seenName = new Set();
for (const f of files) {
  let rows; try { rows = JSON.parse(fs.readFileSync(path.join(R, f), 'utf8')); } catch (e) { console.log(`!! ${f}: bad JSON ${e.message}`); continue; }
  for (const r of rows) {
    const kind = r._kind === 'game-studios' ? 'game-studios' : 'studios';
    const rej = why => rejects.push({ file: f, name: r.name, url: r.url, why });
    if (!r.name || !r.url) { rej('missing name/url'); continue; }
    if (DROP.has(r.name)) { rej('maintainer drop list'); continue; }
    const s = {};
    for (const k of ORDER[kind]) if (r[k] !== undefined && r[k] !== null && !(Array.isArray(r[k]) && !r[k].length)) s[k] = r[k];
    delete s.size; delete s.added_at; delete s.url_status; delete s.url_last_verified;
    if (s.social) { if (s.social.twitter && !s.social.x) s.social.x = s.social.twitter; for (const k of Object.keys(s.social)) if (!s.social[k] || !SOCIAL.includes(k) || !/^https?:\/\//.test(s.social[k])) delete s.social[k]; if (!Object.keys(s.social).length) delete s.social; }
    if (s.notable) s.notable = s.notable.slice(0, 4).map(n => String(n).slice(0, 80));
    if (kind === 'game-studios' && s.segments) s.segments = s.segments.slice(0, 3);
    if (s.hq && !s.hq.city) delete s.hq.city;
    const h = host(s.url), n = norm(s.name), ctry = s.hq && s.hq.country;
    if (!h) { rej('bad url'); continue; }
    if (ctry === 'Russia') { rej('Russia HQ (open question)'); continue; }
    if (!SHARED_HOSTS.has(h) && (hostSet.has(h) || seenHost.has(h))) { rej(`dupe host ${h}`); continue; }
    if (nameKey.has(`${n}|${ctry}`) || seenName.has(`${n}|${ctry}`)) { rej('dupe name+country'); continue; }
    if (BANNED.test(s.description || '')) { rej('style: ' + (s.description || '').match(BANNED)[0]); continue; }
    const bad = [s.hq, ...(s.offices || [])].filter(p => p && !COUNTRY_REGION[p.country]).map(p => p.country);
    if (bad.length) { rej('unknown country ' + bad.join(',')); continue; }
    if (!V[kind]({ ...s, added_at: new Date().toISOString() })) { rej('schema ' + ajv.errorsText(V[kind].errors)); continue; }
    seenHost.add(h); seenName.add(`${n}|${ctry}`);
    keep.push({ kind, s, file: f, conf: r._confidence || 'n/a', src: (r._src || []).length });
  }
}

async function probe(rows) {
  const cacheF = path.join(R, 'probe-cache.json');
  const cache = fs.existsSync(cacheF) ? JSON.parse(fs.readFileSync(cacheF, 'utf8')) : {};
  const todo = rows.filter(r => !cache[r.s.url]);
  let i = 0;
  const worker = async () => {
    while (i < todo.length) {
      const r = todo[i++];
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 20000);
      try {
        const res = await fetch(r.s.url, { redirect: 'follow', signal: ctl.signal, headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36', accept: 'text/html' } });
        const body = (await res.text()).slice(0, 200000);
        const title = (body.match(/<title[^>]*>([^<]*)/i) || [])[1] || '';
        const visible = body.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ');
        cache[r.s.url] = { status: res.status, final: res.url, title: title.trim().slice(0, 120), spam: (SPAM.exec(title + ' ' + visible) || [])[0] || null };
      } catch (e) { cache[r.s.url] = { status: 0, err: String(e.cause?.code || e.name) }; }
      clearTimeout(t);
    }
  };
  await Promise.all(Array.from({ length: 12 }, worker));
  fs.writeFileSync(cacheF, JSON.stringify(cache, null, 1));
  return cache;
}

(async () => {
  let pass = keep;
  if (PROBE) {
    const cache = await probe(keep);
    pass = [];
    for (const r of keep) {
      const p = cache[r.s.url];
      const fh = p.final && host(p.final);
      // 403/429/503 are usually bot walls on live sites: keep, but only when the agent cited sources.
      const ok = (p.status >= 200 && p.status < 400) || ([401, 403, 429, 503].includes(p.status) && r.src > 0);
      if (FORCE.has(r.s.name)) { r.probe = p; pass.push(r); continue; }
      if (!ok) { rejects.push({ file: r.file, name: r.s.name, url: r.s.url, why: `probe ${p.status} ${p.err || ''}` }); continue; }
      if (p.spam) { rejects.push({ file: r.file, name: r.s.name, url: r.s.url, why: `spam/parked: ${p.spam}` }); continue; }
      if (fh && fh !== host(r.s.url) && !fh.endsWith('.' + host(r.s.url)) && !host(r.s.url).endsWith('.' + fh)) {
        if (hostSet.has(fh)) { rejects.push({ file: r.file, name: r.s.name, url: r.s.url, why: `redirects to listed host ${fh}` }); continue; }
        r.redirect = p.final;
      }
      r.probe = p; pass.push(r);
    }
  }
  fs.writeFileSync(path.join(R, 'merged.json'), JSON.stringify(pass, null, 1));
  fs.writeFileSync(path.join(R, 'rejects.json'), JSON.stringify(rejects, null, 1));
  const by = {}; for (const r of pass) by[r.file] = (by[r.file] || 0) + 1;
  const rb = {}; for (const r of rejects) { const k = r.why.split(' ')[0]; rb[k] = (rb[k] || 0) + 1; }
  console.log('pass by file:', by, 'total', pass.length, '| rejects:', rb, rejects.length);
  for (const r of rejects) console.log(`  REJECT ${r.why.padEnd(30)} ${r.name} | ${r.url} [${r.file}]`);
  console.log('cross-host redirects (review):', pass.filter(r => r.redirect).map(r => `${r.s.name}: ${r.s.url} -> ${r.redirect}`).join('\n  ') || 'none');

  if (WRITE) {
    const now = new Date(), day = now.toISOString().slice(0, 10);
    for (const kind of ['studios', 'game-studios']) {
      // Bot-walled (403/429/503) and force-passed failures get no url_status; the monthly link check fills it.
      const rows = pass.filter(r => r.kind === kind).map((r, i) => ({ ...r.s, added_at: new Date(now.getTime() + i).toISOString(), ...(r.probe.status >= 200 && r.probe.status < 400 ? { url_status: 'ok', url_last_verified: day } : {}) }));
      const chunks = c.loadStudioChunks(kind), dirty = new Set();
      for (const s of rows) {
        let last = chunks[chunks.length - 1];
        if (last.studios.length >= c.CHUNK_CAP) { last = { file: `${String(chunks.length + 1).padStart(2, '0')}-${kind}.yml`, studios: [] }; chunks.push(last); }
        last.studios.push(s); dirty.add(last);
      }
      // Windows EPERM on rename when a chunk is rewritten fast: retry.
      for (const ch of dirty) for (let t = 0; ; t++) { try { c.saveStudioChunk(ch.file, ch.studios, kind); break; } catch (e) { if (t > 8) throw e; const until = Date.now() + 500; while (Date.now() < until); } }
      console.log(`wrote ${rows.length} -> ${kind} (${dirty.size} chunk files)`);
    }
  }
})();
