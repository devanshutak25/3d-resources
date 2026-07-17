// Client-side filter for 3D Resources site.
// Reads data.json, decorates rendered README with data-attrs, renders filter UI.

(function () {
  'use strict';

  const DATA_URL = '/data.json';
  const SEARCH_INDEX_URL = '/search-index.json';
  const HIGHLIGHT_CAP = 80; // only highlight top-N matching rows for perf
  const EXCLUDED_H2_IDS = new Set(['contents', 'contributing', 'footnotes', 'attribution']);
  const ISSUES_URL = 'https://github.com/devanshutak25/3d-resources/issues';

  const CATEGORY_OPTIONS = [
    'assets-libraries', 'modeling-sculpting-texturing', 'animation-rigging',
    'lighting-rendering-shaders', 'vfx-compositing-virtual-production', 'motion-graphics-video',
    'game-development', 'art-design-visual-storytelling', 'ai-ml-for-cg',
    'tools-pipeline-utilities', 'learning-community-industry', 'software-reference'
  ];
  const CATEGORY_LABELS = {
    'assets-libraries': 'Assets',
    'modeling-sculpting-texturing': 'Modeling',
    'animation-rigging': 'Animation',
    'lighting-rendering-shaders': 'Lighting & Render',
    'vfx-compositing-virtual-production': 'VFX',
    'motion-graphics-video': 'Motion Graphics',
    'game-development': 'Game Dev',
    'art-design-visual-storytelling': 'Art & Design',
    'ai-ml-for-cg': 'AI/ML',
    'tools-pipeline-utilities': 'Tools & Pipeline',
    'learning-community-industry': 'Learning',
    'software-reference': 'Software Reference'
  };
  const LICENSE_OPTIONS = ['Open Source', 'Free', 'Free NC', 'Freemium', 'Paid', 'Mixed'];
  const PLATFORM_OPTIONS = ['win', 'mac', 'linux', 'web', 'ios', 'ipad', 'android', 'cloud'];
  const PLATFORM_LABELS = { win: 'Windows', mac: 'macOS', linux: 'Linux', web: 'Web', ios: 'iOS', ipad: 'iPad', android: 'Android', cloud: 'Cloud' };
  const WORKFLOW_OPTIONS = ['modeling', 'sculpting', 'retopo', 'uv', 'texturing', 'material-authoring', 'rigging', 'animation', 'mocap', 'simulation', 'fx', 'lighting', 'rendering', 'compositing', 'editing', 'audio-design'];
  const WORKFLOW_LABELS = {
    'modeling': 'Modeling', 'sculpting': 'Sculpting', 'retopo': 'Retopo', 'uv': 'UV',
    'texturing': 'Texturing', 'material-authoring': 'Material Authoring',
    'rigging': 'Rigging', 'animation': 'Animation', 'mocap': 'MoCap',
    'simulation': 'Simulation', 'fx': 'FX', 'lighting': 'Lighting',
    'rendering': 'Rendering', 'compositing': 'Compositing',
    'editing': 'Editing', 'audio-design': 'Audio Design'
  };
  const OUTPUT_OPTIONS = ['games', 'film-vfx', 'broadcast', 'archviz', 'product-viz', 'motion-graphics', 'illustration', 'xr'];
  const OUTPUT_LABELS = {
    'games': 'Games', 'film-vfx': 'Film & VFX', 'broadcast': 'Broadcast',
    'archviz': 'ArchViz', 'product-viz': 'Product Viz',
    'motion-graphics': 'Motion Graphics', 'illustration': 'Illustration', 'xr': 'XR'
  };

  const active = {
    search: '',
    category: new Set(),
    license: new Set(),
    platform: new Set(),
    workflow: new Set(),
    output: new Set()
  };

  let itemIndex = []; // [{ el, entry, urlKey, score, origIndex }]
  let mainEl = null;
  let miniSearch = null;          // loaded MiniSearch instance (null until ready)
  let lastSearching = false;      // tracks searching↔idle transitions for reorder
  const autoExpanded = new Set();           // headings auto-opened during search (§3)
  const headingOrigOrder = new WeakMap();   // h3 -> int

  function normalizeUrl(u) {
    try {
      const url = new URL(u);
      url.hash = '';
      let s = url.toString();
      if (s.endsWith('/') && url.pathname !== '/') s = s.slice(0, -1);
      return s;
    } catch (e) {
      return u;
    }
  }

  function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  function slugifyId(s) {
    return String(s || '').toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 80);
  }

  function decorate(data) {
    const byUrl = new Map();
    for (const e of data.entries) byUrl.set(normalizeUrl(e.url), e);

    const usedIds = new Set();
    const anchors = mainEl.querySelectorAll('a[href]');
    let idx = 0;
    for (const a of anchors) {
      const entry = byUrl.get(normalizeUrl(a.getAttribute('href')));
      if (!entry) continue;
      let el = a;
      while (el && el !== mainEl && el.tagName !== 'LI' && el.tagName !== 'TR') {
        el = el.parentElement;
      }
      if (!el || el === mainEl) continue;
      if (el.dataset.decorated) continue;
      el.dataset.decorated = '1';
      if (entry.license) el.dataset.license = entry.license;
      el.dataset.platform = (entry.tags.platform || []).join(' ');
      el.dataset.workflow = (entry.tags.workflow || []).join(' ');
      el.dataset.output = (entry.tags.output || []).join(' ');
      // Catalog context for analytics.js outbound_click. Filtering never reads
      // these; they exist so a click knows which entry it belongs to.
      if (entry.name) el.dataset.name = entry.name;
      if (entry.entry_type) el.dataset.entryType = entry.entry_type;
      if (entry.section) el.dataset.section = entry.section;
      if (entry.subsection) el.dataset.subsection = entry.subsection;
      el.setAttribute('tabindex', '0');
      // B6: stable id + hover anchor.
      const base = 'r-' + slugifyId(entry.name || '');
      let rid = base; let n = 2;
      while (!base || usedIds.has(rid) || document.getElementById(rid)) { rid = base + '-' + n++; }
      usedIds.add(rid);
      el.id = rid;
      const link = document.createElement('a');
      link.className = 'row-anchor no-ext-icon';
      link.href = '#' + rid;
      link.setAttribute('aria-label', 'Link to this item');
      link.textContent = '§';
      link.addEventListener('click', (ev) => {
        ev.stopPropagation();
        try { navigator.clipboard && navigator.clipboard.writeText(location.origin + location.pathname + '#' + rid); } catch (e) { /* noop */ }
      });
      if (el.tagName === 'TR') {
        const firstCell = el.querySelector('td');
        if (firstCell) {
          firstCell.style.position = firstCell.style.position || 'relative';
          firstCell.insertBefore(link, firstCell.firstChild);
        }
      } else {
        el.insertBefore(link, el.firstChild);
      }
      itemIndex.push({
        el, entry,
        urlKey: normalizeUrl(entry.url),
        score: 0,
        origIndex: idx++
      });
    }

    // Capture H3 original order for restoration on clear (§3, §4 reorder restore).
    let hidx = 0;
    for (const h of mainEl.querySelectorAll('h3')) headingOrigOrder.set(h, hidx++);
  }

  // ---------- §4 Search via MiniSearch ----------
  //
  // Index is built server-side (scripts/build-search-index.js) and loaded
  // once at start. Search options here MUST mirror the build options.

  const SEARCH_OPTS = {
    boost: { name: 4, nameSquashed: 4, aliases: 4, tags: 2, subsection: 1.5, description: 1 },
    prefix: true,
    fuzzy: 0.2,
    combineWith: 'AND'
  };

  function runSearch(query) {
    if (!miniSearch || !query) return null;
    // Defensive: MiniSearch tokenizes itself. Strip extra noise; keep alphanum
    // and spaces so "cinema4d" stays one token (matches indexed nameSquashed).
    const q = String(query).trim();
    if (!q) return null;
    const results = miniSearch.search(q, SEARCH_OPTS);
    const map = new Map();
    for (const r of results) map.set(r.id, r.score);
    return map;
  }

  // Tokens exposed to the highlighter — split on whitespace + punctuation,
  // dedupe, lowercase. Order doesn't matter for highlighting.
  function highlightTokens(query) {
    if (!query) return [];
    const set = new Set();
    for (const t of String(query).toLowerCase().split(/[^a-z0-9]+/)) {
      if (t && t.length >= 2) set.add(t);
    }
    return [...set];
  }

  // ---------- Filter logic ----------

  function matches(item) {
    if (active.search && item.score <= 0) return false;
    if (active.category.size && !active.category.has(item.entry.section)) return false;
    if (active.license.size && item.entry.license && !active.license.has(item.entry.license)) return false;
    for (const group of ['platform', 'workflow', 'output']) {
      if (!active[group].size) continue;
      const vals = item.entry.tags[group] || [];
      if (!vals.length) continue;
      let ok = false;
      for (const v of active[group]) if (vals.includes(v)) { ok = true; break; }
      if (!ok) return false;
    }
    return true;
  }

  function anyFilterActive() {
    return active.search || active.category.size || active.license.size ||
      active.platform.size || active.workflow.size || active.output.size;
  }

  function rangeFromHeading(heading, level) {
    const range = [];
    let n = heading.nextElementSibling;
    while (n) {
      if (n.tagName === 'H2') break;
      if (level === 'H3' && n.tagName === 'H3') break;
      range.push(n);
      n = n.nextElementSibling;
    }
    return range;
  }

  function elementHasVisibleItem(el) {
    if ((el.tagName === 'LI' || el.tagName === 'TR') && el.dataset.decorated) {
      return el.style.display !== 'none';
    }
    if (!el.querySelectorAll) return false;
    const decorated = el.querySelectorAll('[data-decorated]');
    for (const d of decorated) if (d.style.display !== 'none') return true;
    return false;
  }

  function resetSectionHiding() {
    const hidden = mainEl.querySelectorAll('[data-hidden-by-filter]');
    for (const el of hidden) {
      el.removeAttribute('data-hidden-by-filter');
      if (!el.hasAttribute('data-user-collapsed')) el.style.display = '';
    }
  }

  function hideRange(heading, range) {
    heading.style.display = 'none';
    heading.setAttribute('data-hidden-by-filter', '1');
    for (const el of range) {
      el.style.display = 'none';
      el.setAttribute('data-hidden-by-filter', '1');
    }
  }

  function hideEmptySections() {
    resetSectionHiding();
    if (!anyFilterActive()) { syncToC(); return; }

    const h3s = Array.from(mainEl.querySelectorAll('h3'));
    for (const h3 of h3s) {
      const range = rangeFromHeading(h3, 'H3');
      const hasVisible = range.some(elementHasVisibleItem);
      if (!hasVisible) hideRange(h3, range);
    }

    const h2s = Array.from(mainEl.querySelectorAll('h2'));
    for (const h2 of h2s) {
      if (EXCLUDED_H2_IDS.has(h2.id)) continue;
      const range = rangeFromHeading(h2, 'H2');
      const hasVisible = range.some(elementHasVisibleItem);
      if (!hasVisible) hideRange(h2, range);
    }

    syncToC();
  }

  // §17: Dim non-matching ToC entries; keep clickable (no display:none).
  function syncToC() {
    const contents = document.getElementById('contents');
    if (!contents) return;
    let n = contents.nextElementSibling;
    while (n && n.tagName !== 'H2') {
      if (n.tagName === 'DETAILS') {
        const sumA = n.querySelector(':scope > summary a[href^="#"]');
        if (sumA) {
          const targetId = decodeURIComponent(sumA.getAttribute('href').slice(1));
          const target = document.getElementById(targetId);
          if (target) {
            const dimmed = target.style.display === 'none';
            if (dimmed) n.setAttribute('data-dim', '1'); else n.removeAttribute('data-dim');
            n.style.display = '';
          }
        }
        const lis = n.querySelectorAll('li');
        for (const li of lis) {
          const a = li.querySelector('a[href^="#"]');
          if (!a) continue;
          const tid = decodeURIComponent(a.getAttribute('href').slice(1));
          const target = document.getElementById(tid);
          if (target) {
            const dimmed = target.style.display === 'none';
            if (dimmed) li.setAttribute('data-dim', '1'); else li.removeAttribute('data-dim');
            li.style.display = '';
          }
        }
      }
      n = n.nextElementSibling;
    }
  }

  // ---------- §5 Match highlighting ----------

  function clearHighlights() {
    const marks = mainEl.querySelectorAll('mark.hl');
    for (const m of marks) {
      const t = document.createTextNode(m.textContent);
      m.parentNode.replaceChild(t, m);
    }
  }

  function highlightInVisible(tokens) {
    if (!tokens.length) return;
    const re = new RegExp('(' + tokens.map(escapeRegExp).join('|') + ')', 'gi');
    // Highlight only the top-N visible items by score — the most relevant
    // ones the user actually sees first. Bounds the worst case at ~80 tree
    // walks even when 1000+ rows match.
    const ordered = itemIndex
      .filter(it => it.el.style.display !== 'none')
      .sort((a, b) => b.score - a.score)
      .slice(0, HIGHLIGHT_CAP);
    for (const item of ordered) {
      const walker = document.createTreeWalker(item.el, NodeFilter.SHOW_TEXT, {
        acceptNode(n) {
          if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          const p = n.parentNode;
          if (!p) return NodeFilter.FILTER_REJECT;
          const tag = p.tagName;
          if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'MARK') return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      const nodes = [];
      let n; while ((n = walker.nextNode())) nodes.push(n);
      for (const node of nodes) {
        const v = node.nodeValue;
        re.lastIndex = 0;
        if (!re.test(v)) continue;
        re.lastIndex = 0;
        const frag = document.createDocumentFragment();
        let last = 0; let m;
        while ((m = re.exec(v))) {
          if (m.index > last) frag.appendChild(document.createTextNode(v.slice(last, m.index)));
          const mark = document.createElement('mark');
          mark.className = 'hl';
          mark.textContent = m[0];
          frag.appendChild(mark);
          last = m.index + m[0].length;
        }
        if (last < v.length) frag.appendChild(document.createTextNode(v.slice(last)));
        node.parentNode.replaceChild(frag, node);
      }
    }
  }

  // ---------- §4 Reorder by score ----------

  function reorderItems(searching) {
    // Skip the heavy per-item DOM shuffle when nothing has changed.
    //   - searching now, was idle:    sort by score, move
    //   - searching, still searching: sort by score, move (scores changed)
    //   - idle now, was searching:    restore original order
    //   - idle, still idle:           no-op
    if (!searching && !lastSearching) { lastSearching = false; return; }

    const groups = new Map();
    for (const item of itemIndex) {
      const p = item.el.parentElement;
      if (!p) continue;
      if (!groups.has(p)) groups.set(p, []);
      groups.get(p).push(item);
    }
    for (const [parent, items] of groups) {
      items.sort((a, b) => {
        if (searching && b.score !== a.score) return b.score - a.score;
        return a.origIndex - b.origIndex;
      });
      // Single batched insert via DocumentFragment — one reflow per parent
      // instead of one per item (the previous loop was O(N) reflows).
      const frag = document.createDocumentFragment();
      for (const it of items) frag.appendChild(it.el);
      parent.appendChild(frag);
    }
    reorderSubcats(searching);
    lastSearching = searching;
  }

  function reorderSubcats(searching) {
    const h2s = mainEl.querySelectorAll('h2');
    for (const h2 of h2s) {
      if (EXCLUDED_H2_IDS.has(h2.id)) continue;
      const blocks = [];
      const preH3 = [];
      let n = h2.nextElementSibling;
      while (n && n.tagName !== 'H2') {
        if (n.tagName === 'H3') {
          const range = [];
          let m = n.nextElementSibling;
          while (m && m.tagName !== 'H3' && m.tagName !== 'H2') {
            range.push(m); m = m.nextElementSibling;
          }
          let max = 0;
          for (const item of itemIndex) {
            for (const r of range) {
              if (r === item.el || (r.contains && r.contains(item.el))) {
                if (item.score > max) max = item.score;
                break;
              }
            }
          }
          blocks.push({ h3: n, range, max, orig: headingOrigOrder.get(n) ?? 0 });
          n = m;
        } else {
          if (!blocks.length) preH3.push(n);
          n = n.nextElementSibling;
        }
      }
      if (!blocks.length) continue;
      const sorted = blocks.slice().sort((a, b) => {
        if (searching && b.max !== a.max) return b.max - a.max;
        return a.orig - b.orig;
      });
      let anchor = preH3.length ? preH3[preH3.length - 1] : h2;
      for (const block of sorted) {
        anchor.parentElement.insertBefore(block.h3, anchor.nextSibling);
        anchor = block.h3;
        for (const r of block.range) {
          anchor.parentElement.insertBefore(r, anchor.nextSibling);
          anchor = r;
        }
      }
    }
  }

  // ---------- Hit count badges (§2) ----------

  function addOrUpdateHitBadges() {
    for (const b of mainEl.querySelectorAll('.hit-count')) b.remove();
    if (!active.search) return;
    const h3s = mainEl.querySelectorAll('h3');
    for (const h3 of h3s) {
      const range = rangeFromHeading(h3, 'H3');
      let count = 0;
      for (const r of range) {
        if (!r.querySelectorAll) continue;
        const decs = r.matches && r.matches('[data-decorated]') ? [r] : Array.from(r.querySelectorAll('[data-decorated]'));
        for (const d of decs) {
          if (d.style.display !== 'none') count++;
        }
      }
      if (count > 0) {
        const span = document.createElement('span');
        span.className = 'hit-count';
        span.textContent = String(count);
        h3.appendChild(document.createTextNode(' '));
        h3.appendChild(span);
      }
    }
  }

  // ---------- Auto-expand subcats on hit (§2) ----------

  function autoExpandMatchingSubcats() {
    if (!active.search) return;
    const h3s = mainEl.querySelectorAll('h3');
    for (const h3 of h3s) {
      const range = rangeFromHeading(h3, 'H3');
      let hasHit = false;
      for (const r of range) if (elementHasVisibleItem(r)) { hasHit = true; break; }
      if (hasHit && h3.hasAttribute('data-collapsed')) {
        setCollapsed(h3, false);
        h3.setAttribute('aria-expanded', 'true');
        autoExpanded.add(h3);
      }
    }
  }

  // ---------- §7/§13 Empty state ----------

  function updateEmptyState(visibleCount) {
    let node = document.getElementById('filter-empty-state');
    if (visibleCount > 0 || !anyFilterActive()) {
      if (node) node.remove();
      return;
    }
    if (!node) {
      node = document.createElement('div');
      node.id = 'filter-empty-state';
      const bar = document.getElementById('filter-bar');
      if (bar && bar.parentElement) bar.parentElement.insertBefore(node, bar.nextSibling);
      else mainEl.insertBefore(node, mainEl.firstChild);
    }
    const lines = [];
    if (active.search) {
      lines.push(`<strong>No results for "${escHtml(active.search)}".</strong>`);
      lines.push(pickEmptyCopy());
      lines.push(`<a href="${ISSUES_URL}" target="_blank" rel="noopener noreferrer">Know a resource? Suggest it →</a>`);
    } else {
      const restrictive = mostRestrictiveFilter();
      if (restrictive) {
        lines.push(`<strong>No results match the active filters.</strong>`);
        lines.push(`Try removing "${escHtml(restrictive.label)}".`);
      } else {
        lines.push(`<strong>No results match the active filters.</strong>`);
      }
    }
    node.innerHTML = lines.join('<br>');
  }

  function pickEmptyCopy() {
    const copies = [
      `Try a broader term — "retopo" instead of "quad-remesher".`,
      `Nothing yet. If it exists and it's good, open an issue below.`,
      `Empty. Even Houdini returns null sometimes.`
    ];
    return copies[Math.floor(Math.random() * copies.length)];
  }

  function mostRestrictiveFilter() {
    const groups = ['category', 'license', 'platform', 'workflow', 'output'];
    let best = null; let bestGain = 0;
    for (const g of groups) {
      if (!active[g].size) continue;
      const saved = active[g];
      active[g] = new Set();
      // re-score not needed — search unchanged.
      let count = 0;
      for (const item of itemIndex) if (matches(item)) count++;
      active[g] = saved;
      if (count > bestGain) {
        bestGain = count;
        const v = saved.values().next().value;
        best = { group: g, value: v, label: labelFor(g, v) };
      }
    }
    return best;
  }

  function labelFor(group, value) {
    if (group === 'category') return CATEGORY_LABELS[value] || value;
    if (group === 'platform') return PLATFORM_LABELS[value] || value;
    if (group === 'workflow') return WORKFLOW_LABELS[value] || value;
    if (group === 'output') return OUTPUT_LABELS[value] || value;
    return value;
  }

  // ---------- URL hash state (B1) ----------

  const HASH_GROUPS = ['category', 'license', 'platform', 'workflow', 'output'];
  let hashWriteSuspended = false;

  function serializeStateToHash(replace) {
    if (hashWriteSuspended) return;
    const parts = [];
    if (active.search) parts.push('q=' + encodeURIComponent(active.search));
    for (const g of HASH_GROUPS) {
      const set = active[g];
      if (set && set.size) {
        const vals = [...set].map(encodeURIComponent).join(',');
        parts.push(g + '=' + vals);
      }
    }
    const newHash = parts.length ? '#' + parts.join('&') : '';
    const url = location.pathname + location.search + newHash;
    try {
      if (replace) history.replaceState(null, '', url || location.pathname);
      else history.pushState(null, '', url || location.pathname);
    } catch (e) { /* noop */ }
  }

  function restoreStateFromHash() {
    const h = location.hash || '';
    if (!h.startsWith('#')) return false;
    const body = h.slice(1);
    if (!body || body.indexOf('=') === -1) return false; // anchor link, not state
    const params = new URLSearchParams(body);
    let any = false;
    if (params.has('q')) { active.search = params.get('q') || ''; any = true; }
    for (const g of HASH_GROUPS) {
      if (!params.has(g)) continue;
      const raw = params.get(g) || '';
      const vals = raw.split(',').map(decodeURIComponent).filter(Boolean);
      active[g] = new Set(vals);
      any = true;
    }
    return any;
  }

  function reflectStateInUI() {
    const search = document.getElementById('filter-search');
    if (search) search.value = active.search || '';
    const bar = document.getElementById('filter-bar');
    if (!bar) return;
    for (const chip of bar.querySelectorAll('.filter-chip')) {
      const g = chip.dataset.group;
      const v = chip.dataset.value;
      const on = active[g] && active[g].has(v);
      chip.classList.toggle('active', !!on);
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  // ---------- Analytics ----------
  // Events go through window.track3d (assets/js/analytics.js), which queues
  // until Mixpanel loads. Guarded: filter.js must keep working when
  // analytics.js is blocked by an extension or fails to load.

  const FACET_GROUPS = ['category', 'license', 'platform', 'workflow', 'output'];

  // Result count from the most recent applyFilters(), read by the event
  // emitters below. applyFilters() is the single funnel every filter and
  // search change flows through, so this is always the count the user sees.
  let lastVisibleCount = 0;

  function track(event, props) {
    if (typeof window.track3d === 'function') window.track3d(event, props);
  }

  // Each facet group is emitted as its own list property rather than one
  // nested object, so Mixpanel can filter on "license contains Free".
  function facetProps() {
    const out = { facet_count: 0 };
    for (const g of FACET_GROUPS) {
      const set = active[g];
      if (set && set.size) {
        out['facet_' + g] = Array.from(set).sort();
        out.facet_count += set.size;
      }
    }
    return out;
  }

  // A search event should describe a query the user finished typing, not each
  // keystroke on the way there. The input debounce (80-180ms) is tuned for
  // responsive filtering and is far too short to mean "done"; this settles
  // separately and only reports queries that stopped changing.
  const SEARCH_SETTLE_MS = 1000;
  let searchSettleTimer = 0;
  let lastTrackedQuery = '';

  function trackSearchSettled() {
    clearTimeout(searchSettleTimer);
    searchSettleTimer = setTimeout(() => {
      const q = active.search;
      if (!q || q === lastTrackedQuery) return;
      lastTrackedQuery = q;
      const props = facetProps();
      props.query = q;
      props.query_length = q.length;
      props.result_count = lastVisibleCount;
      // Zero-result queries are the point of this event: they are a standing
      // list of what the catalog is missing.
      props.zero_results = lastVisibleCount === 0;
      track('search', props);
    }, SEARCH_SETTLE_MS);
  }

  // ---------- Apply ----------

  function applyFilters() {
    clearHighlights();
    // If the engine isn't ready yet (initial load with a hash query), treat
    // search as inactive for now. loadSearchIndex() re-applies once ready.
    const searching = !!active.search && !!miniSearch;
    const scoreMap = searching ? runSearch(active.search) : null;
    if (searching && scoreMap) {
      for (const item of itemIndex) item.score = scoreMap.get(item.urlKey) || 0;
    } else {
      for (const item of itemIndex) item.score = 1;
    }

    let visibleCount = 0;
    for (const item of itemIndex) {
      const show = matches(item);
      item.el.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    }
    lastVisibleCount = visibleCount;

    reorderItems(searching);
    autoExpandMatchingSubcats();
    hideEmptySections();
    addOrUpdateHitBadges();
    if (searching) {
      const tokens = highlightTokens(active.search);
      if (tokens.length) highlightInVisible(tokens);
    }
    updateEmptyState(visibleCount);

    const counter = document.getElementById('filter-count');
    if (counter) counter.textContent = `${visibleCount} / ${itemIndex.length}`;
    const toggle = document.getElementById('filter-toggle');
    if (toggle && toggle._setIcon) toggle._setIcon();
    syncSearchClearVisibility();
    serializeStateToHash(applyFilters._replaceHash !== false);
    applyFilters._replaceHash = true;
  }

  function syncSearchClearVisibility() {
    const c = document.getElementById('filter-search-clear');
    if (c) c.style.display = active.search ? '' : 'none';
  }

  // ---------- UI ----------

  function makeChip(group, value, label) {
    const btn = document.createElement('button');
    btn.className = 'filter-chip';
    btn.type = 'button';
    btn.textContent = label;
    btn.dataset.group = group;
    btn.dataset.value = value;
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => {
      const set = active[group];
      const adding = !set.has(value);
      if (set.has(value)) { set.delete(value); btn.classList.remove('active'); btn.setAttribute('aria-pressed', 'false'); }
      else { set.add(value); btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true'); }
      applyFilters._replaceHash = false;
      applyFilters();
      // After applyFilters so result_count reflects this toggle.
      const props = facetProps();
      props.group = group;
      props.value = value;
      props.action = adding ? 'add' : 'remove';
      props.result_count = lastVisibleCount;
      props.has_query = !!active.search;
      track('filter_apply', props);
    });
    return btn;
  }

  function makeGroup(bar, label, group, options, labelMap) {
    const row = document.createElement('div');
    row.className = 'filter-row';
    const lab = document.createElement('span');
    lab.className = 'filter-label';
    lab.textContent = label;
    row.appendChild(lab);
    const chips = document.createElement('div');
    chips.className = 'filter-chips';
    for (const v of options) chips.appendChild(makeChip(group, v, labelMap ? labelMap[v] : v));
    row.appendChild(chips);
    bar.appendChild(row);
  }

  function buildUI() {
    // Drop the SSR shell (rendered by build-html.js for SEO + no-JS) before
    // building the live filter bar. The shell only exists to give crawlers
    // a <search> landmark and a fallback notice in <noscript>.
    const ssrShell = document.getElementById('filter-shell');
    if (ssrShell) ssrShell.remove();

    const bar = document.createElement('div');
    bar.id = 'filter-bar';
    bar.setAttribute('role', 'search');

    const header = document.createElement('div');
    header.className = 'filter-header';

    const title = document.createElement('div');
    title.className = 'filter-title';
    title.textContent = 'Filter';
    header.appendChild(title);

    // §6 Trigger button with inline "Filters" text label
    const toggle = document.createElement('button');
    toggle.id = 'filter-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Toggle filters');
    toggle.setAttribute('title', 'Toggle filters');
    const toggleIcon = document.createElement('i');
    toggleIcon.setAttribute('aria-hidden', 'true');
    const toggleLabel = document.createElement('span');
    toggleLabel.id = 'filter-toggle-label';
    toggleLabel.textContent = 'Filters';
    toggle.appendChild(toggleIcon);
    toggle.appendChild(toggleLabel);
    const setToggleIcon = () => {
      const collapsed = bar.classList.contains('collapsed');
      const hasFilters = anyFilterActive();
      let name;
      if (collapsed) name = hasFilters ? 'filter-menu' : 'filter-menu-outline';
      else name = hasFilters ? 'filter' : 'filter-outline';
      toggleIcon.className = `mdi mdi-${name}`;
    };
    toggle._setIcon = setToggleIcon;
    toggle.addEventListener('click', () => {
      const collapsed = !bar.classList.contains('collapsed');
      bar.classList.toggle('collapsed', collapsed);
      setToggleIcon();
    });

    header.appendChild(toggle);
    bar.appendChild(header);

    const top = document.createElement('div');
    top.className = 'filter-top';

    const search = document.createElement('input');
    search.type = 'search';
    search.placeholder = 'Search resources…';
    search.id = 'filter-search';
    search.setAttribute('aria-label', 'Search resources');
    let searchDebounce = 0;
    search.addEventListener('input', () => {
      const v = search.value.trim().toLowerCase();
      clearTimeout(searchDebounce);
      const delay = v.length >= 4 ? 180 : 80;
      searchDebounce = setTimeout(() => {
        active.search = v;
        applyFilters();
        trackSearchSettled();
      }, delay);
    });
    top.appendChild(search);

    // §2 Clear-search button
    const searchClear = document.createElement('button');
    searchClear.id = 'filter-search-clear';
    searchClear.type = 'button';
    searchClear.textContent = 'Clear search';
    searchClear.style.display = 'none';
    searchClear.addEventListener('click', () => {
      active.search = '';
      search.value = '';
      // Clearing ends the current query. Reset so retyping the same term later
      // counts as a genuine second search rather than being deduped away.
      clearTimeout(searchSettleTimer);
      lastTrackedQuery = '';
      // §3: do NOT recollapse autoExpanded subcats.
      applyFilters();
      search.focus();
    });
    top.appendChild(searchClear);

    const counter = document.createElement('span');
    counter.id = 'filter-count';
    counter.textContent = `${itemIndex.length} / ${itemIndex.length}`;
    top.appendChild(counter);

    const clear = document.createElement('button');
    clear.id = 'filter-clear';
    clear.type = 'button';
    clear.textContent = 'Clear all';
    clear.addEventListener('click', () => {
      // Snapshot what was actually discarded, before the state is wiped.
      const before = facetProps();
      before.had_query = !!active.search;
      active.search = '';
      active.category.clear();
      active.license.clear();
      active.platform.clear();
      active.workflow.clear();
      active.output.clear();
      search.value = '';
      clearTimeout(searchSettleTimer);
      lastTrackedQuery = '';
      for (const c of bar.querySelectorAll('.filter-chip.active')) { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); }
      applyFilters();
      // A clear with nothing active is a no-op click, not a signal.
      if (before.facet_count || before.had_query) track('filter_clear', before);
    });
    top.appendChild(clear);

    bar.appendChild(top);

    // Chip groups live behind their own collapsed-by-default sub-toggle so the
    // open panel stays compact. Search/counter/clear (.filter-top) stay outside.
    const groupsToggle = document.createElement('button');
    groupsToggle.id = 'filter-groups-toggle';
    groupsToggle.className = 'filter-groups-toggle';
    groupsToggle.type = 'button';
    groupsToggle.setAttribute('aria-expanded', 'false');
    groupsToggle.innerHTML = '<span>Filter by category, license, platform…</span><i class="mdi mdi-chevron-down" aria-hidden="true"></i>';
    bar.appendChild(groupsToggle);

    const groups = document.createElement('div');
    groups.className = 'filter-chip-groups collapsed';
    groupsToggle.setAttribute('aria-controls', 'filter-chip-groups');
    groups.id = 'filter-chip-groups';
    makeGroup(groups, 'Category', 'category', CATEGORY_OPTIONS, CATEGORY_LABELS);
    makeGroup(groups, 'License', 'license', LICENSE_OPTIONS);
    makeGroup(groups, 'Platform', 'platform', PLATFORM_OPTIONS, PLATFORM_LABELS);
    makeGroup(groups, 'Workflow', 'workflow', WORKFLOW_OPTIONS, WORKFLOW_LABELS);
    makeGroup(groups, 'Output', 'output', OUTPUT_OPTIONS, OUTPUT_LABELS);
    bar.appendChild(groups);

    const setGroupsOpen = (open) => {
      groups.classList.toggle('collapsed', !open);
      groupsToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    bar._setGroupsOpen = setGroupsOpen;
    groupsToggle.addEventListener('click', () => {
      setGroupsOpen(groups.classList.contains('collapsed'));
    });

    const contents = document.getElementById('contents');
    if (contents) contents.parentElement.insertBefore(bar, contents);
    else mainEl.insertBefore(bar, mainEl.firstChild);

    // §16: no localStorage of expand/filters/query — fresh defaults every visit.
    // Panel open by default on desktop; collapsed on mobile to avoid the
    // fullscreen overlay (CSS @media max-width:768px) popping open on load.
    if (window.matchMedia('(max-width: 768px)').matches) bar.classList.add('collapsed');
    setToggleIcon();

    // §12 Mobile: ToC dropdown.
    buildMobileTocJump();
  }

  function buildMobileTocJump() {
    const contents = document.getElementById('contents');
    if (!contents) return;
    const sel = document.createElement('select');
    sel.id = 'mobile-toc-jump';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Jump to section…';
    sel.appendChild(placeholder);
    for (const h2 of mainEl.querySelectorAll('h2')) {
      if (EXCLUDED_H2_IDS.has(h2.id)) continue;
      const opt = document.createElement('option');
      opt.value = '#' + h2.id;
      opt.textContent = h2.textContent.trim();
      sel.appendChild(opt);
    }
    sel.addEventListener('change', () => {
      const v = sel.value;
      if (!v) return;
      const id = v.slice(1);
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, '', v);
        try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
      }
      sel.value = '';
    });
    contents.parentElement.insertBefore(sel, contents);
  }

  // ---------- §1/§10 Collapsible headings ----------

  const ANIM_MS = 200;

  function clearAnim(el) {
    el.style.maxHeight = '';
    el.style.overflow = '';
    el.style.transition = '';
    el.style.willChange = '';
  }

  function animateClose(range) {
    const targets = range.filter(el => el.style.display !== 'none' && !el.hasAttribute('data-hidden-by-filter'));
    if (!targets.length) return;
    for (const el of targets) {
      const h = el.scrollHeight;
      el.style.maxHeight = h + 'px';
      el.style.overflow = 'hidden';
      el.style.willChange = 'max-height';
    }
    // Force reflow before transition starts.
    void targets[0].offsetHeight;
    for (const el of targets) {
      el.style.transition = `max-height ${ANIM_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      el.style.maxHeight = '0px';
    }
    setTimeout(() => {
      for (const el of targets) {
        el.style.display = 'none';
        clearAnim(el);
      }
    }, ANIM_MS + 30);
  }

  function animateOpen(range) {
    const targets = range.filter(el => !el.hasAttribute('data-hidden-by-filter'));
    if (!targets.length) return;
    // Make visible at 0 height, measure target, then transition to it.
    const heights = [];
    for (const el of targets) {
      el.style.display = '';
      el.style.maxHeight = 'none';
      heights.push(el.scrollHeight);
    }
    for (let i = 0; i < targets.length; i++) {
      const el = targets[i];
      el.style.maxHeight = '0px';
      el.style.overflow = 'hidden';
      el.style.willChange = 'max-height';
    }
    void targets[0].offsetHeight;
    for (let i = 0; i < targets.length; i++) {
      const el = targets[i];
      el.style.transition = `max-height ${ANIM_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      el.style.maxHeight = heights[i] + 'px';
    }
    setTimeout(() => {
      for (const el of targets) clearAnim(el);
    }, ANIM_MS + 30);
  }

  function setCollapsed(heading, collapsed, animate) {
    const level = heading.tagName;
    const range = rangeFromHeading(heading, level);
    if (collapsed) {
      heading.setAttribute('data-collapsed', 'true');
      if (animate) {
        animateClose(range);
      } else {
        for (const el of range) {
          if (!el.hasAttribute('data-hidden-by-filter')) el.style.display = 'none';
        }
      }
      for (const el of range) el.setAttribute('data-user-collapsed', '1');
    } else {
      heading.removeAttribute('data-collapsed');
      for (const el of range) el.removeAttribute('data-user-collapsed');
      if (animate) {
        animateOpen(range);
      } else {
        for (const el of range) {
          if (!el.hasAttribute('data-hidden-by-filter')) el.style.display = '';
        }
      }
    }
  }

  function setupCollapsibleHeadings() {
    const headings = mainEl.querySelectorAll('h2, h3');
    const hashTarget = (location.hash && location.hash.length > 1)
      ? decodeURIComponent(location.hash.slice(1)) : null;
    for (const h of headings) {
      if (h.tagName === 'H2' && EXCLUDED_H2_IDS.has(h.id)) continue;
      h.classList.add('collapsible-heading');
      h.setAttribute('role', 'button');
      // A4: out of tab order; reachable via arrow nav + programmatic focus.
      h.setAttribute('tabindex', '-1');
      // §1: H2 open by default; H3 closed by default.
      if (h.tagName === 'H2') {
        h.setAttribute('aria-expanded', 'true');
      } else {
        if (h.id !== hashTarget) {
          setCollapsed(h, true);
          h.setAttribute('aria-expanded', 'false');
        } else {
          h.setAttribute('aria-expanded', 'true');
        }
      }
      const toggle = (ev) => {
        if (ev.target && ev.target.closest && ev.target.closest('a')) return;
        const nowCollapsed = !h.hasAttribute('data-collapsed');
        setCollapsed(h, nowCollapsed, true);
        h.setAttribute('aria-expanded', nowCollapsed ? 'false' : 'true');
        // User manual toggle: clear from autoExpanded.
        autoExpanded.delete(h);
      };
      h.addEventListener('click', toggle);
      h.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggle(ev); }
      });
    }
  }

  function findPrevH2(el) {
    let p = el.previousElementSibling;
    while (p) {
      if (p.tagName === 'H2') return p;
      p = p.previousElementSibling;
    }
    return null;
  }

  function expandHeading(h) {
    if (!h) return;
    if (h.hasAttribute('data-collapsed')) {
      setCollapsed(h, false);
      h.setAttribute('aria-expanded', 'true');
    }
  }

  // Height of the sticky filter panel as it sits pinned at the top of the
  // viewport, plus a small gap. Used to offset in-page scroll targets so a
  // heading doesn't land underneath the pinned search box. Falls back to 8px
  // when the bar isn't sticky/fixed or isn't present.
  function stickyTopOffset() {
    const bar = document.getElementById('filter-bar');
    if (!bar || bar.offsetParent === null) return 8;
    const pos = getComputedStyle(bar).position;
    if (pos !== 'sticky' && pos !== 'fixed') return 8;
    return bar.getBoundingClientRect().height + 12;
  }

  function smoothScrollTo(targetY, duration, onDone) {
    if (typeof duration === 'function') { onDone = duration; duration = undefined; }
    const startY = window.pageYOffset;
    const delta = targetY - startY;
    if (Math.abs(delta) < 2) {
      window.scrollTo(0, targetY);
      if (onDone) onDone(false);
      return;
    }
    const d = duration || Math.min(800, 250 + Math.abs(delta) * 0.4);
    const t0 = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    let cancelled = false;
    const onWheel = () => { cancelled = true; };
    window.addEventListener('wheel', onWheel, { passive: true, once: true });
    window.addEventListener('touchstart', onWheel, { passive: true, once: true });
    function step(now) {
      if (cancelled) {
        window.removeEventListener('wheel', onWheel);
        window.removeEventListener('touchstart', onWheel);
        if (onDone) onDone(true);
        return;
      }
      const t = Math.min(1, (now - t0) / d);
      window.scrollTo(0, startY + delta * ease(t));
      if (t < 1) requestAnimationFrame(step);
      else {
        window.removeEventListener('wheel', onWheel);
        window.removeEventListener('touchstart', onWheel);
        if (onDone) onDone(false);
      }
    }
    requestAnimationFrame(step);
  }

  function flashElement(el) {
    if (!el) return;
    el.classList.remove('row-flash');
    void el.offsetWidth;
    el.classList.add('row-flash');
    setTimeout(() => el.classList.remove('row-flash'), 1700);
  }

  // ToC details open/close animation.
  function setupTocAnimation() {
    const contents = document.getElementById('contents');
    if (!contents) return;
    for (let n = contents.nextElementSibling; n && n.tagName !== 'H2'; n = n.nextElementSibling) {
      if (n.tagName !== 'DETAILS') continue;
      wireTocDetailsAnim(n);
    }
  }

  function wireTocDetailsAnim(details) {
    const summary = details.querySelector(':scope > summary');
    const ul = details.querySelector(':scope > ul');
    if (!summary || !ul) return;
    summary.addEventListener('click', (ev) => {
      // Anchor clicks are handled by setupTocClickHandler (smooth scroll + section open).
      if (ev.target.closest && ev.target.closest('a')) return;
      ev.preventDefault();
      if (details.open) {
        const h = ul.scrollHeight;
        ul.style.maxHeight = h + 'px';
        ul.style.overflow = 'hidden';
        ul.style.willChange = 'max-height';
        void ul.offsetHeight;
        ul.style.transition = `max-height ${ANIM_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        ul.style.maxHeight = '0px';
        setTimeout(() => {
          details.open = false;
          clearAnim(ul);
        }, ANIM_MS + 30);
      } else {
        details.open = true;
        ul.style.maxHeight = '0px';
        ul.style.overflow = 'hidden';
        ul.style.willChange = 'max-height';
        void ul.offsetHeight;
        ul.style.transition = `max-height ${ANIM_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        ul.style.maxHeight = ul.scrollHeight + 'px';
        setTimeout(() => { clearAnim(ul); }, ANIM_MS + 30);
      }
    });
  }

  // §17 ToC click: clear filters + jump.
  function setupTocClickHandler() {
    const contents = document.getElementById('contents');
    if (!contents) return;
    for (let n = contents.nextElementSibling; n && n.tagName !== 'H2'; n = n.nextElementSibling) {
      if (n.tagName !== 'DETAILS') continue;
      const details = n;
      details.addEventListener('click', (ev) => {
        const a = ev.target.closest && ev.target.closest('a[href^="#"]');
        if (!a || !details.contains(a)) return;
        const id = decodeURIComponent(a.getAttribute('href').slice(1));
        const target = document.getElementById(id);
        if (!target) return;
        ev.preventDefault();

        // Preserve active search + filters on TOC jump (do not clear). The
        // target heading is force-expanded below so it is visible even if the
        // active filters dim/hide some of its rows.

        // Collapse the chip-groups sub-section so the panel is compact as the
        // page scrolls to the target.
        const bar = document.getElementById('filter-bar');
        if (bar && bar._setGroupsOpen) bar._setGroupsOpen(false);

        if (target.tagName === 'H3') expandHeading(findPrevH2(target));
        expandHeading(target);
        history.pushState(null, '', '#' + id);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // Offset by the sticky filter panel so the target isn't hidden
            // behind the pinned search box.
            const top = target.getBoundingClientRect().top + window.pageYOffset - stickyTopOffset();
            smoothScrollTo(top);
            // A4: move keyboard focus to the heading once it's in view.
            try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
          });
        });
      });
    }
  }

  function setupExpandAllButton() {
    const btn = document.getElementById('expand-all-btn');
    if (!btn) return;
    let expanded = false;
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      expanded = !expanded;
      const headings = mainEl.querySelectorAll('h2, h3');
      for (const h of headings) {
        if (h.tagName === 'H2' && EXCLUDED_H2_IDS.has(h.id)) continue;
        if (!h.classList.contains('collapsible-heading')) continue;
        if (expanded) {
          if (h.hasAttribute('data-collapsed')) {
            setCollapsed(h, false);
            h.setAttribute('aria-expanded', 'true');
          }
        } else if (h.tagName === 'H3') {
          if (!h.hasAttribute('data-collapsed')) {
            setCollapsed(h, true);
            h.setAttribute('aria-expanded', 'false');
          }
        }
      }
      const contents = document.getElementById('contents');
      if (contents) {
        for (let n = contents.nextElementSibling; n && n.tagName !== 'H2'; n = n.nextElementSibling) {
          if (n.tagName === 'DETAILS') n.open = expanded;
        }
      }
      btn.textContent = expanded ? 'Collapse all' : 'Expand all';
      btn.setAttribute('aria-pressed', expanded ? 'true' : 'false');
    });
  }

  // ---------- §15 Keyboard navigation ----------

  function isVisibleNow(el) {
    // Walk up: collapsed parent (e.g. UL inside collapsed H2/H3 range) hides children.
    let n = el;
    while (n && n !== mainEl) {
      if (n.style && n.style.display === 'none') return false;
      n = n.parentElement;
    }
    return el.offsetParent !== null || el.tagName === 'H2' || el.tagName === 'H3';
  }

  function getNavList() {
    const list = [];
    const all = mainEl.querySelectorAll('h2, h3, [data-decorated]');
    for (const el of all) {
      if (el.tagName === 'H2' && EXCLUDED_H2_IDS.has(el.id)) continue;
      if (el.hasAttribute('data-hidden-by-filter')) continue;
      if (!isVisibleNow(el)) continue;
      list.push(el);
    }
    return list;
  }

  function setupKeyboardNav() {
    document.addEventListener('keydown', (ev) => {
      const target = ev.target;
      const inField = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      const search = document.getElementById('filter-search');

      // '/' or Cmd-K / Ctrl-K → focus search
      if (!inField && ev.key === '/') {
        ev.preventDefault(); if (search) search.focus(); return;
      }
      if ((ev.metaKey || ev.ctrlKey) && (ev.key === 'k' || ev.key === 'K')) {
        ev.preventDefault(); if (search) search.focus(); return;
      }

      // Esc → clear search (only if search has value)
      if (ev.key === 'Escape') {
        if (search && active.search) {
          ev.preventDefault();
          active.search = '';
          search.value = '';
          applyFilters();
          search.focus();
          return;
        }
      }

      if (inField) return; // skip arrows when typing

      const list = getNavList();
      if (!list.length) return;
      const focused = document.activeElement;
      let idx = list.indexOf(focused);

      if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        idx = (idx < 0) ? 0 : Math.min(list.length - 1, idx + 1);
        list[idx].focus();
        return;
      }
      if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        idx = (idx < 0) ? 0 : Math.max(0, idx - 1);
        list[idx].focus();
        return;
      }
      if (ev.key === 'ArrowRight' && focused && (focused.tagName === 'H2' || focused.tagName === 'H3')) {
        if (focused.hasAttribute('data-collapsed')) {
          ev.preventDefault();
          setCollapsed(focused, false, true);
          focused.setAttribute('aria-expanded', 'true');
        }
        return;
      }
      if (ev.key === 'ArrowLeft' && focused && (focused.tagName === 'H2' || focused.tagName === 'H3')) {
        if (!focused.hasAttribute('data-collapsed') && !EXCLUDED_H2_IDS.has(focused.id)) {
          ev.preventDefault();
          setCollapsed(focused, true, true);
          focused.setAttribute('aria-expanded', 'false');
        }
        return;
      }
      if (ev.key === 'Enter' && focused && (focused.tagName === 'LI' || focused.tagName === 'TR')) {
        const a = focused.querySelector('a[href]');
        if (a) {
          ev.preventDefault();
          window.open(a.getAttribute('href'), '_blank', 'noopener,noreferrer');
        }
      }
    });
  }

  // Floating "Scroll to Top" button — appears after the user scrolls past
  // ~1 viewport. Click smooth-scrolls to top.
  function setupScrollToTop() {
    const btn = document.createElement('button');
    btn.id = 'scroll-top';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Scroll to top');
    btn.setAttribute('title', 'Scroll to top');
    btn.innerHTML = '<i class="mdi mdi-arrow-up" aria-hidden="true"></i>';
    btn.addEventListener('click', () => {
      smoothScrollTo(0);
      const skip = document.querySelector('.skip-link');
      if (skip) try { skip.focus({ preventScroll: true }); } catch (e) { skip.focus(); }
    });
    document.body.appendChild(btn);

    let ticking = false;
    const update = () => {
      ticking = false;
      btn.classList.toggle('visible', window.pageYOffset > window.innerHeight * 0.6);
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  // B5: "See also" + mirror "Also in" cross-links must expand the target
  // subsection (and its parent H2 if collapsed) before smooth-scrolling, then
  // flash the destination so the eye lands on it.
  function setupSeeAlsoClickHandler() {
    mainEl.addEventListener('click', (ev) => {
      const a = ev.target.closest && ev.target.closest(
        '.see-also a[href^="#"], .mirror-provenance a[href^="#"]'
      );
      if (!a || !mainEl.contains(a)) return;
      const id = decodeURIComponent(a.getAttribute('href').slice(1));
      const target = document.getElementById(id);
      if (!target) return;
      ev.preventDefault();
      if (target.tagName === 'H3') expandHeading(findPrevH2(target));
      expandHeading(target);
      history.pushState(null, '', '#' + id);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const top = target.getBoundingClientRect().top + window.pageYOffset - 8;
          smoothScrollTo(top, undefined, () => flashElement(target));
          try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
        });
      });
    });
  }

  // ---------- Init ----------

  // B6: flash a row when it matches the page hash on load or hashchange.
  function flashHashRow() {
    const h = (location.hash || '').slice(1);
    if (!h) return;
    const id = decodeURIComponent(h);
    const el = document.getElementById(id);
    if (!el || !el.dataset || !el.dataset.decorated) return;
    // Expand parent H2/H3 so the row is actually visible.
    let p = el.previousElementSibling;
    let h3 = null, h2 = null;
    let cur = el;
    while (cur && cur !== mainEl) {
      let s = cur.previousElementSibling;
      while (s) {
        if (!h3 && s.tagName === 'H3') h3 = s;
        if (s.tagName === 'H2') { h2 = s; break; }
        s = s.previousElementSibling;
      }
      if (h2) break;
      cur = cur.parentElement;
    }
    if (h3) expandHeading(h3);
    if (h2) expandHeading(h2);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
        smoothScrollTo(top);
        el.classList.remove('row-flash');
        void el.offsetWidth;
        el.classList.add('row-flash');
        setTimeout(() => el.classList.remove('row-flash'), 1700);
      });
    });
  }

  // C2: W key wireframe easter egg.
  function setupWireframeEgg() {
    document.addEventListener('keydown', (ev) => {
      if (ev.key !== 'w' && ev.key !== 'W') return;
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      const t = ev.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      document.body.classList.toggle('wireframe');
    });
  }

  function init(data) {
    mainEl = document.querySelector('main') || document.body;
    decorate(data);
    buildUI();
    setupCollapsibleHeadings();
    setupTocAnimation();
    setupTocClickHandler();
    setupExpandAllButton();
    setupSeeAlsoClickHandler();
    setupScrollToTop();
    setupKeyboardNav();
    setupWireframeEgg();

    // B1: restore filter/search state from URL hash
    const restored = restoreStateFromHash();
    if (restored) {
      reflectStateInUI();
      hashWriteSuspended = true;
      applyFilters();
      hashWriteSuspended = false;
      const bar = document.getElementById('filter-bar');
      if (bar) bar.classList.remove('collapsed');
      // Open the chip-groups sub-section if any chip filter was restored.
      const chipsActive = active.category.size || active.license.size ||
        active.platform.size || active.workflow.size || active.output.size;
      if (bar && chipsActive && bar._setGroupsOpen) bar._setGroupsOpen(true);
    }

    window.addEventListener('popstate', () => {
      // Reset state, re-restore from hash, re-apply
      active.search = '';
      for (const g of HASH_GROUPS) active[g].clear();
      restoreStateFromHash();
      reflectStateInUI();
      hashWriteSuspended = true;
      applyFilters();
      hashWriteSuspended = false;
    });

    // B6: flash row matching hash on load + hashchange.
    flashHashRow();
    window.addEventListener('hashchange', flashHashRow);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  function start() {
    // Load entries + search index in parallel. The page is usable as soon as
    // entries arrive; search becomes available when the index finishes
    // loading + parsing (typically <300ms after).
    fetch(DATA_URL)
      .then(r => r.json())
      .then(data => {
        init(data);
        loadSearchIndex();
      })
      .catch(err => console.error('Filter init failed:', err));
  }

  function loadSearchIndex() {
    if (typeof MiniSearch === 'undefined') {
      console.warn('MiniSearch library not loaded; search disabled.');
      return;
    }
    const search = document.getElementById('filter-search');
    if (search) {
      search.placeholder = 'Loading search…';
      search.disabled = true;
    }
    fetch(SEARCH_INDEX_URL)
      .then(r => r.text())
      .then(json => {
        miniSearch = MiniSearch.loadJSON(json, {
          fields: ['name', 'nameSquashed', 'aliases', 'tags', 'subsection', 'description'],
          storeFields: ['id'],
          searchOptions: SEARCH_OPTS
        });
        if (search) {
          search.placeholder = 'Search resources…';
          search.disabled = false;
        }
        // If the user already typed something while we were loading, run it now.
        if (active.search) applyFilters();
      })
      .catch(err => {
        console.error('Search index load failed:', err);
        if (search) {
          search.placeholder = 'Search resources…';
          search.disabled = false;
        }
      });
  }
})();
