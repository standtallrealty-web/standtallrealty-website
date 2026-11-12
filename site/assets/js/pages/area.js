/* Area page (property-in-<area>-pune): live listings for the area, tabs, and a lead form */
(function () {
  'use strict';
  var ST = window.ST, $ = ST.$, $$ = ST.$$, esc = ST.esc;
  var main = $('main[data-area-name]');
  if (!main) return;
  var name = main.dataset.areaName;
  var match = String(main.dataset.areaMatch || '').split('|').filter(Boolean).map(function (x) { return x.toLowerCase(); });
  var box = $('#area-cards'), tabs = $('#area-tabs');
  var cur = 'all', all = [];

  function inArea(l) {
    var loc = String(l.locality || '').toLowerCase();
    return match.some(function (m) { return loc.indexOf(m) >= 0; });
  }
  var KIND = {
    all: function () { return true; },
    sale: function (l) { return l.purpose === 'sale' && l.kind !== 'project'; },
    rent: function (l) { return l.purpose === 'rent'; },
    project: function (l) { return l.kind === 'project'; }
  };
  function draw() {
    $$('button[data-k]', tabs).forEach(function (t) {
      var n = all.filter(KIND[t.dataset.k]).length;
      t.setAttribute('aria-selected', String(t.dataset.k === cur));
      $('small', t).textContent = n ? ' ' + n : '';
    });
    var list = all.filter(KIND[cur]);
    box.innerHTML = list.length ? list.map(function (l) { return ST.card(l); }).join('') :
      '<div class="empty" style="grid-column:1/-1"><h3>Nothing here right now</h3><p>New homes in ' + esc(name) + ' come up often. Tell us what you need and we will send you matching options first.</p>' +
      '<a class="btn btn-gold" href="#area-lead-sec">Tell us what you need</a></div>';
  }
  tabs.addEventListener('click', function (e) {
    var t = e.target.closest('button[data-k]');
    if (!t) return;
    cur = t.dataset.k;
    draw();
  });
  ST.getListings().then(function (list) { all = list.filter(inArea); draw(); })
    .catch(function () {
      box.innerHTML = '<div class="empty" style="grid-column:1/-1"><h3>Could not load the listings</h3><p>Check your internet connection, or call us and we will tell you what is available.</p><a class="btn btn-navy" href="' + ST.tel() + '">Call us</a></div>';
    });
  ST.leadForm($('#area-lead'), { question: 'What are you looking for in ' + name + '?', area: name });
})();
