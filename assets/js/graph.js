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

  const KIND_LABELS  = { section: 'Sections', subsection: 'Subsections', entry: 'Entries', tag: 'Tags' };
  const KIND_LABELS_S = { section: 'section', subsection: 'subsection', entry: 'entry', tag: 'tag' };

  const DEFAULT_KINDS = new Set(['section', 'subsection', 'entry']);

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
    if (n.kind === 'entry') return n.url ? 'click to open ↗' : 'no link';
    if (n.kind === 'subsection') return state.expandedSubs.has(n.id) ? 'click to collapse' : 'click to expand entries';
    if (n.kind === 'section') return 'click to focus camera';
    if (n.kind === 'tag') return 'click to focus camera';
    return '';
  }

  function colorOf(n) {
    if (n.kind === 'section') return SECTION_HUB_COLOR;
    if (n.kind === 'tag') return TAG_COLOR;
    return SECTION_COLORS[n.section] || '#888';
  }

  function sizeOf(n) {
    if (n.kind === 'section') return 190;
    if (n.kind === 'subsection') return Math.max(60, 60 + Math.min(200, Math.sqrt(n.entryCount || 0) * 14));
    if (n.kind === 'tag') return 8;
    return 4; // entry
  }

  function buildVisibleData() {
    const visible = new Set();
    for (const n of state.raw.nodes) {
      if (!state.enabledKinds.has(n.kind)) continue;
      if (n.kind === 'entry') {
        // Two paths: (a) Entries kind enabled = show all; (b) parent subsection expanded
        if (state.enabledKinds.has('entry')) {
          visible.add(n.id);
          continue;
        }
        const adj = state.nodeAdj.get(n.id) || new Set();
        let shown = false;
        for (const nb of adj) {
          const nbNode = state.nodesById.get(nb);
          if (nbNode && nbNode.kind === 'subsection' && state.expandedSubs.has(nb)) { shown = true; break; }
        }
        if (!shown) continue;
      }
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

  // Tags rendered as octahedrons (other kinds use default sphere by returning null).
  function makeTagOctahedron(n) {
    if (n.kind !== 'tag' || !window.THREE) return null;
    const radius = sizeOf(n) * 0.5;
    const geom = new window.THREE.OctahedronGeometry(radius, 0);
    const mat = new window.THREE.MeshLambertMaterial({
      color: TAG_COLOR,
      transparent: true,
      opacity: 0.95,
      flatShading: true
    });
    const mesh = new window.THREE.Mesh(geom, mat);
    n.__mat = mat;
    return mesh;
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
    // Hover takes priority but selected always contributes too — both stay lit.
    const targets = [];
    if (state.selectedNode) targets.push(state.selectedNode);
    if (state.hoveredNode && state.hoveredNode !== state.selectedNode) targets.push(state.hoveredNode);
    if (targets.length) {
      const data = state.Graph.graphData();
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
    if (!state.Graph) return;
    state.Graph
      .linkColor(state.Graph.linkColor())
      .linkWidth(state.Graph.linkWidth())
      .nodeColor(state.Graph.nodeColor());
    const dim = state.highlightNodes.size > 0;
    for (const n of state.raw.nodes) {
      if (n.kind !== 'tag' || !n.__mat) continue;
      n.__mat.opacity = dim ? (state.highlightNodes.has(n.id) ? 0.95 : 0.3) : 0.95;
    }
  }

  function setHovered(node) { state.hoveredNode = node; recomputeHighlights(); }
  function setSelected(node) { state.selectedNode = node; recomputeHighlights(); }

  function tooltipHtml(n) {
    const swatch = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${colorOf(n)};margin-right:6px;vertical-align:middle"></span>`;
    let html = `<div style="font-weight:600">${swatch}${escapeHtml(n.label)}</div>`;
    html += `<div style="opacity:0.55;font-size:11px;font-style:italic;margin-top:2px">${KIND_LABELS_S[n.kind]}${n.namespace ? ' · ' + n.namespace : ''}${n.kind === 'subsection' ? ' · ' + (n.entryCount || 0) + ' entries' : ''}</div>`;
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
    let html = `<div class="kind"><span class="swatch" style="background:${colorOf(node)}"></span>${KIND_LABELS_S[node.kind]}${node.namespace ? ' · ' + node.namespace : ''}</div>`;
    html += `<h2>${escapeHtml(node.label)}</h2>`;
    const meta = [];
    if (node.entry_type) meta.push(`type ${node.entry_type}`);
    if (node.license) meta.push(`license ${node.license}`);
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
      html += `<div style="margin-top:10px"><a href="${node.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(node.url)} ↗</a></div>`;
    }
    if (node.kind === 'subsection' || node.kind === 'section') {
      html += `<div style="margin-top:8px"><a href="/#${node.anchor}">Open in main page →</a></div>`;
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

  function focusNode(nodeId) {
    const node = state.nodesById.get(nodeId);
    if (!node) return;
    if (node.x == null) {
      // not in current layout (filtered out) — re-feed and try after a frame
      requestAnimationFrame(() => focusNode(nodeId));
      return;
    }
    const distance = 90;
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
    section: 'glyph-square-fill',
    subsection: 'glyph-square-outline',
    entry: 'glyph-circle-fill',
    tag: 'glyph-hash'
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
    help.addEventListener('click', () => {
      const overlay = document.getElementById('onboard');
      if (overlay) {
        overlay.classList.remove('hidden');
        const ok = document.getElementById('onboard-ok');
        if (ok) ok.focus();
      }
    });
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
      <button class="g-btn" id="btn-fit" type="button">Reset view</button>
      <button class="g-btn" id="btn-relayout" type="button" title="Re-run physics simulation">Re-layout</button>
      <button class="g-btn" id="btn-pause" type="button" aria-pressed="false" title="Pause / resume physics">Pause</button>
      <button class="g-btn" id="btn-collapse" type="button" title="Collapse all expanded subsections">Collapse all</button>
    `;
    panel.appendChild(foot);
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

    function render(matches, query) {
      if (!matches.length) {
        results.innerHTML = `<div class="g-search-empty">No matches for "${escapeHtml(query)}"</div>`;
        results.classList.add('visible');
        input.setAttribute('aria-expanded', 'true');
        return;
      }
      results.innerHTML = matches.map((m, i) => {
        const node = state.nodesById.get(m.id);
        const swatch = node ? colorOf(node) : '#888';
        return `<div class="g-search-result" role="option" data-id="${m.id}" id="sr-${i}" aria-selected="${i === activeIdx ? 'true' : 'false'}">
          <span class="swatch" style="background:${swatch}"></span>
          <span class="label-text">${escapeHtml(m.label)}</span>
          <span class="kind">${KIND_LABELS_S[m.kind]}</span>
        </div>`;
      }).join('');
      results.classList.add('visible');
      input.setAttribute('aria-expanded', 'true');
    }

    function performSearch() {
      const q = input.value.trim().toLowerCase();
      if (!q) { results.classList.remove('visible'); input.setAttribute('aria-expanded', 'false'); return; }
      const matches = [];
      for (const item of lookup) {
        if (item.lc.includes(q)) {
          matches.push(item);
          if (matches.length >= 30) break;
        }
      }
      activeIdx = -1;
      render(matches, q);
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
        items.forEach((el, i) => el.classList.toggle('active', i === activeIdx));
        items[activeIdx].scrollIntoView({ block: 'nearest' });
      } else if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        if (!items.length) return;
        activeIdx = (activeIdx - 1 + items.length) % items.length;
        items.forEach((el, i) => el.classList.toggle('active', i === activeIdx));
        items[activeIdx].scrollIntoView({ block: 'nearest' });
      } else if (ev.key === 'Enter') {
        if (activeIdx >= 0 && items[activeIdx]) {
          ev.preventDefault();
          selectFromSearch(items[activeIdx].dataset.id);
        } else if (items.length === 1) {
          selectFromSearch(items[0].dataset.id);
        }
      } else if (ev.key === 'Escape') {
        if (results.classList.contains('visible')) {
          results.classList.remove('visible');
          input.setAttribute('aria-expanded', 'false');
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
      if (!state.enabledKinds.has(node.kind)) {
        state.enabledKinds.add(node.kind);
        renderLegend();
        toast(`Enabled ${KIND_LABELS[node.kind].toLowerCase()} so this match would be visible`);
      }
      refreshGraph();
      results.classList.remove('visible');
      input.setAttribute('aria-expanded', 'false');
      input.value = '';
      requestAnimationFrame(() => requestAnimationFrame(() => focusNode(id)));
    }

    results.addEventListener('click', (ev) => {
      const r = ev.target.closest('.g-search-result');
      if (!r) return;
      selectFromSearch(r.dataset.id);
    });

    document.addEventListener('click', (ev) => {
      if (!ev.target.closest('.g-search')) {
        results.classList.remove('visible');
        input.setAttribute('aria-expanded', 'false');
      }
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
      }
    });
  }

  function setupControls() {
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

  function setupOnboarding() {
    const overlay = document.getElementById('onboard');
    const ok = document.getElementById('onboard-ok');
    const seen = (() => { try { return localStorage.getItem(STORAGE_ONBOARD_KEY); } catch { return null; } })();
    if (!seen) {
      overlay.classList.remove('hidden');
      ok.focus();
    }
    function dismiss() {
      overlay.classList.add('hidden');
      try { localStorage.setItem(STORAGE_ONBOARD_KEY, '1'); } catch {}
      const help = document.getElementById('btn-help');
      if (help) help.focus();
    }
    ok.addEventListener('click', dismiss);
    overlay.addEventListener('click', (ev) => { if (ev.target === overlay) dismiss(); });
    document.addEventListener('keydown', (ev) => {
      if (!overlay.classList.contains('hidden') && ev.key === 'Escape') dismiss();
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
    const Graph = window.ForceGraph3D()(container)
      .backgroundColor('#0b0b0d')
      .showNavInfo(false)
      .nodeRelSize(1)
      .nodeVal(n => Math.max(1, sizeOf(n) * 0.4))
      .nodeColor(nodeColorFn)
      .nodeLabel(tooltipHtml)
      .nodeOpacity(0.95)
      .nodeThreeObject(makeTagOctahedron)
      .nodeThreeObjectExtend(false)
      .linkOpacity(0.99)
      .linkColor(linkColor)
      .linkWidth(linkWidth)
      .linkDirectionalParticles(0)
      .enableNodeDrag(true)
      .onNodeHover(node => {
        container.style.cursor = node ? 'pointer' : '';
        setHovered(node);
      })
      .onNodeClick(node => {
        if (node.kind === 'subsection') toggleExpandSub(node.id);
        focusNode(node.id);
        if (node.kind === 'entry' && node.url) {
          window.open(node.url, '_blank', 'noopener,noreferrer');
          announce(`Opened ${node.label} in new tab`);
        }
      })
      .onBackgroundClick(() => {
        setSelected(null);
        showInfo(null);
        updateBreadcrumb();
        history.replaceState(null, '', location.pathname);
      });

    Graph.d3Force('charge').strength(-40).distanceMax(180);
    Graph.d3Force('link').distance(l => l.kind === 'tag' ? 40 : 22);

    // Clamp orbit zoom distance so users can't pan to infinity
    const controls = Graph.controls();
    if (controls) {
      controls.minDistance = 80;
      controls.maxDistance = 4000;
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

  function start() {
    init().catch(err => {
      console.error(err);
      const loading = document.getElementById('loading');
      loading.querySelector('.label').textContent = 'Failed to load graph: ' + err.message;
    });
  }

  function ready() {
    if (window.ForceGraph3D && window.THREE) start();
    else window.addEventListener('graph-deps-ready', start, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }
})();
