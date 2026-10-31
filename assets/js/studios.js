// Studios directory filter (/studios/). Cards are server-rendered; this only
// shows/hides them. URL state lives in the query string, like the catalog:
//   /studios/?q=…&d=vfx,animation&loc=c:France&size=large&careers=1

(function () {
  'use strict';

  const form = document.getElementById('studio-filters');
  if (!form) return;

  const cards = Array.from(document.querySelectorAll('.studio-card'));
  const haystack = cards.map(c => c.textContent.toLowerCase().replace(/\s+/g, ' '));
  const qInput = document.getElementById('studio-q');
  const locSel = document.getElementById('studio-loc');
  const careersBox = document.getElementById('studio-careers');
  const countEl = document.getElementById('studio-count');
  const emptyEl = document.getElementById('studio-empty');
  const clearBtn = document.getElementById('studio-clear');
  const chips = Array.from(form.querySelectorAll('.filter-chip'));

  const state = { q: '', d: new Set(), size: new Set(), loc: '', careers: false };

  function track(event, props) {
    if (typeof window.track3d === 'function') window.track3d(event, props);
  }

  function readUrl() {
    const p = new URLSearchParams(location.search);
    state.q = p.get('q') || '';
    state.d = new Set((p.get('d') || '').split(',').filter(Boolean));
    state.size = new Set((p.get('size') || '').split(',').filter(Boolean));
    state.loc = p.get('loc') || '';
    state.careers = p.get('careers') === '1';
  }

  function writeUrl() {
    const p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    if (state.d.size) p.set('d', [...state.d].join(','));
    if (state.loc) p.set('loc', state.loc);
    if (state.size.size) p.set('size', [...state.size].join(','));
    if (state.careers) p.set('careers', '1');
    const qs = p.toString();
    try { history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash); } catch (e) { /* noop */ }
  }

  function syncControls() {
    qInput.value = state.q;
    if ([...locSel.options].some(o => o.value === state.loc)) locSel.value = state.loc;
    else state.loc = locSel.value = '';
    careersBox.checked = state.careers;
    for (const c of chips) {
      const on = state[c.dataset.group].has(c.dataset.value);
      c.classList.toggle('active', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  function matches(card, i, terms) {
    if (state.d.size && !card.dataset.d.split(' ').some(d => state.d.has(d))) return false;
    if (state.size.size && !state.size.has(card.dataset.s)) return false;
    if (state.careers && card.dataset.j !== '1') return false;
    if (state.loc) {
      const [kind, val] = [state.loc.slice(0, 1), state.loc.slice(2)];
      if (kind === 'c' && !card.dataset.c.split('|').includes(val)) return false;
      if (kind === 'r' && !card.dataset.r.split(' ').includes(val)) return false;
    }
    return terms.every(t => haystack[i].includes(t));
  }

  function apply() {
    const terms = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    cards.forEach((card, i) => {
      const ok = matches(card, i, terms);
      card.hidden = !ok;
      if (ok) shown++;
    });
    const active = !!(terms.length || state.d.size || state.size.size || state.loc || state.careers);
    countEl.textContent = active
      ? `Showing ${shown.toLocaleString()} of ${cards.length.toLocaleString()} studios`
      : `${cards.length.toLocaleString()} studios`;
    emptyEl.hidden = shown !== 0;
    clearBtn.hidden = !active;
    writeUrl();
    return shown;
  }

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

  careersBox.addEventListener('change', () => {
    state.careers = careersBox.checked;
    const n = apply();
    track('filter_apply', { group: 'studio_careers', value: '1', action: state.careers ? 'add' : 'remove', result_count: n });
  });

  function clearAll() {
    state.q = ''; state.d.clear(); state.size.clear(); state.loc = ''; state.careers = false;
    syncControls();
    apply();
    track('filter_clear', {});
  }
  clearBtn.addEventListener('click', clearAll);
  document.querySelectorAll('[data-clear]').forEach(b => b.addEventListener('click', clearAll));

  form.addEventListener('submit', e => e.preventDefault());

  readUrl();
  syncControls();
  apply();
  form.hidden = false;
})();
