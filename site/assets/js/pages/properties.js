/* Search / browse page */
(function () {
  'use strict';
  var ST = window.ST, $ = ST.$, $$ = ST.$$, esc = ST.esc;
  var TYPES = {
    Residential: ['Apartment / Flat', 'Independent house / Bungalow', 'Villa', 'Row house', 'Penthouse', 'Studio apartment', 'Farm house'],
    Commercial: ['Shop', 'Office space', 'Showroom', 'Warehouse / Godown', 'Commercial building', 'Co-working space', 'Industrial shed'],
    Plot: ['Residential plot', 'NA plot', 'Agricultural land', 'Commercial plot', 'Industrial plot']
  };
  var SEGS = [['', 'All'], ['project', 'New projects'], ['Under Construction', 'Under construction'], ['Ready to Move', 'Ready to move'],
    ['Resale', 'Resale'], ['Rental', 'Rentals'], ['Commercial', 'Commercial'], ['Plots', 'Plots & land']];
  var P = new URLSearchParams(location.search);
  var st = {
    purpose: P.get('purpose') || '', kind: P.get('kind') || '', seg: P.get('seg') || '', city: P.has('city') ? P.get('city') : (ST.S.defaultCity || 'Pune'),
    loc: P.get('loc') || '', type: P.get('type') || '', bhk: P.get('bhk') || '', budget: P.get('budget') || '', sort: P.get('sort') || 'new', q: P.get('q') || ''
  };
  var near = null;
  if (P.get('near')) { var nn = P.get('near').split(','); near = { lat: +nn[0], lng: +nn[1], name: P.get('nearName') || 'your location' }; st.sort = 'near'; }
  var all = [], shown = 12;

  // ---- controls
  var f = $('#f-form');
  $('#seg-chips').innerHTML = SEGS.map(function (s) {
    var on = s[0] === 'project' ? st.kind === 'project' : (!st.kind && s[0] === st.seg);
    return '<label class="chip"><input type="radio" name="seg" value="' + esc(s[0]) + '"' + (on ? ' checked' : '') + '><span>' + esc(s[1]) + '</span></label>';
  }).join('');
  $('#f-city').innerHTML = ST.cityOptions(st.city, 'Any city').replace('<option value="__other">Other (type it)</option>', '');
  $('#f-city').value = st.city;
  if (st.city && $('#f-city').value !== st.city) { $('#f-city').insertAdjacentHTML('afterbegin', '<option>' + esc(st.city) + '</option>'); $('#f-city').value = st.city; }
  $('#f-type').innerHTML = '<option value="">Any type</option>' + Object.keys(TYPES).map(function (k) {
    return '<optgroup label="' + (k === 'Plot' ? 'Plots & land' : k) + '">' + TYPES[k].map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</optgroup>';
  }).join('');
  f.purpose.value = st.purpose; f.loc.value = st.loc; f.type.value = st.type; f.bhk.value = st.bhk;
  function syncBudget() { $('#f-budget').innerHTML = ST.budgetOptions(st.purpose, st.budget); }
  syncBudget();
  ST.fillLocalities($('#f-loc-list'), st.city);
  $('#sort').value = st.sort;
  if (near) $('#sort option[value=near]').hidden = false;

  function readControls() {
    var seg = ($('input[name=seg]:checked') || {}).value || '';
    st.kind = seg === 'project' ? 'project' : '';
    st.seg = seg === 'project' ? '' : seg;
    st.purpose = f.purpose.value; st.city = f.city.value; st.loc = f.loc.value.trim(); st.type = f.type.value; st.bhk = f.bhk.value;
    st.budget = $('#f-budget').value; st.sort = $('#sort').value;
    if (st.seg === 'Rental') st.purpose = 'rent';
    else if (st.kind || SALE_SEGS.indexOf(st.seg) >= 0) st.purpose = 'sale';
    f.purpose.value = st.purpose;
    if (st.budget && ((st.budget[0] === 'r' && st.purpose === 'sale') || (st.budget[0] === 's' && st.purpose === 'rent'))) st.budget = '';
  }
  function writeUrl() {
    var q = new URLSearchParams();
    ['purpose', 'kind', 'seg', 'loc', 'type', 'bhk', 'budget'].forEach(function (k) { if (st[k]) q.set(k, st[k]); });
    q.set('city', st.city || '');
    if (st.sort !== 'new') q.set('sort', st.sort);
    if (near) { q.set('near', near.lat + ',' + near.lng); q.set('nearName', near.name); }
    history.replaceState(null, '', 'properties.html?' + q.toString());
  }
  var SALE_SEGS = ['Under Construction', 'Ready to Move', 'Resale', 'Plots'];
  function onChange(e) {
    if (e && e.target === f.city) ST.fillLocalities($('#f-loc-list'), f.city.value);
    if (e && e.target === f.purpose) {
      var seg = ($('input[name=seg]:checked') || {}).value || '';
      if ((f.purpose.value === 'rent' && (seg === 'project' || SALE_SEGS.indexOf(seg) >= 0)) || (f.purpose.value === 'sale' && seg === 'Rental')) $('input[name=seg][value=""]').checked = true;
    }
    readControls(); syncBudget(); shown = 12; writeUrl(); render();
  }
  f.addEventListener('change', onChange);
  f.loc.addEventListener('input', ST.debounce(onChange, 300));
  $('#seg-chips').addEventListener('change', onChange);
  $('#sort').addEventListener('change', onChange);
  $('#f-clear').addEventListener('click', function () {
    $('input[name=seg][value=""]').checked = true;
    f.purpose.value = ''; f.loc.value = ''; f.type.value = ''; f.bhk.value = ''; st.budget = ''; near = null;
    $('#sort option[value=near]').hidden = true; $('#sort').value = 'new';
    onChange();
  });
  $('#f-toggle').addEventListener('click', function () {
    var open = !$('#filters').classList.contains('open');
    $('#filters').classList.toggle('open', open); this.setAttribute('aria-expanded', String(open));
  });
  $('#near').addEventListener('click', function () {
    var b = this; ST.busy(b, true, 'Finding you…');
    ST.detectLocation().then(function (a) {
      ST.busy(b, false);
      near = { lat: a.lat, lng: a.lng, name: [a.locality, a.city].filter(Boolean).join(', ') || 'your location' };
      $('#sort option[value=near]').hidden = false; $('#sort').value = 'near';
      if (a.city && Array.prototype.some.call(f.city.options, function (o) { return o.value === a.city; })) f.city.value = a.city;
      f.loc.value = '';
      onChange();
    }).catch(function (err) { ST.busy(b, false); ST.toast(err.message, 'error'); });
  });
  $('#more').addEventListener('click', function () { shown += 12; render(); });

  // ---- filtering
  function bhkNums(l) { return String(l.bhk || '').split(',').map(function (x) { return /rk/i.test(x) ? 1 : parseFloat(x); }).filter(function (n) { return !isNaN(n); }); }
  function match(l) {
    if (st.purpose && l.purpose !== st.purpose) return false;
    if (st.kind && l.kind !== st.kind) return false;
    if (st.seg && l.segment !== st.seg) return false;
    if (st.city && String(l.city).toLowerCase() !== st.city.toLowerCase()) return false;
    if (st.loc) { var a = String(l.locality).toLowerCase(), b = st.loc.toLowerCase(); if (a.indexOf(b) < 0 && b.indexOf(a) < 0) return false; }
    if (st.type && l.propertyType !== st.type) return false;
    if (st.bhk) { var want = +st.bhk, have = bhkNums(l); if (!have.some(function (n) { return want >= 4 ? n >= 4 : Math.floor(n) === want; })) return false; }
    if (!ST.inBudget(l, st.budget)) return false;
    return true;
  }
  function value(l) { return l.purpose === 'rent' ? Number(l.rent) || 0 : Number(l.price) || 0; }
  function sorter(a, b) {
    if (st.sort === 'low') return (value(a) || 9e15) - (value(b) || 9e15);
    if (st.sort === 'high') return value(b) - value(a);
    if (st.sort === 'near' && near) return dist(a) - dist(b);
    return (b.createdAt || 0) - (a.createdAt || 0);
  }
  function dist(l) { return l.lat && l.lng ? ST.distanceKm(near, { lat: +l.lat, lng: +l.lng }) : 1e6; }
  function heading(n) {
    var what = 'Properties';
    if (st.kind === 'project') what = 'New projects';
    else if (st.seg === 'Plots') what = 'Plots and land';
    else if (st.seg === 'Commercial') what = 'Commercial properties';
    else if (st.seg === 'Under Construction') what = 'Under-construction homes';
    else if (st.seg === 'Ready to Move') what = 'Ready-to-move homes';
    else if (st.seg === 'Resale') what = 'Resale homes';
    else if (st.seg === 'Rental') what = 'Homes';
    if (st.type) what = st.type.split(' / ').pop().replace(/^./, function (c) { return c.toUpperCase(); }) + (/s$/.test(st.type) ? '' : 's');
    if (st.bhk) what = (st.bhk === '4' ? '4+' : st.bhk) + ' BHK ' + (st.type ? what.toLowerCase() : 'homes');
    var pur = st.purpose === 'rent' ? ' for rent' : st.purpose === 'sale' && st.kind !== 'project' && st.seg !== 'Plots' ? ' for sale' : '';
    var place = st.loc ? st.loc + (st.city ? ', ' + st.city : '') : (st.city || 'Maharashtra');
    var t = what + pur + ' in ' + place;
    $('#ph-title').textContent = t;
    $('#crumb').textContent = t;
    document.title = t + ' | Stand Tall Realty';
    $('#r-count').textContent = n === null ? 'Loading properties…' : n + (n === 1 ? ' property' : ' properties') + ' found';
  }
  function render() {
    var list = all.filter(match).sort(sorter);
    heading(list.length);
    var note = $('#near-note');
    note.hidden = !(near && st.sort === 'near');
    if (near) note.textContent = 'Sorted by distance from ' + near.name + '.';
    $('#results').innerHTML = list.slice(0, shown).map(function (l) {
      var c = ST.card(l);
      if (near && st.sort === 'near' && l.lat && l.lng) c = c.replace('<p class="pc-loc">', '<p class="pc-loc"><b>' + dist(l).toFixed(1) + ' km</b>&nbsp;away in&nbsp;');
      return c;
    }).join('');
    $('#more').hidden = list.length <= shown;
    var nr = $('#no-results');
    nr.hidden = !!list.length;
    if (!list.length && !nr.dataset.ready) {
      nr.dataset.ready = '1';
      nr.innerHTML = '<div class="tools"><div class="empty" style="text-align:left"><h3>Nothing matches these filters yet</h3><p>New properties are added every week. Try a nearby locality or a wider budget, or tell us exactly what you need and we will call you with options that are not online yet.</p><button class="btn btn-ghost" type="button" id="nr-clear">Clear all filters</button></div><div class="panel"><h2>Tell us what you need</h2><div id="nr-lead"></div></div></div>';
      ST.leadForm($('#nr-lead'), { intent: st.purpose === 'rent' ? 'rent' : st.seg === 'Plots' ? 'plot_buy' : st.seg === 'Commercial' ? 'commercial' : st.kind === 'project' ? 'project' : 'buy', compact: true });
      $('#nr-clear').onclick = function () { $('#f-clear').click(); };
    }
  }
  heading(null);
  $('#results').innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
  ST.getListings().then(function (l) { all = l; render(); }).catch(function (err) {
    $('#r-count').textContent = 'Listings could not load';
    $('#results').innerHTML = '<div class="empty" style="grid-column:1/-1"><p>' + esc(err.message) + '</p><button class="btn btn-ghost" onclick="location.reload()">Try again</button></div>';
  });
})();
