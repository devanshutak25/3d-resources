#!/usr/bin/env node
// Build _site/graph.json — node/edge data for the WebGL graph view.
// Nodes: section / subsection / entry / tag.
// Edges: section→subsection, subsection→entry (incl. dual_listed), entry→tag.

const fs = require('fs');
const path = require('path');
const catalog = require('./lib/catalog');

function ghAnchor(t) {
  return String(t).toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
}

function main() {
  const outPath = process.argv[2] || '_site/graph.json';
  const sections = catalog.loadSections().sections;

  // Section + subsection metadata
  const subMeta = new Map(); // key: section/sub -> {sectionSlug, subSlug, sectionTitle, subTitle, anchor}
  const sectionMeta = new Map();
  for (const meta of sections) {
    const sec = catalog.loadSection(meta.file);
    sectionMeta.set(sec.slug, { slug: sec.slug, title: sec.title, anchor: ghAnchor(sec.title) });
    for (const sub of sec.subsections || []) {
      const key = `${sec.slug}/${sub.slug}`;
      subMeta.set(key, {
        sectionSlug: sec.slug,
        sectionTitle: sec.title,
        subSlug: sub.slug,
        subTitle: sub.title,
        anchor: ghAnchor(sub.title)
      });
    }
  }

  const nodes = [];
  const edges = [];
  const nodeIds = new Set();

  function addNode(n) {
    if (nodeIds.has(n.id)) return;
    nodeIds.add(n.id);
    nodes.push(n);
  }

  // Section + subsection nodes + section→subsection edges
  for (const [slug, m] of sectionMeta) {
    addNode({ id: `sec:${slug}`, label: m.title, kind: 'section', anchor: m.anchor });
  }
  for (const [key, m] of subMeta) {
    addNode({
      id: `sub:${key}`,
      label: m.subTitle,
      kind: 'subsection',
      section: m.sectionSlug,
      anchor: m.anchor
    });
    edges.push({ id: `e:sec:${m.sectionSlug}->sub:${key}`, source: `sec:${m.sectionSlug}`, target: `sub:${key}`, kind: 'contains' });
  }

  // Entry + tag nodes via catalog (gives us primary location + dual_listed_in)
  const entryIds = new Map(); // key: url||name -> nodeId
  function entryKey(e) { return (e.url ? `u:${e.url}` : `n:${e.name}`).toLowerCase(); }

  for (const { sectionFile, subSlug, entry: e } of catalog.iterEntries()) {
    if (e.deprecated) continue;
    if (!e.name) continue;
    // Resolve primary section slug from file
    let primarySection = null;
    for (const m of sections) if (m.file === sectionFile) primarySection = catalog.loadSection(m.file).slug;
    if (!primarySection) continue;

    const ek = entryKey(e);
    let nodeId = entryIds.get(ek);
    if (!nodeId) {
      nodeId = `ent:${nodes.length}`;
      entryIds.set(ek, nodeId);
      addNode({
        id: nodeId,
        label: e.name,
        kind: 'entry',
        section: primarySection,
        url: e.url || null,
        license: e.license || null,
        entry_type: e.entry_type || null
      });
    }

    // Primary location edge
    const primKey = `${primarySection}/${subSlug}`;
    if (subMeta.has(primKey)) {
      edges.push({ id: `e:${nodeId}->sub:${primKey}`, source: nodeId, target: `sub:${primKey}`, kind: 'in' });
    }

    // Dual-listed edges
    for (const dl of e.dual_listed_in || []) {
      const [secSlug, subOnly] = String(dl).split('/');
      if (!secSlug || !subOnly) continue;
      const k = `${secSlug}/${subOnly}`;
      if (!subMeta.has(k)) continue;
      const eid = `e:${nodeId}->sub:${k}:dual`;
      edges.push({ id: eid, source: nodeId, target: `sub:${k}`, kind: 'mirror' });
    }

    // Tag edges
    const tags = e.tags || {};
    for (const ns of ['workflow', 'output', 'platform', 'skill', 'tech']) {
      for (const t of tags[ns] || []) {
        const tagId = `tag:${ns}:${t}`;
        addNode({ id: tagId, label: t, kind: 'tag', namespace: ns });
        edges.push({ id: `e:${nodeId}->${tagId}`, source: nodeId, target: tagId, kind: 'tag' });
      }
    }
  }

  // Stats
  const counts = nodes.reduce((acc, n) => ((acc[n.kind] = (acc[n.kind] || 0) + 1), acc), {});

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({ nodes, edges, counts }));
  console.log(`Wrote graph.json: ${nodes.length} nodes (${JSON.stringify(counts)}), ${edges.length} edges → ${outPath}`);
}

main();
