// Client-side filter for 3D Resources site.
// Reads data.json, decorates rendered README with data-attrs, renders filter UI.

(function () {
  'use strict';

  const DATA_URL = '/data.json';
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
  const LICENSE_OPTIONS = ['Open Source', 'Free', 'Free NC', 'Freemium', 'Paid'];
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

  let itemIndex = []; // [{ el, entry, title, desc, tagsText, score, origIndex }]
  let mainEl = null;
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

  function decorate(data) {
    const byUrl = new Map();
    for (const e of data.entries) byUrl.set(normalizeUrl(e.url), e);

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
      el.setAttribute('tabindex', '0');
      const tagsAll = []
        .concat(entry.tags.platform || [])
        .concat(entry.tags.workflow || [])
        .concat(entry.tags.output || [])
        .concat(entry.tags.tech || [])
        .concat(entry.tags.skill || [])
        .concat(entry.readme_tags || []);
      itemIndex.push({
        el, entry,
        title: (entry.name || '').toLowerCase(),
        desc: (entry.description || '').toLowerCase(),
        tagsText: tagsAll.join(' ').toLowerCase(),
        score: 0,
        origIndex: idx++
      });
    }

    // Capture H3 original order for restoration on clear (§3, §4 reorder restore).
    let hidx = 0;
    for (const h of mainEl.querySelectorAll('h3')) headingOrigOrder.set(h, hidx++);
  }

  // ---------- §4 Search ranking & fuzziness ----------

  function tokenize(q) {
    return q.toLowerCase().split(/\s+/).filter(Boolean);
  }

  function levCap1(a, b) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > 1) return 2;
    if (a.length === b.length) {
      let d = 0;
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) { d++; if (d > 1) return 2; }
      }
      return d;
    }
    const [s, l] = a.length < b.length ? [a, b] : [b, a];
    let i = 0, j = 0, d = 0;
    while (i < s.length && j < l.length) {
      if (s[i] === l[j]) { i++; j++; }
      else { d++; if (d > 1) return 2; j++; }
    }
    return d + (l.length - j);
  }

  function fieldScore(field, tokens) {
    if (!field || !tokens.length) return 0;
    let total = 0;
    const words = field.split(/[^a-z0-9]+/);
    for (const tk of tokens) {
      if (field.indexOf(tk) !== -1) { total += 1; continue; }
      if (tk.length >= 4) {
        let best = 99;
        for (const w of words) {
          if (!w || Math.abs(w.length - tk.length) > 1) continue;
          const d = levCap1(w, tk);
          if (d < best) { best = d; if (best === 0) break; }
        }
        if (best <= 1) total += 0.5;
      }
    }
    return total;
  }

  function scoreItem(item, tokens) {
    if (!tokens.length) return 1;
    return fieldScore(item.title, tokens) * 3
         + fieldScore(item.tagsText, tokens) * 2
         + fieldScore(item.desc, tokens) * 1;
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
    for (const item of itemIndex) {
      if (item.el.style.display === 'none') continue;
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
    const groups = new Map();
    for (const item of itemIndex) {
      const p = item.el.parentElement;
      if (!p) continue;
      if (!groups.has(p)) groups.set(p, []);
      groups.get(p).push(item);
    }
    for (const [parent, items] of groups) {
      const sorted = items.slice().sort((a, b) => {
        if (searching && b.score !== a.score) return b.score - a.score;
        return a.origIndex - b.origIndex;
      });
      for (const it of sorted) parent.appendChild(it.el);
    }
    reorderSubcats(searching);
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

  // ---------- Apply ----------

  function applyFilters() {
    clearHighlights();
    const tokens = tokenize(active.search);
    for (const item of itemIndex) item.score = scoreItem(item, tokens);

    let visibleCount = 0;
    for (const item of itemIndex) {
      const show = matches(item);
      item.el.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    }

    reorderItems(tokens.length > 0);
    autoExpandMatchingSubcats();
    hideEmptySections();
    addOrUpdateHitBadges();
    if (tokens.length) highlightInVisible(tokens);
    updateEmptyState(visibleCount);

    const counter = document.getElementById('filter-count');
    if (counter) counter.textContent = `${visibleCount} / ${itemIndex.length}`;
    const toggle = document.getElementById('filter-toggle');
    if (toggle && toggle._setIcon) toggle._setIcon();
    syncSearchClearVisibility();
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
    btn.addEventListener('click', () => {
      const set = active[group];
      if (set.has(value)) { set.delete(value); btn.classList.remove('active'); }
      else { set.add(value); btn.classList.add('active'); }
      applyFilters();
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
    const bar = document.createElement('div');
    bar.id = 'filter-bar';
    bar.setAttribute('role', 'search');

    const header = document.createElement('div');
    header.className = 'filter-header';

    const title = document.createElement('div');
    title.className = 'filter-title';
    title.textContent = 'Filter';
    header.appendChild(title);

    // §6 Trigger button + visible "Filters" text label
    const toggleWrap = document.createElement('div');
    toggleWrap.style.display = 'inline-flex';
    toggleWrap.style.alignItems = 'center';

    const toggle = document.createElement('button');
    toggle.id = 'filter-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Toggle filters');
    toggle.setAttribute('title', 'Toggle filters');
    const setToggleIcon = () => {
      const collapsed = bar.classList.contains('collapsed');
      const hasFilters = anyFilterActive();
      let name;
      if (collapsed) name = hasFilters ? 'filter-menu' : 'filter-menu-outline';
      else name = hasFilters ? 'filter' : 'filter-outline';
      toggle.innerHTML = `<i class="mdi mdi-${name}" aria-hidden="true"></i>`;
    };
    toggle._setIcon = setToggleIcon;
    toggle.addEventListener('click', () => {
      const collapsed = !bar.classList.contains('collapsed');
      bar.classList.toggle('collapsed', collapsed);
      setToggleIcon();
    });
    toggleWrap.appendChild(toggle);

    const toggleLabel = document.createElement('span');
    toggleLabel.id = 'filter-toggle-label';
    toggleLabel.textContent = 'Filters';
    toggleWrap.appendChild(toggleLabel);

    header.appendChild(toggleWrap);
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
      active.search = '';
      active.category.clear();
      active.license.clear();
      active.platform.clear();
      active.workflow.clear();
      active.output.clear();
      search.value = '';
      for (const c of bar.querySelectorAll('.filter-chip.active')) c.classList.remove('active');
      applyFilters();
    });
    top.appendChild(clear);

    bar.appendChild(top);

    // §6 Flat: all 5 groups visible inside the panel.
    makeGroup(bar, 'Category', 'category', CATEGORY_OPTIONS, CATEGORY_LABELS);
    makeGroup(bar, 'License', 'license', LICENSE_OPTIONS);
    makeGroup(bar, 'Platform', 'platform', PLATFORM_OPTIONS, PLATFORM_LABELS);
    makeGroup(bar, 'Workflow', 'workflow', WORKFLOW_OPTIONS, WORKFLOW_LABELS);
    makeGroup(bar, 'Output', 'output', OUTPUT_OPTIONS, OUTPUT_LABELS);

    const contents = document.getElementById('contents');
    if (contents) contents.parentElement.insertBefore(bar, contents);
    else mainEl.insertBefore(bar, mainEl.firstChild);

    // §16: no localStorage of expand/filters/query — fresh defaults every visit.
    bar.classList.add('collapsed');
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
      }
      sel.value = '';
    });
    contents.parentElement.insertBefore(sel, contents);
  }

  // ---------- §1/§10 Collapsible headings ----------

  function setCollapsed(heading, collapsed) {
    const level = heading.tagName;
    const range = rangeFromHeading(heading, level);
    if (collapsed) {
      heading.setAttribute('data-collapsed', 'true');
      for (const el of range) {
        el.setAttribute('data-user-collapsed', '1');
        if (!el.hasAttribute('data-hidden-by-filter')) el.style.display = 'none';
      }
    } else {
      heading.removeAttribute('data-collapsed');
      for (const el of range) {
        el.removeAttribute('data-user-collapsed');
        if (!el.hasAttribute('data-hidden-by-filter')) el.style.display = '';
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
      h.setAttribute('tabindex', '0');
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
        setCollapsed(h, nowCollapsed);
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

  function smoothScrollTo(targetY, duration) {
    const startY = window.pageYOffset;
    const delta = targetY - startY;
    if (Math.abs(delta) < 2) { window.scrollTo(0, targetY); return; }
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
        return;
      }
      const t = Math.min(1, (now - t0) / d);
      window.scrollTo(0, startY + delta * ease(t));
      if (t < 1) requestAnimationFrame(step);
      else {
        window.removeEventListener('wheel', onWheel);
        window.removeEventListener('touchstart', onWheel);
      }
    }
    requestAnimationFrame(step);
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

        // §17: clear filters + search if any active.
        if (anyFilterActive()) {
          active.search = '';
          active.category.clear();
          active.license.clear();
          active.platform.clear();
          active.workflow.clear();
          active.output.clear();
          const search = document.getElementById('filter-search');
          if (search) search.value = '';
          const bar = document.getElementById('filter-bar');
          if (bar) for (const c of bar.querySelectorAll('.filter-chip.active')) c.classList.remove('active');
          applyFilters();
        }

        if (target.tagName === 'H3') expandHeading(findPrevH2(target));
        expandHeading(target);
        history.pushState(null, '', '#' + id);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const top = target.getBoundingClientRect().top + window.pageYOffset - 8;
            smoothScrollTo(top);
          });
        });
      });
    }
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
          setCollapsed(focused, false);
          focused.setAttribute('aria-expanded', 'true');
        }
        return;
      }
      if (ev.key === 'ArrowLeft' && focused && (focused.tagName === 'H2' || focused.tagName === 'H3')) {
        if (!focused.hasAttribute('data-collapsed') && !EXCLUDED_H2_IDS.has(focused.id)) {
          ev.preventDefault();
          setCollapsed(focused, true);
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

  // ---------- Init ----------

  function init(data) {
    mainEl = document.querySelector('main') || document.body;
    decorate(data);
    buildUI();
    setupCollapsibleHeadings();
    setupTocClickHandler();
    setupKeyboardNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  function start() {
    fetch(DATA_URL)
      .then(r => r.json())
      .then(init)
      .catch(err => console.error('Filter init failed:', err));
  }
})();
