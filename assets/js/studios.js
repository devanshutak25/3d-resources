// Studios directory (/studios/). The page ships the first cards server-rendered; this fetches
// studios.json (every card pre-rendered + filter fields), then filters, groups and renders cards
// in batches as the visitor scrolls. URL state lives in the query string, like the catalog:
//   /studios/?q=…&d=vfx,3d-animation&m=film&loc=c:France&size=large&careers=1&g=r

(function () {
  'use strict';

  const form = document.getElementById('studio-filters');
  const grid = document.getElementById('studio-grid');
  const sentinel = document.getElementById('studio-sentinel');
  // Without fetch/IntersectionObserver the server-rendered first cards stay as the fallback.
  if (!form || !grid || !sentinel || !window.fetch || !window.IntersectionObserver) return;

  const BATCH = 48;
  const qInput = document.getElementById('studio-q');
  const locSel = document.getElementById('studio-loc');
  const groupSel = document.getElementById('studio-group');
  const careersBox = document.getElementById('studio-careers');
  const countEl = document.getElementById('studio-count');
  const emptyEl = document.getElementById('studio-empty');
  const clearBtn = document.getElementById('studio-clear');
  const allHeading = document.getElementById('studio-all-h');
  const chips = Array.from(form.querySelectorAll('.filter-chip'));

  const state = { q: '', d: new Set(), m: new Set(), size: new Set(), loc: '', careers: false, g: '' };
  let data = null;     // { regions, sizes, studios: [{ id, h, t, d, m, c, r, hc, hr, s, a, j }] }
  let list = [];       // filtered, ordered records
  let keys = [];       // group key per list item (when grouped)
  let counts = null;   // group key -> count
  let rendered = 0;

  function track(event, props) {
    if (typeof window.track3d === 'function') window.track3d(event, props);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  const splitSet = v => new Set((v || '').split(',').filter(Boolean));

  function readUrl() {
    const p = new URLSearchParams(location.search);
    state.q = p.get('q') || '';
    state.d = splitSet(p.get('d'));
    state.m = splitSet(p.get('m'));
    state.size = splitSet(p.get('size'));
    state.loc = p.get('loc') || '';
    state.careers = p.get('careers') === '1';
    state.g = p.get('g') || '';
  }

  function writeUrl() {
    const p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    if (state.d.size) p.set('d', [...state.d].join(','));
    if (state.m.size) p.set('m', [...state.m].join(','));
    if (state.loc) p.set('loc', state.loc);
    if (state.size.size) p.set('size', [...state.size].join(','));
    if (state.careers) p.set('careers', '1');
    if (state.g) p.set('g', state.g);
    const qs = p.toString();
    try { history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash); } catch (e) { /* noop */ }
  }

  function syncSelect(sel, key) {
    if ([...sel.options].some(o => o.value === state[key])) sel.value = state[key];
    else state[key] = sel.value = '';
  }

  function syncControls() {
    qInput.value = state.q;
    syncSelect(locSel, 'loc');
    syncSelect(groupSel, 'g');
    careersBox.checked = state.careers;
    for (const c of chips) {
      const on = state[c.dataset.group].has(c.dataset.value);
      c.classList.toggle('active', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  function filtersActive() {
    return !!(state.q || state.d.size || state.m.size || state.size.size || state.loc || state.careers);
  }

  function matches(s, terms) {
    if (state.d.size && !s.d.some(x => state.d.has(x))) return false;
    if (state.m.size && !s.m.some(x => state.m.has(x))) return false;
    if (state.size.size && !state.size.has(s.s)) return false;
    if (state.careers && !s.j) return false;
    if (state.loc) {
      const kind = state.loc.slice(0, 1), val = state.loc.slice(2);
      if (kind === 'c' && !s.c.includes(val)) return false;
      if (kind === 'r' && !s.r.includes(val)) return false;
    }
    return terms.every(t => s.t.includes(t));
  }

  // Grouping is by HQ, so each studio appears once.
  function groupKey(s) {
    return { r: s.hr, c: s.hc, s: s.s, a: s.a }[state.g] || '';
  }

  function groupLabel(k) {
    if (state.g === 'r') return data.regions[k] || 'Other';
    if (state.g === 'c') return k;
    if (state.g === 's') return k ? data.sizes[k] : 'Size unknown';
    return k === 'pre-1980' ? 'Founded before 1980' : k ? `Founded in the ${k}` : 'Founding year unknown';
  }

  // Sort key for group order: regions and sizes in data order, decades oldest first, unknown last.
  function groupRank(k) {
    if (state.g === 'r') return String(Object.keys(data.regions).indexOf(k) + 10);
    if (state.g === 's') return k ? String(Object.keys(data.sizes).indexOf(k) + 10) : '~';
    if (state.g === 'a') return k === 'pre-1980' ? '0' : k || '~';
    return k;
  }

  function renderMore() {
    const end = Math.min(rendered + BATCH, list.length);
    let html = '';
    for (let i = rendered; i < end; i++) {
      if (state.g && (i === 0 || keys[i] !== keys[i - 1])) {
        html += `<h2 class="studio-group">${esc(groupLabel(keys[i]))} <small>${counts.get(keys[i])}</small></h2>`;
      }
      html += list[i].h;
    }
    grid.insertAdjacentHTML('beforeend', html);
    rendered = end;
  }

  // observe() always delivers one entry with the current state, so re-observing after a render
  // keeps filling while the sentinel is still on screen.
  const io = new IntersectionObserver(entries => {
    if (entries[entries.length - 1].isIntersecting && rendered < list.length) {
      renderMore();
      io.unobserve(sentinel);
      io.observe(sentinel);
    }
  }, { rootMargin: '1200px 0px' });

  function updateMeta() {
    const total = data.studios.length.toLocaleString();
    countEl.textContent = filtersActive()
      ? `Showing ${list.length.toLocaleString()} of ${total} studios`
      : `${total} studios`;
    emptyEl.hidden = list.length !== 0;
    clearBtn.hidden = !filtersActive();
    allHeading.hidden = !!state.g;
  }

  function apply() {
    const terms = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    list = data.studios.filter(s => matches(s, terms));
    keys = [];
    if (state.g) {
      const ranked = list.map(s => { const k = groupKey(s); return { s, k, rank: groupRank(k) }; });
      ranked.sort((a, b) => a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : 0); // stable: name order within a group
      list = ranked.map(x => x.s);
      keys = ranked.map(x => x.k);
      counts = new Map();
      for (const k of keys) counts.set(k, (counts.get(k) || 0) + 1);
    }
    grid.textContent = '';
    rendered = 0;
    renderMore();
    updateMeta();
    writeUrl();
    io.unobserve(sentinel);
    io.observe(sentinel);
    return list.length;
  }

  function bind() {
    let qTimer = 0, trackTimer = 0;
    qInput.addEventListener('input', () => {
      clearTimeout(qTimer);
      qTimer = setTimeout(() => {
        state.q = qInput.value.trim();
        const n = apply();
        // Separate settle timer so search events fire once per query, not per keystroke.
        clearTimeout(trackTimer);
        if (state.q) trackTimer = setTimeout(() => track('search', { query: state.q, query_length: state.q.length, result_count: n, zero_results: n === 0 }), 1000);
      }, 120);
    });

    for (const c of chips) {
      c.addEventListener('click', () => {
        const set = state[c.dataset.group];
        const on = !set.has(c.dataset.value);
        if (on) set.add(c.dataset.value); else set.delete(c.dataset.value);
        syncControls();
        const n = apply();
        track('filter_apply', { group: 'studio_' + c.dataset.group, value: c.dataset.value, action: on ? 'add' : 'remove', result_count: n });
      });
    }

    locSel.addEventListener('change', () => {
      state.loc = locSel.value;
      const n = apply();
      track('filter_apply', { group: 'studio_loc', value: state.loc, action: state.loc ? 'add' : 'remove', result_count: n });
    });

    groupSel.addEventListener('change', () => {
      state.g = groupSel.value;
      const n = apply();
      track('filter_apply', { group: 'studio_group', value: state.g, action: state.g ? 'add' : 'remove', result_count: n });
    });

    careersBox.addEventListener('change', () => {
      state.careers = careersBox.checked;
      const n = apply();
      track('filter_apply', { group: 'studio_careers', value: '1', action: state.careers ? 'add' : 'remove', result_count: n });
    });

    // Clears filters, keeps the grouping (it is a view, not a filter).
    function clearAll() {
      state.q = ''; state.d.clear(); state.m.clear(); state.size.clear(); state.loc = ''; state.careers = false;
      syncControls();
      apply();
      track('filter_clear', {});
    }
    clearBtn.addEventListener('click', clearAll);
    document.querySelectorAll('[data-clear]').forEach(b => b.addEventListener('click', clearAll));
    form.addEventListener('submit', e => e.preventDefault());
  }

  function start(json) {
    data = json;
    readUrl();
    syncControls();
    if (filtersActive() || state.g) {
      apply();
    } else {
      // Default view: keep the server-rendered cards and continue from there.
      list = data.studios;
      rendered = grid.querySelectorAll('.studio-card').length;
      updateMeta();
      io.observe(sentinel);
    }
    // Deep link to a card (#s-framestore) that is not rendered yet.
    const id = decodeURIComponent(location.hash.slice(1));
    const i = id ? list.findIndex(s => s.id === id) : -1;
    if (i >= rendered) {
      while (rendered <= i) renderMore();
      const el = document.getElementById(id);
      if (el) el.scrollIntoView();
    }
    bind();
    form.hidden = false;
  }

  fetch(grid.dataset.src)
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(start)
    .catch(() => {
      grid.insertAdjacentHTML('afterend', '<p class="studio-empty">Could not load the full list. Reload to try again.</p>');
    });
})();
