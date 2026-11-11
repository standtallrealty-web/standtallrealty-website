/* Property detail page */
(function () {
  'use strict';
  var ST = window.ST, $ = ST.$, $$ = ST.$$, esc = ST.esc, icon = ST.icon;
  var id = ST.qs('id');
  var root = $('#pd'), bar = $('#pd-bar');
  var L = null;

  function waText() { return 'Hi Stand Tall Realty, I am interested in ' + L.id + ' – ' + L.title + ' (' + ST.priceLabel(L) + ST.priceSuffix(L) + '). ' + ST.absUrl(ST.listingUrl(L.id)); }

  function fail(err) {
    document.title = 'Property not available | Stand Tall Realty';
    root.innerHTML = '<div class="tools" style="padding:30px 0"><div class="empty" style="text-align:left"><h1 style="font-size:30px">' + (err.code === 'GONE' ? 'This property is no longer available' : 'We could not find this property') + '</h1>' +
      '<p>' + esc(err.code === 'GONE' ? err.message + ' Similar options may still be available.' : 'The link may be old, or the listing may be under review.') + '</p>' +
      '<p><a class="btn btn-navy" href="properties.html">Browse properties</a></p></div><div class="panel"><h2>Tell us what you need</h2><div id="gone-lead"></div></div></div>';
    ST.leadForm($('#gone-lead'), { intent: 'buy', compact: true });
    bar.hidden = true;
  }

  function fact(label, value) { return value ? '<div><dt>' + esc(label) + '</dt><dd>' + esc(value) + '</dd></div>' : ''; }
  function perSqft() {
    if (L.purpose !== 'sale' || L.kind === 'project' || !L.price || !L.carpetArea || (L.areaUnit && L.areaUnit !== 'sq ft')) return '';
    return '₹' + Math.round(L.price / L.carpetArea).toLocaleString('en-IN') + ' per sq ft';
  }
  function ytId(u) { var m = String(u).match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/); return m ? m[1] : ''; }

  function render() {
    var photos = L.photos || [];
    document.title = L.title + ' | Stand Tall Realty';
    var md = $('meta[name=description]'); if (md) md.setAttribute('content', (ST.priceLabel(L) + ' — ' + L.title + ', ' + ST.placeLabel(L)).slice(0, 160));
    var isRent = L.purpose === 'rent';
    var banner = '';
    if (L.isOwner) {
      var msg = { Pending: 'Your listing is waiting for review. Only you can see this page until it is approved.', Rejected: 'This listing was not approved' + (L.rejectReason ? ': ' + L.rejectReason : '.') + ' Edit it and submit again.', Approved: 'Your listing is live. Buyers can chat with you from this page.', Sold: 'You marked this property as sold.', Rented: 'You marked this property as rented.' }[L.status] || '';
      banner = '<div class="owner-banner ' + esc(L.status) + '">' + esc(msg) + ' <a href="post-property.html?edit=' + esc(L.id) + '">Edit listing</a> <a href="account.html" style="margin-left:12px">My listings</a></div>';
    } else if (L.status && L.status !== 'Approved') {
      banner = '<div class="owner-banner Pending">Admin preview — status: ' + esc(L.status) + '</div>';
    }
    var pills = ['<span class="pill gold">' + esc(ST.segLabel(L)) + '</span>'];
    if (L.tag) pills.push('<span class="pill gold">' + esc(L.tag) + '</span>');
    if (L.negotiable === 'Yes') pills.push('<span class="pill">Negotiable</span>');
    if (L.reraNumber) pills.push('<span class="pill ok">' + icon('shield') + 'MahaRERA registered</span>');
    pills.push('<span class="pill">' + icon('check') + 'Reviewed by our team</span>');

    var facts = [
      fact('Property type', L.propertyType), fact(L.kind === 'project' ? 'Configurations' : 'Size', L.category === 'Residential' ? ST.bhkLabel(L) : ''),
      fact(L.category === 'Plot' ? 'Plot area' : 'Carpet area', ST.areaLabel(L)), fact('Floor', L.floor ? L.floor + (L.totalFloors ? ' of ' + L.totalFloors : '') : ''),
      fact('Furnishing', L.furnishing), fact('Facing', L.facing), fact('Parking', L.parking), fact('Bathrooms', L.bathrooms), fact('Balconies', L.balconies),
      fact('Possession', [L.possession, L.possessionDate].filter(Boolean).join(', ')), fact('Age of property', L.ageOfProperty),
      fact('Plot status', L.plotType), fact('Security deposit', isRent && L.deposit ? ST.rupees(L.deposit) : ''), fact('Maintenance', L.maintenance ? ST.rupees(L.maintenance) + ' / month' : ''),
      fact('Available from', L.availableFrom ? new Date(L.availableFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''),
      fact('Preferred tenants', L.tenantPreference), fact('MahaRERA no.', L.reraNumber), fact('Listed by', L.isFirm ? 'Stand Tall Realty' : L.ownerName + ' (' + String(L.ownerRole || 'Owner').toLowerCase() + ')'),
      fact('Listing ID', L.id), fact('Posted', L.createdAt ? ST.timeAgo(L.createdAt) : '')
    ].join('');
    var priceRows = String(L.priceNote || '').split('\n').filter(Boolean).map(function (line) {
      var parts = line.split(/\s+[—–-]\s+/);
      return '<tr>' + (parts.length > 1 ? '<td>' + esc(parts.slice(0, -1).join(', ')) + '</td><td>' + esc(parts[parts.length - 1]) + '</td>' : '<td colspan="2">' + esc(line) + '</td>') + '</tr>';
    }).join('');
    var highlights = String(L.highlights || '').split('\n').filter(Boolean).map(function (h) { return '<li>' + icon('check') + '<span>' + esc(h) + '</span></li>'; }).join('');
    var amen = String(L.amenities || '').split(',').map(function (a) { return a.trim(); }).filter(Boolean).map(function (a) { return '<span>' + esc(a) + '</span>'; }).join('');
    var q = L.lat && L.lng ? L.lat + ',' + L.lng : [L.landmark, L.locality, L.city, L.state].filter(Boolean).join(', ');
    var yt = ytId(L.videoUrl);
    var video = yt ? '<div class="video-wrap"><iframe src="https://www.youtube-nocookie.com/embed/' + yt + '" title="Property video" loading="lazy" allowfullscreen></iframe></div>' :
      (L.videoUrl ? '<a class="btn btn-ghost" href="' + esc(L.videoUrl) + '" target="_blank" rel="noopener">Watch the video tour</a>' : '');

    root.innerHTML = banner +
      '<nav class="crumbs" aria-label="Breadcrumb" style="color:var(--muted)"><a href="index.html" style="color:var(--muted)">Home</a> / <a style="color:var(--muted)" href="properties.html?city=' + encodeURIComponent(L.city) + '">' + esc(L.city) + '</a> / <a style="color:var(--muted)" href="properties.html?city=' + encodeURIComponent(L.city) + '&loc=' + encodeURIComponent(L.locality) + '">' + esc(L.locality) + '</a> / ' + esc(L.id) + '</nav>' +
      '<div class="pd-top"><div><h1>' + esc(L.title) + '</h1><p class="pd-loc">' + icon('pin') + esc([L.landmark, L.locality, L.city].filter(Boolean).join(', ')) + '</p></div>' +
      '<div class="pd-actions"><button class="btn btn-ghost" type="button" id="share">' + icon('share') + 'Share</button><button class="btn btn-ghost" type="button" data-save="' + esc(L.id) + '" data-label="1" aria-pressed="' + ST.Saved.has(L.id) + '">' + icon(ST.Saved.has(L.id) ? 'heart' : 'heartOutline') + '<span>' + (ST.Saved.has(L.id) ? 'Saved' : 'Save') + '</span></button></div></div>' +
      '<div class="pd-grid"><div>' +
      '<div class="gallery"><div class="gallery-main" id="g-main"></div>' + (photos.length > 1 ? '<button class="gallery-nav prev" type="button" aria-label="Previous photo">' + icon('arrowLeft') + '</button><button class="gallery-nav next" type="button" aria-label="Next photo">' + icon('arrowLeft') + '</button><span class="gallery-count" id="g-count"></span>' : '') + '</div>' +
      (photos.length > 1 ? '<div class="thumbs" id="thumbs">' + photos.map(function (p, i) { return '<button type="button" data-i="' + i + '" aria-label="Photo ' + (i + 1) + '">' + ST.imgTag(p, 240, '') + '</button>'; }).join('') + '</div>' : '') +
      '<div class="price-box"><span class="p">' + esc(ST.priceLabel(L)) + '<small>' + ST.priceSuffix(L) + '</small></span>' +
      (isRent && L.deposit ? '<span class="per">Deposit ' + esc(ST.rupees(L.deposit)) + '</span>' : '') + (perSqft() ? '<span class="per">' + perSqft() + '</span>' : '') + '</div>' +
      '<p class="tagline">' + pills.join('') + '</p>' +
      '<section class="pd-section"><h2>Key details</h2><dl class="facts">' + facts + '</dl></section>' +
      (priceRows ? '<section class="pd-section"><h2>Price list</h2><table class="price-table">' + priceRows + '</table><p class="small muted" style="margin:10px 0 0">Prices are as shared by the developer and may change. Stamp duty, registration and other charges are extra.</p></section>' : '') +
      (highlights ? '<section class="pd-section"><h2>Highlights</h2><ul class="hl">' + highlights + '</ul></section>' : '') +
      (L.description ? '<section class="pd-section"><h2>About this property</h2><p class="desc">' + esc(L.description) + '</p></section>' : '') +
      (amen ? '<section class="pd-section"><h2>Amenities</h2><div class="amen">' + amen + '</div></section>' : '') +
      (video ? '<section class="pd-section"><h2>Video tour</h2>' + video + '</section>' : '') +
      '<section class="pd-section"><h2>Location</h2><p class="pd-loc">' + icon('pin') + esc([L.landmark, L.locality, L.city, L.pincode].filter(Boolean).join(', ')) + '</p>' +
      '<iframe class="map" title="Map of ' + esc(L.locality) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=' + encodeURIComponent(q) + '&z=' + (L.lat ? 15 : 14) + '&output=embed"></iframe>' +
      '<p style="margin:10px 0 0"><a href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q) + '" target="_blank" rel="noopener">Open in Google Maps</a></p></section>' +
      (L.purpose === 'sale' && L.price ? '<section class="pd-section" id="pd-emi"><h2>EMI estimate</h2><div id="mini-emi"></div></section>' : '') +
      '<button class="report-link" type="button" id="report">' + icon('flag') + 'Report this listing</button>' +
      '</div><aside id="contact-col"></aside></div>' +
      '<section class="section" id="similar-sec" hidden style="padding-bottom:0"><div class="section-head"><div><h2>Similar properties</h2></div><a class="link-more" href="properties.html?city=' + encodeURIComponent(L.city) + '&seg=' + encodeURIComponent(L.segment) + '">See more</a></div><div class="cards" id="similar"></div></section>';

    gallery(photos);
    contactCard();
    miniEmi();
    similar();
    $('#share').addEventListener('click', share);
    $('#report').addEventListener('click', report);
  }

  // ---- gallery
  function gallery(photos) {
    var i = 0, main = $('#g-main');
    function show(n) {
      if (!photos.length) { main.innerHTML = ST.art(L); return; }
      i = (n + photos.length) % photos.length;
      main.innerHTML = ST.art(L) + ST.imgTag(photos[i], 1600, L.title + ' — photo ' + (i + 1));
      var c = $('#g-count'); if (c) c.textContent = (i + 1) + ' / ' + photos.length;
      $$('#thumbs button').forEach(function (b) { b.setAttribute('aria-current', String(+b.dataset.i === i)); });
    }
    show(0);
    var prev = $('.gallery-nav.prev'), next = $('.gallery-nav.next');
    if (prev) prev.onclick = function () { show(i - 1); };
    if (next) next.onclick = function () { show(i + 1); };
    var th = $('#thumbs'); if (th) th.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) show(+b.dataset.i); });
    var x0 = null;
    main.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    main.addEventListener('touchend', function (e) { if (x0 === null || photos.length < 2) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1)); x0 = null; });
  }

  // ---- contact column + mobile bar
  function contactCard() {
    var col = $('#contact-col');
    if (L.isOwner) {
      col.innerHTML = '<div class="contact-card"><div class="cc-head"><span class="cc-avatar">' + esc(ST.initials(L.ownerName)) + '</span><div><b>This is your listing</b><small>' + esc(L.status || '') + '</small></div></div>' +
        '<div class="cc-body"><a class="btn btn-navy" href="post-property.html?edit=' + esc(L.id) + '">Edit listing</a><a class="btn btn-ghost" href="chats.html">' + icon('chat') + 'Your chats</a><a class="btn btn-ghost" href="account.html">My listings</a></div></div>';
      bar.innerHTML = '<a href="post-property.html?edit=' + esc(L.id) + '">' + icon('building') + 'Edit</a><a href="chats.html">' + icon('chat') + 'Chats</a><a href="account.html">' + icon('user') + 'Account</a><a href="index.html">' + icon('key') + 'Home</a>';
      return;
    }
    if (L.isFirm) {
      col.innerHTML = '<div class="contact-card"><div class="cc-head"><img src="assets/img/mark-sm.png" alt=""><div><b>Stand Tall Realty</b><small>Our team handles this property</small></div></div>' +
        '<div class="cc-body"><a class="btn btn-navy" href="' + ST.tel() + '">' + icon('phone') + 'Call ' + esc(ST.fmtPhone(ST.S.phone)) + '</a>' +
        '<a class="btn btn-wa" href="' + ST.wa(waText()) + '" target="_blank" rel="noopener">' + icon('wa') + 'WhatsApp us</a>' +
        '<button class="btn btn-ghost" type="button" data-chat>' + icon('chat') + 'Chat on the website</button><hr class="cc-sep">' +
        '<b style="font-size:16px">Request a call back or site visit</b><div id="cc-lead"></div></div></div>';
      ST.leadForm($('#cc-lead'), { listing: L, compact: true, submitLabel: 'Request call back', messagePh: 'e.g. I can visit on Saturday morning' });
      bar.innerHTML = '<a href="' + ST.tel() + '">' + icon('phone') + 'Call</a><a class="wa" href="' + ST.wa(waText()) + '" target="_blank" rel="noopener">' + icon('wa') + 'WhatsApp</a><button type="button" data-chat>' + icon('chat') + 'Chat</button><button type="button" data-enq>' + icon('calendar') + 'Visit</button>';
    } else {
      var direct = L.phoneMode === 'direct';
      col.innerHTML = '<div class="contact-card"><div class="cc-head"><span class="cc-avatar">' + esc(ST.initials(L.ownerName)) + '</span><div><b>' + esc(L.ownerName) + '</b><small>' + esc(L.ownerRole || 'Owner') + ', listed ' + esc(ST.timeAgo(L.createdAt)) + '</small></div></div>' +
        '<div class="cc-body"><button class="btn btn-navy" type="button" data-chat>' + icon('chat') + 'Chat with ' + esc(L.ownerName) + '</button>' +
        '<div id="phone-slot"><button class="btn btn-ghost btn-block" type="button" data-phone>' + icon(direct ? 'eye' : 'lock') + (direct ? 'Show phone number' : 'Request phone number') + '</button>' +
        '<p class="cc-note">' + (direct ? 'Log in to see the number and call directly.' : 'The ' + esc(String(L.ownerRole || 'owner').toLowerCase()) + ' shares their number after approving your request in chat.') + '</p></div><hr class="cc-sep">' +
        '<b style="font-size:16px">Want help with the price or paperwork?</b><p class="cc-note" style="margin:0">Stand Tall Realty can check the property, negotiate and guide you through the deal.</p>' +
        '<button class="btn btn-ghost" type="button" data-enq>Talk to Stand Tall Realty</button></div></div>';
      bar.innerHTML = '<button type="button" data-chat>' + icon('chat') + 'Chat</button><button type="button" data-phone>' + icon(direct ? 'phone' : 'lock') + (direct ? 'Call' : 'Ask number') + '</button><a class="wa" href="' + ST.wa(waText()) + '" target="_blank" rel="noopener">' + icon('wa') + 'Help</a><button type="button" data-save="' + esc(L.id) + '" aria-pressed="' + ST.Saved.has(L.id) + '">' + icon(ST.Saved.has(L.id) ? 'heart' : 'heartOutline') + 'Save</button>';
    }
    $$('[data-chat]').forEach(function (b) { b.addEventListener('click', startChat); });
    $$('[data-phone]').forEach(function (b) { b.addEventListener('click', phone); });
    $$('[data-enq]').forEach(function (b) { b.addEventListener('click', function () { ST.openEnquiry({ listing: L, title: 'Talk to Stand Tall Realty', submitLabel: 'Request call back' }); }); });
  }

  function startChat() {
    var btn = this;
    ST.Auth.require(L.isFirm ? 'Log in to chat with Stand Tall Realty about this property.' : 'Log in to chat with ' + L.ownerName + '. It takes less than a minute.').then(function () {
      ST.busy(btn, true, 'Opening chat…');
      return ST.api('startChat', { listingId: L.id });
    }).then(function (r) { location.href = 'chats.html?c=' + encodeURIComponent(r.chatId); })
      .catch(function (err) { ST.busy(btn, false); if (err.code !== 'CANCELLED') ST.toast(err.message, 'error'); });
  }

  function phone() {
    var btn = this;
    ST.Auth.require(L.phoneMode === 'direct' ? 'Log in to see the phone number.' : 'Log in to ask ' + L.ownerName + ' for their number.').then(function () {
      ST.busy(btn, true, 'Please wait…');
      if (L.phoneMode === 'direct') return ST.api('revealPhone', { listingId: L.id }).then(function (r) {
        ST.busy(btn, false);
        if (!r.phone) return ST.toast('The number is shared after approval. Send a chat request instead.', 'error');
        $('#phone-slot').innerHTML = '<div class="cc-phone"><div><small class="muted">' + esc(L.ownerName) + '</small><br><b>' + esc(ST.fmtPhone(r.phone)) + '</b></div><a class="btn btn-wa btn-sm" href="' + ST.wa('Hi, I saw your listing ' + L.id + ' (' + L.title + ') on Stand Tall Realty.', r.phone) + '" target="_blank" rel="noopener">' + icon('wa') + '</a></div>' +
          '<a class="btn btn-navy btn-block" href="tel:+91' + esc(r.phone) + '">' + icon('phone') + 'Call now</a>';
        $$('#pd-bar [data-phone]').forEach(function (b) { b.outerHTML = '<a href="tel:+91' + esc(r.phone) + '">' + icon('phone') + 'Call</a>'; });
      });
      return ST.api('startChat', { listingId: L.id, requestPhone: true }).then(function (r) {
        ST.busy(btn, false);
        $('#phone-slot').innerHTML = '<div class="cc-phone" style="background:var(--warn-bg)"><div><b style="font-size:15px">Request sent</b><br><small>You will see the number in your chat once ' + esc(L.ownerName) + ' approves.</small></div></div>' +
          '<a class="btn btn-ghost btn-block" href="chats.html?c=' + encodeURIComponent(r.chatId) + '">' + icon('chat') + 'Open chat</a>';
        ST.toast('Request sent to ' + L.ownerName + '.', 'ok');
      });
    }).catch(function (err) { ST.busy(btn, false); if (err.code !== 'CANCELLED') ST.toast(err.message, 'error'); });
  }

  // ---- extras
  function miniEmi() {
    var box = $('#mini-emi'); if (!box) return;
    var loan = Math.round(L.price * 0.8 / 100000) * 100000;
    box.innerHTML = '<div class="grid-3"><label class="field"><span>Loan amount</span><div class="money"><i>₹</i><input id="me-p" inputmode="numeric" value="' + loan.toLocaleString('en-IN') + '"></div></label>' +
      '<label class="field"><span>Interest (% per year)</span><input id="me-r" inputmode="decimal" value="8.5"></label><label class="field"><span>Years</span><input id="me-n" inputmode="numeric" value="20"></label></div>' +
      '<p style="margin:14px 0 0;font-size:17px">Estimated EMI: <b id="me-out" style="font-family:var(--serif);font-size:24px"></b> per month</p><p class="small muted" style="margin:4px 0 0">Assumes a loan of 80% of the price. Your bank decides the final rate.</p>';
    function calc() {
      var n = function (v) { return Number(String(v).replace(/[^\d.]/g, '')) || 0; };
      var P = n($('#me-p').value), r = n($('#me-r').value) / 1200, m = n($('#me-n').value) * 12;
      var e = P && m ? (r ? P * r * Math.pow(1 + r, m) / (Math.pow(1 + r, m) - 1) : P / m) : 0;
      $('#me-out').textContent = ST.rupees(Math.round(e)) || '₹0';
    }
    box.addEventListener('input', calc); calc();
  }
  function similar() {
    ST.getListings().then(function (all) {
      var list = all.filter(function (x) { return x.id !== L.id && x.segment === L.segment && String(x.city).toLowerCase() === String(L.city).toLowerCase(); })
        .sort(function (a, b) { return (b.locality === L.locality) - (a.locality === L.locality) || b.createdAt - a.createdAt; }).slice(0, 4);
      if (!list.length) return;
      $('#similar').innerHTML = list.map(function (x) { return ST.card(x); }).join('');
      $('#similar-sec').hidden = false;
    }).catch(function () {});
  }
  function share() {
    var url = ST.absUrl(ST.listingUrl(L.id)), text = L.title + ' — ' + ST.priceLabel(L) + ST.priceSuffix(L);
    if (navigator.share) { navigator.share({ title: L.title, text: text, url: url }).catch(function () {}); return; }
    var m = ST.openModal({ title: 'Share this property', size: 'sm', body: '<div class="stack"><a class="btn btn-wa btn-block" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(text + ' ' + url) + '">' + icon('wa') + 'Share on WhatsApp</a><div class="combo"><input value="' + esc(url) + '" readonly id="share-url"><button class="btn btn-ghost" type="button" id="copy">Copy</button></div></div>' });
    $('#copy', m.el).onclick = function () { var i = $('#share-url', m.el); i.select(); try { navigator.clipboard.writeText(url); } catch (e) { document.execCommand('copy'); } ST.toast('Link copied.'); };
  }
  function report() {
    var u = ST.Auth.user();
    var m = ST.openModal({ title: 'Report this listing', size: 'sm', body: '<form class="stack" novalidate><fieldset class="field"><legend>What is wrong?</legend><div class="stack">' +
      ['Already sold or rented', 'Wrong price or details', 'Photos are not of this property', 'Looks like a fraud', 'Other'].map(function (r, i) { return '<label class="check"><input type="radio" name="reason" value="' + r + '"' + (i ? '' : ' checked') + '> ' + r + '</label>'; }).join('') + '</div></fieldset>' +
      (u ? '' : '<div class="grid-2"><label class="field"><span>Your name</span><input name="name"></label><label class="field"><span>Mobile</span><input name="phone" type="tel" inputmode="numeric"></label></div>') +
      '<label class="field"><span>Details <em>(optional)</em></span><textarea name="more" rows="2"></textarea></label><div class="form-actions"><button class="btn btn-navy btn-block" type="submit">Send report</button></div></form>' });
    $('form', m.el).addEventListener('submit', function (e) {
      e.preventDefault();
      var d = ST.formData(this), b = $('button[type=submit]', this);
      ST.busy(b, true, 'Sending…');
      ST.api('report', { listingId: L.id, reason: d.reason + (d.more ? ': ' + d.more : ''), name: u ? u.name : d.name, phone: u ? u.phone : d.phone })
        .then(function () { m.close(); ST.toast('Thanks. Our team will check this listing.', 'ok'); })
        .catch(function (err) { ST.busy(b, false); ST.toast(err.message, 'error'); });
    });
  }

  if (!id) { fail({ code: 'NOT_FOUND' }); return; }
  var payload = { id: id };
  if (ST.Admin.token()) payload.adminToken = ST.Admin.token();
  ST.api('listing', payload).then(function (l) { L = l; render(); }).catch(fail);
})();
