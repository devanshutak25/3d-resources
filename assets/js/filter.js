// Client-side filter for 3D Resources site.
// Reads data.json, decorates rendered README with data-attrs, renders filter UI.

(function () {
  'use strict';

  // location.hash / href fragments are user-controllable; a lone '%' throws URIError.
  function safeDecode(s) {
    try { return decodeURIComponent(s); } catch (e) { return s; }
  }

  const DATA_URL = '/data.json';
  const SEARCH_INDEX_URL = '/search-index.json';
  const HIGHLIGHT_CAP = 80; // only highlight top-N matching rows for perf
  const EXCLUDED_H2_IDS = new Set(['contents', 'contributing', 'footnotes', 'attribution']);
  const REPO_URL = 'https://github.com/devanshutak25/3d-resources';
  const ISSUES_URL = REPO_URL + '/issues';
  const SUGGEST_URL = REPO_URL + '/issues/new?template=suggest-resource.yml';
  const REPORT_URL = REPO_URL + '/issues/new?template=report-broken-link.yml';
  const MOBILE_MQ = '(max-width: 768px)';

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
  const TYPE_OPTIONS = ['software', 'plugin', 'tool', 'asset-source', 'marketplace', 'tutorial', 'channel', 'book', 'paper', 'reference', 'community', 'inspiration', 'service', 'hardware'];
  const TYPE_LABELS = {
    'software': 'Software', 'plugin': 'Plugin / add-on', 'tool': 'Tool', 'asset-source': 'Asset source',
    'marketplace': 'Marketplace', 'tutorial': 'Tutorial / course', 'channel': 'Channel', 'book': 'Book',
    'paper': 'Paper', 'reference': 'Reference', 'community': 'Community', 'inspiration': 'Inspiration',
    'service': 'Service', 'hardware': 'Hardware'
  };
  const LICENSE_OPTIONS = ['Open Source', 'Free', 'Free NC', 'Freemium', 'Paid', 'Mixed'];
  const LICENSE_LABELS = {
    'Open Source': 'Open source', 'Free': 'Free', 'Free NC': 'Free (non-commercial)',
    'Freemium': 'Free tier', 'Paid': 'Paid', 'Mixed': 'Mixed'
  };
  const SKILL_OPTIONS = ['beginner', 'intermediate', 'advanced'];
  const SKILL_LABELS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
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

  const GROUP_LABELS = {
    category: 'Category', type: 'Type', license: 'License', skill: 'Level',
    platform: 'OS / Platform', workflow: 'Workflow', output: 'Output'
  };
  const GROUP_HINTS = {
    category: 'Catalog section the resource is listed in.',
    type: 'What kind of resource it is: an app, a plugin, an asset site, a tutorial.',
    license: 'Cost and usage terms as recorded in the catalog. Asset licenses and software licenses differ; check the resource before commercial use.',
    skill: 'Learning level. Only set on educational resources.',
    platform: 'Operating system or runtime the resource runs on. Not the host 3D application.',
    workflow: 'Production stage the resource serves.',
    output: 'End medium the resource targets.'
  };
  const FACET_GROUPS = ['category', 'type', 'license', 'skill', 'platform', 'workflow', 'output'];
  const TAG_GROUPS = ['skill', 'platform', 'workflow', 'output'];

  const active = {
    search: '',
    category: new Set(),
    type: new Set(),
    license: new Set(),
    skill: new Set(),
    platform: new Set(),
    workflow: new Set(),
    output: new Set(),
    // Off by default: a filter only matches entries whose metadata says so.
    // On: entries with no recorded value for an active group also pass.
    includeUnspecified: false
  };

  let itemIndex = []; // [{ el, entry, urlKey, score, origIndex, h2, h3 }]
  let totalUnique = 0;
  let mainEl = null;
  let miniSearch = null;          // loaded MiniSearch instance (null until ready)
  let searchState = 'loading';    // 'loading' | 'ready' | 'unavailable'
  let lastSearching = false;      // tracks searching↔idle transitions for reorder
  const autoExpanded = new Set();           // headings auto-opened during search (§3)
  const headingOrigOrder = new WeakMap();   // h2/h3 -> int
  let tocHr = null;                         // the rule that closes the Contents block

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

  function isMobile() {
    return !!(window.matchMedia && window.matchMedia(MOBILE_MQ).matches);
  }

  // Nearest preceding H2/H3 of a top-level block. The README is flat: every
  // list/table follows its owning heading as a sibling inside <main>.
  function owningHeadings(el) {
    while (el && el.parentElement !== mainEl) el = el.parentElement;
    let h2 = null, h3 = null;
    for (let p = el && el.previousElementSibling; p; p = p.previousElementSibling) {
      if (!h3 && p.tagName === 'H3') h3 = p;
      if (p.tagName === 'H2') { h2 = p; break; }
    }
    return { h2, h3 };
  }

  function reportUrl(entry) {
    const params = new URLSearchParams();
    params.set('template', 'report-broken-link.yml');
    params.set('title', '[Broken] ' + (entry.name || ''));
    if (entry.name) params.set('name', entry.name);
    if (entry.url) params.set('url', entry.url);
    return REPO_URL + '/issues/new?' + params.toString();
  }

  function decorate(data) {
    const byUrl = new Map();
    for (const e of data.entries) {
      const key = normalizeUrl(e.url);
      if (!byUrl.has(key)) byUrl.set(key, []);
      byUrl.get(key).push(e);
    }
    totalUnique = byUrl.size;
    const sectionByAnchor = new Map((data.sections || []).map(s => [s.anchor, s.slug]));

    const usedIds = new Set();
    const anchors = mainEl.querySelectorAll('a[href]');
    let idx = 0;
    for (const a of anchors) {
      const candidates = byUrl.get(normalizeUrl(a.getAttribute('href')));
      if (!candidates) continue;
      let el = a;
      while (el && el !== mainEl && el.tagName !== 'LI' && el.tagName !== 'TR') {
        el = el.parentElement;
      }
      if (!el || el === mainEl) continue;
      if (el.dataset.decorated) continue;
      const owners = owningHeadings(el);
      const section = owners.h2 ? sectionByAnchor.get(owners.h2.id) : null;
      const matching = candidates.find(e => e.section === section) || candidates[0];
      // Whole software tables can also be mirrored without a dual_listed row.
      const entry = section ? { ...matching, section } : matching;
      el.dataset.decorated = '1';
      if (entry.license) el.dataset.license = entry.license;
      el.dataset.platform = (entry.tags.platform || []).join(' ');
      el.dataset.workflow = (entry.tags.workflow || []).join(' ');
      el.dataset.output = (entry.tags.output || []).join(' ');
      // Catalog context for analytics.js outbound_click. Filtering never reads
      // these; they exist so a click knows which entry it belongs to.
      if (entry.name) el.dataset.name = entry.name;
      if (entry.url) el.dataset.url = entry.url;
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
      link.setAttribute('aria-label', 'Copy link to ' + (entry.name || 'this item'));
      link.setAttribute('title', 'Copy link');
      link.textContent = '§';
      link.addEventListener('click', (ev) => {
        ev.stopPropagation();
        // Permalinks point at the canonical, unfiltered catalog.
        try { navigator.clipboard && navigator.clipboard.writeText(location.origin + location.pathname + '#' + rid); } catch (e) { /* noop */ }
      });
      if (el.tagName === 'TR') {
        const firstCell = typeof el.querySelector === 'function' ? el.querySelector('td') : null;
        if (firstCell) {
          firstCell.style.position = firstCell.style.position || 'relative';
          firstCell.insertBefore(link, firstCell.firstChild);
        }
      } else {
        el.insertBefore(link, el.firstChild);
      }
      // Compact summary: resource type after the name (bullet rows only; tables
      // already carry columns) and a quiet "report" action prefilled with the
      // entry identity so a broken link can be flagged without retyping it.
      if (a.parentNode && el.tagName === 'LI' && entry.entry_type) {
        const type = document.createElement('span');
        type.className = 'type-pill';
        type.textContent = entry.entry_type;
        a.parentNode.insertBefore(type, a.nextSibling);
      }
      if (a.parentNode) {
        const report = document.createElement('a');
        report.className = 'row-report no-ext-icon';
        report.href = reportUrl(entry);
        report.target = '_blank';
        report.rel = 'noopener noreferrer';
        report.textContent = 'report';
        report.setAttribute('title', 'Report a broken link or wrong details on GitHub');
        report.setAttribute('aria-label', 'Report a problem with ' + (entry.name || 'this item'));
        report.addEventListener('click', (ev) => ev.stopPropagation());
        if (el.tagName === 'TR') a.parentNode.appendChild(report);
        else el.appendChild(report);
      }
      itemIndex.push({
        el, entry,
        urlKey: normalizeUrl(entry.url),
        score: 0,
        origIndex: idx++,
        h2: owners.h2,
        h3: owners.h3
      });
    }

    // Capture heading original order for restoration on clear (§3, §4 reorder restore).
    let hidx = 0;
    for (const h of mainEl.querySelectorAll('h2, h3')) headingOrigOrder.set(h, hidx++);
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

  // An active facet only passes entries whose metadata explicitly matches.
  // Entries with no recorded value for that facet are excluded unless the
  // "include unspecified" toggle is on, so "Free" never quietly includes
  // entries whose license was never recorded.
  function matches(item) {
    if (active.search && item.score <= 0) return false;
    const entry = item.entry;
    if (active.category.size && !active.category.has(entry.section)) return false;
    if (active.type.size) {
      if (!entry.entry_type) { if (!active.includeUnspecified) return false; }
      else if (!active.type.has(entry.entry_type)) return false;
    }
    if (active.license.size) {
      if (!entry.license) { if (!active.includeUnspecified) return false; }
      else if (!active.license.has(entry.license)) return false;
    }
    const tags = entry.tags || {};
    for (const group of TAG_GROUPS) {
      if (!active[group].size) continue;
      const vals = tags[group] || [];
      if (!vals.length) {
        if (!active.includeUnspecified) return false;
        continue;
      }
      let ok = false;
      for (const v of active[group]) if (vals.includes(v)) { ok = true; break; }
      if (!ok) return false;
    }
    return true;
  }

  function facetCount() {
    let n = 0;
    for (const g of FACET_GROUPS) n += active[g].size;
    return n;
  }

  function anyFacetActive() { return facetCount() > 0; }

  function anyFilterActive() {
    return !!active.search || anyFacetActive();
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

  // Per-heading visible count + best score, computed once per apply from the
  // item index instead of re-walking DOM ranges for every heading.
  let headingStats = new Map(); // heading -> { visible, max }
  function computeHeadingStats() {
    headingStats = new Map();
    const bump = (h, visible, score) => {
      if (!h) return;
      let s = headingStats.get(h);
      if (!s) { s = { visible: 0, max: 0 }; headingStats.set(h, s); }
      if (visible) s.visible++;
      if (score > s.max) s.max = score;
    };
    for (const item of itemIndex) {
      const visible = item.el.style.display !== 'none';
      bump(item.h3, visible, item.score);
      bump(item.h2, visible, item.score);
    }
  }
  function statsFor(h) { return headingStats.get(h) || { visible: 0, max: 0 }; }

  function hideEmptySections() {
    resetSectionHiding();
    if (!anyFilterActive()) { syncToC(); return; }

    for (const h3 of mainEl.querySelectorAll('h3')) {
      if (statsFor(h3).visible) continue;
      hideRange(h3, rangeFromHeading(h3, 'H3'));
    }
    for (const h2 of mainEl.querySelectorAll('h2')) {
      if (EXCLUDED_H2_IDS.has(h2.id)) continue;
      if (statsFor(h2).visible) continue;
      hideRange(h2, rangeFromHeading(h2, 'H2'));
    }

    syncToC();
  }

  // §17: Dim non-matching ToC entries; keep clickable (no display:none). The
  // Contents block is hidden entirely while a query or facet is active, so
  // this mostly matters for the moment filters are cleared.
  function syncToC() {
    const contents = document.getElementById('contents');
    if (!contents) return;
    let n = contents.nextElementSibling;
    while (n && n.tagName !== 'H2') {
      if (n.tagName === 'DETAILS') {
        const sumA = n.querySelector(':scope > summary a[href^="#"]');
        if (sumA) {
          const targetId = safeDecode(sumA.getAttribute('href').slice(1));
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
          const tid = safeDecode(a.getAttribute('href').slice(1));
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

  // Results mode: while a query or facet is active the Contents block is
  // hidden so the first matching resource sits directly under the search box.
  function syncResultsMode() {
    const on = anyFilterActive();
    document.body.classList.toggle('results-mode', on);
    if (tocHr) tocHr.style.display = on ? 'none' : '';
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
          if (p.classList && (p.classList.contains('row-report') || p.classList.contains('type-pill'))) return NodeFilter.FILTER_REJECT;
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
      const frag = document.createDocumentFragment();
      for (const it of items) frag.appendChild(it.el);
      parent.appendChild(frag);
    }
    reorderSubcats(searching);
    reorderSections(searching);
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
          blocks.push({ h3: n, range, max: statsFor(n).max, orig: headingOrigOrder.get(n) ?? 0 });
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

  // Global ranking across sections: the section holding the best match comes
  // first while searching; document order is restored when the query clears.
  function reorderSections(searching) {
    const blocks = [];
    let anchor = null;
    for (const h2 of mainEl.querySelectorAll('h2')) {
      if (EXCLUDED_H2_IDS.has(h2.id)) continue;
      const range = rangeFromHeading(h2, 'H2');
      blocks.push({ h2, range, max: statsFor(h2).max, orig: headingOrigOrder.get(h2) ?? 0 });
      if (!anchor) anchor = h2.previousElementSibling;
    }
    if (blocks.length < 2 || !anchor) return;
    const sorted = blocks.slice().sort((a, b) => {
      if (searching && b.max !== a.max) return b.max - a.max;
      return a.orig - b.orig;
    });
    let cur = anchor;
    for (const block of sorted) {
      cur.parentElement.insertBefore(block.h2, cur.nextSibling);
      cur = block.h2;
      for (const r of block.range) {
        cur.parentElement.insertBefore(r, cur.nextSibling);
        cur = r;
      }
    }
  }

  // ---------- Hit count badges (§2) ----------

  function addOrUpdateHitBadges() {
    for (const b of mainEl.querySelectorAll('.hit-count')) b.remove();
    if (!active.search) return;
    for (const h3 of mainEl.querySelectorAll('h3')) {
      const count = statsFor(h3).visible;
      if (count > 0) {
        const span = document.createElement('span');
        span.className = 'hit-count';
        span.textContent = String(count);
        span.setAttribute('aria-label', count + ' matches');
        h3.appendChild(document.createTextNode(' '));
        h3.appendChild(span);
      }
    }
  }

  // ---------- Auto-expand subcats on hit (§2) ----------

  function autoExpandMatchingSubcats() {
    if (!active.search) return;
    for (const h3 of mainEl.querySelectorAll('h3')) {
      if (statsFor(h3).visible && h3.hasAttribute('data-collapsed')) {
        setCollapsed(h3, false);
        autoExpanded.add(h3);
      }
    }
  }

  // ---------- §7/§13 Empty state ----------

  // Count matches after a change to the active state, then put it back.
  function countWith(mutate) {
    const snapshot = {
      search: active.search,
      includeUnspecified: active.includeUnspecified
    };
    for (const g of FACET_GROUPS) snapshot[g] = new Set(active[g]);
    mutate();
    let count = 0;
    for (const item of itemIndex) if (matches(item)) count++;
    active.search = snapshot.search;
    active.includeUnspecified = snapshot.includeUnspecified;
    for (const g of FACET_GROUPS) active[g] = snapshot[g];
    return count;
  }

  function groupSummary(g) {
    return GROUP_LABELS[g] + ': ' + [...active[g]].map(v => labelFor(g, v)).join(', ');
  }

  // Deterministic recovery: every suggestion is a button that performs exactly
  // the change it names, and the count shown is the count that change yields.
  function updateEmptyState(visibleCount) {
    let node = document.getElementById('filter-empty-state');
    if (visibleCount > 0 || !anyFilterActive() || searchPending) {
      if (node) node.remove();
      return;
    }
    if (!node) {
      node = document.createElement('div');
      node.id = 'filter-empty-state';
      node.setAttribute('role', 'region');
      node.setAttribute('aria-label', 'No results');
      const bar = document.getElementById('filter-bar');
      if (bar && bar.parentElement) bar.parentElement.insertBefore(node, bar.nextSibling);
      else mainEl.insertBefore(node, mainEl.firstChild);
    }
    node.innerHTML = '';
    const head = document.createElement('p');
    head.className = 'empty-head';
    const parts = [];
    if (active.search) parts.push(`query "${active.search}"`);
    const fc = facetCount();
    if (fc) parts.push(`${fc} active filter${fc === 1 ? '' : 's'}`);
    head.innerHTML = `<strong>No results</strong> for ${escHtml(parts.join(' and '))}.`;
    node.appendChild(head);

    const suggestions = [];
    const addSuggestion = (label, count, run) => {
      if (count <= 0) return;
      suggestions.push({ label, count, run });
    };

    if (active.search && fc) {
      addSuggestion('Reset filters, keep search', countWith(() => { for (const g of FACET_GROUPS) active[g].clear(); }), () => {
        resetFacets();
      });
      addSuggestion('Clear search, keep filters', countWith(() => { active.search = ''; }), () => {
        setSearch('');
      });
    }
    if (fc) {
      for (const g of FACET_GROUPS) {
        if (!active[g].size) continue;
        const values = [...active[g]];
        addSuggestion('Remove ' + groupSummary(g), countWith(() => { active[g].clear(); }), () => {
          for (const v of values) setFacet(g, v, false);
        });
      }
      if (!active.includeUnspecified) {
        addSuggestion('Include entries with unspecified metadata', countWith(() => { active.includeUnspecified = true; }), () => {
          setIncludeUnspecified(true);
        });
      }
    }
    suggestions.sort((a, b) => b.count - a.count);

    if (suggestions.length) {
      const list = document.createElement('ul');
      list.className = 'empty-actions';
      for (const s of suggestions) {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'empty-action';
        btn.innerHTML = `${escHtml(s.label)} <span class="empty-count">${s.count} result${s.count === 1 ? '' : 's'}</span>`;
        btn.addEventListener('click', s.run);
        li.appendChild(btn);
        list.appendChild(li);
      }
      node.appendChild(list);
    } else if (active.search) {
      const p = document.createElement('p');
      p.textContent = 'Try a shorter or broader term, or a different spelling.';
      node.appendChild(p);
    }

    const foot = document.createElement('p');
    foot.className = 'empty-foot';
    foot.innerHTML = `Know a resource that belongs here? <a href="${SUGGEST_URL}" target="_blank" rel="noopener noreferrer">Suggest it on GitHub</a>.`;
    node.appendChild(foot);
  }

  function labelFor(group, value) {
    if (group === 'category') return CATEGORY_LABELS[value] || value;
    if (group === 'type') return TYPE_LABELS[value] || value;
    if (group === 'license') return LICENSE_LABELS[value] || value;
    if (group === 'skill') return SKILL_LABELS[value] || value;
    if (group === 'platform') return PLATFORM_LABELS[value] || value;
    if (group === 'workflow') return WORKFLOW_LABELS[value] || value;
    if (group === 'output') return OUTPUT_LABELS[value] || value;
    return value;
  }

  // ---------- URL state (query string) ----------
  //
  // Search + facets live in the query string (?q=…&license=…). The fragment
  // is reserved for the selected item or section, so a shared link can carry
  // both a filtered view and the row it points at.

  let urlWriteSuspended = false;

  function serializeStateToUrl(replace) {
    if (urlWriteSuspended) return;
    const params = new URLSearchParams();
    if (active.search) params.set('q', active.search);
    for (const g of FACET_GROUPS) {
      const set = active[g];
      if (set && set.size) params.set(g, [...set].join(','));
    }
    if (active.includeUnspecified && anyFacetActive()) params.set('unspecified', '1');
    const qs = params.toString();
    const url = location.pathname + (qs ? '?' + qs : '') + location.hash;
    try {
      if (replace) history.replaceState(null, '', url);
      else history.pushState(null, '', url);
    } catch (e) { /* noop */ }
  }

  function applyParams(params) {
    let any = false;
    if (params.has('q')) { active.search = (params.get('q') || '').trim().toLowerCase(); any = true; }
    for (const g of FACET_GROUPS) {
      if (!params.has(g)) continue;
      const vals = (params.get(g) || '').split(',').map(s => s.trim()).filter(Boolean);
      active[g] = new Set(vals);
      any = true;
    }
    if (params.get('unspecified') === '1') { active.includeUnspecified = true; any = true; }
    return any;
  }

  function restoreStateFromUrl() {
    let any = false;
    if (location.search && location.search.length > 1) {
      any = applyParams(new URLSearchParams(location.search.slice(1))) || any;
    }
    // Legacy links stored state in the fragment (#q=…&license=…). Honor them
    // once, then rewrite the URL into the query-string form.
    const h = location.hash || '';
    if (h.startsWith('#') && h.indexOf('=') !== -1) {
      const legacy = applyParams(new URLSearchParams(h.slice(1)));
      if (legacy) {
        any = true;
        try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* noop */ }
      }
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
    const unspecified = document.getElementById('filter-unspecified');
    if (unspecified) unspecified.checked = !!active.includeUnspecified;
  }

  // ---------- Analytics ----------
  // Events go through window.track3d (assets/js/analytics.js), which queues
  // until Mixpanel loads. Guarded: filter.js must keep working when
  // analytics.js is blocked by an extension or fails to load.

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
    out.include_unspecified = !!active.includeUnspecified;
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
      props.zero_results = lastVisibleCount === 0;
      props.search_state = searchState;
      track('search', props);
    }, SEARCH_SETTLE_MS);
  }

  // ---------- State mutators ----------
  // Every UI control routes through these so chips, active-filter pills, the
  // empty-state buttons and URL restore all stay consistent.

  function setFacet(group, value, on) {
    const set = active[group];
    if (on) set.add(value); else set.delete(value);
    const bar = document.getElementById('filter-bar');
    if (bar) {
      for (const chip of bar.querySelectorAll('.filter-chip')) {
        if (chip.dataset.group === group && chip.dataset.value === value) {
          chip.classList.toggle('active', on);
          chip.setAttribute('aria-pressed', on ? 'true' : 'false');
        }
      }
    }
    applyFilters._replaceUrl = false;
    applyFilters();
    const props = facetProps();
    props.group = group;
    props.value = value;
    props.action = on ? 'add' : 'remove';
    props.result_count = lastVisibleCount;
    props.has_query = !!active.search;
    track('filter_apply', props);
  }

  function setIncludeUnspecified(on) {
    active.includeUnspecified = !!on;
    const box = document.getElementById('filter-unspecified');
    if (box) box.checked = active.includeUnspecified;
    applyFilters._replaceUrl = false;
    applyFilters();
  }

  function setSearch(value) {
    active.search = String(value || '').trim().toLowerCase();
    const search = document.getElementById('filter-search');
    if (search) search.value = active.search;
    if (!active.search) {
      clearTimeout(searchSettleTimer);
      lastTrackedQuery = '';
    }
    applyFilters();
  }

  function resetFacets() {
    const before = facetProps();
    for (const g of FACET_GROUPS) active[g].clear();
    active.includeUnspecified = false;
    reflectStateInUI();
    applyFilters._replaceUrl = false;
    applyFilters();
    if (before.facet_count) track('filter_clear', before);
  }

  function resetAll() {
    const before = facetProps();
    before.had_query = !!active.search;
    active.search = '';
    for (const g of FACET_GROUPS) active[g].clear();
    active.includeUnspecified = false;
    clearTimeout(searchSettleTimer);
    lastTrackedQuery = '';
    reflectStateInUI();
    applyFilters._replaceUrl = false;
    applyFilters();
    if (before.facet_count || before.had_query) track('filter_clear', before);
  }

  // ---------- Apply ----------

  let searchPending = false; // query typed but no engine (loading / unavailable)

  function applyFilters() {
    clearHighlights();
    const wantSearch = !!active.search;
    const searching = wantSearch && !!miniSearch;
    searchPending = wantSearch && !searching;
    const scoreMap = searching ? runSearch(active.search) : null;
    if (searching && scoreMap) {
      for (const item of itemIndex) item.score = scoreMap.get(item.urlKey) || 0;
    } else {
      for (const item of itemIndex) item.score = 1;
    }

    let visibleCount = 0;
    const visibleUnique = new Set();
    const saveSearch = active.search;
    // Without an engine the query cannot be applied. Browse with facets only,
    // keep the Contents visible, and say so in the counter rather than
    // presenting the whole catalog as a match.
    if (searchPending) active.search = '';
    for (const item of itemIndex) {
      const show = matches(item);
      item.el.style.display = show ? '' : 'none';
      if (show) { visibleCount++; visibleUnique.add(item.urlKey); }
    }
    lastVisibleCount = visibleUnique.size;

    computeHeadingStats();
    reorderItems(searching);
    autoExpandMatchingSubcats();
    hideEmptySections();
    addOrUpdateHitBadges();
    if (searching) {
      const tokens = highlightTokens(active.search);
      if (tokens.length) highlightInVisible(tokens);
    }
    syncResultsMode();
    updateEmptyState(visibleCount);
    active.search = saveSearch;
    updateCounter(visibleUnique.size, visibleCount);
    updateActiveFilters();
    const toggle = document.getElementById('filter-toggle');
    if (toggle && toggle._sync) toggle._sync();
    syncSearchClearVisibility();
    scheduleStatusAnnouncement();
    serializeStateToUrl(applyFilters._replaceUrl !== false);
    applyFilters._replaceUrl = true;
  }

  function resourceWord(n) { return n === 1 ? 'resource' : 'resources'; }

  function updateCounter(unique, listings) {
    const counter = document.getElementById('filter-count');
    if (!counter) return;
    if (searchPending) {
      counter.textContent = searchState === 'unavailable' ? 'Search unavailable' : 'Search loading…';
      counter.removeAttribute('title');
      return;
    }
    if (anyFilterActive()) {
      counter.textContent = `${unique} ${resourceWord(unique)}`;
      counter.setAttribute('title', `${unique} unique of ${totalUnique}. ${listings} listings including cross-listed copies.`);
    } else {
      counter.textContent = `${totalUnique} ${resourceWord(totalUnique)}`;
      counter.setAttribute('title', `${listings} listings including cross-listed copies.`);
    }
    const show = document.getElementById('filter-show-results');
    if (show) show.textContent = `Show ${unique} ${resourceWord(unique)}`;
  }

  // Polite status for assistive tech, announced once after results settle.
  let statusTimer = 0;
  function scheduleStatusAnnouncement() {
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
      const status = document.getElementById('filter-status');
      if (!status) return;
      let text = '';
      if (searchPending) text = searchState === 'unavailable' ? 'Search is unavailable. Filters and browsing still work.' : 'Search is loading.';
      else if (anyFilterActive()) text = lastVisibleCount === 0 ? 'No results.' : `${lastVisibleCount} ${resourceWord(lastVisibleCount)} found.`;
      if (status.textContent !== text) status.textContent = text;
    }, 500);
  }

  // Removable pills for every active restriction, visible even when the chip
  // groups are collapsed or the drawer is closed.
  function updateActiveFilters() {
    const row = document.getElementById('filter-active');
    if (!row) return;
    row.innerHTML = '';
    const chips = [];
    for (const g of FACET_GROUPS) {
      for (const v of active[g]) chips.push({ g, v });
    }
    const hasAny = chips.length > 0 || (active.includeUnspecified && anyFacetActive());
    row.hidden = !hasAny;
    const clear = document.getElementById('filter-clear');
    if (clear) clear.hidden = !anyFilterActive();
    if (!hasAny) return;
    const lab = document.createElement('span');
    lab.className = 'filter-active-label';
    lab.textContent = 'Active:';
    row.appendChild(lab);
    for (const { g, v } of chips) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'active-chip';
      btn.innerHTML = `<span class="active-chip-group">${escHtml(GROUP_LABELS[g])}</span> ${escHtml(labelFor(g, v))} <span aria-hidden="true">×</span>`;
      btn.setAttribute('aria-label', `Remove filter ${GROUP_LABELS[g]}: ${labelFor(g, v)}`);
      btn.addEventListener('click', () => setFacet(g, v, false));
      row.appendChild(btn);
    }
    if (active.includeUnspecified && anyFacetActive()) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'active-chip';
      btn.innerHTML = `Including unspecified <span aria-hidden="true">×</span>`;
      btn.setAttribute('aria-label', 'Stop including entries with unspecified metadata');
      btn.addEventListener('click', () => setIncludeUnspecified(false));
      row.appendChild(btn);
    }
    if (chips.length > 1) {
      const reset = document.createElement('button');
      reset.type = 'button';
      reset.className = 'active-chip active-chip-reset';
      reset.textContent = 'Reset filters';
      reset.addEventListener('click', resetFacets);
      row.appendChild(reset);
    }
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
      setFacet(group, value, !active[group].has(value));
    });
    return btn;
  }

  function makeGroup(bar, group, options, labelMap, hint) {
    const row = document.createElement('div');
    row.className = 'filter-row';
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', GROUP_LABELS[group]);
    const lab = document.createElement('span');
    lab.className = 'filter-label';
    lab.textContent = GROUP_LABELS[group];
    if (GROUP_HINTS[group]) lab.setAttribute('title', GROUP_HINTS[group]);
    row.appendChild(lab);
    const chips = document.createElement('div');
    chips.className = 'filter-chips';
    for (const v of options) chips.appendChild(makeChip(group, v, labelMap ? (labelMap[v] || v) : v));
    if (hint) {
      const small = document.createElement('small');
      small.className = 'filter-hint';
      small.textContent = hint;
      chips.appendChild(small);
    }
    row.appendChild(chips);
    bar.appendChild(row);
  }

  // ---------- Mobile filter drawer (managed dialog) ----------

  const drawer = { open: false, lastFocus: null, inerted: [] };

  function focusableIn(root) {
    return Array.from(root.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'
    )).filter(el => el.offsetParent !== null || el === document.activeElement);
  }

  // Make everything outside `el` inert so Tab and assistive tech stay inside
  // the open drawer. Records what it touched so close() can undo exactly that.
  function setInertOutside(el) {
    drawer.inerted = [];
    let node = el;
    while (node && node.parentElement && node !== document.body) {
      for (const sib of node.parentElement.children) {
        if (sib === node || sib.hasAttribute('inert')) continue;
        sib.setAttribute('inert', '');
        drawer.inerted.push(sib);
      }
      node = node.parentElement;
    }
  }

  function clearInert() {
    for (const el of drawer.inerted) el.removeAttribute('inert');
    drawer.inerted = [];
  }

  function openDrawer() {
    const panel = document.getElementById('filter-panel');
    const toggle = document.getElementById('filter-toggle');
    if (!panel || drawer.open) return;
    drawer.open = true;
    drawer.lastFocus = document.activeElement;
    panel.classList.add('open');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'filter-panel-title');
    document.body.classList.add('filter-drawer-open');
    setInertOutside(panel);
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
    const close = document.getElementById('filter-panel-close');
    requestAnimationFrame(() => { if (close) close.focus(); });
  }

  function closeDrawer(restoreFocus) {
    const panel = document.getElementById('filter-panel');
    const toggle = document.getElementById('filter-toggle');
    if (!panel || !drawer.open) return;
    drawer.open = false;
    panel.classList.remove('open');
    panel.removeAttribute('role');
    panel.removeAttribute('aria-modal');
    panel.removeAttribute('aria-labelledby');
    document.body.classList.remove('filter-drawer-open');
    clearInert();
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    if (restoreFocus !== false) {
      const target = toggle || drawer.lastFocus;
      if (target) try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
    }
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
    bar.setAttribute('aria-label', 'Search and filter the catalog');

    const header = document.createElement('div');
    header.className = 'filter-header';

    const title = document.createElement('div');
    title.className = 'filter-title';
    title.textContent = 'Find a resource';
    header.appendChild(title);

    // Trigger: on desktop it collapses the whole bar into a pill; on mobile it
    // opens the filter drawer. Search itself stays visible in both cases.
    const toggle = document.createElement('button');
    toggle.id = 'filter-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-controls', 'filter-panel');
    toggle.setAttribute('aria-expanded', 'false');
    const toggleIcon = document.createElement('i');
    toggleIcon.setAttribute('aria-hidden', 'true');
    const toggleLabel = document.createElement('span');
    toggleLabel.id = 'filter-toggle-label';
    toggleLabel.textContent = 'Filters';
    const toggleBadge = document.createElement('span');
    toggleBadge.id = 'filter-toggle-badge';
    toggleBadge.hidden = true;
    toggle.appendChild(toggleIcon);
    toggle.appendChild(toggleLabel);
    toggle.appendChild(toggleBadge);
    const syncToggle = () => {
      const collapsed = bar.classList.contains('collapsed');
      const n = facetCount();
      let name;
      if (collapsed) name = n ? 'filter-menu' : 'filter-menu-outline';
      else name = n ? 'filter' : 'filter-outline';
      toggleIcon.className = `mdi mdi-${name}`;
      toggleBadge.textContent = String(n);
      toggleBadge.hidden = n === 0;
      const expanded = isMobile() ? drawer.open : !collapsed;
      toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      toggle.setAttribute('aria-label', (collapsed ? 'Show search and filters' : (isMobile() ? 'Open filters' : 'Hide search and filters')) + (n ? `, ${n} active` : ''));
    };
    toggle._sync = syncToggle;
    toggle.addEventListener('click', () => {
      if (isMobile()) {
        if (drawer.open) closeDrawer(); else openDrawer();
      } else {
        bar.classList.toggle('collapsed');
      }
      syncToggle();
    });

    header.appendChild(toggle);
    bar.appendChild(header);

    const top = document.createElement('div');
    top.className = 'filter-top';

    const search = document.createElement('input');
    search.type = 'search';
    search.placeholder = 'Search resources, e.g. HDRIs or Houdini tutorials';
    search.id = 'filter-search';
    search.setAttribute('aria-label', 'Search resources');
    search.setAttribute('autocomplete', 'off');
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
      // §3: do NOT recollapse autoExpanded subcats.
      setSearch('');
      search.focus();
    });
    top.appendChild(searchClear);

    const counter = document.createElement('span');
    counter.id = 'filter-count';
    counter.textContent = `${totalUnique} ${resourceWord(totalUnique)}`;
    top.appendChild(counter);

    const clear = document.createElement('button');
    clear.id = 'filter-clear';
    clear.type = 'button';
    clear.textContent = 'Reset all';
    clear.hidden = true;
    clear.addEventListener('click', resetAll);
    top.appendChild(clear);

    bar.appendChild(top);

    // Search engine availability notice (loading / unavailable + retry).
    const notice = document.createElement('div');
    notice.id = 'filter-search-notice';
    notice.hidden = true;
    bar.appendChild(notice);

    // Active restrictions, always visible.
    const activeRow = document.createElement('div');
    activeRow.id = 'filter-active';
    activeRow.hidden = true;
    bar.appendChild(activeRow);

    // The panel holds the chip groups. On mobile it becomes a managed dialog.
    const panel = document.createElement('div');
    panel.id = 'filter-panel';

    const panelHead = document.createElement('div');
    panelHead.className = 'filter-panel-head';
    const panelTitle = document.createElement('span');
    panelTitle.id = 'filter-panel-title';
    panelTitle.textContent = 'Filters';
    const panelClose = document.createElement('button');
    panelClose.id = 'filter-panel-close';
    panelClose.type = 'button';
    panelClose.setAttribute('aria-label', 'Close filters');
    panelClose.innerHTML = '<i class="mdi mdi-close" aria-hidden="true"></i>';
    panelClose.addEventListener('click', () => closeDrawer());
    panelHead.appendChild(panelTitle);
    panelHead.appendChild(panelClose);
    panel.appendChild(panelHead);

    // Chip groups live behind their own collapsed-by-default sub-toggle on
    // desktop so the open panel stays compact.
    const groupsToggle = document.createElement('button');
    groupsToggle.id = 'filter-groups-toggle';
    groupsToggle.className = 'filter-groups-toggle';
    groupsToggle.type = 'button';
    groupsToggle.setAttribute('aria-expanded', 'false');
    groupsToggle.innerHTML = '<span>Filter by type, category, license, level…</span><i class="mdi mdi-chevron-down" aria-hidden="true"></i>';
    panel.appendChild(groupsToggle);

    const groups = document.createElement('div');
    groups.className = 'filter-chip-groups collapsed';
    groupsToggle.setAttribute('aria-controls', 'filter-chip-groups');
    groups.id = 'filter-chip-groups';
    makeGroup(groups, 'type', TYPE_OPTIONS, TYPE_LABELS);
    makeGroup(groups, 'category', CATEGORY_OPTIONS, CATEGORY_LABELS);
    makeGroup(groups, 'license', LICENSE_OPTIONS, LICENSE_LABELS,
      'As recorded in the catalog. Asset licenses and software licenses differ; check before commercial use.');
    makeGroup(groups, 'skill', SKILL_OPTIONS, SKILL_LABELS, 'Set on learning resources only.');

    const more = document.createElement('details');
    more.className = 'filter-more';
    const moreSummary = document.createElement('summary');
    moreSummary.textContent = 'More filters: OS, workflow, output';
    more.appendChild(moreSummary);
    makeGroup(more, 'platform', PLATFORM_OPTIONS, PLATFORM_LABELS, 'Operating system or runtime, not the host 3D app.');
    makeGroup(more, 'workflow', WORKFLOW_OPTIONS, WORKFLOW_LABELS);
    makeGroup(more, 'output', OUTPUT_OPTIONS, OUTPUT_LABELS);
    groups.appendChild(more);

    const unspecifiedLabel = document.createElement('label');
    unspecifiedLabel.className = 'filter-unspecified';
    const unspecified = document.createElement('input');
    unspecified.type = 'checkbox';
    unspecified.id = 'filter-unspecified';
    unspecified.addEventListener('change', () => setIncludeUnspecified(unspecified.checked));
    unspecifiedLabel.appendChild(unspecified);
    unspecifiedLabel.appendChild(document.createTextNode(' Include entries with no recorded value for an active filter'));
    groups.appendChild(unspecifiedLabel);

    panel.appendChild(groups);

    const panelFoot = document.createElement('div');
    panelFoot.className = 'filter-panel-foot';
    const showResults = document.createElement('button');
    showResults.id = 'filter-show-results';
    showResults.type = 'button';
    showResults.textContent = `Show ${totalUnique} ${resourceWord(totalUnique)}`;
    showResults.addEventListener('click', () => closeDrawer());
    const resetBtn = document.createElement('button');
    resetBtn.id = 'filter-panel-reset';
    resetBtn.type = 'button';
    resetBtn.textContent = 'Reset filters';
    resetBtn.addEventListener('click', resetFacets);
    panelFoot.appendChild(resetBtn);
    panelFoot.appendChild(showResults);
    panel.appendChild(panelFoot);

    // Focus containment while the drawer is open.
    panel.addEventListener('keydown', (ev) => {
      if (!drawer.open || ev.key !== 'Tab') return;
      const items = focusableIn(panel);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    });

    bar.appendChild(panel);

    const status = document.createElement('div');
    status.id = 'filter-status';
    status.className = 'sr-only';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    bar.appendChild(status);

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

    // Locate the rule that closes the Contents block so results mode can hide it.
    if (contents) {
      for (let n = contents.nextElementSibling; n && n.tagName !== 'H2'; n = n.nextElementSibling) {
        if (n.tagName === 'HR') { tocHr = n; break; }
      }
    }

    // §16: no localStorage of expand/filters/query — fresh defaults every visit.
    // Desktop: panel open with chip groups behind the sub-toggle. Mobile: the
    // bar is never collapsed (search stays inline); chips live in the drawer.
    syncToggle();
    if (window.matchMedia) {
      const mq = window.matchMedia(MOBILE_MQ);
      const onChange = () => {
        if (mq.matches) bar.classList.remove('collapsed');
        else closeDrawer(false);
        syncToggle();
      };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }

    // §12 Mobile: section selector.
    buildMobileTocJump();
  }

  function headingTitle(h) {
    const clone = h.cloneNode(true);
    for (const junk of clone.querySelectorAll('.edit-on-gh, .hit-count, .section-icon, .heading-toggle-icon')) junk.remove();
    return clone.textContent.replace(/\s+/g, ' ').trim();
  }

  function buildMobileTocJump() {
    const contents = document.getElementById('contents');
    if (!contents) return;
    const sel = document.createElement('select');
    sel.id = 'mobile-toc-jump';
    sel.setAttribute('aria-label', 'Browse category');
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Browse category…';
    sel.appendChild(placeholder);
    for (const h2 of mainEl.querySelectorAll('h2')) {
      if (EXCLUDED_H2_IDS.has(h2.id)) continue;
      const opt = document.createElement('option');
      opt.value = '#' + h2.id;
      opt.textContent = headingTitle(h2);
      sel.appendChild(opt);
    }
    sel.addEventListener('change', () => {
      const v = sel.value;
      if (!v) return;
      const id = v.slice(1);
      const target = document.getElementById(id);
      if (target) {
        expandHeading(target);
        history.pushState(null, '', v);
        const top = target.getBoundingClientRect().top + window.pageYOffset - stickyTopOffset();
        smoothScrollTo(top);
        focusHeading(target);
      }
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
    void targets[0].offsetHeight;
    for (const el of targets) {
      el.style.transition = `max-height ${ANIM_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      el.style.maxHeight = '0px';
    }
    setTimeout(() => {
      for (const el of targets) {
        // A reopen during the tween wins; do not hide what was just reopened.
        if (!el.hasAttribute('data-user-collapsed')) { clearAnim(el); continue; }
        el.style.display = 'none';
        clearAnim(el);
      }
    }, ANIM_MS + 30);
  }

  function animateOpen(range) {
    const targets = range.filter(el => !el.hasAttribute('data-hidden-by-filter'));
    if (!targets.length) return;
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

  function setExpandedAttr(heading, expanded) {
    const btn = heading._toggle;
    if (btn) btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  }

  function setCollapsed(heading, collapsed, animate) {
    const level = heading.tagName;
    const range = rangeFromHeading(heading, level);
    if (collapsed) {
      heading.setAttribute('data-collapsed', 'true');
      for (const el of range) el.setAttribute('data-user-collapsed', '1');
      if (animate) {
        animateClose(range);
      } else {
        for (const el of range) {
          if (!el.hasAttribute('data-hidden-by-filter')) el.style.display = 'none';
        }
      }
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
    setExpandedAttr(heading, !collapsed);
  }

  // Headings stay headings. A real <button> inside each one carries the
  // toggle: it is in the normal tab order, exposes aria-expanded, and Enter or
  // Space activate it natively. The heading itself keeps tabindex="-1" only
  // as a programmatic scroll/focus target for ToC links.
  function setupCollapsibleHeadings() {
    const headings = mainEl.querySelectorAll('h2, h3');
    const hashTarget = (location.hash && location.hash.length > 1)
      ? safeDecode(location.hash.slice(1)) : null;
    for (const h of headings) {
      if (h.tagName === 'H2' && EXCLUDED_H2_IDS.has(h.id)) continue;
      h.classList.add('collapsible-heading');
      h.removeAttribute('role');
      h.setAttribute('tabindex', '-1');

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'heading-toggle';
      const chevron = document.createElement('span');
      chevron.className = 'heading-toggle-icon';
      chevron.setAttribute('aria-hidden', 'true');
      chevron.textContent = '▾';
      btn.appendChild(chevron);
      // Move the heading's own content (icon + text) into the button, leaving
      // side controls such as the Edit link outside it.
      const keep = [];
      for (const child of Array.from(h.childNodes)) {
        if (child.nodeType === 1 && child.classList && child.classList.contains('edit-on-gh')) { keep.push(child); continue; }
        btn.appendChild(child);
      }
      h.appendChild(btn);
      for (const k of keep) h.appendChild(k);
      h._toggle = btn;

      // §1: H2 open by default; H3 closed by default.
      if (h.tagName === 'H2') {
        setExpandedAttr(h, true);
      } else if (h.id !== hashTarget) {
        setCollapsed(h, true);
      } else {
        setExpandedAttr(h, true);
      }
      btn.addEventListener('click', (ev) => {
        if (ev.target && ev.target.closest && ev.target.closest('a')) return;
        const nowCollapsed = !h.hasAttribute('data-collapsed');
        setCollapsed(h, nowCollapsed, true);
        autoExpanded.delete(h);
      });
    }
  }

  function focusHeading(h) {
    const target = (h && h._toggle) || h;
    if (!target) return;
    try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
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
    if (h.tagName === 'H3') expandHeading(findPrevH2(h));
    if (h.hasAttribute('data-collapsed')) setCollapsed(h, false);
  }

  // Height of the sticky filter panel as it sits pinned at the top of the
  // viewport, plus a small gap. Used to offset in-page scroll targets so a
  // heading doesn't land underneath the pinned search box.
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

  // §17 ToC click: keep filters, expand target, jump.
  function setupTocClickHandler() {
    const contents = document.getElementById('contents');
    if (!contents) return;
    for (let n = contents.nextElementSibling; n && n.tagName !== 'H2'; n = n.nextElementSibling) {
      if (n.tagName !== 'DETAILS') continue;
      const details = n;
      details.addEventListener('click', (ev) => {
        const a = ev.target.closest && ev.target.closest('a[href^="#"]');
        if (!a || !details.contains(a)) return;
        const id = safeDecode(a.getAttribute('href').slice(1));
        const target = document.getElementById(id);
        if (!target) return;
        ev.preventDefault();

        const bar = document.getElementById('filter-bar');
        if (bar && bar._setGroupsOpen) bar._setGroupsOpen(false);

        expandHeading(target);
        history.pushState(null, '', '#' + id);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const top = target.getBoundingClientRect().top + window.pageYOffset - stickyTopOffset();
            smoothScrollTo(top);
            focusHeading(target);
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
          if (h.hasAttribute('data-collapsed')) setCollapsed(h, false);
        } else if (h.tagName === 'H3') {
          if (!h.hasAttribute('data-collapsed')) setCollapsed(h, true);
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
    let n = el;
    while (n && n !== mainEl) {
      if (n.style && n.style.display === 'none') return false;
      n = n.parentElement;
    }
    return el.offsetParent !== null || el.tagName === 'H2' || el.tagName === 'H3';
  }

  // Focusable catalog stops in document order: heading toggle buttons and rows.
  function getNavList() {
    const list = [];
    const all = mainEl.querySelectorAll('h2, h3, [data-decorated]');
    for (const el of all) {
      if (el.tagName === 'H2' && EXCLUDED_H2_IDS.has(el.id)) continue;
      if (el.hasAttribute('data-hidden-by-filter')) continue;
      if (!isVisibleNow(el)) continue;
      list.push(el._toggle || el);
    }
    return list;
  }

  function headingOf(el) {
    if (!el) return null;
    if (el.tagName === 'H2' || el.tagName === 'H3') return el;
    if (el.classList && el.classList.contains('heading-toggle')) return el.parentElement;
    return null;
  }

  function openRow(row) {
    const url = row.dataset && row.dataset.url;
    let href = url;
    if (!href) {
      const a = row.querySelector('a[href^="http"]:not(.repo-pill):not(.row-report)');
      if (a) href = a.getAttribute('href');
    }
    if (href) window.open(href, '_blank', 'noopener,noreferrer');
  }

  function setupKeyboardNav() {
    document.addEventListener('keydown', (ev) => {
      const target = ev.target;
      const tag = target && target.tagName;
      const inField = target && (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable);
      const search = document.getElementById('filter-search');

      // '/' or Cmd-K / Ctrl-K → focus search
      if (!inField && ev.key === '/') {
        ev.preventDefault(); if (search) search.focus(); return;
      }
      if ((ev.metaKey || ev.ctrlKey) && (ev.key === 'k' || ev.key === 'K')) {
        ev.preventDefault(); if (search) search.focus(); return;
      }

      // Esc → close the topmost overlay first, then clear search.
      if (ev.key === 'Escape') {
        if (drawer.open) { ev.preventDefault(); closeDrawer(); return; }
        if (search && active.search && (target === search || !inField)) {
          ev.preventDefault();
          setSearch('');
          search.focus();
          return;
        }
      }

      if (inField) return; // never fight native controls

      // Arrow navigation only acts while focus is already on a catalog stop
      // (a heading toggle or a resource row). Elsewhere arrows scroll the page.
      const focused = document.activeElement;
      const list = getNavList();
      let idx = list.indexOf(focused);
      if (idx < 0) return;

      if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        idx = Math.min(list.length - 1, idx + 1);
        list[idx].focus();
        return;
      }
      if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        idx = Math.max(0, idx - 1);
        list[idx].focus();
        return;
      }
      const heading = headingOf(focused);
      if (ev.key === 'ArrowRight' && heading) {
        if (heading.hasAttribute('data-collapsed')) {
          ev.preventDefault();
          setCollapsed(heading, false, true);
        }
        return;
      }
      if (ev.key === 'ArrowLeft' && heading) {
        if (!heading.hasAttribute('data-collapsed') && !EXCLUDED_H2_IDS.has(heading.id)) {
          ev.preventDefault();
          setCollapsed(heading, true, true);
        }
        return;
      }
      if (ev.key === 'Enter' && focused && (focused.tagName === 'LI' || focused.tagName === 'TR') && focused.dataset.decorated) {
        ev.preventDefault();
        openRow(focused);
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
      const id = safeDecode(a.getAttribute('href').slice(1));
      const target = document.getElementById(id);
      if (!target) return;
      ev.preventDefault();
      expandHeading(target);
      history.pushState(null, '', '#' + id);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const top = target.getBoundingClientRect().top + window.pageYOffset - 8;
          smoothScrollTo(top, undefined, () => flashElement(target));
          focusHeading(target);
        });
      });
    });
  }

  // ---------- Init ----------

  // B6: flash a row when it matches the page hash on load or hashchange.
  function flashHashRow() {
    const h = (location.hash || '').slice(1);
    if (!h || h.indexOf('=') !== -1) return;
    const id = safeDecode(h);
    const el = document.getElementById(id);
    if (!el || !el.dataset || !el.dataset.decorated) return;
    const owners = owningHeadings(el);
    if (owners.h3) expandHeading(owners.h3);
    if (owners.h2) expandHeading(owners.h2);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
        smoothScrollTo(top);
        flashElement(el);
      });
    });
  }

  // C2: W key wireframe easter egg.
  function setupWireframeEgg() {
    document.addEventListener('keydown', (ev) => {
      if (ev.key !== 'w' && ev.key !== 'W') return;
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      const t = ev.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
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

    // Restore filter/search state from the URL.
    const restored = restoreStateFromUrl();
    if (restored) {
      reflectStateInUI();
      urlWriteSuspended = true;
      applyFilters();
      urlWriteSuspended = false;
      const bar = document.getElementById('filter-bar');
      if (bar && !isMobile()) bar.classList.remove('collapsed');
      // Open the chip-groups sub-section if any chip filter was restored.
      if (bar && anyFacetActive() && bar._setGroupsOpen) bar._setGroupsOpen(true);
      const toggle = document.getElementById('filter-toggle');
      if (toggle && toggle._sync) toggle._sync();
    }

    window.addEventListener('popstate', () => {
      active.search = '';
      for (const g of FACET_GROUPS) active[g].clear();
      active.includeUnspecified = false;
      restoreStateFromUrl();
      reflectStateInUI();
      urlWriteSuspended = true;
      applyFilters();
      urlWriteSuspended = false;
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

  // Visible failure state when the catalog index itself cannot load: the
  // static page still works, but search and filters do not.
  function showDataFailure(err) {
    console.error('Filter init failed:', err);
    const shell = document.getElementById('filter-shell');
    if (!shell) return;
    shell.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'filter-noscript-notice';
    p.setAttribute('role', 'alert');
    p.textContent = 'Search and filters could not load. The table of contents below still works. ';
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'filter-retry';
    retry.textContent = 'Retry';
    retry.addEventListener('click', () => { retry.disabled = true; start(); });
    p.appendChild(retry);
    shell.appendChild(p);
  }

  function fetchIndex() {
    return fetch(SEARCH_INDEX_URL).then(r => {
      if (!r.ok) throw new Error('search index HTTP ' + r.status);
      return r.text();
    });
  }

  function start() {
    // Entries and the search index load in parallel. The page is usable as
    // soon as entries arrive; search becomes available when the index finishes.
    const indexPromise = fetchIndex();
    indexPromise.catch(() => { /* handled in loadSearchIndex */ });
    fetch(DATA_URL)
      .then(r => {
        if (!r.ok) throw new Error('data.json HTTP ' + r.status);
        return r.json();
      })
      .then(data => {
        init(data);
        loadSearchIndex(indexPromise);
      })
      .catch(showDataFailure);
  }

  function setSearchState(state, message) {
    searchState = state;
    const search = document.getElementById('filter-search');
    const notice = document.getElementById('filter-search-notice');
    if (search) {
      search.disabled = false;
      search.placeholder = state === 'loading'
        ? 'Search loading… you can type now'
        : 'Search resources, e.g. HDRIs or Houdini tutorials';
      search.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false');
    }
    if (notice) {
      notice.innerHTML = '';
      notice.hidden = state !== 'unavailable';
      if (state === 'unavailable') {
        notice.setAttribute('role', 'alert');
        const span = document.createElement('span');
        span.textContent = (message || 'Search is unavailable right now.') + ' Filters and browsing by section still work. ';
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.className = 'filter-retry';
        retry.textContent = 'Retry search';
        retry.addEventListener('click', () => loadSearchIndex(fetchIndex()));
        notice.appendChild(span);
        notice.appendChild(retry);
      }
    }
    // Re-run so the counter and rows reflect the new engine state.
    if (itemIndex.length) { urlWriteSuspended = true; applyFilters(); urlWriteSuspended = false; }
  }

  function loadSearchIndex(indexPromise) {
    if (typeof MiniSearch === 'undefined') {
      setSearchState('unavailable', 'The search library did not load.');
      return;
    }
    setSearchState('loading');
    (indexPromise || fetchIndex())
      .then(json => {
        miniSearch = MiniSearch.loadJSON(json, {
          fields: ['name', 'nameSquashed', 'aliases', 'tags', 'subsection', 'description'],
          storeFields: ['id'],
          searchOptions: SEARCH_OPTS
        });
        setSearchState('ready');
      })
      .catch(err => {
        console.error('Search index load failed:', err);
        miniSearch = null;
        setSearchState('unavailable', 'The search index could not be loaded.');
      });
  }
})();
