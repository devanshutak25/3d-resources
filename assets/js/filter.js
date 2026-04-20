// Client-side filter for 3D Resources site.
// Reads data.json, decorates rendered README with data-attrs, renders filter UI.

(function () {
  'use strict';

  const DATA_URL = '/data.json';
  const EXCLUDED_H2_IDS = new Set(['contents', 'contributing', 'footnotes']);

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
  const OUTPUT_OPTIONS = ['games', 'film-vfx', 'broadcast', 'archviz', 'product-viz', 'motion-graphics', 'illustration', 'xr'];

  const active = {
    search: '',
    category: new Set(),
    license: new Set(),
    platform: new Set(),
    workflow: new Set(),
    output: new Set()
  };

  let itemIndex = []; // [{ el, entry, text }]
  let mainEl = null;

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

  function decorate(data) {
    const byUrl = new Map();
    for (const e of data.entries) byUrl.set(normalizeUrl(e.url), e);

    const anchors = mainEl.querySelectorAll('a[href]');
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
      el.dataset.platform = entry.tags.platform.join(' ');
      el.dataset.workflow = entry.tags.workflow.join(' ');
      el.dataset.output = entry.tags.output.join(' ');
      itemIndex.push({ el, entry, text: el.textContent.toLowerCase() });
    }
  }

  function matches(item) {
    if (active.search && !item.text.includes(active.search)) return false;
    // Category: section slug. Strict — entry must be in one of the active categories.
    if (active.category.size && !active.category.has(item.entry.section)) return false;
    // License: only filter entries that have a license value. Tutorials/channels
    // without license are treated as "does not apply" and shown.
    if (active.license.size && item.entry.license && !active.license.has(item.entry.license)) return false;
    // Tag dimensions: if entry has no tags in this dimension, treat as
    // "not applicable" → don't exclude. Prevents platform filter from
    // hiding texture libraries, tutorials, etc. that lack platform tags.
    for (const group of ['platform', 'workflow', 'output']) {
      if (!active[group].size) continue;
      const vals = item.entry.tags[group];
      if (!vals.length) continue;
      let ok = false;
      for (const v of active[group]) if (vals.includes(v)) { ok = true; break; }
      if (!ok) return false;
    }
    return true;
  }

  function anyFilterActive() {
    return active.search || active.category.size || active.license.size || active.platform.size || active.workflow.size || active.output.size;
  }

  function rangeFromHeading(heading, level) {
    // Returns siblings from heading.nextElementSibling up to (exclusive) next same-or-higher heading.
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

  function h3InsideHiddenH2(h3) {
    let p = h3.previousElementSibling;
    while (p) {
      if (p.tagName === 'H2') return p.style.display === 'none';
      p = p.previousElementSibling;
    }
    return false;
  }

  function resetSectionHiding() {
    const hidden = mainEl.querySelectorAll('[data-hidden-by-filter]');
    for (const el of hidden) {
      el.removeAttribute('data-hidden-by-filter');
      // Preserve user-initiated collapse; only clear filter-driven hiding.
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

    // H3 first (so their visibility is correct when we evaluate H2 ranges)
    const h3s = Array.from(mainEl.querySelectorAll('h3'));
    for (const h3 of h3s) {
      const range = rangeFromHeading(h3, 'H3');
      const hasVisible = range.some(elementHasVisibleItem);
      if (!hasVisible) hideRange(h3, range);
    }

    // H2 (skip wrapper headings)
    const h2s = Array.from(mainEl.querySelectorAll('h2'));
    for (const h2 of h2s) {
      if (EXCLUDED_H2_IDS.has(h2.id)) continue;
      const range = rangeFromHeading(h2, 'H2');
      const hasVisible = range.some(elementHasVisibleItem);
      if (!hasVisible) hideRange(h2, range);
    }

    syncToC();
  }

  function syncToC() {
    const contents = document.getElementById('contents');
    if (!contents) return;
    // ToC is now a series of <details> blocks between Contents H2 and next H2.
    let n = contents.nextElementSibling;
    while (n && n.tagName !== 'H2') {
      if (n.tagName === 'DETAILS') {
        // Top-level section <details>
        const sumA = n.querySelector(':scope > summary a[href^="#"]');
        if (sumA) {
          const targetId = decodeURIComponent(sumA.getAttribute('href').slice(1));
          const target = document.getElementById(targetId);
          if (target) n.style.display = (target.style.display === 'none') ? 'none' : '';
        }
        // Inner <li> subsection entries
        const lis = n.querySelectorAll('li');
        for (const li of lis) {
          const a = li.querySelector('a[href^="#"]');
          if (!a) continue;
          const tid = decodeURIComponent(a.getAttribute('href').slice(1));
          const target = document.getElementById(tid);
          if (target) li.style.display = (target.style.display === 'none') ? 'none' : '';
        }
      }
      n = n.nextElementSibling;
    }
  }

  function applyFilters() {
    let visibleCount = 0;
    for (const item of itemIndex) {
      const show = matches(item);
      item.el.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    }
    hideEmptySections();
    const counter = document.getElementById('filter-count');
    if (counter) counter.textContent = `${visibleCount} / ${itemIndex.length}`;
  }

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
    for (const v of options) row.appendChild(makeChip(group, v, labelMap ? labelMap[v] : v));
    bar.appendChild(row);
  }

  function buildUI() {
    const bar = document.createElement('div');
    bar.id = 'filter-bar';

    const title = document.createElement('div');
    title.className = 'filter-title';
    title.textContent = 'Filter';
    bar.appendChild(title);

    const top = document.createElement('div');
    top.className = 'filter-top';

    const search = document.createElement('input');
    search.type = 'search';
    search.placeholder = 'Search resources…';
    search.id = 'filter-search';
    search.addEventListener('input', () => {
      active.search = search.value.trim().toLowerCase();
      applyFilters();
    });
    top.appendChild(search);

    const counter = document.createElement('span');
    counter.id = 'filter-count';
    counter.textContent = `${itemIndex.length} / ${itemIndex.length}`;
    top.appendChild(counter);

    const clear = document.createElement('button');
    clear.id = 'filter-clear';
    clear.type = 'button';
    clear.textContent = 'Clear';
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

    // Category chips — front and center
    makeGroup(bar, 'Category', 'category', CATEGORY_OPTIONS, CATEGORY_LABELS);

    // Collapsible: license, platform, workflow, output
    const more = document.createElement('details');
    more.className = 'filter-more';
    const summary = document.createElement('summary');
    summary.textContent = 'More filters (license, platform, workflow, output)';
    more.appendChild(summary);
    const moreBody = document.createElement('div');
    more.appendChild(moreBody);
    makeGroup(moreBody, 'License', 'license', LICENSE_OPTIONS);
    makeGroup(moreBody, 'Platform', 'platform', PLATFORM_OPTIONS, PLATFORM_LABELS);
    makeGroup(moreBody, 'Workflow', 'workflow', WORKFLOW_OPTIONS);
    makeGroup(moreBody, 'Output', 'output', OUTPUT_OPTIONS);
    bar.appendChild(more);

    // Insert right before the "Contents" heading (so at rest, bar sits above ToC, below intro).
    const contents = document.getElementById('contents');
    if (contents) contents.parentElement.insertBefore(bar, contents);
    else mainEl.insertBefore(bar, mainEl.firstChild);
  }

  function setCollapsed(heading, collapsed) {
    const level = heading.tagName; // H2 or H3
    const range = rangeFromHeading(heading, level);
    if (collapsed) {
      heading.setAttribute('data-collapsed', 'true');
      for (const el of range) {
        el.setAttribute('data-user-collapsed', '1');
        // Don't stomp on filter-driven hiding — only set display when visible.
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
    for (const h of headings) {
      if (h.tagName === 'H2' && EXCLUDED_H2_IDS.has(h.id)) continue;
      h.classList.add('collapsible-heading');
      h.setAttribute('role', 'button');
      h.setAttribute('tabindex', '0');
      h.setAttribute('aria-expanded', 'true');
      const toggle = (ev) => {
        // Don't swallow clicks on anchor links inside the heading.
        if (ev.target && ev.target.closest && ev.target.closest('a')) return;
        const nowCollapsed = !h.hasAttribute('data-collapsed');
        setCollapsed(h, nowCollapsed);
        h.setAttribute('aria-expanded', nowCollapsed ? 'false' : 'true');
      };
      h.addEventListener('click', toggle);
      h.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggle(ev); }
      });
    }
  }

  function init(data) {
    mainEl = document.querySelector('main') || document.body;
    decorate(data);
    buildUI();
    setupCollapsibleHeadings();
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
