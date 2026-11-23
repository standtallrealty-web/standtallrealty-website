/* Home page: search, categories, new projects, latest properties */
(function () {
  'use strict';
  var ST = window.ST, $ = ST.$, $$ = ST.$$, esc = ST.esc;

  // ---- search
  var form = $('#home-search'), mode = 'buy', locIn = $('#s-loc');
  var city = ST.S.defaultCity || 'Pune';
  ST.fillLocalities($('#s-loc-list'), city);
  $$('.search-tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      mode = b.dataset.mode;
      $$('.search-tabs button').forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
    });
  });
  function go(extra) {
    var p = new URLSearchParams();
    if (mode === 'buy') p.set('purpose', 'sale');
    if (mode === 'rent') p.set('purpose', 'rent');
    if (mode === 'project') p.set('kind', 'project');
    p.set('city', city);
    if (locIn.value.trim()) p.set('loc', locIn.value.trim());
    Object.keys(extra || {}).forEach(function (k) { if (extra[k]) p.set(k, extra[k]); });
    location.href = 'properties.html?' + p.toString();
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); go(); });
  $('#near-me').addEventListener('click', function () {
    var b = this; ST.busy(b, true, 'Finding you…');
    ST.detectLocation().then(function (a) {
      go({ near: a.lat + ',' + a.lng, nearName: [a.locality, a.city].filter(Boolean).join(', ') });
    }).catch(function (err) { ST.busy(b, false); ST.toast(err.message, 'error'); });
  });

  // ---- listings
  var all = [];
  function render() {
    var feat = all.filter(function (l) { return l.featured === 'Yes'; });
    feat = feat.concat(all.filter(function (l) { return l.kind === 'project' && feat.indexOf(l) < 0; })).slice(0, 6);
    $('#featured').innerHTML = feat.map(function (l) { return ST.card(l); }).join('');
    $('#featured-sec').hidden = !feat.length;
    renderLatest();
  }
  function renderLatest() {
    var f = ($('input[name=latest]:checked') || {}).value || '';
    var list = all.filter(function (l) { return l.kind !== 'project' && (!f || l.purpose === f); }).slice(0, 8);
    $('#latest').innerHTML = list.length ? list.map(function (l) { return ST.card(l); }).join('') :
      '<div class="empty" style="grid-column:1/-1"><h3>New listings are on the way</h3><p>Tell us what you are looking for and we will call you with options.</p><a class="btn btn-gold" href="contact.html">Tell us what you need</a></div>';
  }
  $$('input[name=latest]').forEach(function (r) { r.addEventListener('change', renderLatest); });
  ST.getListings().then(function (l) { all = l; render(); }).catch(function (err) {
    $('#featured-sec').hidden = true;
    $('#latest').innerHTML = '<div class="empty" style="grid-column:1/-1"><h3>Listings could not load</h3><p>' + esc(err.message) + '</p></div>';
  });
})();
