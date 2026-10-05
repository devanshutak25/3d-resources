// Graph view — 3D force graph (Three.js + d3-force-3d via 3d-force-graph).
// Hierarchical: sections + subsections + tags shown by default; entries hidden,
// represented by their subsection. Click subsection to expand/collapse, click
// entry to open its URL. Drag nodes, right-drag rotate, scroll zoom.

(function () {
  'use strict';

  // OKLCH(0.75 0.13 H) approximated to hex — uniform vibrancy across 12 sections.
  const SECTION_COLORS = {
    'assets-libraries':                    '#7ad0c2', // 180
    'modeling-sculpting-texturing':        '#e09a72', //  35
    'animation-rigging':                   '#d4b86a', //  80
    'lighting-rendering-shaders':          '#e09588', //  20
    'vfx-compositing-virtual-production':  '#cf91c6', // 320
    'motion-graphics-video':               '#b09add', // 290
    'game-development':                    '#71bce4', // 230
    'art-design-visual-storytelling':      '#dc92ad', // 350
    'ai-ml-for-cg':                        '#85c8d9', // 210
    'tools-pipeline-utilities':            '#9cc3a5', // 150
    'learning-community-industry':         '#9ab4d7', // 250
    'software-reference':                  '#bcabd9'  // 280
  };
  const TAG_COLOR = '#8a8f9e';                 // lifted gray, readable
  const SECTION_HUB_COLOR = '#a8a8b2';         // dimmer hub (ring is bright)

  const KIND_LABELS  = { section: 'Sections', subsection: 'Subsections', entry: 'All resources', tag: 'Tags' };
  const KIND_LABELS_S = { section: 'section', subsection: 'subsection', entry: 'resource', tag: 'tag' };
  const KIND_ORDER = { section: 0, subsection: 1, entry: 2, tag: 3 };
  const SEARCH_LIMIT = 30;

  // Low-end / mobile detection. Drives default visible kinds, pixel ratio,
  // antialiasing, sphere segment count, and tap behavior.
  const isLowEnd = (() => {
    try {
      const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      const small  = window.matchMedia && window.matchMedia('(max-width: 720px)').matches;
      const cores  = navigator.hardwareConcurrency || 8;
      const mem    = navigator.deviceMemory || 8;
      return coarse || small || cores <= 4 || mem <= 4;
    } catch { return false; }
  })();

  // Start readable: sections + subsections only. Resources appear per
  // subsection on click, or all at once via the "All resources" toggle.
  const DEFAULT_KINDS = new Set(['section', 'subsection']);

  const SPHERE_SEG = isLowEnd ? [8, 6] : [16, 12];

  const LINK_BASE_RGB       = '180,190,210';
  const LINK_BASE_ALPHA     = 0.5;
  const LINK_HIGHLIGHT_RGB  = '125,211,252';
  const LINK_HIGHLIGHT_ALPHA = 0.85;
  const LINK_DIM_ALPHA      = 0.12;

  const STORAGE_ONBOARD_KEY = 'graph-onboard-v1';

  const state = {
    raw: null,
    Graph: null,
    nodesById: new Map(),
    subEntries: new Map(),
    enabledKinds: new Set(DEFAULT_KINDS),
    expandedSubs: new Set(),
    hoveredNode: null,
    selectedNode: null,
    highlightLinks: new Set(),
    highlightNodes: new Set(),
    nodeAdj: new Map(),
    paused: false
  };

  function actionVerb(n) {
    if (n.kind === 'entry') return 'click for details';
    if (n.kind === 'subsection') {
      if (state.enabledKinds.has('entry')) return 'click to focus';
      return state.expandedSubs.has(n.id) ? 'click to hide its resources' : 'click to show its resources';
    }
    if (n.kind === 'section') return 'click to focus';
    if (n.kind === 'tag') return 'click to focus';
    return '';
  }

  function colorOf(n) {
    if (n.kind === 'section') return SECTION_HUB_COLOR;
    if (n.kind === 'tag') return TAG_COLOR;
    return SECTION_COLORS[n.section] || '#888';
  }

  // Target render radius in graph-space units. Used directly for custom meshes
  // and cubed for 3d-force-graph's default-sphere nodeVal mapping.
  function radiusOf(n) {
    if (n.kind === 'section') return 10.5;
    if (n.kind === 'subsection') return 0.75 * Math.max(6, 6 + Math.min(10, Math.sqrt(n.entryCount || 0) * 1.2));
    if (n.kind === 'tag') return 3;
    return 2; // entry
  }
  function buildVisibleData() {
    const visible = new Set();
    for (const n of state.raw.nodes) {
      if (n.kind === 'entry') {
        if (state.enabledKinds.has('entry')) { visible.add(n.id); continue; }
        const adj = state.nodeAdj.get(n.id) || new Set();
        let shown = false;
        for (const nb of adj) {
          const nbNode = state.nodesById.get(nb);
          if (nbNode && nbNode.kind === 'subsection' && state.expandedSubs.has(nb)) { shown = true; break; }
        }
        if (shown) visible.add(n.id);
        continue;
      }
      if (!state.enabledKinds.has(n.kind)) continue;
      visible.add(n.id);
    }
    const nodes = state.raw.nodes.filter(n => visible.has(n.id));
    const links = [];
    for (const e of state.raw.edges) {
      if (!visible.has(e.source) || !visible.has(e.target)) continue;
      links.push({ source: e.source, target: e.target, kind: e.kind, _id: e.id });
    }
    return { nodes, links };
  }

  function refreshGraph() {
    const data = buildVisibleData();
    state.Graph.graphData(data);
  }

  function rgba(rgb, a) { return `rgba(${rgb},${a})`; }

  function linkColor(link) {
    const hasHi = state.highlightLinks.size > 0;
    const isHi = state.highlightLinks.has(link);
    if (isHi) return rgba(LINK_HIGHLIGHT_RGB, LINK_HIGHLIGHT_ALPHA);
    if (hasHi) return rgba(LINK_BASE_RGB, LINK_DIM_ALPHA);
    return rgba(LINK_BASE_RGB, LINK_BASE_ALPHA);
  }
  function linkWidth(link) { return state.highlightLinks.has(link) ? 0.65 : 0.3; }

  function makeLabelSprite(text, opts) {
    if (!window.SpriteText) return null;
    const sprite = new window.SpriteText(text);
    sprite.color = '#ffffff';
    sprite.backgroundColor = (opts && opts.bg) || 'rgba(0,0,0,0.72)';
    sprite.padding = (opts && opts.padding) || 3;
    sprite.borderRadius = 4;
    sprite.fontFace = 'Inter, sans-serif';
    sprite.fontWeight = (opts && opts.weight) || '600';
    sprite.textHeight = (opts && opts.textHeight) || 22;
    return sprite;
  }

  // Shared geometries/materials for the custom kinds. Sections (12) and tags
  // (~92) are the only kinds with bespoke meshes — entries and subsections fall
  // back to the library's instanced default sphere (one draw call vs ~3000).
  const sharedGeom = {};
  function getSectionGeom(radius) {
    const key = 'sec:' + radius;
    if (!sharedGeom[key]) sharedGeom[key] = new window.THREE.SphereGeometry(radius, SPHERE_SEG[0], SPHERE_SEG[1]);
    return sharedGeom[key];
  }
  function getTagGeom(radius) {
    const key = 'tag:' + radius;
    if (!sharedGeom[key]) sharedGeom[key] = new window.THREE.OctahedronGeometry(radius, 0);
    return sharedGeom[key];
  }

  function makeNodeObject(n) {
    const T = window.THREE;
    if (!T) return null;
    // Entry + subsection use the library's default instanced sphere via
    // nodeVal/nodeColor — vastly cheaper on low-end GPUs.
    if (n.kind !== 'section' && n.kind !== 'tag') return null;

    const radius = radiusOf(n);

    if (n.kind === 'tag') {
      const mat = new T.MeshLambertMaterial({ color: TAG_COLOR, transparent: true, opacity: 0.95, flatShading: true });
      const mesh = new T.Mesh(getTagGeom(radius), mat);
      n.__mat = mat; n.__obj = mesh; n.__radius = radius;
      return mesh;
    }

    // section
    const sphereMat = new T.MeshLambertMaterial({ color: colorOf(n), transparent: true, opacity: 0.95 });
    const sphere = new T.Mesh(getSectionGeom(radius), sphereMat);
    n.__mat = sphereMat; n.__radius = radius;
    const grp = new T.Group();
    grp.add(sphere);
    const sprite = makeLabelSprite(n.label, { textHeight: isLowEnd ? 8 : 6, weight: '600' });
    if (sprite) {
      sprite.position.set(0, radius + sprite.textHeight + 1, 0);
      n.__sectionLabel = sprite;
      grp.add(sprite);
    }
    n.__obj = grp;
    return grp;
  }

  function attachSelectionLabel(node) {
    // Remove previous selection label
    if (state._selLabel && state._selLabelHost) {
      try {
        state._selLabelHost.remove(state._selLabel);
        // SpriteText keeps a canvas-backed CanvasTexture — dispose it.
        const m = state._selLabel.material;
        if (m) { if (m.map) m.map.dispose(); m.dispose(); }
      } catch {}
      state._selLabel = null;
      state._selLabelHost = null;
    }
    if (!node || !node.__obj) return;
    if (node.kind === 'section') return; // section already has a permanent label
    const sprite = makeLabelSprite(node.label, { textHeight: 4, weight: '500', bg: 'rgba(125,211,252,0.92)' });
    if (!sprite) return;
    const r = node.__radius || 2;
    sprite.position.set(0, r + sprite.textHeight + 0.8, 0);
    sprite.color = '#0b0b0d';
    state._selLabel = sprite;
    state._selLabelHost = node.__obj;
    node.__obj.add(sprite);
  }

  function nodeColorFn(n) {
    // Selected: full color. Hovered: full color. Others under highlight: dim via rgba.
    const base = colorOf(n);
    if (state.highlightNodes.size === 0) return base;
    if (state.highlightNodes.has(n.id)) return base;
    // Dim by mixing toward bg (~0.35 alpha against #0b0b0d looks dimmer)
    return hexToRgba(base, 0.35);
  }

  function hexToRgba(hex, a) {
    const m = hex.replace('#', '');
    const r = parseInt(m.slice(0, 2), 16);
    const g = parseInt(m.slice(2, 4), 16);
    const b = parseInt(m.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  function recomputeHighlights() {
    state.highlightLinks.clear();
    state.highlightNodes.clear();
    if (!state.Graph) return;
    const data = state.Graph.graphData();
    const targets = [];
    if (state.selectedNode) targets.push(state.selectedNode);
    if (state.hoveredNode && state.hoveredNode !== state.selectedNode) targets.push(state.hoveredNode);
    if (targets.length) {
      const ids = new Set(targets.map(t => t.id));
      for (const id of ids) state.highlightNodes.add(id);
      for (const l of data.links) {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        if (ids.has(s) || ids.has(t)) {
          state.highlightLinks.add(l);
          state.highlightNodes.add(s); state.highlightNodes.add(t);
        }
      }
    }
    state.Graph
      .linkColor(state.Graph.linkColor())
      .linkWidth(state.Graph.linkWidth());
    const anyHi = state.highlightNodes.size > 0;
    // Walk only currently rendered nodes. For custom-mesh kinds we have
    // n.__mat; for default kinds the library exposes n.__threeObj whose
    // .material we can dim directly. Skip the full raw.nodes scan.
    for (const n of data.nodes) {
      const isHi = state.highlightNodes.has(n.id);
      const op = anyHi ? (isHi ? 0.95 : 0.28) : 0.95;
      if (n.__mat) {
        n.__mat.opacity = op;
      } else if (n.__threeObj && n.__threeObj.material) {
        const m = n.__threeObj.material;
        if (!m.transparent) m.transparent = true;
        m.opacity = op;
      }
    }
  }

  function setHovered(node) { state.hoveredNode = node; recomputeHighlights(); }
  function setSelected(node) {
    state.selectedNode = node;
    attachSelectionLabel(node);
    recomputeHighlights();
    renderSelectedList(node);
  }

  function tooltipHtml(n) {
    const swatch = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${colorOf(n)};margin-right:6px;vertical-align:middle"></span>`;
    let html = `<div style="font-weight:600">${swatch}${escapeHtml(n.label)}</div>`;
    html += `<div style="opacity:0.55;font-size:11px;font-style:italic;margin-top:2px">${KIND_LABELS_S[n.kind]}${n.namespace ? ' · ' + escapeHtml(n.namespace) : ''}${n.kind === 'subsection' ? ' · ' + (n.entryCount || 0) + ' entries' : ''}</div>`;
    if (n.kind === 'subsection') {
      const entries = (state.subEntries.get(n.id) || []).slice(0, 4);
      const names = entries.map(eid => state.nodesById.get(eid)?.label).filter(Boolean);
      const more = (n.entryCount || 0) - names.length;
      if (names.length) {
        html += `<div class="tt-preview">${names.map(escapeHtml).join(', ')}${more > 0 ? ', +' + more : ''}</div>`;
      }
    }
    const verb = actionVerb(n);
    if (verb) html += `<div class="tt-action">${verb}</div>`;
    return html;
  }

  function showInfo(node) {
    const info = document.getElementById('info');
    if (!node) { info.classList.remove('visible'); info.innerHTML = ''; return; }
    let html = `<div class="kind"><span class="swatch" style="background:${colorOf(node)}"></span>${KIND_LABELS_S[node.kind]}${node.namespace ? ' · ' + escapeHtml(node.namespace) : ''}</div>`;
    html += `<h2>${escapeHtml(node.label)}</h2>`;
    const meta = [];
    if (node.entry_type) meta.push(`type ${escapeHtml(node.entry_type)}`);
    if (node.license) meta.push(`license ${escapeHtml(node.license)}`);
    if (node.kind === 'subsection') meta.push(`${node.entryCount} entr${node.entryCount === 1 ? 'y' : 'ies'}`);
    const adj = state.nodeAdj.get(node.id);
    if (adj) meta.push(`${adj.size} connection${adj.size === 1 ? '' : 's'}`);
    if (meta.length) html += `<div class="meta">${meta.join(' · ')}</div>`;

    if (node.kind === 'subsection') {
      const entries = (state.subEntries.get(node.id) || []).slice(0, 6);
      const names = entries.map(eid => state.nodesById.get(eid)?.label).filter(Boolean);
      const more = (node.entryCount || 0) - names.length;
      if (names.length) {
        html += `<div class="preview"><div class="head">entries</div><ul>${names.map(n => `<li>${escapeHtml(n)}</li>`).join('')}${more > 0 ? `<li style="opacity:0.6">+${more} more</li>` : ''}</ul></div>`;
      }
    }

    if (node.url) {
      // Selecting a node never opens anything; this link is the only way out.
      html += `<div><a class="open-resource" href="${isSafeUrl(node.url) ? escapeHtml(node.url) : '#'}" target="_blank" rel="noopener noreferrer">Open resource ↗</a></div>`;
      html += `<div style="margin-top:6px;opacity:0.7">${escapeHtml(node.url)}</div>`;
    }
    if (node.kind === 'subsection' || node.kind === 'section') {
      html += `<div style="margin-top:8px"><a href="/#${escapeHtml(encodeURIComponent(node.anchor))}">Open in main page →</a></div>`;
    }
    const verb = actionVerb(node);
    if (verb) html += `<div class="action-hint">${verb}</div>`;
    info.innerHTML = html;
    info.classList.add('visible');
  }

  function announce(msg) {
    const a = document.getElementById('announce');
    if (a) a.textContent = msg;
  }

  function toast(msg, ms) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('visible'), ms || 1800);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  // Entry URLs come from catalog data; only http(s) may become a link.
  function isSafeUrl(u) {
    return /^https?:\/\//i.test(String(u || '').trim());
  }

  function updateBreadcrumb() {
    const crumb = document.getElementById('crumb');
    const node = state.selectedNode;
    if (!node) { crumb.classList.remove('visible'); crumb.innerHTML = ''; return; }
    const parts = [];
    if (node.section) {
      const sec = state.nodesById.get('sec:' + node.section);
      if (sec) parts.push(`<span class="swatch-inline" style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${SECTION_COLORS[node.section] || '#888'};margin-right:4px"></span>${escapeHtml(sec.label)}`);
    }
    if (node.kind === 'subsection' || node.kind === 'entry') {
      // Find subsection neighbor for entries
      if (node.kind === 'entry') {
        const adj = state.nodeAdj.get(node.id) || new Set();
        for (const nb of adj) {
          const nbNode = state.nodesById.get(nb);
          if (nbNode && nbNode.kind === 'subsection') { parts.push(escapeHtml(nbNode.label)); break; }
        }
      }
      parts.push(`<strong>${escapeHtml(node.label)}</strong>`);
    } else if (node.kind === 'section') {
      // already added above
    } else if (node.kind === 'tag') {
      parts.push(`<em>tag</em>`, `<strong>${escapeHtml(node.label)}</strong>`);
    }
    crumb.innerHTML = parts.join(' <span class="arrow">›</span> ');
    crumb.classList.add('visible');
  }

  function focusNode(nodeId, distance) {
    const node = state.nodesById.get(nodeId);
    if (!node) return;
    if (node.x == null) {
      // not in current layout (filtered out) — re-feed and try after a frame
      requestAnimationFrame(() => focusNode(nodeId, distance));
      return;
    }
    if (distance == null) distance = 90;
    const distRatio = 1 + distance / Math.hypot(node.x || 1, node.y || 1, node.z || 1);
    state.Graph.cameraPosition(
      { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
      { x: node.x, y: node.y, z: node.z },
      900
    );
    setSelected(node);
    showInfo(node);
    updateBreadcrumb();
    history.replaceState(null, '', '#' + encodeURIComponent(nodeId));
    announce(`Focused ${KIND_LABELS_S[node.kind]} ${node.label}`);
  }

  function toggleExpandSub(nodeId) {
    const before = state.expandedSubs.has(nodeId);
    if (before) state.expandedSubs.delete(nodeId);
    else state.expandedSubs.add(nodeId);
    refreshGraph();
    const sub = state.nodesById.get(nodeId);
    const cnt = sub ? (sub.entryCount || 0) : 0;
    toast(before ? `Collapsed ${cnt} entries` : `Expanded ${cnt} entries`);
  }

  function buildAdjacency() {
    state.nodeAdj.clear();
    for (const e of state.raw.edges) {
      let a = state.nodeAdj.get(e.source); if (!a) { a = new Set(); state.nodeAdj.set(e.source, a); }
      let b = state.nodeAdj.get(e.target); if (!b) { b = new Set(); state.nodeAdj.set(e.target, b); }
      a.add(e.target); b.add(e.source);
    }
    state.subEntries.clear();
    for (const e of state.raw.edges) {
      if (e.kind !== 'in' && e.kind !== 'mirror') continue;
      let arr = state.subEntries.get(e.target);
      if (!arr) { arr = []; state.subEntries.set(e.target, arr); }
      arr.push(e.source);
    }
  }

  function annotateNodes() {
    const subEntryCount = new Map();
    for (const e of state.raw.edges) {
      if (e.kind === 'in' || e.kind === 'mirror') {
        subEntryCount.set(e.target, (subEntryCount.get(e.target) || 0) + 1);
      }
    }
    for (const n of state.raw.nodes) {
      n.entryCount = n.kind === 'subsection' ? (subEntryCount.get(n.id) || 0) : 0;
      state.nodesById.set(n.id, n);
    }
  }

  const KIND_GLYPH = {
    section: 'glyph-hexagon',
    subsection: 'glyph-square',
    entry: 'glyph-triangle',
    tag: 'glyph-pentagon'
  };

  function renderLegend() {
    const data = state.raw;
    const counts = data.counts || {};
    const panel = document.getElementById('legend');
    panel.innerHTML = '';

    // Header: title + help (?) button to reopen onboarding
    const head = document.createElement('div');
    head.className = 'g-panel-head';
    const title = document.createElement('span');
    title.className = 'g-panel-title';
    title.textContent = 'filters';
    const help = document.createElement('button');
    help.className = 'g-panel-help';
    help.type = 'button';
    help.id = 'btn-help';
    help.setAttribute('aria-label', 'Show graph help');
    help.title = 'Show graph help';
    help.textContent = '?';
    help.addEventListener('click', () => openOnboarding());
    head.append(title, help);
    panel.appendChild(head);

    // Body — scrollable
    const body = document.createElement('div');
    body.className = 'g-panel-body';
    panel.appendChild(body);

    const altLink = document.createElement('a');
    altLink.href = '/';
    altLink.className = 'alt-link';
    altLink.textContent = 'Open structured view ↗';
    altLink.title = 'Browse the same content as a text page (better for keyboard / screen reader)';
    body.appendChild(altLink);

    const h = document.createElement('h3');
    h.textContent = 'show';
    body.appendChild(h);

    for (const kind of ['section', 'subsection', 'entry', 'tag']) {
      const row = document.createElement('button');
      row.className = 'legend-row';
      row.type = 'button';
      row.dataset.kind = kind;
      row.setAttribute('aria-pressed', state.enabledKinds.has(kind) ? 'true' : 'false');
      const glyph = document.createElement('span');
      glyph.className = 'glyph ' + KIND_GLYPH[kind];
      glyph.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.className = 'label-text';
      label.textContent = KIND_LABELS[kind];
      const count = document.createElement('span');
      count.className = 'count';
      count.textContent = counts[kind] || 0;
      row.append(glyph, label, count);
      if (kind === 'entry') row.title = 'Show every resource at once. Dense; use search or open a subsection for a focused view.';
      if (!state.enabledKinds.has(kind)) row.classList.add('disabled');
      row.addEventListener('click', () => {
        if (state.enabledKinds.has(kind)) state.enabledKinds.delete(kind);
        else state.enabledKinds.add(kind);
        const enabled = state.enabledKinds.has(kind);
        row.classList.toggle('disabled', !enabled);
        row.setAttribute('aria-pressed', enabled ? 'true' : 'false');
        refreshGraph();
        toast(`${enabled ? 'Showing' : 'Hiding'} ${KIND_LABELS[kind].toLowerCase()}`);
      });
      body.appendChild(row);
    }

    // Structured alternative for whatever is selected: a readable list of the
    // subsection's resources, no camera flight required.
    const listBlock = document.createElement('div');
    listBlock.id = 'selected-list';
    listBlock.className = 'filter-section';
    listBlock.hidden = true;
    body.appendChild(listBlock);

    // Sections legend in collapsed <details>
    const sectionNodes = data.nodes.filter(x => x.kind === 'section');
    const details = document.createElement('details');
    details.className = 'sections-block';
    const summary = document.createElement('summary');
    summary.textContent = `sections (${sectionNodes.length})`;
    details.appendChild(summary);
    for (const n of sectionNodes) {
      const row = document.createElement('button');
      row.className = 'legend-row';
      row.type = 'button';
      const swatch = document.createElement('span');
      swatch.className = 'swatch';
      swatch.style.background = SECTION_COLORS[n.id.replace(/^sec:/, '')] || '#888';
      const label = document.createElement('span');
      label.className = 'label-text';
      label.textContent = n.label;
      label.style.fontSize = '12px';
      row.append(swatch, label);
      row.addEventListener('click', () => focusNode(n.id));
      details.appendChild(row);
    }
    body.appendChild(details);

    // Sticky footer — control buttons
    const foot = document.createElement('nav');
    foot.className = 'g-panel-foot';
    foot.setAttribute('aria-label', 'Graph controls');
    foot.innerHTML = `
      <button class="g-btn" id="btn-zoom-in" type="button" aria-label="Zoom in" title="Zoom in">+</button>
      <button class="g-btn" id="btn-zoom-out" type="button" aria-label="Zoom out" title="Zoom out">−</button>
      <button class="g-btn" id="btn-fit" type="button" title="Fit the whole graph in view">Reset view</button>
      <button class="g-btn" id="btn-relayout" type="button" title="Re-run physics simulation">Re-layout</button>
      <button class="g-btn" id="btn-pause" type="button" aria-pressed="false" title="Pause / resume physics">Pause</button>
      <button class="g-btn" id="btn-collapse" type="button" title="Hide resources of every opened subsection">Collapse all</button>
    `;
    panel.appendChild(foot);
  }

  // List view of the selected subsection's resources inside the panel.
  function renderSelectedList(node) {
    const block = document.getElementById('selected-list');
    if (!block) return;
    if (!node || node.kind !== 'subsection') { block.hidden = true; block.innerHTML = ''; return; }
    const ids = state.subEntries.get(node.id) || [];
    const entries = ids.map(id => state.nodesById.get(id)).filter(Boolean)
      .sort((a, b) => a.label.localeCompare(b.label, 'en', { sensitivity: 'base' }));
    block.hidden = false;
    block.innerHTML = `<h3>${escapeHtml(node.label)} · ${entries.length} resource${entries.length === 1 ? '' : 's'}</h3>`;
    const ul = document.createElement('ul');
    ul.className = 'selected-list';
    for (const e of entries) {
      const li = document.createElement('li');
      if (e.url) {
        const a = document.createElement('a');
        a.href = isSafeUrl(e.url) ? e.url : '#'; a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.textContent = e.label;
        li.appendChild(a);
      } else {
        li.textContent = e.label;
      }
      ul.appendChild(li);
    }
    block.appendChild(ul);
  }

  function setupSearch() {
    const data = state.raw;
    const input = document.getElementById('search');
    const results = document.getElementById('search-results');
    const lookup = data.nodes.map(n => ({
      id: n.id, label: n.label, kind: n.kind, lc: n.label.toLowerCase()
    }));
    let timer = null;
    let activeIdx = -1;

    function closeResults() {
      results.classList.remove('visible');
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      activeIdx = -1;
    }

    // Keep the visual highlight, aria-selected and aria-activedescendant on
    // the same option; clear all three when nothing is active.
    function syncActive() {
      const items = results.querySelectorAll('.g-search-result');
      items.forEach((el, i) => {
        const on = i === activeIdx;
        el.classList.toggle('active', on);
        el.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      if (activeIdx >= 0 && items[activeIdx]) {
        input.setAttribute('aria-activedescendant', items[activeIdx].id);
        items[activeIdx].scrollIntoView({ block: 'nearest' });
      } else {
        input.removeAttribute('aria-activedescendant');
      }
    }

    function render(matches, total, query) {
      if (!matches.length) {
        results.innerHTML = `<div class="g-search-empty">No matches for "${escapeHtml(query)}". <a href="/?q=${encodeURIComponent(query)}">Search the full catalog →</a></div>`;
        results.classList.add('visible');
        input.setAttribute('aria-expanded', 'true');
        input.removeAttribute('aria-activedescendant');
        return;
      }
      let html = matches.map((m, i) => {
        const node = state.nodesById.get(m.id);
        const swatch = node ? colorOf(node) : '#888';
        return `<div class="g-search-result" role="option" data-id="${escapeHtml(m.id)}" id="sr-${i}" aria-selected="false">
          <span class="swatch" style="background:${swatch}"></span>
          <span class="label-text">${escapeHtml(m.label)}</span>
          <span class="kind">${KIND_LABELS_S[m.kind]}</span>
        </div>`;
      }).join('');
      if (total > matches.length) {
        html += `<div class="g-search-more">Showing ${matches.length} of ${total} matches. Refine the search, or <a href="/?q=${encodeURIComponent(query)}">view all matching resources in the catalog →</a></div>`;
      }
      results.innerHTML = html;
      results.classList.add('visible');
      input.setAttribute('aria-expanded', 'true');
      syncActive();
    }

    // Rank: exact name, then name starts with the query, then substring.
    // Within a rank, sections before subsections before resources before tags.
    function rankOf(item, q) {
      if (item.lc === q) return 0;
      if (item.lc.startsWith(q)) return 1;
      return 2;
    }

    function performSearch() {
      const q = input.value.trim().toLowerCase();
      if (!q) { closeResults(); return; }
      const all = [];
      for (const item of lookup) {
        if (item.lc.includes(q)) all.push({ item, rank: rankOf(item, q) });
      }
      all.sort((a, b) =>
        a.rank - b.rank ||
        KIND_ORDER[a.item.kind] - KIND_ORDER[b.item.kind] ||
        a.item.label.length - b.item.label.length ||
        a.item.label.localeCompare(b.item.label));
      activeIdx = -1;
      render(all.slice(0, SEARCH_LIMIT).map(x => x.item), all.length, q);
      announce(`${all.length} match${all.length === 1 ? '' : 'es'}${all.length > SEARCH_LIMIT ? `, showing first ${SEARCH_LIMIT}` : ''}`);
    }

    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(performSearch, 80);
    });

    input.addEventListener('keydown', (ev) => {
      const items = results.querySelectorAll('.g-search-result');
      if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        if (!items.length) return;
        activeIdx = (activeIdx + 1) % items.length;
        syncActive();
      } else if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        if (!items.length) return;
        activeIdx = (activeIdx - 1 + items.length) % items.length;
        syncActive();
      } else if (ev.key === 'Enter') {
        if (activeIdx >= 0 && items[activeIdx]) {
          ev.preventDefault();
          selectFromSearch(items[activeIdx].dataset.id);
        } else if (items.length === 1) {
          selectFromSearch(items[0].dataset.id);
        }
      } else if (ev.key === 'Escape') {
        if (results.classList.contains('visible')) {
          closeResults();
        } else {
          input.value = '';
          input.blur();
        }
      }
    });

    function selectFromSearch(id) {
      const node = state.nodesById.get(id);
      if (!node) return;
      if (node.kind === 'entry') {
        const adj = state.nodeAdj.get(id) || new Set();
        for (const nb of adj) {
          const nbNode = state.nodesById.get(nb);
          if (nbNode && nbNode.kind === 'subsection') state.expandedSubs.add(nb);
        }
      }
      // Entries become visible through their expanded subsection (above);
      // other kinds need their layer on. Sync the legend row in place rather
      // than rebuilding the panel, which would drop the control listeners.
      if (node.kind !== 'entry' && !state.enabledKinds.has(node.kind)) {
        state.enabledKinds.add(node.kind);
        const row = document.querySelector(`.legend-row[data-kind="${node.kind}"]`);
        if (row) { row.classList.remove('disabled'); row.setAttribute('aria-pressed', 'true'); }
        toast(`Enabled ${KIND_LABELS[node.kind].toLowerCase()} so this match is visible`);
      }
      refreshGraph();
      closeResults();
      input.value = '';
      requestAnimationFrame(() => requestAnimationFrame(() => focusNode(id)));
    }

    results.addEventListener('click', (ev) => {
      const r = ev.target.closest('.g-search-result');
      if (!r) return;
      selectFromSearch(r.dataset.id);
    });

    document.addEventListener('click', (ev) => {
      if (!ev.target.closest('.g-search')) closeResults();
    });

    // Global / and Esc
    document.addEventListener('keydown', (ev) => {
      if (ev.key === '/' && document.activeElement !== input && !ev.metaKey && !ev.ctrlKey) {
        ev.preventDefault();
        input.focus();
        input.select();
      } else if (ev.key === 'Escape' && document.activeElement !== input) {
        if (state.selectedNode) {
          setSelected(null);
          showInfo(null);
          updateBreadcrumb();
          history.replaceState(null, '', location.pathname);
        }
      } else if ((ev.key === 'f' || ev.key === 'F') && document.activeElement !== input && !ev.metaKey && !ev.ctrlKey && !ev.altKey) {
        const t = ev.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
        if (state.selectedNode) {
          ev.preventDefault();
          focusNode(state.selectedNode.id);
        }
      }
    });
  }

  // Move the camera toward or away from what it is looking at.
  function zoomBy(factor) {
    const G = state.Graph;
    if (!G) return;
    const pos = G.cameraPosition();
    const target = state.selectedNode && state.selectedNode.x != null
      ? { x: state.selectedNode.x, y: state.selectedNode.y, z: state.selectedNode.z }
      : { x: 0, y: 0, z: 0 };
    const next = {
      x: target.x + (pos.x - target.x) * factor,
      y: target.y + (pos.y - target.y) * factor,
      z: target.z + (pos.z - target.z) * factor
    };
    G.cameraPosition(next, target, 300);
  }

  function setupControls() {
    document.getElementById('btn-zoom-in').addEventListener('click', () => zoomBy(0.7));
    document.getElementById('btn-zoom-out').addEventListener('click', () => zoomBy(1.4));
    document.getElementById('btn-fit').addEventListener('click', () => {
      state.Graph.zoomToFit(800, 60);
      setSelected(null);
      showInfo(null);
      updateBreadcrumb();
      history.replaceState(null, '', location.pathname);
    });
    document.getElementById('btn-relayout').addEventListener('click', () => {
      state.Graph.d3ReheatSimulation();
      toast('Re-running physics');
    });
    document.getElementById('btn-collapse').addEventListener('click', () => {
      const had = state.expandedSubs.size;
      if (!had) { toast('Nothing expanded'); return; }
      state.expandedSubs.clear();
      refreshGraph();
      toast(`Collapsed ${had} subsection${had === 1 ? '' : 's'}`);
    });
    const btnPause = document.getElementById('btn-pause');
    btnPause.addEventListener('click', () => {
      state.paused = !state.paused;
      btnPause.setAttribute('aria-pressed', state.paused ? 'true' : 'false');
      btnPause.textContent = state.paused ? 'Resume' : 'Pause';
      if (state.paused) state.Graph.pauseAnimation();
      else state.Graph.resumeAnimation();
      toast(state.paused ? 'Physics paused' : 'Physics resumed');
    });
  }

  // Onboarding is a real modal: focus is contained, everything behind it is
  // inert, and dismissal returns focus to the help button.
  const onboard = { inerted: [] };

  function openOnboarding() {
    const overlay = document.getElementById('onboard');
    const ok = document.getElementById('onboard-ok');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    onboard.inerted = [];
    for (const sib of document.body.children) {
      if (sib === overlay || sib.hasAttribute('inert')) continue;
      sib.setAttribute('inert', '');
      onboard.inerted.push(sib);
    }
    if (ok) ok.focus();
  }

  function closeOnboarding() {
    const overlay = document.getElementById('onboard');
    if (!overlay || overlay.classList.contains('hidden')) return;
    overlay.classList.add('hidden');
    for (const el of onboard.inerted) el.removeAttribute('inert');
    onboard.inerted = [];
    try { localStorage.setItem(STORAGE_ONBOARD_KEY, '1'); } catch {}
    const help = document.getElementById('btn-help');
    if (help) help.focus();
  }

  function setupOnboarding() {
    const overlay = document.getElementById('onboard');
    const ok = document.getElementById('onboard-ok');
    const countEl = document.getElementById('onboard-count');
    if (countEl && state.raw && state.raw.counts && state.raw.counts.entry) {
      countEl.textContent = `${state.raw.counts.entry.toLocaleString('en')}`;
    }
    const seen = (() => { try { return localStorage.getItem(STORAGE_ONBOARD_KEY); } catch { return null; } })();
    if (!seen) openOnboarding();
    ok.addEventListener('click', closeOnboarding);
    overlay.addEventListener('click', (ev) => { if (ev.target === overlay) closeOnboarding(); });
    overlay.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Tab') return;
      const items = Array.from(overlay.querySelectorAll('a[href], button:not([disabled])'));
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    });
    document.addEventListener('keydown', (ev) => {
      if (!overlay.classList.contains('hidden') && ev.key === 'Escape') closeOnboarding();
    });
  }

  function maybeFocusFromHash() {
    const h = (location.hash || '').slice(1);
    if (!h) return;
    try {
      const id = decodeURIComponent(h);
      if (state.nodesById.has(id)) {
        // Wait for layout to settle a bit
        setTimeout(() => focusNode(id), 1200);
      }
    } catch {}
  }

  async function init() {
    const loading = document.getElementById('loading');
    const labelEl = loading.querySelector('.label');

    labelEl.textContent = 'Fetching graph data...';
    const res = await fetch('/graph.json');
    if (!res.ok) throw new Error('graph.json fetch failed');
    state.raw = await res.json();

    labelEl.textContent = `Building ${state.raw.nodes.length} nodes...`;
    await new Promise(r => setTimeout(r, 16));
    annotateNodes();
    buildAdjacency();

    labelEl.textContent = 'Initializing 3D scene...';
    await new Promise(r => setTimeout(r, 16));

    const container = document.getElementById('graph-container');
    // rendererConfig consumed once at construction.
    const rendererConfig = isLowEnd
      ? { antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false }
      : { antialias: true, powerPreference: 'high-performance', alpha: false, stencil: false };

    const NODE_REL_SIZE = 2;
    const Graph = window.ForceGraph3D({ rendererConfig })(container)
      .backgroundColor('#0b0b0d')
      .showNavInfo(false)
      .nodeRelSize(NODE_REL_SIZE)
      // val^(1/3) * nodeRelSize = library sphere radius; we want it == radiusOf(n).
      .nodeVal(n => Math.pow(radiusOf(n) / NODE_REL_SIZE, 3))
      .nodeResolution(isLowEnd ? 8 : 16)
      .nodeColor(nodeColorFn)
      .nodeLabel(tooltipHtml)
      .nodeOpacity(0.95)
      .nodeThreeObject(makeNodeObject)
      .nodeThreeObjectExtend(false)
      .linkOpacity(0.99)
      .linkColor(linkColor)
      .linkWidth(linkWidth)
      .linkDirectionalParticles(0)
      .cooldownTicks(isLowEnd ? 120 : 200)
      .cooldownTime(isLowEnd ? 6000 : 10000)
      .warmupTicks(isLowEnd ? 30 : 60)
      .enableNodeDrag(true)
      .onNodeHover(node => {
        container.style.cursor = node ? 'pointer' : '';
        setHovered(node);
      })
      .onNodeClick(node => {
        const willExpand = node.kind === 'subsection'
          && !state.enabledKinds.has('entry')
          && !state.expandedSubs.has(node.id);
        if (node.kind === 'subsection' && !state.enabledKinds.has('entry')) toggleExpandSub(node.id);
        if (willExpand) {
          // Let the force layout place the newly-added entries before we
          // frame, and zoom out wide enough to fit the cloud.
          const cnt = node.entryCount || 0;
          const dist = Math.max(140, 80 + Math.sqrt(cnt) * 22);
          setTimeout(() => focusNode(node.id, dist), 350);
          setSelected(node);
          showInfo(node);
          updateBreadcrumb();
          history.replaceState(null, '', '#' + encodeURIComponent(node.id));
        } else {
          // Selection reveals details; the details panel holds the only
          // "Open resource" action, so exploratory clicks never open tabs.
          focusNode(node.id);
        }
      })
      .onBackgroundClick(() => {
        setSelected(null);
        showInfo(null);
        updateBreadcrumb();
        history.replaceState(null, '', location.pathname);
      });

    Graph.d3Force('charge').strength(isLowEnd ? -28 : -40).distanceMax(isLowEnd ? 140 : 180);
    Graph.d3Force('link').distance(l => l.kind === 'tag' ? 40 : 22);

    // Cap render resolution. Mobile DPR can be 3x (e.g. 1080p phone reports 3.0)
    // — clamping to 1.0/1.5 gives 4-9× fewer fragments without visible loss.
    try {
      const renderer = Graph.renderer();
      if (renderer) {
        const cap = isLowEnd ? 1 : 1.5;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
      }
    } catch {}

    // Clamp orbit zoom distance so users can't pan to infinity
    const controls = Graph.controls();
    if (controls) {
      controls.minDistance = isLowEnd ? 30 : 80;
      controls.maxDistance = 4000;
      // Touch devices benefit from slightly damped rotation for stability.
      if (isLowEnd && 'enableDamping' in controls) {
        controls.enableDamping = true;
        controls.dampingFactor = 0.12;
        controls.rotateSpeed = 0.7;
      }
    }

    state.Graph = Graph;
    refreshGraph();

    renderLegend();
    setupSearch();
    setupControls();
    setupOnboarding();
    maybeFocusFromHash();

    setTimeout(() => Graph.zoomToFit(900, 80), 1500);

    loading.classList.add('hidden');
    setTimeout(() => loading.remove(), 600);
  }

  function showFailure(message) {
    const loading = document.getElementById('loading');
    if (!loading) return;
    loading.classList.remove('hidden');
    loading.classList.add('failed');
    loading.querySelector('.label').textContent = message;
    const actions = document.getElementById('loading-actions');
    if (actions) actions.hidden = false;
    const retry = document.getElementById('btn-retry');
    if (retry && !retry._wired) {
      retry._wired = true;
      retry.addEventListener('click', () => location.reload());
    }
  }

  let started = false;
  function start() {
    if (started) return;
    started = true;
    init().catch(err => {
      console.error(err);
      showFailure('The graph could not be loaded. Check your connection and retry, or browse the same catalog as a list.');
    });
  }

  const DEPS_TIMEOUT_MS = 12000;
  function ready() {
    if (window.ForceGraph3D && window.THREE) { start(); return; }
    window.addEventListener('graph-deps-ready', start, { once: true });
    window.addEventListener('graph-deps-failed', () => {
      showFailure('The 3D graph library could not be loaded. Retry, or browse the same catalog as a list.');
    }, { once: true });
    setTimeout(() => {
      if (!started) showFailure('The 3D graph library is taking too long to load. Retry, or browse the same catalog as a list.');
    }, DEPS_TIMEOUT_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }
})();
