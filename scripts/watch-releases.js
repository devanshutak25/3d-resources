#!/usr/bin/env node
// Release watcher: checks configured release feeds, opens issue if new major/minor.
// Maintains state in _maintenance/release-state.json.

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '_maintenance');
const STATE_PATH = path.join(STATE_DIR, 'release-state.json');
const TODAY = new Date().toISOString().slice(0, 10);

// Software to watch. Each entry: { name, type: 'github'|'url-json', config, affectsTag }
// affectsTag = value to grep in data/ to count affected entries when a new release drops.
const WATCHLIST = [
  { name: 'Blender',   type: 'github', config: { repo: 'blender/blender' },                 affectsTag: 'blender-addon' },
  { name: 'Godot',     type: 'github', config: { repo: 'godotengine/godot' },               affectsTag: null },
  { name: 'Bevy',      type: 'github', config: { repo: 'bevyengine/bevy' },                 affectsTag: null },
  { name: 'Flax',      type: 'github', config: { repo: 'FlaxEngine/FlaxEngine' },           affectsTag: null },
  { name: 'O3DE',      type: 'github', config: { repo: 'o3de/o3de' },                       affectsTag: null },
  { name: 'Fyrox',     type: 'github', config: { repo: 'FyroxEngine/Fyrox' },               affectsTag: null },
  { name: 'OpenUSD',   type: 'github', config: { repo: 'PixarAnimationStudios/OpenUSD' },   affectsTag: 'usd' },
  { name: 'MaterialX', type: 'github', config: { repo: 'AcademySoftwareFoundation/MaterialX' }, affectsTag: null },
  { name: 'OpenImageIO', type: 'github', config: { repo: 'AcademySoftwareFoundation/OpenImageIO' }, affectsTag: null },
  { name: 'OpenEXR',   type: 'github', config: { repo: 'AcademySoftwareFoundation/openexr' }, affectsTag: null }
];

async function latestGithubRelease(repo) {
  const url = `https://api.github.com/repos/${repo}/releases/latest`;
  const headers = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'release-watcher' };
  if (process.env.GITHUB_TOKEN) headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`${repo}: HTTP ${res.status}`);
  }
  const data = await res.json();
  return { tag: data.tag_name, name: data.name, published: data.published_at, html_url: data.html_url };
}

async function main() {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  let state = {};
  if (fs.existsSync(STATE_PATH)) {
    try { state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')); } catch (e) {}
  }

  const newReleases = [];
  for (const item of WATCHLIST) {
    try {
      if (item.type === 'github') {
        const latest = await latestGithubRelease(item.config.repo);
        if (!latest) continue;
        const prev = state[item.name];
        if (!prev || prev.tag !== latest.tag) {
          newReleases.push({ ...item, latest, prev });
          state[item.name] = { tag: latest.tag, seen: TODAY };
        }
      }
    } catch (e) {
      console.error(`${item.name}: ${e.message}`);
    }
  }

  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));

  if (!newReleases.length) {
    console.log('No new releases.');
    // Write empty report so CI workflow can skip.
    fs.writeFileSync(path.join(STATE_DIR, 'release-report.md'), '');
    return;
  }

  const lines = [];
  lines.push(`# New releases detected — ${TODAY}`);
  lines.push('');
  lines.push('Review each below. Consider updating related entries in `data/*.yml`.');
  lines.push('');
  for (const r of newReleases) {
    const prevTag = r.prev ? r.prev.tag : '(none tracked)';
    lines.push(`## ${r.name} ${r.latest.tag}`);
    lines.push('');
    lines.push(`- Previous: \`${prevTag}\``);
    lines.push(`- Release notes: ${r.latest.html_url}`);
    lines.push(`- Published: ${r.latest.published}`);
    if (r.affectsTag) {
      lines.push(`- Entries tagged \`${r.affectsTag}\` may need compatibility review.`);
    }
    lines.push('');
  }
  fs.writeFileSync(path.join(STATE_DIR, 'release-report.md'), lines.join('\n'));
  console.log(`Wrote ${newReleases.length} new releases → release-report.md`);
}

main().catch(e => { console.error(e); process.exit(1); });
