/* Home page */
(function () {
  'use strict';
  var ST = window.ST, $ = ST.$, $$ = ST.$$, esc = ST.esc;

  // ---- search console
  var form = $('#home-search'), mode = 'buy';
  var citySel = $('#s-city'), locIn = $('#s-loc'), budget = $('#s-budget');
  citySel.innerHTML = ST.cityOptions(ST.S.defaultCity || 'Pune', 'Any city').replace('<option value="__other">Other (type it)</option>', '');
  citySel.value = ST.S.defaultCity || 'Pune';
  function syncLoc() { ST.fillLocalities($('#s-loc-list'), citySel.value); }
  function syncBudget() { budget.innerHTML = ST.budgetOptions(mode === 'rent' ? 'rent' : 'sale', ''); }
  citySel.addEventListener('change', syncLoc);
  syncLoc(); syncBudget();
  $$('.search-tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      mode = b.dataset.mode;
      $$('.search-tabs button').forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
      syncBudget();
      locIn.placeholder = mode === 'plots' ? 'Locality or village' : 'Locality, e.g. Baner';
    });
  });
  function go(extra) {
    var p = new URLSearchParams();
    if (mode === 'buy') p.set('purpose', 'sale');
    if (mode === 'rent') p.set('purpose', 'rent');
    if (mode === 'project') p.set('kind', 'project');
    if (mode === 'commercial') p.set('seg', 'Commercial');
    if (mode === 'plots') p.set('seg', 'Plots');
    if (citySel.value) p.set('city', citySel.value);
    if (locIn.value.trim()) p.set('loc', locIn.value.trim());
    if (budget.value) p.set('budget', budget.value);
    Object.keys(extra || {}).forEach(function (k) { if (extra[k]) p.set(k, extra[k]); });
    location.href = 'properties.html?' + p.toString();
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); go(); });
  $('#near-me').addEventListener('click', function () {
    var b = this; ST.busy(b, true, 'Finding you…');
    ST.detectLocation().then(function (a) {
      citySel.value = Array.prototype.some.call(citySel.options, function (o) { return o.value === a.city; }) ? a.city : '';
      locIn.value = '';
      go({ near: a.lat + ',' + a.lng, nearName: [a.locality, a.city].filter(Boolean).join(', ') });
    }).catch(function (err) { ST.busy(b, false); ST.toast(err.message, 'error'); });
  });

  // ---- listings on the page
  var all = [];
  function render() {
    var feat = all.filter(function (l) { return l.featured === 'Yes'; });
    if (feat.length < 3) feat = feat.concat(all.filter(function (l) { return l.kind === 'project' && feat.indexOf(l) < 0; }));
    feat = feat.slice(0, 3);
    $('#featured').innerHTML = feat.map(function (l) { return ST.card(l); }).join('');
    $('#featured-sec').hidden = !feat.length;
    renderLatest();
    var segs = {};
    all.forEach(function (l) { segs[l.segment] = (segs[l.segment] || 0) + 1; });
    $$('[data-segcount]').forEach(function (el) { var n = segs[el.dataset.segcount] || 0; el.textContent = n ? n + (n === 1 ? ' listing' : ' listings') : 'Explore'; });
    $$('[data-areacount]').forEach(function (el) {
      var a = el.dataset.areacount.toLowerCase();
      var n = all.filter(function (l) { return String(l.locality).toLowerCase().indexOf(a) === 0; }).length;
      el.textContent = n ? n + (n === 1 ? ' property' : ' properties') : 'Ask us';
    });
  }
  function renderLatest() {
    var f = ($('input[name=latest]:checked') || {}).value || '';
    var list = all.filter(function (l) { return !f || l.purpose === f; }).slice(0, 8);
    $('#latest').innerHTML = list.length ? list.map(function (l) { return ST.card(l); }).join('') :
      '<div class="empty" style="grid-column:1/-1"><h3>New listings are on the way</h3><p>Tell us what you are looking for and we will call you with options.</p><a class="btn btn-gold" href="#enquire">Tell us what you need</a></div>';
  }
  $$('input[name=latest]').forEach(function (r) { r.addEventListener('change', renderLatest); });
  ST.getListings().then(function (l) { all = l; render(); }).catch(function (err) {
    $('#featured-sec').hidden = true;
    $('#latest').innerHTML = '<div class="empty" style="grid-column:1/-1"><h3>Listings could not load</h3><p>' + esc(err.message) + '</p></div>';
  });

  // ---- EMI calculator
  function num(v) { return Number(String(v).replace(/[^\d.]/g, '')) || 0; }
  function emi() {
    var P = num($('#emi-pv').value), r = num($('#emi-rv').value) / 1200, n = num($('#emi-nv').value) * 12;
    var e = !P || !n ? 0 : (r ? P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1) : P / n);
    $('#emi-out').textContent = ST.rupees(Math.round(e)) || '₹0';
    $('#emi-int').textContent = ST.inr(Math.max(0, e * n - P)) || '₹0';
    $('#emi-tot').textContent = ST.inr(e * n) || '₹0';
  }
  function pair(rangeId, inputId, money) {
    var rg = $(rangeId), inp = $(inputId);
    rg.addEventListener('input', function () { inp.value = money ? Number(rg.value).toLocaleString('en-IN') : rg.value; emi(); });
    inp.addEventListener('input', function () { var v = num(inp.value); if (v) rg.value = v; emi(); });
    inp.addEventListener('blur', function () { if (money) inp.value = num(inp.value).toLocaleString('en-IN'); });
  }
  pair('#emi-p', '#emi-pv', true); pair('#emi-r', '#emi-rv'); pair('#emi-n', '#emi-nv');
  emi();

  // ---- enquiry
  ST.leadForm($('#home-lead'), { intent: '' });
  $$('[data-intent-link]').forEach(function (b) {
    b.addEventListener('click', function () {
      var r = $('#home-lead input[name=intent][value="' + b.dataset.intentLink + '"]');
      if (r) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }
    });
  });
})();
