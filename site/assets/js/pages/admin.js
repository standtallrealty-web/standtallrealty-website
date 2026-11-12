/* Admin panel: approve listings, manage leads, chats and users */
(function () {
  'use strict';
  var ST = window.ST, $ = ST.$, $$ = ST.$$, esc = ST.esc, icon = ST.icon;
  var root = $('#admin-root'), tabsBox = $('#admin-tabs'), tabsEl = $('#tabs');
  var ov = null, listingsCache = null, leadsCache = null;
  var TABS = [['overview', 'Overview'], ['pending', 'Pending'], ['listings', 'All listings'], ['add', 'Add listing'], ['leads', 'Leads'], ['chats', 'Chats'], ['users', 'Users']];
  var STATUS_PILL = { Pending: 'warn', Approved: 'ok', Rejected: 'bad', Sold: '', Rented: '' };

  // ---------- login
  function login() {
    tabsBox.hidden = true; $('#logout').hidden = true;
    root.innerHTML = '<form class="panel admin-login stack" novalidate><h1 style="font-size:28px">Admin login</h1><p class="muted">Approve listings, see leads and reply to chats.</p>' +
      '<label class="field"><span>Admin password</span><input name="password" type="password" autocomplete="current-password" autofocus></label>' +
      (ST.DEMO ? '<p class="modal-reason">Preview mode: the password is <b>demo1234</b>. Your real password is set in the Google Apps Script code.</p>' : '') +
      '<div class="form-actions"><button class="btn btn-navy btn-block" type="submit">Log in</button></div></form>';
    var f = $('form', root);
    f.addEventListener('submit', function (e) {
      e.preventDefault(); var b = $('button', f); ST.busy(b, true, 'Checking…');
      ST.api('adminLogin', { password: f.password.value }).then(function (r) { ST.Admin.set(r.adminToken); start(); })
        .catch(function (err) { ST.busy(b, false); ST.fieldError(f, err.message); });
    });
  }
  $('#logout').addEventListener('click', function () { ST.Admin.clear(); location.hash = ''; login(); });

  function start() {
    tabsBox.hidden = false; $('#logout').hidden = false;
    refreshOverview().then(route).catch(handleErr);
  }
  function handleErr(err) {
    if (err && err.code === 'ADMIN_REQUIRED') return login();
    root.innerHTML = '<div class="empty"><h3>Something went wrong</h3><p>' + esc(err && err.message) + '</p><button class="btn btn-ghost" onclick="location.reload()">Reload</button></div>';
  }
  function refreshOverview() { return ST.api('adminOverview').then(function (o) { var prev = ov; ov = o; renderTabs(); if (prev && o.pending > prev.pending) ST.toast('New listing waiting for approval.', 'ok'); if (prev && o.newLeads > prev.newLeads) ST.toast('New enquiry received.', 'ok'); return o; }); }
  /** A lead the admin marked New themselves is not a new website enquiry: count it so no toast fires. */
  function ownNewLead(n) { if (ov && n > 0) ov.newLeads = (ov.newLeads || 0) + n; }
  function cur() { var h = (location.hash || '#overview').slice(1).split('='); return { tab: h[0] || 'overview', arg: h[1] || '' }; }
  function renderTabs() {
    var c = cur().tab, n = { pending: ov && ov.pending, leads: ov && ov.newLeads, chats: ov && ov.adminUnread };
    tabsEl.innerHTML = TABS.map(function (t) {
      return '<a href="#' + t[0] + '" role="tab" aria-selected="' + (t[0] === c || (c === 'edit' && t[0] === 'add')) + '">' + t[1] + (n[t[0]] ? '<span class="count" style="background:var(--gold);color:var(--navy)">' + n[t[0]] + '</span>' : '') + '</a>';
    }).join('');
  }
  function route() {
    renderTabs();
    var r = cur();
    window.scrollTo(0, 0);
    ({ overview: overview, pending: function () { listingsView(true); }, listings: function () { listingsView(false); }, add: function () { editor('', r.arg); },
      edit: function () { editor(r.arg); }, import: importView, leads: function () { leadsView(r.arg); }, chats: chatsView, users: usersView }[r.tab] || overview)();
  }
  window.addEventListener('hashchange', function () { if (ST.Admin.token()) route(); });
  setInterval(function () { if (ST.Admin.token() && !document.hidden) refreshOverview().catch(function () {}); }, 60000);

  // ---------- overview
  function overview() {
    var o = ov;
    root.innerHTML = '<h1 style="font-size:28px">Overview</h1><div class="kpis">' +
      kpi('#pending', o.pending, 'Listings waiting for approval', o.pending) + kpi('#leads', o.newLeads, 'New enquiries to call', o.newLeads) +
      (o.followUpsDue !== undefined ? kpi('#leads=due', o.followUpsDue, 'Follow-ups due today', o.followUpsDue) : '') +
      kpi('#chats', o.adminUnread, 'Unread chats for you', o.adminUnread) + kpi('#listings', o.live, 'Live listings') +
      kpi('#leads', o.leadsToday, 'Enquiries in the last 24 hours' + (o.otp && o.otp.on ? ', ' + (o.verifiedToday || 0) + ' verified by OTP' : '')) + kpi('#listings', o.total, 'All listings') + kpi('#users', o.users, 'Registered users') + kpi('#chats', o.chats, 'Chats on the website') + '</div>' +
      '<div class="tools"><div class="panel"><h2>Daily routine</h2><ol class="hl" style="list-style:decimal;padding-left:20px;display:block">' +
      '<li style="display:list-item;margin-bottom:8px">Approve or reject <a href="#pending">pending listings</a>. Call the owner first if anything looks unclear.</li>' +
      '<li style="display:list-item;margin-bottom:8px">Call every <a href="#leads">new enquiry</a> and update its status.</li>' +
      '<li style="display:list-item;margin-bottom:8px">Reply to <a href="#chats">chats</a> sent to Stand Tall Realty.</li>' +
      '<li style="display:list-item">Add your own projects and rentals from <a href="#add">Add listing</a>.</li></ol></div>' +
      '<div class="panel"><h2>Your data</h2><p class="muted">Everything is stored in your Google Sheet. You can also open it on your phone with the Google Sheets app.</p>' +
      (o.sheetUrl && !ST.DEMO ? '<a class="btn btn-ghost" href="' + esc(o.sheetUrl) + '" target="_blank" rel="noopener">Open Google Sheet</a>' : '<p class="small muted">Preview mode: data is kept in this browser only.</p>') + '</div>' +
      otpPanel(o.otp || {}) + '</div>';
  }
  function otpPanel(s) {
    if (!s.on) return '<div class="panel" id="otp-status"><h2>SMS OTP</h2><p><span class="pill">Off</span></p><p class="muted">Enquiries arrive without checking the mobile number. To switch on real OTP, paste your Fast2SMS API key in Code.gs (guide, Step 7) and deploy a new version.</p></div>';
    return '<div class="panel" id="otp-status"><h2>SMS OTP</h2><p><span class="pill ok">' + icon('shield') + 'On</span> <span class="muted">' + esc(s.provider) + '</span></p>' +
      '<p class="muted">' + (s.sentToday || 0) + ' of ' + (s.limit || 0) + ' OTP SMS used today. ' + (s.enquiry ? 'Enquiry forms ask clients to verify their number.' : 'Enquiry forms do not ask for OTP (OTP_ON_ENQUIRY is false).') + '</p>' +
      (s.lastError ? '<p class="form-error">Last SMS problem, ' + esc(ST.timeAgo(s.lastErrorAt)) + ': ' + esc(s.lastError) + '</p>' : '') + '</div>';
  }
  function kpi(href, n, label, alert) { return '<a class="kpi' + (alert ? ' alert' : '') + '" href="' + href + '"><b>' + (n || 0) + '</b><span>' + esc(label) + '</span></a>'; }

  // ---------- listings
  function loadListings(force) {
    if (listingsCache && !force) return Promise.resolve(listingsCache);
    return ST.api('adminListings').then(function (l) { listingsCache = l; return l; });
  }
  function listingsView(pendingOnly) {
    root.innerHTML = '<h1 style="font-size:28px">' + (pendingOnly ? 'Waiting for approval' : 'All listings') + '</h1>' +
      (pendingOnly ? '' : '<div class="toolbar"><input class="grow" id="lq" placeholder="Search title, ID, area or owner"><select id="ls"><option value="">Any status</option><option>Pending</option><option>Approved</option><option>Rejected</option><option>Sold</option><option>Rented</option></select><select id="lsrc"><option value="">Anyone</option><option value="admin">Stand Tall Realty</option><option value="owner">Owners / builders / agents</option></select></div>') +
      '<div id="lbox"><div class="skeleton" style="min-height:160px"></div></div>';
    function draw() {
      var q = ($('#lq') || {}).value || '', s = ($('#ls') || {}).value || '', src = ($('#lsrc') || {}).value || '';
      var list = listingsCache.filter(function (l) {
        if (pendingOnly && l.status !== 'Pending') return false;
        if (s && l.status !== s) return false;
        if (src && l.source !== src) return false;
        if (q) { var hay = [l.id, l.title, l.locality, l.city, l.owner && l.owner.name, l.owner && l.owner.phone, l.projectName].join(' ').toLowerCase(); if (hay.indexOf(q.toLowerCase()) < 0) return false; }
        return true;
      });
      $('#lbox').innerHTML = list.length ? list.map(aCard).join('') : '<div class="empty"><h3>' + (pendingOnly ? 'Nothing to approve right now' : 'No listings match') + '</h3>' + (pendingOnly ? '<p>New listings from owners will appear here.</p>' : '') + '</div>';
    }
    loadListings(true).then(draw).catch(handleErr);
    ['#lq', '#ls', '#lsrc'].forEach(function (s) { var el = $(s); if (el) el.addEventListener('input', draw); });
  }
  function aCard(l) {
    var media = ST.art(l) + (l.photos && l.photos[0] ? ST.imgTag(l.photos[0], 400, '') : '');
    var o = l.owner;
    var owner = l.source === 'admin' ? '<div class="a-owner">' + icon('shield') + '<b>Stand Tall Realty listing</b>' + (l.projectName ? '<span>Project: ' + esc(l.projectName) + '</span>' : '') + '</div>' :
      '<div class="a-owner"><span>Posted by <b>' + esc(o ? o.name : l.ownerName) + '</b> (' + esc(String(l.ownerRole || 'Owner').toLowerCase()) + ')</span>' +
      '<a href="tel:+91' + esc(l.contactPhone) + '">' + esc(ST.fmtPhone(l.contactPhone)) + '</a>' +
      '<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="' + ST.wa('Hi ' + (o ? o.name.split(' ')[0] : '') + ', this is Stand Tall Realty about your listing ' + l.id + ' (' + l.title + ').', l.contactPhone) + '">' + icon('wa') + 'WhatsApp</a>' +
      (o && o.email ? '<span>' + esc(o.email) + '</span>' : '') + '<span>Number: ' + (l.phoneMode === 'direct' ? 'shown to buyers' : 'after approval') + '</span>' + (l.projectName ? '<span>Society: ' + esc(l.projectName) + '</span>' : '') + '</div>';
    var actions = [];
    if (l.status !== 'Approved') actions.push('<button class="btn btn-navy btn-sm" data-act="approve" data-id="' + l.id + '">' + icon('check') + 'Approve</button>');
    if (l.status === 'Pending') actions.push('<button class="btn btn-ghost btn-sm" data-act="approve-feature" data-id="' + l.id + '">Approve and feature</button>');
    if (l.status === 'Pending' || l.status === 'Approved') actions.push('<button class="btn btn-ghost btn-sm" data-act="reject" data-id="' + l.id + '">Reject</button>');
    if (l.status === 'Approved') actions.push('<button class="btn btn-ghost btn-sm" data-act="feature" data-id="' + l.id + '">' + icon('star') + (l.featured === 'Yes' ? 'Remove from home page' : 'Feature on home page') + '</button>', '<button class="btn btn-ghost btn-sm" data-act="' + (l.purpose === 'rent' ? 'rented' : 'sold') + '" data-id="' + l.id + '">Mark ' + (l.purpose === 'rent' ? 'rented' : 'sold') + '</button>');
    actions.push('<a class="btn btn-ghost btn-sm" href="#edit=' + l.id + '">Edit</a>', '<a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="property.html?id=' + l.id + '">Preview</a>', '<button class="btn btn-ghost btn-sm" data-act="delete" data-id="' + l.id + '">Delete</button>');
    return '<article class="a-card"><a class="my-thumb" href="property.html?id=' + l.id + '" target="_blank" rel="noopener">' + media + '</a><div>' +
      '<div><span class="pill ' + (STATUS_PILL[l.status] || '') + '">' + esc(l.status) + '</span> <span class="pill">' + esc(l.segment) + '</span>' + (l.featured === 'Yes' ? ' <span class="pill gold">' + icon('star') + 'Featured</span>' : '') + (l.tag ? ' <span class="pill gold">' + esc(l.tag) + '</span>' : '') + ' <span class="small muted">' + esc(l.id) + '</span></div>' +
      '<h3>' + esc(l.title) + '</h3><div class="a-meta"><b style="color:var(--ink)">' + esc(ST.priceLabel(l)) + esc(ST.priceSuffix(l)) + '</b><span>' + esc(ST.placeLabel(l)) + '</span><span>' + (l.photos || []).length + ' photos</span><span>' + (l.views || 0) + ' views</span><span>' + (l.chats || 0) + ' chats</span><span>Posted ' + esc(ST.timeAgo(l.createdAt)) + '</span></div>' +
      owner + (l.description ? '<p class="small muted" style="margin:8px 0 0">' + esc(String(l.description).slice(0, 220)) + (String(l.description).length > 220 ? '…' : '') + '</p>' : '') +
      (l.rejectReason && l.status === 'Rejected' ? '<p class="reject-note">Rejected: ' + esc(l.rejectReason) + '</p>' : '') +
      (l.adminNotes ? '<p class="small" style="margin:8px 0 0;background:#FFF9EC;padding:8px 10px;border-radius:8px">Note: ' + esc(l.adminNotes) + '</p>' : '') +
      '<div class="a-actions">' + actions.join('') + '</div></div></article>';
  }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    var id = b.dataset.id, act = b.dataset.act, l = (listingsCache || []).filter(function (x) { return x.id === id; })[0] || {};
    function done(msg) { ST.toast(msg, 'ok'); refreshOverview().catch(function () {}); route(); }
    function fail(err) { ST.busy(b, false); ST.toast(err.message, 'error'); }
    if (act === 'approve' || act === 'approve-feature') { ST.busy(b, true); ST.api('adminSetListing', { id: id, status: 'Approved', featured: act === 'approve-feature' ? true : undefined }).then(function () { done('Approved. ' + id + ' is live.'); }).catch(fail); }
    if (act === 'feature') { ST.busy(b, true); ST.api('adminSetListing', { id: id, featured: l.featured !== 'Yes' }).then(function () { done(l.featured === 'Yes' ? 'Removed from home page.' : 'Featured on the home page.'); }).catch(fail); }
    if (act === 'sold' || act === 'rented') { ST.busy(b, true); ST.api('adminSetListing', { id: id, status: act === 'sold' ? 'Sold' : 'Rented' }).then(function () { done('Marked ' + act + '.'); }).catch(fail); }
    if (act === 'delete') ST.confirmBox('Delete ' + id + '?', 'This removes the listing permanently from the website and the sheet.', 'Delete', true).then(function (ok) {
      if (!ok) return; ST.busy(b, true); ST.api('adminDeleteListing', { id: id }).then(function () { done('Deleted.'); }).catch(fail);
    });
    if (act === 'reject') rejectModal(id);
  });
  function rejectModal(id) {
    var reasons = ['Please add clear photos of the property', 'Price or details look incorrect', 'Duplicate listing', 'Could not verify ownership', 'Incomplete address or location'];
    var m = ST.openModal({ title: 'Reject ' + id, size: 'sm', body: '<form class="stack" novalidate><fieldset class="field"><legend>Reason (the owner will see this)</legend><div class="stack">' +
      reasons.map(function (r, i) { return '<label class="check"><input type="radio" name="r" value="' + esc(r) + '"' + (i ? '' : ' checked') + '> ' + esc(r) + '</label>'; }).join('') +
      '<label class="check"><input type="radio" name="r" value="other"> Other</label></div></fieldset><label class="field"><span>Details <em>(optional)</em></span><textarea name="more" rows="2" maxlength="250"></textarea></label>' +
      '<div class="form-actions"><button class="btn btn-danger btn-block" type="submit">Reject listing</button></div></form>' });
    $('form', m.el).addEventListener('submit', function (e) {
      e.preventDefault(); var d = ST.formData(this), b = $('button', this);
      var reason = (d.r === 'other' ? '' : d.r) + (d.more ? (d.r === 'other' ? '' : '. ') + d.more : '');
      ST.busy(b, true);
      ST.api('adminSetListing', { id: id, status: 'Rejected', rejectReason: reason || 'Please check the details and resubmit.' }).then(function () { m.close(); ST.toast('Rejected. The owner can edit and resubmit.', 'ok'); refreshOverview(); route(); })
        .catch(function (err) { ST.busy(b, false); ST.toast(err.message, 'error'); });
    });
  }

  // ---------- add / edit listing
  function editor(id, fromLead) {
    fromLead = id ? '' : decodeURIComponent(fromLead || '');
    root.innerHTML = '<h1 style="font-size:28px">' + (id ? 'Edit ' + esc(id) : fromLead ? 'Create a listing from enquiry ' + esc(fromLead) : 'Add a listing') + '</h1><p class="muted">' +
      (id ? 'Changes go live as soon as you save.' : fromLead ? 'We filled in what the owner told us. Check the details, add the photos they sent on WhatsApp, then publish.' : 'Your own projects, rentals and resale properties. They go live immediately unless you set the status to Pending.') + '</p>' +
      (id || fromLead ? '' : '<p><a href="#import">' + icon('plus') + ' Import projects we prepared for you</a></p>') +
      '<div class="post-card"><div id="alf"><div class="skeleton" style="min-height:300px"></div></div><div class="wiz-nav"><a class="btn btn-ghost" href="#listings">Cancel</a><button class="btn btn-gold" type="button" id="asave">' + (id ? 'Save changes' : 'Publish listing') + '</button></div></div>';
    var lead = null;
    var p = id ? loadListings(!listingsCache).then(function (all) { return all.filter(function (x) { return x.id === id; })[0]; }) :
      fromLead ? (leadsCache ? Promise.resolve(leadsCache) : loadLeads()).then(function () { lead = leadById(fromLead); return lead ? draftFromLead(lead) : null; }) : Promise.resolve(null);
    p.then(function (l) {
      if (id && !l) { root.innerHTML = '<div class="empty"><h3>Listing not found</h3><a class="btn btn-ghost" href="#listings">Back to listings</a></div>'; return; }
      if (fromLead && !lead) { root.innerHTML = '<div class="empty"><h3>Enquiry not found</h3><p>It may have been deleted.</p><a class="btn btn-ghost" href="#leads">Back to leads</a></div>'; return; }
      var lf = window.ListingForm.mount($('#alf'), { mode: 'admin', listing: l });
      $('#asave').addEventListener('click', function () {
        var b = this;
        for (var s = 1; s <= 3; s++) { var err = lf.stepErrors(s); if (err) { ST.toast(err, 'error'); return; } }
        ST.busy(b, true, 'Saving…');
        lf.uploadPending(function (i, n) { b.textContent = 'Uploading photo ' + i + ' of ' + n + '…'; })
          .then(function () { var data = lf.collect(); return ST.api('adminSaveListing', { id: id || undefined, listing: data }).then(function (r) { r.data = data; return r; }); })
          .then(function (r) {
            listingsCache = null; refreshOverview();
            if (!lead) { ST.toast((id ? 'Saved ' : 'Published ') + r.id + '.', 'ok'); location.hash = '#listings'; return; }
            var note = (lead.notes ? lead.notes + ' · ' : '') + 'Listed as ' + r.id;
            ST.api('adminUpdateLead', Object.assign({ id: lead.id, notes: note }, lead.status === 'New' ? { status: 'Contacted' } : {}))
              .then(function () { lead.notes = note; if (lead.status === 'New') lead.status = 'Contacted'; }).catch(function () {});
            location.hash = '#listings';
            listedModal(lead, r.id, r.data);
          })
          .catch(function (err) { ST.busy(b, false); ST.toast(err.message, 'error'); });
      });
    }).catch(handleErr);
  }

  // ---------- listings from owner enquiries (website chat or form)
  var OWNER_INTENTS = ['Sell my property', 'Rent out my property', 'Sell a plot / land'];
  function isOwnerLead(l) {
    return OWNER_INTENTS.indexOf(l.intent) >= 0 || (/^Commercial/.test(l.intent || '') && /Wants to: (Sell|Rent out)/.test(l.details || ''));
  }
  /** Reads "Key: value | Key: value" enquiry details into a listing draft for the form. */
  function draftFromLead(l) {
    var f = {};
    String(l.details || '').split(/\s*\|\s*/).forEach(function (part) {
      var i = part.indexOf(':'); if (i > 0) f[part.slice(0, i).trim().toLowerCase()] = part.slice(i + 1).trim();
    });
    var rent = /Rent out/.test(l.intent) || /^rent/i.test(f['for'] || '') || /Rent out/.test(f['wants to'] || '');
    var type = f.type || '';
    var cat = /plot|land/i.test(type) || /plot/i.test(l.intent) ? 'Plot' : /shop|office|showroom|warehouse|godown/i.test(type) || /^Commercial/.test(l.intent) ? 'Commercial' : 'Residential';
    var ptype = cat === 'Plot' ? (/agri/i.test(type) ? 'Agricultural land' : /commercial/i.test(type) ? 'Commercial plot' : /industrial/i.test(type) ? 'Industrial plot' : /\bNA\b/.test(type) ? 'NA plot' : 'Residential plot') :
      cat === 'Commercial' ? (/showroom/i.test(type) ? 'Showroom' : /warehouse|godown/i.test(type) ? 'Warehouse / Godown' : /office/i.test(type) && !/shop/i.test(type) ? 'Office space' : 'Shop') :
      /bungalow|villa|independent/i.test(type) ? 'Independent house / Bungalow' : /row/i.test(type) ? 'Row house' : /penthouse/i.test(type) ? 'Penthouse' : 'Apartment / Flat';
    var bt = f.bhk || f.size || '', bm = bt.match(/(\d+(?:\.5)?)\s*\+?\s*BHK/i);
    var bhk = /1\s*RK/i.test(bt) ? '1 RK' : bm ? (parseFloat(bm[1]) >= 5 ? '5+' : bm[1]) : '';
    var st = f['carpet area'] || f['plot size'] || (bhk ? '' : f.size) || '';
    var sm = st.replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*(sq\.?\s*ft|sqft|sq\.?\s*yd|sq\.?\s*m|guntha|acres?|hectares?)?/i);
    var u = sm && sm[2] ? sm[2].toLowerCase().replace(/[\s.]/g, '') : '';
    var unit = /guntha/.test(u) ? 'guntha' : /acre/.test(u) ? 'acre' : /hect/.test(u) ? 'hectare' : /yd/.test(u) ? 'sq yd' : u === 'sqm' ? 'sq m' : 'sq ft';
    var amount = ST.parseAmount(f['expected price'] || f['expected rent'] || f.expected || '', rent);
    var area = f.area || '';
    var furn = { 'fully furnished': 'Fully furnished', 'semi furnished': 'Semi furnished', 'unfurnished': 'Unfurnished' }[String(f.furnishing || '').toLowerCase()] || '';
    var what = cat === 'Residential' ? ({ 'Apartment / Flat': 'flat', 'Independent house / Bungalow': 'bungalow', 'Row house': 'row house', 'Penthouse': 'penthouse' }[ptype] || 'home') : ptype.toLowerCase();
    var title = [bhk ? (bhk === '1 RK' ? '1 RK' : bhk + ' BHK') : '', what, rent ? 'for rent' : 'for sale', area ? 'in ' + area : ''].filter(Boolean).join(' ');
    var d = {
      purpose: rent ? 'rent' : 'sale', category: cat, propertyType: ptype, kind: 'property', bhk: bhk, carpetArea: sm ? sm[1] : '', areaUnit: unit,
      furnishing: furn, state: 'Maharashtra', city: 'Pune', locality: area, status: 'Approved',
      title: title.charAt(0).toUpperCase() + title.slice(1),
      description: title.charAt(0).toUpperCase() + title.slice(1) + ', Pune.' + (st ? ' Area ' + st + '.' : '') + (furn ? ' ' + furn + '.' : ''),
      adminNotes: 'Owner: ' + l.name + ', ' + ST.fmtPhone(l.phone) + (f.society ? '. Society: ' + f.society : '') + '. From enquiry ' + l.id + (l.source ? ' (' + l.source + ')' : '') + '.'
    };
    if (amount) d[rent ? 'rent' : 'price'] = String(amount);
    return d;
  }
  function listedModal(lead, id, data) {
    var live = !data || !data.status || data.status === 'Approved', first = String(lead.name || '').split(' ')[0];
    var url = ST.absUrl(ST.listingUrl(id));
    var text = 'Hi ' + first + ', your ' + (data && data.title ? data.title.charAt(0).toLowerCase() + data.title.slice(1) : 'property') + ' is now live on Stand Tall Realty: ' + url + ' Share it with anyone who may be interested.';
    var m = ST.openModal({ title: live ? 'Listing is live' : 'Listing saved', size: 'sm', body: '<div class="stack"><p style="margin:0">' +
      (live ? esc(id) + ' is live on the website. Let ' + esc(first) + ' know, so they can share it too.' : esc(id) + ' is saved as ' + esc(data.status) + '. Visitors will see it after you approve it.') + '</p>' +
      (live ? '<a class="btn btn-wa btn-block" target="_blank" rel="noopener" href="' + esc(ST.wa(text, lead.phone)) + '">' + icon('wa') + 'Send the link to ' + esc(first) + ' on WhatsApp</a>' : '') +
      '<button type="button" class="btn btn-ghost btn-block" data-ok>Done</button></div>' });
    $('[data-ok]', m.el).onclick = function () { m.close(); };
  }

  // ---------- import prepared projects (assets/projects/import.json, added as Pending)
  function importView() {
    root.innerHTML = '<h1 style="font-size:28px">Import prepared projects</h1><p class="muted">Projects we prepared for your website. Each one is added as <b>Pending</b>, so visitors cannot see it until you approve it.</p><div id="ibox"><div class="skeleton" style="min-height:160px"></div></div>';
    var file = fetch(ST.ASSETS + 'projects/import.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('There are no prepared projects yet.');
      return r.json();
    });
    Promise.all([file, loadListings(true)]).then(function (res) {
      var items = (res[0] && res[0].projects) || [], all = res[1] || [];
      function key(x) { return [String(x.projectName || x.title || '').trim().toLowerCase(), String(x.reraNumber || '').trim().toUpperCase()].join('|'); }
      var have = {}; all.forEach(function (l) { have[key(l)] = l.id; });
      if (!items.length) { $('#ibox').innerHTML = '<div class="empty"><h3>Nothing to import</h3><p>New projects will show up here once they are prepared.</p></div>'; return; }
      $('#ibox').innerHTML = '<form class="stack" id="iform" novalidate>' + items.map(function (p, i) {
        var done = have[key(p)];
        return '<label class="a-card import-row"><input type="checkbox" name="p" value="' + i + '"' + (done ? ' disabled' : ' checked') + '><div>' +
          '<h3>' + esc(p.title || p.projectName) + '</h3><div class="a-meta"><span>' + esc([p.locality, p.city].filter(Boolean).join(', ')) + '</span>' +
          '<span>MahaRERA ' + esc(p.reraNumber || 'missing') + '</span><span>' + (p.photos || []).length + ' photos</span>' +
          (done ? '<span class="pill ok">Already added as ' + esc(done) + '</span>' : '') + '</div></div></label>';
      }).join('') + '<div class="form-actions"><button class="btn btn-gold" type="submit">Import selected as Pending</button></div></form>';
      $('#iform').addEventListener('submit', function (e) {
        e.preventDefault();
        var b = $('button[type=submit]', this);
        var picks = $$('input[name=p]:checked', this).map(function (x) { return items[+x.value]; });
        if (!picks.length) return ST.toast('Choose at least one project.', 'error');
        ST.busy(b, true, 'Importing…');
        var n = 0;
        picks.reduce(function (chain, item) {
          return chain.then(function () {
            n++; b.textContent = 'Importing ' + n + ' of ' + picks.length + '…';
            return ST.api('adminSaveListing', { listing: Object.assign({}, item, { status: 'Pending' }) });
          });
        }, Promise.resolve()).then(function () {
          ST.toast('Imported ' + picks.length + (picks.length > 1 ? ' projects' : ' project') + ' as Pending.', 'ok');
          listingsCache = null; refreshOverview().catch(function () {}); location.hash = '#pending';
        }).catch(function (err) { ST.busy(b, false); ST.toast(err.message, 'error'); });
      });
    }).catch(function (err) {
      if (err && err.code === 'ADMIN_REQUIRED') return login();
      $('#ibox').innerHTML = '<div class="empty"><h3>Nothing to import</h3><p>' + esc(err.message) + '</p></div>';
    });
  }

  // ---------- leads (a small CRM: add, edit, delete, follow-up reminders by email)
  var LEAD_ST = ['New', 'Contacted', 'Site visit', 'Negotiation', 'Closed', 'Not interested'];
  var LEAD_INTENTS = ['Buy a property', 'Take a property on rent', 'Sell my property', 'Rent out my property', 'Buy a plot / land', 'Sell a plot / land',
    'Commercial – buy / rent / lease', 'New project / investment', 'Other'];
  var LEAD_SOURCES = ['Walk-in', 'Phone call', 'WhatsApp', 'Website chat', 'Instagram', 'Facebook', 'YouTube', 'OLX', 'Referral', 'Other'];
  var sel = {};   // selected lead ids
  function endOfToday() { var d = new Date(); d.setHours(23, 59, 59, 999); return d.getTime(); }
  function isOpen(l) { return l.status !== 'Closed' && l.status !== 'Not interested'; }
  function fmtWhen(ms) { return new Date(ms).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }); }
  function toLocalInput(ms) {
    if (!ms) return '';
    var d = new Date(ms), p = function (n) { return ('0' + n).slice(-2); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function fromLocalInput(v) { var t = v ? new Date(v).getTime() : 0; return isNaN(t) ? 0 : t; }
  function needsUpdate(err) { return err && err.code === 'BAD_ACTION'; }
  var UPDATE_MSG = 'This needs the new Apps Script code. Follow the update steps, then try again.';

  function leadsView(arg) {
    sel = {};
    root.innerHTML = '<div class="leads-head"><h1 style="font-size:28px;margin:0">Leads and enquiries</h1><button class="btn btn-gold" type="button" id="addlead">' + icon('plus') + 'Add lead</button></div>' +
      '<div class="toolbar"><input class="grow" id="dq" placeholder="Search name, number, area"><select id="ds"><option value="">Any status</option>' + LEAD_ST.map(function (s) { return '<option>' + s + '</option>'; }).join('') + '</select>' +
      '<select id="df"><option value="">Any follow-up</option><option value="due">Due today or overdue</option><option value="upcoming">Upcoming</option><option value="none">No follow-up</option></select>' +
      '<select id="di"><option value="">Any type</option></select><select id="dv"><option value="">Any number</option><option value="Yes">OTP verified</option><option value="No">Not verified</option></select><button class="btn btn-ghost" type="button" id="csv">Download CSV</button></div>' +
      '<div class="bulk-bar" id="bulk" hidden><label class="check"><input type="checkbox" id="selall"> Select all shown</label><span id="bulk-n"></span><button class="btn btn-danger btn-sm" type="button" id="bulk-del">Delete selected</button><button class="btn btn-ghost btn-sm" type="button" id="bulk-clear">Clear</button></div>' +
      '<div id="dbox"><div class="skeleton" style="min-height:160px"></div></div>';
    if (arg === 'due') $('#df').value = 'due';
    $('#addlead').onclick = function () { leadModal(null); };
    loadLeads().then(function () {
      var intents = leadsCache.map(function (l) { return l.intent; }).filter(function (x, i, a) { return x && a.indexOf(x) === i; });
      $('#di').innerHTML += intents.map(function (i) { return '<option>' + esc(i) + '</option>'; }).join('');
      drawLeads();
      ['#dq', '#ds', '#df', '#di', '#dv'].forEach(function (s) { $(s).addEventListener('input', drawLeads); });
      $('#csv').onclick = function () { csv(filteredLeads()); };
      $('#selall').onchange = function () { var on = this.checked; filteredLeads().forEach(function (l) { if (on) sel[l.id] = 1; else delete sel[l.id]; }); drawLeads(); };
      $('#bulk-clear').onclick = function () { sel = {}; drawLeads(); };
      $('#bulk-del').onclick = bulkDelete;
    }).catch(handleErr);
  }
  function loadLeads() { return ST.api('adminLeads').then(function (leads) { leadsCache = leads; return leads; }); }
  function filteredLeads() {
    if (!$('#dq')) return [];
    var q = $('#dq').value.toLowerCase(), s = $('#ds').value, f = $('#df').value, it = $('#di').value, v = $('#dv').value, eod = endOfToday();
    var list = leadsCache.filter(function (l) {
      if (s && l.status !== s) return false;
      if (it && l.intent !== it) return false;
      if (v && (v === 'Yes' ? l.verified !== 'Yes' : l.verified === 'Yes')) return false;
      if (f === 'due' && !(l.followUpAt && l.followUpAt <= eod && isOpen(l))) return false;
      if (f === 'upcoming' && !(l.followUpAt && l.followUpAt > eod)) return false;
      if (f === 'none' && l.followUpAt) return false;
      return !q || [l.name, l.phone, l.details, l.message, l.listingId, l.notes, l.followUpNote].join(' ').toLowerCase().indexOf(q) >= 0;
    });
    if (f === 'due' || f === 'upcoming') list = list.slice().sort(function (a, b) { return a.followUpAt - b.followUpAt; });
    return list;
  }
  function fuLine(l) {
    if (!l.followUpAt) return '';
    var now = Date.now(), cls = l.remindedAt ? 'ok' : !isOpen(l) ? '' : l.followUpAt <= now ? 'bad' : l.followUpAt <= endOfToday() ? 'warn' : '';
    return '<p class="lead-fu"><span class="pill ' + cls + '">' + icon('calendar') + 'Follow-up ' + esc(fmtWhen(l.followUpAt)) + '</span>' +
      (l.followUpNote ? ' <span>' + esc(l.followUpNote) + '</span>' : '') + (l.remindedAt ? ' <span class="small muted">Reminder sent</span>' : '') + '</p>';
  }
  function drawLeads() {
    var list = filteredLeads(), n = Object.keys(sel).length;
    $('#bulk').hidden = !list.length && !n;
    $('#bulk-n').textContent = n ? n + ' selected' : '';
    $('#bulk-del').hidden = $('#bulk-clear').hidden = !n;
    $('#selall').checked = list.length > 0 && list.every(function (l) { return sel[l.id]; });
    $('#dbox').innerHTML = list.length ? list.map(function (l) {
      return '<article class="lead-card' + (sel[l.id] ? ' is-sel' : '') + '" data-lead="' + esc(l.id) + '"><div class="lead-top"><label class="lead-sel"><input type="checkbox" data-sel' + (sel[l.id] ? ' checked' : '') + ' aria-label="Select ' + esc(l.name) + '"></label><div class="grow"><span class="pill ' + (l.status === 'New' ? 'warn' : l.status === 'Closed' ? 'ok' : '') + '">' + esc(l.status) + '</span> <span class="pill gold">' + esc(l.intent) + '</span>' + verifiedPill(l.verified) + '<br><b>' + esc(l.name) + '</b> <span class="muted small">' + esc(ST.fmtPhone(l.phone)) + ', ' + esc(ST.timeAgo(l.createdAt)) + '</span></div>' +
        '<div class="lead-row"><a class="btn btn-navy btn-sm" href="tel:+91' + esc(l.phone) + '">' + icon('phone') + 'Call</a><a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="' + ST.wa('Hi ' + l.name.split(' ')[0] + ', this is Stand Tall Realty. Thank you for your enquiry' + (l.listingTitle ? ' about ' + l.listingTitle : '') + '.', l.phone) + '">' + icon('wa') + 'WhatsApp</a></div></div>' +
        fuLine(l) +
        '<div class="lead-details">' + [l.details, l.message ? '“' + l.message + '”' : '', l.email ? 'Email: ' + l.email : ''].filter(Boolean).map(esc).join('<br>') +
        (l.listingId ? '<br>Property: <a href="property.html?id=' + encodeURIComponent(l.listingId) + '" target="_blank" rel="noopener">' + esc(l.listingId + ' – ' + l.listingTitle) + '</a>' : '') +
        '<br><span class="small muted">Came from: ' + esc(l.source || 'website') + (l.page && l.page !== 'admin' ? ', page ' + esc(l.page) : '') + '</span></div>' +
        '<div class="lead-row"><label class="sr-only">Status</label><select data-lst>' + LEAD_ST.map(function (s) { return '<option' + (s === l.status ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select><input data-lnote placeholder="Add a note, e.g. visit fixed for Sunday" value="' + esc(l.notes) + '">' +
        (isOwnerLead(l) ? '<button class="btn btn-gold btn-sm" type="button" data-lact="list">' + icon('plus') + 'Create listing</button>' : '') +
        '<button class="btn btn-ghost btn-sm" type="button" data-lact="edit">Edit</button><button class="btn btn-ghost btn-sm" type="button" data-lact="followup">' + icon('calendar') + (l.followUpAt ? 'Change follow-up' : 'Set follow-up') + '</button><button class="btn btn-ghost btn-sm lead-del" type="button" data-lact="del">Delete</button></div></article>';
    }).join('') : '<div class="empty"><h3>' + (leadsCache.length ? 'No leads match' : 'No leads yet') + '</h3><p>' + (leadsCache.length ? 'Change the filters above to see more.' : 'Enquiries from the website appear here. Tap Add lead to enter walk-ins and phone calls.') + '</p></div>';
  }
  function verifiedPill(v) {
    if (v === 'Yes') return ' <span class="pill ok">' + icon('shield') + 'OTP verified</span>';
    if (v === 'No') return ' <span class="pill" title="The client did not enter the OTP. The number may still be right.">Not verified</span>';
    return '';
  }
  function leadById(id) { return (leadsCache || []).filter(function (x) { return x.id === id; })[0]; }

  /** Add or edit a lead. focus = 'followup' opens with the reminder fields first. */
  function leadModal(l, focus) {
    var isNew = !l; l = l || { status: 'New', intent: '', source: 'Walk-in' };
    var opt = function (list, cur) { var all = list.slice(); if (cur && all.indexOf(cur) < 0) all.unshift(cur); return all.map(function (o) { return '<option' + (o === cur ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join(''); };
    var m = ST.openModal({ title: isNew ? 'Add a lead' : 'Edit lead', focus: focus === 'followup' ? '[name=followUpAt]' : '[name=name]', body:
      '<form class="stack lead-form-admin" novalidate>' +
      '<div class="grid-2"><label class="field"><span>Name</span><input name="name" required value="' + esc(l.name || '') + '" autocomplete="off"></label>' +
      '<label class="field"><span>Mobile</span><input name="phone" type="tel" inputmode="numeric" required value="' + esc(l.phone || '') + '" placeholder="10-digit mobile"></label></div>' +
      '<div class="grid-2"><label class="field"><span>Looking for</span><select name="intent">' + opt(LEAD_INTENTS, l.intent || 'Buy a property') + '</select></label>' +
      '<label class="field"><span>Came from</span><select name="source">' + opt(LEAD_SOURCES, l.source || 'Walk-in') + '</select></label></div>' +
      '<label class="field"><span>Details <em>(area, size, budget)</em></span><input name="details" value="' + esc(l.details || '') + '" placeholder="e.g. 2 BHK in Kondhwa, up to ₹75 L"></label>' +
      '<fieldset class="field fu-box"><legend>Follow-up reminder</legend>' +
      '<div class="grid-2"><label class="field"><span>Date and time</span><input name="followUpAt" type="datetime-local" value="' + esc(toLocalInput(l.followUpAt)) + '"></label>' +
      '<label class="field"><span>Reminder note</span><input name="followUpNote" value="' + esc(l.followUpNote || '') + '" placeholder="e.g. Share 2 BHK options"></label></div>' +
      '<p class="fu-quick"><button type="button" class="chip-btn" data-fu="1h">In 1 hour</button><button type="button" class="chip-btn" data-fu="t11">Tomorrow 11 am</button><button type="button" class="chip-btn" data-fu="t18">Tomorrow 6 pm</button><button type="button" class="chip-btn" data-fu="clear">No reminder</button></p>' +
      '<p class="small muted" style="margin:0">We email you at this time with the name, number, a call button and your note.</p></fieldset>' +
      '<div class="grid-2"><label class="field"><span>Status</span><select name="status">' + opt(LEAD_ST, l.status || 'New') + '</select></label>' +
      '<label class="field"><span>Email <em>(optional)</em></span><input name="email" type="email" value="' + esc(l.email || '') + '"></label></div>' +
      '<label class="field"><span>Notes</span><textarea name="notes" rows="2" maxlength="1000">' + esc(l.notes || '') + '</textarea></label>' +
      '<p class="form-error" hidden></p>' +
      '<div class="row-end"><button type="button" class="btn btn-ghost" data-cancel>Cancel</button><button type="submit" class="btn btn-gold">' + (isNew ? 'Add lead' : 'Save changes') + '</button></div></form>' });
    var f = $('form', m.el);
    $('[data-cancel]', f).onclick = function () { m.close(); };
    $$('[data-fu]', f).forEach(function (b) {
      b.onclick = function () {
        var d = new Date(), k = b.dataset.fu;
        if (k === 'clear') { f.followUpAt.value = ''; return; }
        if (k === '1h') d = new Date(Date.now() + 3600000);
        else { d.setDate(d.getDate() + 1); d.setHours(k === 't11' ? 11 : 18, 0, 0, 0); }
        f.followUpAt.value = toLocalInput(d.getTime());
      };
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = ST.formData(f), btn = $('button[type=submit]', f), errEl = $('.form-error', f);
      var fail = function (msg) { errEl.textContent = msg; errEl.hidden = false; };
      if ((d.name || '').trim().length < 2) { f.name.focus(); return fail('Enter the name.'); }
      if (!ST.normPhone(d.phone)) { f.phone.focus(); return fail('Enter a valid 10-digit mobile number.'); }
      var fu = fromLocalInput(d.followUpAt);
      var lead = { name: d.name.trim(), phone: d.phone, intent: d.intent, source: d.source, details: d.details || '', status: d.status,
        email: (d.email || '').trim(), notes: d.notes || '', followUpNote: d.followUpNote || '' };
      if (!isNew || fu) lead.followUpAt = fu;
      if (!isNew && fu === (l.followUpAt || 0)) delete lead.followUpAt;   // same time: keep "reminder sent"
      ST.busy(btn, true, 'Saving…');
      ST.api('adminSaveLead', { id: isNew ? undefined : l.id, lead: lead }).then(function (r) {
        m.close();
        ST.toast(r && r.reminders === false ? 'Saved. Email reminders are not switched on yet: run setup once in Apps Script.' : fu ? 'Saved. We will email you at ' + fmtWhen(fu) + '.' : 'Saved.', r && r.reminders === false ? 'error' : 'ok');
        ownNewLead((lead.status === 'New' ? 1 : 0) - (!isNew && l.status === 'New' ? 1 : 0));
        refreshOverview().catch(function () {});
        return loadLeads().then(drawLeads);
      }).catch(function (err) { ST.busy(btn, false); fail(needsUpdate(err) ? UPDATE_MSG : err.message); });
    });
  }

  function deleteLeads(ids) {
    return ST.api('adminDeleteLeads', { ids: ids }).catch(function (err) {
      if (!needsUpdate(err)) throw err;
      // older Apps Script code: delete one by one
      return ids.reduce(function (chain, id) { return chain.then(function () { return ST.api('adminUpdateLead', { id: id, delete: true }); }); }, Promise.resolve());
    });
  }
  function bulkDelete() {
    var ids = Object.keys(sel), b = this;
    if (!ids.length) return;
    ST.confirmBox('Delete ' + ids.length + (ids.length === 1 ? ' lead?' : ' leads?'), 'They will be removed from the admin panel and your Google Sheet. This cannot be undone.', 'Delete', true).then(function (yes) {
      if (!yes) return;
      ST.busy(b, true, 'Deleting…');
      deleteLeads(ids).then(function () {
        ST.toast('Deleted ' + ids.length + (ids.length === 1 ? ' lead.' : ' leads.'), 'ok');
        sel = {}; refreshOverview().catch(function () {});
        return loadLeads().then(drawLeads);
      }).catch(function (err) { ST.busy(b, false); ST.toast(err.message, 'error'); });
    });
  }

  root.addEventListener('click', function (e) {
    var a = e.target.closest('[data-lact]'); if (!a) return;
    var card = a.closest('[data-lead]'), l = card && leadById(card.dataset.lead);
    if (!l) return;
    if (a.dataset.lact === 'edit') leadModal(l);
    if (a.dataset.lact === 'followup') leadModal(l, 'followup');
    if (a.dataset.lact === 'list') location.hash = '#add=' + encodeURIComponent(l.id);
    if (a.dataset.lact === 'del') {
      ST.confirmBox('Delete this lead?', l.name + ' (' + ST.fmtPhone(l.phone) + ') will be removed from the admin panel and your Google Sheet. This cannot be undone.', 'Delete', true).then(function (yes) {
        if (!yes) return;
        ST.busy(a, true);
        ST.api('adminUpdateLead', { id: l.id, delete: true }).then(function () {
          ST.toast('Lead deleted.', 'ok'); delete sel[l.id]; refreshOverview().catch(function () {});
          return loadLeads().then(drawLeads);
        }).catch(function (err) { ST.busy(a, false); ST.toast(err.message, 'error'); });
      });
    }
  });
  root.addEventListener('change', function (e) {
    if (e.target.hasAttribute('data-sel')) {
      var c = e.target.closest('[data-lead]'); if (!c) return;
      if (e.target.checked) sel[c.dataset.lead] = 1; else delete sel[c.dataset.lead];
      drawLeads(); return;
    }
    var card = e.target.closest('[data-lead]'); if (!card) return;
    if (!e.target.hasAttribute('data-lst') && !e.target.hasAttribute('data-lnote')) return;
    var id = card.dataset.lead, patch = {};
    if (e.target.hasAttribute('data-lst')) patch.status = e.target.value;
    if (e.target.hasAttribute('data-lnote')) patch.notes = e.target.value;
    var before = (leadById(id) || {}).status;
    ST.api('adminUpdateLead', Object.assign({ id: id }, patch)).then(function () {
      var l = leadById(id); if (l) Object.assign(l, patch);
      if (patch.status === 'New' && before !== 'New') ownNewLead(1);
      ST.toast('Saved.', 'ok'); refreshOverview().catch(function () {});
    }).catch(function (err) { ST.toast(err.message, 'error'); });
  });
  function csv(list) {
    var cols = ['id', 'createdAt', 'status', 'intent', 'name', 'phone', 'verified', 'email', 'details', 'message', 'listingId', 'listingTitle', 'source', 'notes', 'followUpAt', 'followUpNote'];
    var rows = [cols.join(',')].concat(list.map(function (l) { return cols.map(function (c) { var v = c === 'createdAt' || c === 'followUpAt' ? (l[c] ? new Date(l[c]).toLocaleString('en-IN') : '') : String(l[c] || '').trim(); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + String(v).replace(/"/g, '""') + '"'; }).join(','); }));
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + rows.join('\n')], { type: 'text/csv' }));
    a.download = 'stand-tall-leads-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
  }

  // ---------- chats
  function chatsView() {
    root.innerHTML = '<h1 style="font-size:28px">Chats</h1><p class="muted">Chats with Stand Tall Realty need your reply. You can also read chats between buyers and owners, and step in if needed.</p><div id="cbox"><div class="skeleton" style="min-height:160px"></div></div>';
    ST.api('adminChats').then(function (list) {
      list.sort(function (a, b) { return (b.firm - a.firm) || (b.unread - a.unread) || (b.updatedAt - a.updatedAt); });
      $('#cbox').innerHTML = list.length ? '<div class="panel" style="padding:0;overflow:hidden">' + list.map(function (c) {
        return '<button type="button" class="chat-item' + (c.unread ? ' unread' : '') + '" data-chat="' + esc(c.id) + '"><span class="chat-thumb">' + ST.art({ id: c.listingId || c.id, category: c.listing ? c.listing.category : 'Residential' }) + '</span>' +
          '<span class="chat-meta"><b>' + esc(c.buyerName) + ' → ' + esc(c.firm ? 'Stand Tall Realty' : c.ownerName) + '</b><span class="t">' + esc(c.listingTitle || 'General enquiry') + '</span><span class="last">' + esc(c.lastMessage || '') + '</span></span>' +
          '<span class="chat-side"><span>' + esc(ST.timeAgo(c.updatedAt)) + '</span>' + (c.unread ? '<span class="dot">' + c.unread + '</span>' : '') + (c.firm ? '<span class="req-flag">For you</span>' : '') + '</span></button>';
      }).join('') + '</div>' : '<div class="empty"><h3>No chats yet</h3></div>';
    }).catch(handleErr);
  }
  root.addEventListener('click', function (e) { var b = e.target.closest('[data-chat]'); if (b) openChat(b.dataset.chat); });
  function openChat(id) {
    var m = ST.openModal({ title: 'Chat', size: 'lg', body: '<div class="msgs" id="am" style="max-height:55vh;background:var(--paper);border-radius:10px"></div><form class="composer" id="ac" style="border:0;padding:12px 0 0"><textarea id="at" rows="1" placeholder="Reply as Stand Tall Realty"></textarea><button class="btn btn-gold" type="submit" aria-label="Send">' + icon('send') + '</button></form><p class="small muted" id="anote" style="margin:8px 0 0"></p>', onClose: function () { if (cur().tab === 'chats') chatsView(); refreshOverview().catch(function () {}); } });
    function load() {
      return ST.api('adminMessages', { chatId: id }).then(function (r) {
        var c = r.chat;
        $('h2', m.el).textContent = c.buyerName + ' → ' + (c.firm ? 'Stand Tall Realty' : c.ownerName);
        $('#anote', m.el).innerHTML = (c.listingId ? 'About <a target="_blank" rel="noopener" href="property.html?id=' + encodeURIComponent(c.listingId) + '">' + esc(c.listingId + ' – ' + c.listingTitle) + '</a>. ' : '') +
          (c.buyer ? 'Buyer: ' + esc(c.buyer.name) + ', <a href="tel:+91' + esc(c.buyer.phone) + '">' + esc(ST.fmtPhone(c.buyer.phone)) + '</a>. ' : '') +
          (c.owner ? 'Owner: ' + esc(c.owner.name) + ', <a href="tel:+91' + esc(c.owner.phone) + '">' + esc(ST.fmtPhone(c.owner.phone)) + '</a>. ' : '') +
          (c.firm ? '' : 'Messages you send here appear to both as Stand Tall Realty.');
        var html = '', day = '';
        r.messages.forEach(function (x) {
          var d = ST.dayLabel(x.t); if (d !== day) { html += '<div class="day-sep">' + esc(d) + '</div>'; day = d; }
          var me = x.from === 'admin' || (c.firm && x.from === 'owner');
          if (x.type === 'phone') html += '<div class="phone-card' + (me ? ' me' : '') + '"><span class="small muted">' + esc(me ? 'Stand Tall Realty' : x.name) + ' shared a number</span><b>' + esc(ST.fmtPhone(x.text)) + '</b></div>';
          else if (x.type === 'phone_request' || x.type === 'system') html += '<div class="sys">' + esc(x.text) + '</div>';
          else html += '<div class="bubble ' + (me ? 'me' : 'them') + '"><span class="nm">' + esc(me ? 'Stand Tall Realty' : x.name + (x.from === 'buyer' ? ' (buyer)' : ' (owner)')) + '</span>' + esc(x.text) + '<span class="tm">' + esc(ST.clock(x.t)) + '</span></div>';
        });
        var box = $('#am', m.el); box.innerHTML = html || '<div class="sys">No messages yet.</div>'; box.scrollTop = box.scrollHeight;
      });
    }
    load().catch(function (err) { ST.toast(err.message, 'error'); });
    $('#ac', m.el).addEventListener('submit', function (e) {
      e.preventDefault(); var t = $('#at', m.el), b = $('button', this), text = t.value.trim(); if (!text) return;
      ST.busy(b, true);
      ST.api('adminSend', { chatId: id, text: text }).then(function () { t.value = ''; ST.busy(b, false); return load(); }).catch(function (err) { ST.busy(b, false); ST.toast(err.message, 'error'); });
    });
  }

  // ---------- users
  function usersView() {
    root.innerHTML = '<h1 style="font-size:28px">Users</h1><div class="toolbar"><input class="grow" id="uq" placeholder="Search name or number"></div><div id="ubox" style="overflow-x:auto"><div class="skeleton" style="min-height:160px"></div></div>';
    ST.api('adminUsers').then(function (users) {
      function draw() {
        var q = $('#uq').value.toLowerCase();
        var list = users.filter(function (u) { return !q || (u.name + ' ' + u.phone).toLowerCase().indexOf(q) >= 0; });
        $('#ubox').innerHTML = '<table class="users-table"><thead><tr><th>Name</th><th>Mobile</th><th>Email</th><th>Joined</th><th>Listings</th><th>Status</th><th></th></tr></thead><tbody>' +
          list.map(function (u) {
            return '<tr><td>' + esc(u.name) + '</td><td><a href="tel:+91' + esc(u.phone) + '">' + esc(ST.fmtPhone(u.phone)) + '</a>' + (u.verified ? ' <span class="pill ok" title="Verified by OTP">' + icon('shield') + 'OTP</span>' : '') + '</td><td>' + esc(u.email || '—') + '</td><td>' + esc(ST.timeAgo(u.createdAt)) + '</td><td>' + u.listings + '</td>' +
              '<td><span class="pill ' + (u.status === 'Blocked' ? 'bad' : 'ok') + '">' + esc(u.status) + '</span></td><td style="white-space:nowrap"><button class="btn btn-ghost btn-sm" data-u="' + esc(u.id) + '" data-block="' + (u.status === 'Blocked' ? 'Active' : 'Blocked') + '">' + (u.status === 'Blocked' ? 'Unblock' : 'Block') + '</button> <button class="btn btn-ghost btn-sm" data-u="' + esc(u.id) + '" data-reset="1" data-phone="' + esc(u.phone) + '" data-name="' + esc(u.name) + '">Reset password</button></td></tr>';
          }).join('') + '</tbody></table>' + (list.length ? '' : '<div class="empty" style="margin-top:12px">No users yet.</div>');
      }
      draw(); $('#uq').addEventListener('input', draw);
      $('#ubox').addEventListener('click', function (e) {
        var b = e.target.closest('[data-u]'); if (!b) return;
        if (b.dataset.block) ST.api('adminSetUser', { id: b.dataset.u, status: b.dataset.block }).then(function () { ST.toast(b.dataset.block === 'Blocked' ? 'User blocked.' : 'User unblocked.', 'ok'); usersView(); }).catch(function (err) { ST.toast(err.message, 'error'); });
        if (b.dataset.reset) ST.confirmBox('Reset password?', 'A new temporary password will be created for ' + b.dataset.name + '.', 'Reset').then(function (ok) {
          if (!ok) return;
          ST.api('adminSetUser', { id: b.dataset.u, resetPassword: true }).then(function (r) {
            ST.openModal({ title: 'New password', size: 'sm', body: '<p>Temporary password for ' + esc(b.dataset.name) + ':</p><p style="font:600 26px var(--serif)">' + esc(r.tempPassword) + '</p><a class="btn btn-wa btn-block" target="_blank" rel="noopener" href="' + ST.wa('Hi ' + b.dataset.name.split(' ')[0] + ', your new Stand Tall Realty website password is ' + r.tempPassword + '. Please change it from My account after logging in.', b.dataset.phone) + '">' + icon('wa') + 'Send on WhatsApp</a>' });
          }).catch(function (err) { ST.toast(err.message, 'error'); });
        });
      });
    }).catch(handleErr);
  }

  if (ST.Admin.token()) start(); else login();
})();
