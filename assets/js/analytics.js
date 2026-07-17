// Analytics: Mixpanel init + catalog events.
// Loaded on every page type (catalog index, section, subsection, tag, hub).
//
// Init is deferred to idle so instrumentation never competes with first paint.
// Page context comes from data-* attributes on <body>, set by the generators.
// Events fired before the lib lands are queued and flushed on load.
//
// Public API: window.track3d(event, props) — always safe to call.

(function () {
  'use strict';

  var TOKEN = '3ec8187264dce16657f7d211c7926159';
  var API_HOST = 'https://mp.devanshutak.xyz';
  var LIB_URL = API_HOST + '/lib/mixpanel-2-latest.min.js';

  var pending = [];
  var loaded = false;

  // Page context is per-page, so it is merged into each event rather than
  // registered as a Mixpanel super property — super properties persist in a
  // cookie and would leak the previous page's section onto the next one.
  function pageContext() {
    var d = (document.body && document.body.dataset) || {};
    var out = { page_type: d.pageType || 'unknown' };
    if (d.section) out.section = d.section;
    if (d.subsection) out.subsection = d.subsection;
    if (d.tagGroup) out.tag_group = d.tagGroup;
    if (d.tagValue) out.tag_value = d.tagValue;
    return out;
  }

  function track(event, props) {
    var payload = props || {};
    var ctx = pageContext();
    for (var k in ctx) { if (!(k in payload)) payload[k] = ctx[k]; }
    if (!loaded) {
      if (pending.length < 50) pending.push([event, payload]);
      return;
    }
    send(event, payload);
  }

  function send(event, payload) {
    try {
      // sendBeacon survives the unload that follows an outbound click.
      window.mixpanel.track(event, payload, { transport: 'sendBeacon' });
    } catch (e) {
      // Analytics must never break the page.
    }
  }

  window.track3d = track;

  // --- outbound_click -------------------------------------------------------

  function isOutbound(a) {
    if (!a.getAttribute('href')) return false;
    if (a.protocol !== 'http:' && a.protocol !== 'https:') return false;
    return a.hostname !== location.hostname;
  }

  // Chrome links (header/footer/nav) are outbound too — the GitHub repo,
  // the author site — but they are not catalog resources. Tag them so the
  // entry funnel stays clean.
  function linkKind(a) {
    if (a.closest('header, footer, nav, .site-footer, .breadcrumb')) return 'chrome';
    if (a.closest('main, #main-content')) return 'entry';
    return 'chrome';
  }

  function outboundProps(a) {
    var props = {
      url: a.href,
      host: a.hostname.replace(/^www\./, ''),
      link_kind: linkKind(a),
      link_text: (a.textContent || '').trim().slice(0, 120)
    };

    // On the catalog index, filter.js decorates each row with the entry's
    // catalog metadata. Section pages have no such decoration, so these
    // fields are simply absent there and <body> context carries the location.
    var row = a.closest('[data-decorated]');
    if (row) {
      var d = row.dataset;
      if (d.name) props.entry_name = d.name;
      if (d.entryType) props.entry_type = d.entryType;
      if (d.license) props.license = d.license;
      if (d.section) props.entry_section = d.section;
      if (d.subsection) props.entry_subsection = d.subsection;
    } else if (props.link_kind === 'entry') {
      props.entry_name = props.link_text;
    }
    return props;
  }

  function onLinkActivate(ev) {
    // Ignore right-click; allow left-click and middle-click (open in new tab).
    if (typeof ev.button === 'number' && ev.button !== 0 && ev.button !== 1) return;
    var target = ev.target;
    if (!target || !target.closest) return;
    var a = target.closest('a[href]');
    if (!a || !isOutbound(a)) return;
    track('outbound_click', outboundProps(a));
  }

  // Capture phase: still fires if a nested handler calls stopPropagation.
  document.addEventListener('click', onLinkActivate, true);
  document.addEventListener('auxclick', onLinkActivate, true);

  // --- init -----------------------------------------------------------------

  function init() {
    var MIXPANEL_CUSTOM_LIB_URL = LIB_URL;
    (function(f,b){if(!b.__SV){var e,g,i,h;window.mixpanel=b;b._i=[];b.init=function(e,f,c){function g(a,d){var b=d.split(".");2==b.length&&(a=a[b[0]],d=b[1]);a[d]=function(){a.push([d].concat(Array.prototype.slice.call(arguments,0)))}}var a=b;"undefined"!==typeof c?a=b[c]=[]:c="mixpanel";a.people=a.people||[];a.toString=function(a){var d="mixpanel";"mixpanel"!==c&&(d+="."+c);a||(d+=" (stub)");return d};a.people.toString=function(){return a.toString(1)+".people (stub)"};i="disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split(" ");
for(h=0;h<i.length;h++)g(a,i[h]);var j="set set_once union unset remove delete".split(" ");a.get_group=function(){function b(c){d[c]=function(){call2_args=arguments;call2=[c].concat(Array.prototype.slice.call(call2_args,0));a.push([e,call2])}}for(var d={},e=["get_group"].concat(Array.prototype.slice.call(arguments,0)),c=0;c<j.length;c++)b(j[c]);return d};b._i.push([e,f,c])};b.__SV=1.2;e=f.createElement("script");e.type="text/javascript";e.async=!0;e.src="undefined"!==typeof MIXPANEL_CUSTOM_LIB_URL?MIXPANEL_CUSTOM_LIB_URL:"file:"===f.location.protocol&&"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\/\//)?"https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js":"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";g=f.getElementsByTagName("script")[0];g.parentNode.insertBefore(e,g)}})(document,window.mixpanel||[]);

    window.mixpanel.init(TOKEN, {
      autocapture: true,
      record_sessions_percent: 100,
      api_host: API_HOST
    });

    loaded = true;
    for (var i = 0; i < pending.length; i++) send(pending[i][0], pending[i][1]);
    pending.length = 0;
  }

  if ('requestIdleCallback' in window) requestIdleCallback(init, { timeout: 2500 });
  else setTimeout(init, 1500);
})();
