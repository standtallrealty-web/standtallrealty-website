/* My account: listings, saved, profile */
(function () {
  'use strict';
  var ST = window.ST, $ = ST.$, $$ = ST.$$, esc = ST.esc, icon = ST.icon;
  var panel = $('#acct-panel'), tabsEl = $('#acct-tabs');
  var STATUS = { Pending: ['warn', 'Waiting for review'], Approved: ['ok', 'Live'], Rejected: ['bad', 'Needs changes'], Sold: ['', 'Sold'], Rented: ['', 'Rented'] };

  function loggedOut() {
    $('#acct-title').textContent = 'Your account';
    $('#acct-sub').textContent = 'Log in to manage your listings, chats and saved properties.';
    tabsEl.hidden = true;
    panel.innerHTML = '<div class="tools"><div class="panel"><h2>Log in or create an account</h2><p class="muted">One account for posting properties, chatting with owners and buyers, and getting phone numbers.</p>' +
      '<p style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-navy" type="button" data-l="login">Log in</button><button class="btn btn-gold" type="button" data-l="register">Create free account</button></p></div>' +
      '<div class="panel"><h2>Saved properties</h2><div id="saved-out"></div></div></div>';
    $$('[data-l]', panel).forEach(function (b) { b.onclick = function () { ST.openLogin('', b.dataset.l).then(function () { location.reload(); }).catch(function () {}); }; });
    renderSaved($('#saved-out'), true);
  }

  var TABS = [['listings', 'My listings'], ['saved', 'Saved'], ['profile', 'Profile']];
  function tabs(cur, counts) {
    tabsEl.innerHTML = TABS.map(function (t) { return '<a href="#' + t[0] + '" role="tab" aria-selected="' + (t[0] === cur) + '">' + t[1] + (counts[t[0]] !== undefined ? '<span class="count">' + counts[t[0]] + '</span>' : '') + '</a>'; }).join('');
  }
  var counts = {};
  function route() {
    var cur = (location.hash || '#listings').slice(1);
    if (!TABS.some(function (t) { return t[0] === cur; })) cur = 'listings';
    counts.saved = ST.Saved.all().length;
    tabs(cur, counts);
    if (cur === 'listings') listings();
    if (cur === 'saved') { panel.innerHTML = '<div id="saved-out"></div>'; renderSaved($('#saved-out')); }
    if (cur === 'profile') profile();
  }
  window.addEventListener('hashchange', route);

  function listings() {
    panel.innerHTML = '<div class="skeleton" style="min-height:140px"></div>';
    ST.api('myListings').then(function (list) {
      counts.listings = list.length; tabs('listings', counts);
      if (!list.length) {
        panel.innerHTML = '<div class="empty"><h3>You have not listed a property yet</h3><p>Post your flat, shop or plot for free. Buyers can chat with you once our team approves it.</p><a class="btn btn-gold" href="post-property.html">' + icon('plus') + 'Post your property</a></div>';
        return;
      }
      panel.innerHTML = '<div class="row-end" style="margin:0 0 14px"><a class="btn btn-gold" href="post-property.html">' + icon('plus') + 'Post another property</a></div>' + list.map(function (l) {
        var s = STATUS[l.status] || ['', l.status];
        var media = ST.art(l) + (l.photos && l.photos[0] ? ST.imgTag(l.photos[0], 400, '') : '');
        return '<article class="my-row"><a class="my-thumb" href="property.html?id=' + encodeURIComponent(l.id) + '">' + media + '</a>' +
          '<div><span class="pill ' + s[0] + '">' + esc(s[1]) + '</span> <span class="small muted">' + esc(l.id) + '</span>' +
          '<h3><a href="property.html?id=' + encodeURIComponent(l.id) + '">' + esc(l.title) + '</a></h3>' +
          '<div class="my-stats"><span><b>' + esc(ST.priceLabel(l)) + esc(ST.priceSuffix(l)) + '</b></span><span>' + icon('pin') + esc(ST.placeLabel(l)) + '</span>' +
          '<span>' + icon('eye') + (l.views || 0) + ' views</span><span>' + icon('chat') + (l.chats || 0) + ' chats</span>' + (l.requests ? '<span class="req-flag">' + l.requests + ' number request' + (l.requests > 1 ? 's' : '') + '</span>' : '') + '</div>' +
          (l.status === 'Rejected' && l.rejectReason ? '<p class="reject-note">Reason: ' + esc(l.rejectReason) + '</p>' : '') +
          (l.status === 'Pending' ? '<p class="small muted" style="margin:6px 0 0">Our team usually reviews listings ' + esc(ST.S.approvalTime || 'within 24 hours') + '.</p>' : '') + '</div>' +
          '<div class="my-actions">' + (l.chats ? '<a class="btn btn-navy btn-sm" href="chats.html">' + icon('chat') + 'Chats</a>' : '') +
          '<a class="btn btn-ghost btn-sm" href="post-property.html?edit=' + encodeURIComponent(l.id) + '">Edit</a>' +
          (l.status === 'Approved' ? '<button class="btn btn-ghost btn-sm" type="button" data-op="' + (l.purpose === 'rent' ? 'rented' : 'sold') + '" data-id="' + esc(l.id) + '">Mark ' + (l.purpose === 'rent' ? 'rented' : 'sold') + '</button>' : '') +
          '<button class="btn btn-ghost btn-sm" type="button" data-op="delete" data-id="' + esc(l.id) + '">Delete</button></div></article>';
      }).join('');
    }).catch(function (err) {
      if (err.code === 'LOGIN_REQUIRED') return loggedOut();
      panel.innerHTML = '<div class="empty"><p>' + esc(err.message) + '</p></div>';
    });
  }
  panel.addEventListener('click', function (e) {
    var b = e.target.closest('[data-op]'); if (!b) return;
    var op = b.dataset.op;
    var text = op === 'delete' ? 'The listing will be removed from the website. This cannot be undone.' : 'The listing will be taken off the website and marked as ' + op + '.';
    ST.confirmBox(op === 'delete' ? 'Delete this listing?' : 'Mark as ' + op + '?', text, op === 'delete' ? 'Delete' : 'Mark ' + op, op === 'delete').then(function (ok) {
      if (!ok) return;
      ST.busy(b, true);
      ST.api('listingAction', { id: b.dataset.id, op: op }).then(function () { ST.toast(op === 'delete' ? 'Listing deleted.' : 'Marked as ' + op + '.', 'ok'); listings(); })
        .catch(function (err) { ST.busy(b, false); ST.toast(err.message, 'error'); });
    });
  });

  function renderSaved(box, compact) {
    var ids = ST.Saved.all();
    if (!ids.length) { box.innerHTML = '<div class="empty"><p>Tap the heart on any property to save it here.</p><a class="btn btn-ghost" href="properties.html">Browse properties</a></div>'; return; }
    box.innerHTML = '<div class="skeleton" style="min-height:200px"></div>';
    ST.getListings().then(function (all) {
      var list = ids.map(function (id) { return all.filter(function (l) { return l.id === id; })[0]; }).filter(Boolean);
      var gone = ids.length - list.length;
      box.innerHTML = (list.length ? '<div class="cards' + (compact ? '' : '') + '">' + list.map(function (l) { return ST.card(l); }).join('') + '</div>' : '') +
        (gone ? '<p class="muted small" style="margin-top:14px">' + gone + ' saved ' + (gone > 1 ? 'properties are' : 'property is') + ' no longer available.</p>' : '');
    }).catch(function (err) { box.innerHTML = '<p>' + esc(err.message) + '</p>'; });
  }

  function profile() {
    draw(ST.Auth.user());
    // refresh the "verified" and "has password" flags from the server
    ST.api('me').then(function (r) {
      var old = ST.Auth.user() || {};
      ST.Auth.setUser(r.user);
      if ((old.verified !== r.user.verified || old.hasPassword !== r.user.hasPassword) && (location.hash || '#listings') === '#profile') draw(r.user);
    }).catch(function () {});
  }
  function draw(u) {
    var hasPw = u.hasPassword !== false;   // older sessions have no flag: they were password accounts
    panel.innerHTML = '<div class="tools"><form class="panel stack" id="pf" novalidate><h2>Your details</h2>' +
      '<label class="field"><span>Full name</span><input name="name" value="' + esc(u.name) + '" autocomplete="name"></label>' +
      '<label class="field"><span>Mobile number' + (u.verified ? ' <span class="pill ok" style="margin-left:6px">' + icon('shield') + 'Verified</span>' : '') + '</span><input value="' + esc(ST.fmtPhone(u.phone)) + '" disabled><small class="hint">To change your number, message us on WhatsApp.</small></label>' +
      '<label class="field"><span>Email <em>(for chat and listing alerts)</em></span><input name="email" type="email" value="' + esc(u.email || '') + '" autocomplete="email"></label>' +
      '<div class="form-actions"><button class="btn btn-navy" type="submit">Save details</button></div></form>' +
      '<div class="stack"><form class="panel stack" id="pw" novalidate><h2>' + (hasPw ? 'Change password' : 'Set a password') + '</h2>' +
      (hasPw ? '<label class="field"><span>Current password</span><input name="oldPassword" type="password" autocomplete="current-password"></label>'
        : '<p class="muted" style="margin:0">Optional. You can always log in with an OTP on your mobile.</p>') +
      '<label class="field"><span>New password</span><input name="newPassword" type="password" autocomplete="new-password" minlength="6" placeholder="At least 6 characters"></label><div class="form-actions"><button class="btn btn-ghost" type="submit">' + (hasPw ? 'Update password' : 'Set password') + '</button></div></form>' +
      '<div class="panel"><h2>Log out</h2><p class="muted">Log out of this device.</p><button class="btn btn-ghost" type="button" id="logout">Log out</button></div></div></div>';
    $('#pf').addEventListener('submit', function (e) {
      e.preventDefault(); var d = ST.formData(this), b = $('button', this); ST.busy(b, true, 'Saving…');
      ST.api('updateProfile', d).then(function (r) { ST.busy(b, false); ST.Auth.setUser(r.user); ST.toast('Details saved.', 'ok'); }).catch(function (err) { ST.busy(b, false); ST.fieldError(e.target, err.message); });
    });
    $('#pw').addEventListener('submit', function (e) {
      e.preventDefault(); var f = this, d = ST.formData(f), b = $('button', f); ST.busy(b, true, hasPw ? 'Updating…' : 'Saving…');
      ST.api('changePassword', d).then(function (r) {
        ST.busy(b, false); f.reset(); ST.fieldError(f, '');
        ST.toast(hasPw ? 'Password updated.' : 'Password set. You can now log in with OTP or password.', 'ok');
        if (r && r.user) { ST.Auth.setUser(r.user); if (!hasPw) draw(r.user); }
      }).catch(function (err) { ST.busy(b, false); ST.fieldError(f, err.message); });
    });
    $('#logout').onclick = function () { ST.Auth.clear(); location.href = 'index.html'; };
  }

  var u = ST.Auth.user();
  if (!u) return loggedOut();
  $('#acct-title').textContent = 'Hi, ' + u.name.split(' ')[0];
  $('#acct-sub').textContent = 'Manage your listings, saved properties and details.';
  route();
})();
