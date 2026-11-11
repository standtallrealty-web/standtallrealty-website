/* Chats: buyers ↔ owners ↔ Stand Tall Realty */
(function () {
  'use strict';
  var ST = window.ST, $ = ST.$, $$ = ST.$$, esc = ST.esc, icon = ST.icon;
  var app = $('.chat-app'), listEl = $('#chat-items'), pane = $('#chat-pane');
  var chats = [], active = null, msgs = [], lastId = '', stamp = 0, listStamp = 0, chatInfo = null, phoneMode = '', busyPoll = false;

  function loginPrompt() {
    var html = '<div class="chat-empty">' + icon('chat') + '<h2 style="font-size:22px;margin-top:10px">Log in to see your chats</h2><p>Chat with owners and buyers, and see phone numbers people share with you.</p>' +
      '<p style="display:flex;gap:10px;justify-content:center"><button class="btn btn-navy" type="button" data-l="login">Log in</button><button class="btn btn-gold" type="button" data-l="register">Create account</button></p></div>';
    listEl.innerHTML = html;
    pane.innerHTML = '';
    app.classList.remove('has-active');
    $$('[data-l]', listEl).forEach(function (b) { b.onclick = function () { ST.openLogin('', b.dataset.l).then(function () { location.reload(); }).catch(function () {}); }; });
  }

  // ---------- list
  function thumb(c) {
    if (c.listing && c.listing.photo) return '<span class="chat-thumb">' + ST.art({ id: c.listingId, category: c.listing.category }) + ST.imgTag(c.listing.photo, 160, '') + '</span>';
    if (c.listing) return '<span class="chat-thumb">' + ST.art({ id: c.listingId, category: c.listing.category }) + '</span>';
    return '<span class="chat-thumb" style="display:grid;place-items:center"><img src="assets/img/mark-sm.png" alt="" style="position:static;width:36px;height:auto"></span>';
  }
  function short(ms) { if (!ms) return ''; var d = new Date(ms); return d.toDateString() === new Date().toDateString() ? ST.clock(ms) : ST.dayLabel(ms); }
  function renderList() {
    var f = ($('input[name=cf]:checked') || {}).value || '';
    var list = chats.filter(function (c) { return !f || c.role === f; });
    if (!list.length) {
      listEl.innerHTML = '<div class="chat-empty" style="padding:30px 20px">' + icon('chat') + '<p>' + (chats.length ? 'No chats in this filter.' : 'No chats yet. Open any property and tap <b>Chat</b> to talk to the owner. When buyers message you about your listings, they show up here too.') + '</p><a class="btn btn-ghost" href="properties.html">Browse properties</a></div>';
      return;
    }
    listEl.innerHTML = list.map(function (c) {
      var sub = c.listing ? c.listing.title : (c.listingTitle || 'General enquiry');
      return '<button type="button" class="chat-item' + (c.unread ? ' unread' : '') + '" data-id="' + esc(c.id) + '" aria-current="' + (active === c.id) + '">' + thumb(c) +
        '<span class="chat-meta"><b>' + esc(c.other) + (c.otherIsFirm ? ' ' + icon('shield') : '') + '</b><span class="t">' + (c.role === 'owner' ? 'Your listing: ' : '') + esc(sub) + '</span><span class="last">' + esc(c.lastMessage || 'No messages yet') + '</span></span>' +
        '<span class="chat-side"><span>' + esc(short(c.updatedAt)) + '</span>' + (c.unread ? '<span class="dot">' + c.unread + '</span>' : '') + (c.role === 'owner' && c.phoneStatus === 'requested' ? '<span class="req-flag">Number request</span>' : '') + '</span></button>';
    }).join('');
  }
  listEl.addEventListener('click', function (e) { var b = e.target.closest('.chat-item'); if (b) open(b.dataset.id); });
  $$('input[name=cf]').forEach(function (r) { r.addEventListener('change', renderList); });
  function loadList() {
    return ST.api('chats').then(function (r) {
      chats = r.chats; listStamp = r.stamp || listStamp; renderList();
      var total = chats.reduce(function (n, c) { return n + (c.unread || 0); }, 0); ST.setBadge(total);
    });
  }

  // ---------- conversation
  function mine(m) { return chatInfo && m.from === chatInfo.role; }
  function otherPhone() {
    for (var i = msgs.length - 1; i >= 0; i--) if (msgs[i].type === 'phone' && !mine(msgs[i])) return msgs[i].text;
    return '';
  }
  function msgHTML(m) {
    var me = mine(m);
    var who = m.from === 'admin' || (chatInfo.otherIsFirm && !me) ? 'Stand Tall Realty' : m.name;
    if (m.type === 'phone') {
      if (me) return '<div class="phone-card me"><span class="small muted">You shared your number</span><b>' + esc(ST.fmtPhone(m.text)) + '</b></div>';
      return '<div class="phone-card"><span class="small muted">' + esc(who) + ' shared their number</span><b>' + esc(ST.fmtPhone(m.text)) + '</b><div class="row"><a class="btn btn-navy btn-sm" href="tel:+91' + esc(m.text) + '">' + icon('phone') + 'Call</a><a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="' + ST.wa('Hi, this is about ' + (chatInfo.listingTitle || 'your listing') + ' on Stand Tall Realty.', m.text) + '">' + icon('wa') + 'WhatsApp</a></div></div>';
    }
    if (m.type === 'phone_request') return '<div class="sys">' + (me ? 'You asked for the phone number. You will see it here once it is shared.' : esc(m.name) + ' asked for your phone number.') + '</div>';
    if (m.type === 'system') return '<div class="sys">' + esc(m.text) + '</div>';
    return '<div class="bubble ' + (me ? 'me' : 'them') + (m.pending ? ' pending' : '') + '">' + (m.from === 'admin' ? '<span class="nm">Stand Tall Realty</span>' : '') + esc(m.text) + '<span class="tm">' + (m.failed ? 'Not sent, ' : '') + esc(ST.clock(m.t)) + '</span></div>';
  }
  function renderMsgs(keepScroll) {
    var box = $('#msgs'); if (!box) return;
    var nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
    var html = '', day = '';
    msgs.forEach(function (m) {
      var d = ST.dayLabel(m.t);
      if (d !== day) { html += '<div class="day-sep">' + esc(d) + '</div>'; day = d; }
      html += msgHTML(m);
    });
    if (!msgs.length) html = '<div class="sys">Say hello and ask anything about the property. Do not pay any advance before visiting the property and checking documents.</div>';
    if (chatInfo.role === 'owner' && chatInfo.phoneStatus === 'requested') {
      html += '<div class="req-card"><b>' + esc(chatInfo.other) + ' wants your phone number</b><span class="small muted">Share it if you are happy to take calls from this buyer.</span><div class="row"><button class="btn btn-navy btn-sm" type="button" data-respond="1">' + icon('phone') + 'Share my number</button><button class="btn btn-ghost btn-sm" type="button" data-respond="0">Not now</button></div></div>';
    }
    box.innerHTML = html;
    if (!keepScroll || nearBottom) box.scrollTop = box.scrollHeight;
  }
  function topActions() {
    var c = chatInfo, a = '';
    if (c.role === 'buyer') {
      var ph = otherPhone();
      if (ph) a = '<a class="btn btn-navy btn-sm" href="tel:+91' + esc(ph) + '">' + icon('phone') + 'Call</a>';
      else if (c.phoneStatus === 'requested') a = '<button class="btn btn-ghost btn-sm" type="button" disabled>' + icon('lock') + 'Number requested</button>';
      else a = '<button class="btn btn-ghost btn-sm" type="button" data-askphone>' + icon('phone') + (c.otherIsFirm || phoneMode === 'direct' ? 'Get number' : 'Ask for number') + '</button>';
    } else if (c.phoneStatus !== 'shared') {
      a = '<button class="btn btn-ghost btn-sm" type="button" data-sharephone>' + icon('phone') + 'Share my number</button>';
    }
    return a;
  }
  function renderPane() {
    var c = chatInfo;
    var lt = c.listing ? c.listing.title : (c.listingTitle || 'General enquiry');
    pane.innerHTML = '<div class="chat-top"><button class="icon-btn back" type="button" aria-label="Back to chats" style="color:var(--navy)">' + icon('arrowLeft') + '</button>' +
      '<div class="who"><b>' + esc(c.other) + '</b>' + (c.listingId ? '<a href="property.html?id=' + encodeURIComponent(c.listingId) + '">' + (c.role === 'owner' ? 'Your listing: ' : '') + esc(lt) + (c.listing ? ', ' + esc(ST.priceLabel(c.listing)) + esc(ST.priceSuffix(c.listing)) : '') + '</a>' : '<a>' + esc(lt) + '</a>') + '</div>' +
      '<div class="actions" id="top-actions">' + topActions() + '</div></div>' +
      '<div class="msgs" id="msgs" aria-live="polite"></div>' +
      '<div class="quick-replies" id="qr"></div>' +
      '<form class="composer" id="composer"><label class="sr-only" for="msg-in">Message</label><textarea id="msg-in" rows="1" maxlength="2000" placeholder="Type a message"></textarea><button class="btn btn-gold" type="submit" aria-label="Send">' + icon('send') + '</button></form>';
    renderMsgs(false);
    renderQuick();
    var ta = $('#msg-in');
    ta.addEventListener('input', function () { ta.style.height = 'auto'; ta.style.height = Math.min(140, ta.scrollHeight) + 'px'; });
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) { e.preventDefault(); send(); } });
    $('#composer').addEventListener('submit', function (e) { e.preventDefault(); send(); });
    $('.back', pane).onclick = function () { active = null; app.classList.remove('has-active'); history.replaceState(null, '', 'chats.html'); renderList(); };
  }
  function renderQuick() {
    var q = $('#qr'); if (!q) return;
    var opts = chatInfo.role === 'buyer' ? ['Is this still available?', 'Can I visit this weekend?', 'What is the final price?', 'Is the price negotiable?'] : ['Yes, it is available.', 'When would you like to visit?', 'Please share a good time to call.'];
    q.innerHTML = msgs.filter(function (m) { return m.type === 'text'; }).length > 5 ? '' : opts.map(function (o) { return '<button type="button">' + esc(o) + '</button>'; }).join('');
  }
  pane.addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t) return;
    if (t.closest('#qr')) { $('#msg-in').value = t.textContent; send(); }
    if (t.hasAttribute('data-askphone')) act(t, 'requestPhone', {}, 'Request sent. You will see the number here once it is shared.');
    if (t.hasAttribute('data-sharephone')) {
      ST.confirmBox('Share your number?', chatInfo.other + ' will see your number ' + ST.fmtPhone(ST.Auth.user().phone) + ' in this chat.', 'Share number').then(function (ok) {
        if (ok) act(t, chatInfo.phoneStatus === 'requested' ? 'respondPhone' : 'sharePhone', { approve: true }, 'Number shared.');
      });
    }
    if (t.hasAttribute('data-respond')) act(t, 'respondPhone', { approve: t.dataset.respond === '1' }, t.dataset.respond === '1' ? 'Number shared.' : 'Okay, you can keep chatting here.');
  });
  function act(btn, action, extra, okMsg) {
    ST.busy(btn, true);
    ST.api(action, Object.assign({ chatId: active }, extra)).then(function () { ST.toast(okMsg, 'ok'); return refresh(true); })
      .catch(function (err) { ST.busy(btn, false); ST.toast(err.message, 'error'); });
  }
  function send() {
    var ta = $('#msg-in'), text = ta.value.trim();
    if (!text) return;
    ta.value = ''; ta.style.height = 'auto';
    var temp = { id: 'tmp' + Date.now(), t: Date.now(), from: chatInfo.role, name: '', type: 'text', text: text, pending: true };
    msgs.push(temp); renderMsgs(false); renderQuick();
    var cs = chats.filter(function (x) { return x.id === active; })[0];
    if (cs) { cs.lastMessage = text; cs.updatedAt = Date.now(); chats.sort(function (a, b) { return b.updatedAt - a.updatedAt; }); renderList(); }
    ST.api('sendMessage', { chatId: active, text: text }).then(function (r) {
      var i = msgs.indexOf(temp); if (i >= 0) msgs[i] = r.message;
      lastId = r.message.id; renderMsgs(true);
    }).catch(function (err) {
      temp.failed = true; temp.pending = false; renderMsgs(true);
      ta.value = text; ST.toast(err.message, 'error');
    });
  }
  function open(id) {
    active = id;
    app.classList.add('has-active');
    history.replaceState(null, '', 'chats.html?c=' + encodeURIComponent(id));
    $$('.chat-item').forEach(function (b) { b.setAttribute('aria-current', String(b.dataset.id === id)); });
    pane.innerHTML = '<div class="chat-empty"><p>Opening chat…</p></div>';
    msgs = []; lastId = ''; stamp = 0;
    return ST.api('messages', { chatId: id }).then(function (r) {
      if (active !== id) return;
      chatInfo = r.chat; phoneMode = r.phoneMode; msgs = r.messages; stamp = r.stamp;
      lastId = msgs.length ? msgs[msgs.length - 1].id : '';
      renderPane();
      var c = chats.filter(function (x) { return x.id === id; })[0];
      if (c && c.unread) { c.unread = 0; renderList(); ST.refreshUnread(true); }
      if (!('ontouchstart' in window)) $('#msg-in').focus();
    }).catch(function (err) { pane.innerHTML = '<div class="chat-empty"><p>' + esc(err.message) + '</p></div>'; });
  }
  function refresh(force) {
    if (!active || busyPoll) return Promise.resolve();
    busyPoll = true;
    var id = active;
    return ST.api('messages', { chatId: id, since: force ? 0 : stamp, after: force ? '' : lastId }).then(function (r) {
      busyPoll = false;
      if (r.unchanged || active !== id) return;
      if (force) msgs = r.messages; else msgs = msgs.filter(function (m) { return !m.pending && !m.failed && m.id.indexOf('tmp') !== 0; }).concat(r.messages.filter(function (m) { return !msgs.some(function (x) { return x.id === m.id; }); }));
      chatInfo = r.chat; phoneMode = r.phoneMode; stamp = r.stamp;
      lastId = msgs.length ? msgs[msgs.length - 1].id : lastId;
      $('#top-actions').innerHTML = topActions();
      renderMsgs(true); renderQuick();
      var c = chats.filter(function (x) { return x.id === id; })[0];
      if (c) { c.lastMessage = r.chat.lastMessage; c.phoneStatus = r.chat.phoneStatus; c.unread = 0; renderList(); }
    }).catch(function () { busyPoll = false; });
  }
  setInterval(function () { if (!document.hidden) refresh(false); }, 5000);
  setInterval(function () {
    if (document.hidden || !ST.Auth.token()) return;
    ST.api('poll', { since: listStamp }).then(function (r) { if (r.changed) { listStamp = r.stamp; loadList(); } }).catch(function () {});
  }, 15000);

  // ---------- start
  if (!ST.Auth.user()) return loginPrompt();
  listEl.innerHTML = '<div class="chat-empty"><p>Loading chats…</p></div>';
  pane.innerHTML = '<div class="chat-empty">' + icon('chat') + '<p>Choose a chat to read messages.</p></div>';
  loadList().then(function () {
    var want = ST.qs('c');
    if (want) open(want);
  }).catch(function (err) {
    if (err.code === 'LOGIN_REQUIRED') return loginPrompt();
    listEl.innerHTML = '<div class="chat-empty"><p>' + esc(err.message) + '</p></div>';
  });
})();
