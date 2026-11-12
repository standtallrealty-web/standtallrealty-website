/* =====================================================================
   Stand Tall Realty — quick chat (the "WhatsApp popup")
   Instead of a long form, visitors answer a few tap-to-reply questions:
   buyers and tenants see matching homes, owners describe their property.
   Each finished chat is saved as an enquiry (Admin → Leads, plus the
   usual email) and ends with a one-tap hand-off to WhatsApp.
   Owner chats get a "Create listing" button in Admin → Leads.
   The conversation is kept for this browser tab, so it survives moving
   between pages.
   ===================================================================== */
(function () {
  'use strict';
  var ST = window.ST;
  if (!ST || !document.body) return;
  var PAGE = document.body.getAttribute('data-page') || '';
  if (/^(admin|chats|404)$/.test(PAGE)) return;

  var S = ST.S, $ = ST.$, esc = ST.esc, icon = ST.icon;
  var REDUCE = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var KEY = 'st_chat', ME = 'st_chat_me', TEASED = 'st_chat_teased', AUTO = 'st_chat_auto';
  var AREAS = S.chatAreas && S.chatAreas.length ? S.chatAreas : ['Kondhwa', 'NIBM', 'Undri', 'Wanowrie', 'Hadapsar', 'Kharadi', 'Baner', 'Wakad'];
  var HOMES = /Flat|Bungalow|Row house/;

  // ------------------------------------------------------------ the conversation, kept for this tab
  function fresh() { return { flow: '', step: 'start', a: {}, log: [] }; }
  function load() { try { var v = JSON.parse(sessionStorage.getItem(KEY) || 'null'); return v && v.step ? v : null; } catch (e) { return null; } }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  var st = load() || fresh();

  function remembered() {
    var u = ST.Auth.user();
    if (u && u.phone) return { name: u.name || '', phone: u.phone };
    try { return JSON.parse(localStorage.getItem(ME) || 'null') || {}; } catch (e) { return {}; }
  }

  // ------------------------------------------------------------ questions
  // chips: [value, label] or a plain label. strict: only the chips are valid answers.
  var ZONE = { q: 'Which part of Pune is it in? Or type the area name below.', ph: 'Or type the area name', key: 'area', chips: function () { return zoneChips(); } };
  var LOCS = { q: function () { return 'Pick the area in ' + (st.zone || 'Pune') + '. Not listed? Type the name below.'; }, ph: 'Or type the area name', key: 'area', chips: function () { return localChips(); } };
  var SEARCH = { q: 'Type the area, society or landmark and pick the match from the list.', ph: 'e.g. Pimple Saudagar', key: 'area', chips: function () { return suggChips(); } };
  var STEPS = {
    start: {
      q: function () {
        return ['Hi 👋 Welcome to Stand Tall Realty.', ST.currentListing ? 'Questions about this property, or looking for something else?' : 'What are you looking for?'];
      },
      chips: function () {
        return (ST.currentListing ? [['about', 'Ask about this property']] : []).concat([['buy', 'Buy a home'], ['rent', 'Rent a home'], ['list', 'List my property']]);
      },
      strict: true, wa: 'Chat with us on WhatsApp'
    },
    area: { q: 'Which area are you looking in?', chips: function () { return AREAS.concat(['Other area', 'Any area']); }, ph: 'Or type an area', key: 'area' },
    areaz: ZONE, areal: LOCS, areaq: SEARCH,
    bhk: {
      q: 'How many bedrooms?', key: 'bhk', strict: true,
      chips: function (a) { return (a.flow === 'rent' ? ['1 RK'] : []).concat(['1 BHK', '2 BHK', '3 BHK', '4+ BHK', 'Any']); }
    },
    budget: {
      q: function (a) { return a.flow === 'rent' ? 'What monthly rent suits you?' : 'What is your budget?'; }, key: 'budget', strict: true,
      chips: function (a) { return (a.flow === 'rent' ? ST.RENT_BUDGETS : ST.BUY_BUDGETS).concat(['Not sure']); }
    },
    tenant: { q: 'Who will stay there?', chips: ['Family', 'Bachelor(s)', 'Company lease'], key: 'tenant', strict: true },
    more: {
      q: 'Want more options on WhatsApp? Many of our best homes are not online yet. Share your name and number, it takes 10 seconds.',
      chips: [['yes', 'Yes, send me options'], ['no', 'No thanks']], strict: true
    },
    deal: { q: 'Great! Do you want to sell it or rent it out?', chips: [['sale', 'Sell'], ['rent', 'Rent out']], key: 'deal', strict: true },
    ptype: { q: 'What kind of property is it?', chips: ['Flat / apartment', 'Bungalow / villa', 'Row house', 'Plot / land', 'Shop / office'], key: 'ptype', strict: true },
    where: { q: 'Which area is it in?', chips: function () { return AREAS.concat(['Other area']); }, ph: 'Or type the area', key: 'area' },
    wherez: ZONE, wherel: LOCS, whereq: SEARCH,
    society: { q: 'Society or building name? Start typing and pick it from the list.', ph: 'e.g. Brahma Majestic', skip: 'Skip', key: 'society', chips: function () { return (st.geo || []).map(function (g) { return [g.name, g.label]; }); } },
    obhk: { q: 'How many BHK?', chips: ['1 RK', '1 BHK', '2 BHK', '3 BHK', '4 BHK', '5+ BHK'], key: 'bhk', strict: true },
    size: {
      q: function (a) { return /Plot/.test(a.ptype) ? 'Plot size? (sq ft, guntha or acre)' : 'Carpet area in sq ft?'; },
      ph: function (a) { return /Plot/.test(a.ptype) ? 'e.g. 2000 sq ft or 5 guntha' : 'e.g. 950'; }, skip: 'Skip', key: 'size'
    },
    price: {
      q: function (a) { return a.deal === 'rent' ? 'Expected monthly rent?' : 'Expected price?'; },
      ph: function (a) { return a.deal === 'rent' ? 'e.g. 25000' : 'e.g. 85 lakh or 1.2 crore'; }, skip: 'Not sure yet', key: 'price', mode: 'decimal'
    },
    furnish: { q: 'Is it furnished?', chips: ['Fully furnished', 'Semi furnished', 'Unfurnished'], key: 'furnishing', strict: true },
    about: { q: 'Sure! What would you like?', chips: [['site_visit', 'Book a site visit'], ['listing', 'Price and details'], ['callback', 'Call me back']], key: 'ask', strict: true },
    name: { q: 'Your name?', ph: 'Your name', key: 'name', auto: 'name', chips: function () { var m = remembered(); return m.name ? [m.name] : []; } },
    phone: {
      q: 'Your WhatsApp number?', ph: '10-digit mobile', key: 'phone', type: 'tel', auto: 'tel',
      chips: function () { var m = remembered(); return m.phone ? [[m.phone, ST.fmtPhone(m.phone)]] : []; }
    },
    confirm: { chips: [['send', 'Looks good, send'], ['again', 'Start again']], strict: true },
    end: { chips: [['restart', 'Start over']], strict: true, wa: 'Chat with us on WhatsApp' },
    retry: { chips: [['send', 'Try again']], strict: true, wa: 'Chat with us on WhatsApp' },
    done: { chips: [['restart', 'Start over']], strict: true, wa: function (a) { return a.flow === 'list' ? 'Send photos on WhatsApp' : 'Continue on WhatsApp'; } }
  };
  var ORDER = {
    buy: ['area', 'bhk', 'budget', 'results', 'more', 'name', 'phone', 'send'],
    rent: ['area', 'bhk', 'budget', 'tenant', 'results', 'more', 'name', 'phone', 'send'],
    list: ['deal', 'ptype', 'where', 'society', 'obhk', 'size', 'price', 'furnish', 'name', 'phone', 'confirm', 'send'],
    about: ['about', 'name', 'phone', 'send']
  };
  function applies(step, a) {
    if (step === 'obhk') return HOMES.test(a.ptype || '');
    if (step === 'furnish') return a.deal === 'rent' && HOMES.test(a.ptype || '');
    if (step === 'society') return !/Plot/.test(a.ptype || '');
    return true;
  }
  function val(x, a) { return typeof x === 'function' ? x(a) : x; }

  // ------------------------------------------------------------ searching every Pune locality
  var AREA_LIST = null;
  function areaList() {
    if (AREA_LIST) return AREA_LIST;
    var L = window.ST_LOC || {}, seen = {}, out = [];
    var src = ((L.localities || {})['Pune'] || []).concat((L.localities || {})['Pimpri-Chinchwad'] || []);
    ((L.districts || []).filter(function (d) { return d[0] === 'Pune'; })[0] || [0, []])[1].forEach(function (t) { src.push(t); });
    src.concat(AREAS).forEach(function (n) { var k = nz(n); if (k && !seen[k]) { seen[k] = 1; out.push({ n: n, k: k }); } });
    return (AREA_LIST = out);
  }
  function nz(x) { return String(x || '').toLowerCase().replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim(); }
  function near(a, b) {   // one slip of the finger: a letter changed, added or missing
    if (Math.abs(a.length - b.length) > 1 || a.length < 4) return false;
    var i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
    return a.slice(i + 1) === b.slice(i + 1) || a.slice(i) === b.slice(i + 1) || a.slice(i + 1) === b.slice(i);
  }
  function findAreas(text) {
    var q = nz(text); if (q.length < 2) return [];
    var hits = [];
    areaList().forEach(function (a) {
      var score = -1, ws = a.k.split(' ');
      if (a.k === q) score = 0;
      else if (a.k.indexOf(q) === 0) score = 1;
      else if (ws.some(function (w) { return w.indexOf(q) === 0; })) score = 2;
      else if (a.k.indexOf(q) > -1) score = 3;
      else if (near(q, a.k) || ws.some(function (w) { return near(q, w); })) score = 4;
      if (score >= 0) hits.push({ s: score, a: a });
    });
    hits.sort(function (x, y) { return x.s - y.s || x.a.n.length - y.a.n.length; });
    return hits.slice(0, 6).map(function (h) { return h.a.n; });
  }
  var SUB = /^(area|where)[zlq]$/, PER_PAGE = 12;
  function zoneChips() {
    var z = (window.ST_LOC || {}).puneZones || {};
    return Object.keys(z).map(function (k) { return ['z:' + k, k]; }).concat([['z:search', 'Search by name'], ['__back', 'Back to main areas']]);
  }
  function localChips() {
    var all = ((window.ST_LOC || {}).puneZones || {})[st.zone] || [], page = st.page || 0;
    var out = all.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE).map(function (n) { return [n, n]; });
    if ((page + 1) * PER_PAGE < all.length) out.push(['__more', 'More areas']);
    return out.concat([['__zones', 'Other part of Pune']]);
  }
  function suggChips() {
    var out = (st.sugg || []).map(function (n) { return [n, n]; }).concat((st.geo || []).map(function (g) { return [g.label, g.label]; }));
    if (st.typedArea && (st.sugg || []).map(nz).indexOf(nz(st.typedArea)) < 0) out.push([st.typedArea, 'Use "' + st.typedArea + '"']);
    return out.concat([['__zones', 'Browse by part of Pune']]);
  }
  function chipList(step) {
    var s = STEPS[step]; if (!s || !s.chips) return [];
    return val(s.chips, st.a).map(function (c) { return Array.isArray(c) ? c : [c, c]; });
  }

  // ------------------------------------------------------------ the panel
  var root, list, repliesEl, form, input, launcher, lastFocus = null, started = false, queue = Promise.resolve();
  var gen = 0;   // bumped by "Start over" so messages still on their way are dropped

  function build() {
    if (root) return;
    root = document.createElement('section');
    root.className = 'wac';
    root.hidden = true;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', 'Chat with Stand Tall Realty');
    root.innerHTML =
      '<header class="wac-head"><img class="wac-ava" src="' + ST.ASSETS + 'img/mark-sm.png" alt="" width="40" height="40">' +
      '<div class="wac-who"><b>Stand Tall Realty</b><span>' + esc(S.hours || '') + '</span></div>' +
      '<button type="button" class="wac-hbtn" data-restart aria-label="Start over" title="Start over">' + icon('redo') + '</button>' +
      '<button type="button" class="wac-hbtn" data-close aria-label="Close chat" title="Close">' + icon('x') + '</button></header>' +
      '<div class="wac-body"><div class="wac-log" role="log" aria-live="polite"></div><div class="wac-replies"></div></div>' +
      '<form class="wac-input" novalidate><input name="t" autocomplete="off" enterkeyhint="send" aria-label="Type your answer" maxlength="120">' +
      '<button type="submit" class="wac-send" aria-label="Send">' + icon('send') + '</button></form>' +
      '<p class="wac-foot">Your details go only to Stand Tall Realty.</p>';
    document.body.appendChild(root);
    list = $('.wac-log', root); repliesEl = $('.wac-replies', root); form = $('.wac-input', root); input = form.t;
    var geoLive = ST.debounce(function () {
      var q = input.value.trim(), step = st.step, g0 = gen;
      if (q.length < 3 || (step !== 'society' && !/^(area|where)q$/.test(step))) { if (st.geo && st.geo.length) { st.geo = []; save(); } return; }
      ST.placeSearch(q).then(function (r) {
        if (g0 !== gen || st.step !== step || input.value.trim() !== q) return;
        st.geo = r; save();
        if (step === 'society') { replies(); input.value = q; }
        else repliesEl.innerHTML = suggChips().map(function (c) { return '<button type="button" class="wac-chip" data-v="' + esc(c[0]) + '">' + esc(c[1]) + '</button>'; }).join('');
      });
    }, 260);
    input.addEventListener('input', function () {
      geoLive();
      if (!SUB.test(st.step)) return;
      var q = input.value.trim();
      if (q.length < 2) return;
      st.step = st.step.slice(0, -1) + 'q';
      st.sugg = findAreas(q); st.typedArea = q.slice(0, 60);
      repliesEl.innerHTML = suggChips().map(function (c) { return '<button type="button" class="wac-chip" data-v="' + esc(c[0]) + '">' + esc(c[1]) + '</button>'; }).join('');
    });
    $('[data-close]', root).onclick = close;
    $('[data-restart]', root).onclick = function () { restart(); };
    form.addEventListener('submit', function (e) { e.preventDefault(); var t = input.value.trim(); if (!t) return; input.value = ''; typed(t); });
    repliesEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-v]'); if (!b || b.disabled) return;
      answer(b.getAttribute('data-v'), b.textContent, !!b.hasAttribute('data-skip'));
    });
    root.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    if (window.visualViewport) { visualViewport.addEventListener('resize', fit); visualViewport.addEventListener('scroll', fit); }
    window.addEventListener('resize', fit);
  }

  /** Phones: keep the panel above the on-screen keyboard. */
  function fit() {
    if (!root || root.hidden) return;
    var vv = window.visualViewport;
    if (!vv || window.innerWidth > 640) { root.style.height = ''; root.style.bottom = ''; return; }
    var kb = Math.round(window.innerHeight - vv.height - vv.offsetTop);
    if (kb > 80) { root.style.bottom = kb + 'px'; root.style.height = Math.max(260, Math.round(vv.height) - 6) + 'px'; }
    else { root.style.bottom = ''; root.style.height = ''; }
    scrollEnd();
  }
  function scrollEnd() { var b = root && $('.wac-body', root); if (b) b.scrollTop = b.scrollHeight; }

  function bubble(who, html, cls) {
    var d = document.createElement('div');
    d.className = 'wac-msg ' + who + (cls ? ' ' + cls : '');
    d.innerHTML = html;
    list.appendChild(d);
    scrollEnd();
    return d;
  }
  function typingBubble() { return bubble('bot', '<span class="wac-dots" aria-label="Typing"><i></i><i></i><i></i></span>', 'typing'); }

  /** A message from us, after a short "typing…" pause (none when motion is reduced). */
  function bot(html, cls) {
    var g = gen;
    st.log.push({ w: 'bot', h: html, c: cls || '' }); save();
    queue = queue.then(function () {
      if (g !== gen) return;
      if (REDUCE) { bubble('bot', html, cls); return; }
      var t = typingBubble();
      return ST.sleep(Math.min(900, 320 + html.replace(/<[^>]+>/g, '').length * 7)).then(function () { t.remove(); if (g === gen) bubble('bot', html, cls); });
    });
    return queue;
  }
  function me(text) {
    var g = gen;
    st.log.push({ w: 'me', h: esc(text) }); save();
    queue = queue.then(function () { if (g === gen) bubble('me', esc(text)); });
    return queue;
  }
  /** Runs work after the messages already on their way, unless the chat was restarted meanwhile. */
  function after(fn) { var g = gen; return queue.then(function () { if (g === gen) return fn(g); }); }

  // ------------------------------------------------------------ flow
  function go(step) {
    st.step = step; st.geo = []; save();
    if (step === 'results') return results();
    if (step === 'send') return send();
    if (step === 'confirm') return summary();
    var s = STEPS[step];
    var qs = val(s.q, st.a);
    (Array.isArray(qs) ? qs : qs ? [qs] : []).forEach(function (t) { bot(esc(t)); });
    return queue.then(replies);
  }
  function next() {
    var order = ORDER[st.flow] || [], i = order.indexOf(st.step);
    for (var j = i + 1; j < order.length; j++) if (applies(order[j], st.a)) return go(order[j]);
  }

  function answer(v, label, skipped) {
    var step = st.step, s = STEPS[step] || {};
    clearReplies();
    me(String(label || v).trim());
    if (step === 'start') {
      st.flow = v; st.a = { flow: v };
      if (v === 'about' && ST.currentListing) st.a.listing = { id: ST.currentListing.id, title: ST.currentListing.title };
      return next();
    }
    if (v === 'restart') return restart();
    if ((step === 'area' || step === 'where') && v === 'Other area') { st.sugg = []; st.typedArea = ''; return go(step + 'z'); }
    if (SUB.test(step)) {
      var orig = step.slice(0, -1);
      st.typedArea = '';
      if (v === '__back') return go(orig);
      if (v === '__zones') return go(orig + 'z');
      if (v === 'z:search') { st.sugg = []; return go(orig + 'q'); }
      if (/^z:/.test(v)) { st.zone = v.slice(2); st.page = 0; return go(orig + 'l'); }
      if (v === '__more') { st.page = (st.page || 0) + 1; save(); return queue.then(replies); }
      st.sugg = []; st.a.area = v; st.step = orig; save();
      return next();
    }
    if (step === 'more' && v === 'no') return bye();
    if (step === 'confirm' && v === 'again') { st.a = { flow: 'list' }; st.step = 'start'; bot(esc('Okay, let us start again.')); return next(); }
    if (step === 'retry') return go('send');
    if (s.key) st.a[s.key] = skipped ? '' : v;
    save();
    return next();
  }

  /** The visitor typed instead of tapping. */
  function typed(text) {
    var step = st.step, s = STEPS[step];
    if (!s) return;
    if (SUB.test(step)) {
      var zones = (window.ST_LOC || {}).puneZones || {}, zq = nz(text).replace(/ pune$|^pune /, ''), zn = Object.keys(zones).filter(function (k) { return nz(k) === nz(text) || nz(k).replace(/ pune$/, '') === zq; })[0];
      if (zn) { clearReplies(); me(text); st.zone = zn; st.page = 0; return go(step.slice(0, -1) + 'l'); }
      step = st.step = step.slice(0, -1) + 'q';
      var q = text.replace(/\s+/g, ' ').trim();
      if (q.length < 2) { clearReplies(); me(text); bot(esc('Please type at least two letters of the area name.')); return queue.then(replies); }
      var exact = areaList().filter(function (a) { return a.k === nz(q); })[0];
      if (exact) { st.step = step; return answer(exact.n, text); }
      st.sugg = findAreas(q); st.typedArea = q.slice(0, 60); clearReplies(); me(text);
      bot(esc(st.sugg.length ? 'Is it one of these? Tap the right one.' : 'We could not find that in our list. Tap to use it as you typed it, or try another spelling.'));
      return queue.then(replies);
    }
    var low = text.toLowerCase(), key = function (x) { return String(x).toLowerCase().replace(/[^a-z0-9+]/g, ''); };
    var hit = chipList(step).filter(function (c) { return key(c[1]) === key(text) || key(c[0]) === key(text); })[0];
    if (!hit && step === 'start') {
      var guess = /\b(sell|list|post|owner)\b/.test(low) ? 'list' : /\brent/.test(low) ? 'rent' : /\b(buy|purchase|flat|bhk|home|house)\b/.test(low) ? 'buy' : '';
      if (guess) hit = chipList('start').filter(function (c) { return c[0] === guess; })[0];
    }
    if (hit) return answer(hit[0], text);
    if (step === 'area' || step === 'where') { st.step = step + 'q'; save(); return typed(text); }
    if (s.strict) { clearReplies(); me(text); bot(esc('Please tap one of the options below.')); return queue.then(replies); }
    var c = check(step, text);
    if (c.err) { clearReplies(); me(text); bot(esc(c.err)); return queue.then(replies); }
    return answer(c.v, text);
  }

  function check(step, t) {
    t = t.replace(/\s+/g, ' ').trim();
    if (step === 'name') return /\p{L}/u.test(t) && t.length >= 2 ? { v: t.slice(0, 80) } : { err: 'Please type your name.' };
    if (step === 'phone') { var p = ST.normPhone(t); return p ? { v: p } : { err: 'Please type a 10-digit mobile number, like 98220 11223.' }; }
    if (step === 'area' || step === 'where') return t.length >= 2 ? { v: t.slice(0, 60) } : { err: 'Please type the area name.' };
    if (step === 'size') return /\d/.test(t) ? { v: t.slice(0, 40) } : { err: 'Please type a number, like 950.' };
    if (step === 'price') {
      var rent = st.a.deal === 'rent', n = ST.parseAmount(t, rent);
      if (!n) return { err: rent ? 'Please type the monthly rent, like 25000.' : 'Please type the amount, like 85 lakh or 1.2 crore.' };
      st.a.priceNum = n;
      return { v: rent ? ST.rupees(n) : ST.inr(n) };
    }
    return { v: t.slice(0, 80) };
  }

  function clearReplies() { if (repliesEl) repliesEl.innerHTML = ''; }

  /** Tap-to-answer buttons (and the WhatsApp button) for the current step. */
  function replies() {
    var s = STEPS[st.step];
    clearReplies();
    if (!s) { setInput(null, ' '); return; }
    var html = chipList(st.step).map(function (c) {
      return '<button type="button" class="wac-chip" data-v="' + esc(c[0]) + '">' + esc(c[1]) + '</button>';
    }).join('');
    if (s.skip) html += '<button type="button" class="wac-chip wac-skip" data-v="" data-skip>' + esc(s.skip) + '</button>';
    if (s.wa) html += '<a class="wac-wa" href="' + esc(ST.wa(waText())) + '" target="_blank" rel="noopener">' + icon('wa') + esc(val(s.wa, st.a)) + '</a>';
    repliesEl.innerHTML = html;
    setInput(s);
    scrollEnd();
  }
  function setInput(s, off) {
    var text = s && !s.strict;
    input.disabled = !!off;
    form.classList.toggle('is-off', !!off);
    if (off) { input.placeholder = off; return; }
    input.type = s && s.type === 'tel' ? 'tel' : 'text';
    input.setAttribute('inputmode', s && s.type === 'tel' ? 'numeric' : s && s.mode ? s.mode : 'text');
    input.setAttribute('autocomplete', s && s.auto ? s.auto : 'off');
    input.placeholder = text ? val(s.ph, st.a) || 'Type here' : 'Tap an option, or type here';
    form.classList.toggle('is-text', !!text);
    if (text && root && !root.hidden && window.innerWidth > 640) try { input.focus({ preventScroll: true }); } catch (e) {}
  }

  // ------------------------------------------------------------ buyers and tenants: matching homes
  var STOP = /^(near|road|pune|the|and|east|west|new|old|nagar|colony|society|park|city|area|any)$/;
  function words(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').filter(function (w) { return w.length >= 3 && !STOP.test(w); }); }
  function areaHit(l, area) {
    var w = words(area); if (!w.length) return true;
    var hay = String([l.locality, l.title, l.landmark, l.city].join(' ')).toLowerCase();
    return w.some(function (x) { return hay.indexOf(x) >= 0; });
  }
  function bhkNums(l) { return String(l.bhk || '').split(',').map(function (x) { return /rk/i.test(x) ? 0.5 : parseFloat(x); }).filter(function (n) { return !isNaN(n); }); }
  function bhkHit(l, want) {
    if (!want || want === 'Any') return true;
    var have = bhkNums(l); if (!have.length) return false;
    if (/rk/i.test(want)) return have.indexOf(0.5) >= 0;
    var n = parseInt(want, 10);
    return have.some(function (h) { return /\+/.test(want) ? h >= n : Math.floor(h) === n; });
  }
  function budgetCode(a) {
    var pairs = a.flow === 'rent' ? ST.BUDGET_RENT : ST.BUDGET_SALE;
    var p = (pairs || []).filter(function (x) { return x[1] === a.budget; })[0];
    return p ? p[0] : '';
  }
  function seeAll(a) {
    var q = new URLSearchParams();
    q.set('purpose', a.flow === 'rent' ? 'rent' : 'sale');
    if (a.area && a.area !== 'Any area') q.set('loc', a.area);
    var n = parseInt(a.bhk, 10); if (n) q.set('bhk', String(Math.min(n, 4)));
    var b = budgetCode(a); if (b) q.set('budget', b);
    return 'properties.html?' + q.toString();
  }
  function cardsHtml(items, total, a) {
    return '<div class="wac-cards">' + items.map(function (l) {
      return '<a class="wac-card" href="' + esc(ST.listingUrl(l.id)) + '">' +
        (l.photos && l.photos[0] ? ST.imgTag(l.photos[0], 240, '', 'wac-img') : '<span class="wac-img wac-noimg">' + icon('building') + '</span>') +
        '<span class="wac-ct"><b>' + esc(ST.priceLabel(l)) + '<small>' + esc(ST.priceSuffix(l)) + '</small></b><span class="wac-tt">' + esc(l.title) + '</span><small>' + esc(ST.placeLabel(l)) + '</small></span></a>';
    }).join('') + (total > items.length ? '<a class="wac-all" href="' + esc(seeAll(a)) + '">See all ' + total + ' matches</a>' : '') + '</div>';
  }
  function results() {
    var a = st.a;
    clearReplies();
    return after(function (g) {
      var t = typingBubble();
      return ST.getListings().then(function (all) {
        t.remove();
        if (g !== gen) return;
        var want = all.filter(function (l) { return l.purpose === (a.flow === 'rent' ? 'rent' : 'sale') && (!l.category || l.category === 'Residential'); });
        var exact = want.filter(function (l) { return areaHit(l, a.area) && bhkHit(l, a.bhk) && (!budgetCode(a) || ST.inBudget(l, budgetCode(a))); });
        var picks = exact, note = '';
        if (exact.length) note = exact.length === 1 ? 'Here is a home that matches:' : 'Here are homes that match:';
        else if (a.area && a.area !== 'Any area') {
          picks = want.filter(function (l) { return areaHit(l, a.area); });
          if (picks.length) note = 'Nothing exact online right now. Here is what we have in ' + a.area + ':';
        } else picks = [];
        a.seen = picks.slice(0, 3).map(function (l) { return l.id; }); save();
        if (picks.length) { bot(esc(note)); bot(cardsHtml(picks.slice(0, 3), picks.length, a), 'wide'); }
        else bot(esc('No exact match online right now, but new homes come in every week, and many are never listed online.'));
        return queue.then(next);
      }).catch(function () {
        t.remove();
        if (g !== gen) return;
        bot(esc('We could not load the listings just now.'));
        return queue.then(next);
      });
    });
  }
  function bye() {
    bot(esc('No problem! Tap a home above to see photos and details. We are here if you need us.'));
    st.step = 'end'; save();
    return queue.then(replies);
  }

  // ------------------------------------------------------------ owners: summary before sending
  var SHORT = { 'Flat / apartment': 'flat', 'Bungalow / villa': 'bungalow', 'Row house': 'row house', 'Plot / land': 'plot', 'Shop / office': 'shop / office' };
  function ownerWhat(a) { return [a.bhk || '', SHORT[a.ptype] || 'property'].filter(Boolean).join(' '); }
  function sizeText(a) { return !a.size ? '' : /^[\d.,\s]+$/.test(a.size) ? a.size.replace(/\s/g, '') + ' sq ft' : a.size; }
  function place(a) { return [a.society, a.area].filter(Boolean).join(', '); }
  function summary() {
    var a = st.a, rent = a.deal === 'rent';
    var rows = [['Property', ownerWhat(a)], ['For', rent ? 'Rent' : 'Sale'], ['Location', place(a)], ['Size', sizeText(a)],
      [rent ? 'Monthly rent' : 'Price', a.price || 'Not sure yet'], ['Furnishing', a.furnishing || ''], ['Name', a.name], ['Mobile', ST.fmtPhone(a.phone)]];
    bot('<p class="wac-sum-h">Please check:</p><dl class="wac-sum">' + rows.filter(function (r) { return r[1]; }).map(function (r) {
      return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>';
    }).join('') + '</dl>', 'wide');
    return queue.then(replies);
  }

  // ------------------------------------------------------------ sending the enquiry
  function ownerIntent(a) {
    if (/Shop/.test(a.ptype)) return 'commercial';
    if (/Plot/.test(a.ptype) && a.deal !== 'rent') return 'plot_sell';
    return a.deal === 'rent' ? 'rentout' : 'sell';
  }
  function source() { var s = ST.leadSource(); return 'Website chat' + (s && s !== 'direct' ? ' · ' + s : ''); }
  function payload(a) {
    var d = [], intent = a.flow, L = a.listing || null;
    if (a.flow === 'buy' || a.flow === 'rent') {
      d.push('Area: ' + (a.area || 'Any area'), 'Size: ' + (a.bhk || 'Any'), 'Budget: ' + (a.budget || 'Not sure'));
      if (a.tenant) d.push('Tenant: ' + a.tenant);
      if (a.seen && a.seen.length) d.push('Saw: ' + a.seen.join(', '));
    } else if (a.flow === 'list') {
      intent = ownerIntent(a);
      if (intent === 'commercial') d.push('Wants to: ' + (a.deal === 'rent' ? 'Rent out' : 'Sell'));
      d.push('For: ' + (a.deal === 'rent' ? 'Rent' : 'Sale'), 'Type: ' + a.ptype);
      if (a.bhk) d.push('BHK: ' + a.bhk);
      d.push('Area: ' + a.area);
      if (a.society) d.push('Society: ' + a.society);
      if (a.size) d.push((/Plot/.test(a.ptype) ? 'Plot size: ' : 'Carpet area: ') + sizeText(a));
      if (a.price) d.push((a.deal === 'rent' ? 'Expected rent: ' : 'Expected price: ') + a.price);
      if (a.furnishing) d.push('Furnishing: ' + a.furnishing);
    } else intent = a.ask || 'listing';
    return {
      intent: intent, name: a.name, phone: a.phone, email: '', details: d.join(' | '), message: '', company: '',
      listingId: L ? L.id : '', listingTitle: L ? L.title : '', page: location.pathname.split('/').pop() || 'index.html', source: source()
    };
  }
  function send() {
    var a = st.a, p = payload(a);
    clearReplies();
    return after(function (g) {
      var t = typingBubble();
      return ST.api('lead', p).then(function (r) {
        t.remove();
        if (g !== gen) return;
        try { localStorage.setItem(ME, JSON.stringify({ name: a.name, phone: a.phone })); } catch (e) {}
        ST.track('Lead', { content_name: 'chat_' + p.intent });
        a.ref = (r && r.id) || ''; save();
        if (r && r.otp) return otpStep(r, p);
        return done();
      }).catch(function (err) {
        t.remove();
        if (g !== gen) return;
        bot(esc(err && err.message ? err.message : 'Something went wrong. Please try again.'));
        st.step = 'retry'; save();
        return queue.then(replies);
      });
    });
  }
  /** Only when SMS OTP is switched on: confirm the number, like the enquiry form does. */
  function otpStep(r, p) {
    bot(esc('One last step: please confirm your number with the OTP we sent by SMS.'));
    return queue.then(function () {
      var ph = (r.otp && r.otp.phone) || p.phone;
      repliesEl.innerHTML = '';
      setInput(null, 'Enter the OTP above');
      repliesEl.appendChild(ST.otpBox({
        phone: ph, resendIn: r.otp.resendIn, demoOtp: r.otp.demoOtp, verifyLabel: 'Verify number', waText: waText(),
        onVerify: function (code) { return ST.api('verifyLead', { id: r.id, phone: ph, otp: code }).then(function () { clearReplies(); return done(); }); },
        onResend: function () { return ST.api('sendOtp', { phone: ph, purpose: 'lead', leadId: r.id }); },
        onChange: function () { clearReplies(); go('phone'); }
      }));
      scrollEnd();
    });
  }
  function done() {
    var a = st.a, first = String(a.name || '').split(' ')[0];
    st.step = 'done'; save();
    if (a.flow === 'list') {
      bot(esc('Thanks, ' + first + '! We have your property details.'));
      bot(esc('Next, send us 4 to 8 photos on WhatsApp. Our team checks everything and puts your listing live ' + (S.approvalTime || 'within 24 hours') + '.'));
    } else if (a.flow === 'about') bot(esc('Thanks, ' + first + '! We will call you on ' + ST.fmtPhone(a.phone) + ' soon.'));
    else bot(esc('Thanks, ' + first + '! We will WhatsApp you matching options on ' + ST.fmtPhone(a.phone) + ' soon.'));
    return queue.then(replies);
  }

  /** The message that opens in WhatsApp, with everything they told us. */
  function waText() {
    var a = st.a || {}, L = a.listing || (ST.currentListing ? { id: ST.currentListing.id, title: ST.currentListing.title } : null);
    var hi = 'Hi Stand Tall Realty, ' + (a.name ? 'I am ' + a.name + '. ' : '');
    var ref = a.ref ? ' (ref ' + a.ref + ')' : '';
    if (st.step === 'done' && a.flow === 'list') return hi + 'Sending photos of my ' + ownerWhat(a) + ' for ' + (a.deal === 'rent' ? 'rent' : 'sale') + ' in ' + place(a) + ref + '.';
    if ((st.step === 'done' || st.step === 'end') && (a.flow === 'buy' || a.flow === 'rent')) {
      return hi + 'I am looking for ' + (a.bhk && a.bhk !== 'Any' ? 'a ' + a.bhk + ' home' : 'a home') + (a.flow === 'rent' ? ' on rent' : ' to buy') +
        (a.area && a.area !== 'Any area' ? ' in ' + a.area : '') + (a.budget && a.budget !== 'Not sure' ? ', budget ' + a.budget : '') + ref + '.';
    }
    if (L) return hi + 'I am interested in ' + L.id + ' – ' + L.title + ref + '. ' + ST.absUrl(ST.listingUrl(L.id));
    return 'Hi Stand Tall Realty, I am looking for a property.';
  }

  // ------------------------------------------------------------ open, close, restart
  function restore() {
    st.log.forEach(function (m) { bubble(m.w, m.h, m.c); });
    if (st.step === 'results') return results();
    if (st.step === 'send') st.step = 'retry';
    replies();
  }
  function restart() {
    gen++;
    st = fresh(); save();
    if (list) list.innerHTML = '';
    clearReplies();
    queue = Promise.resolve();
    started = true;
    go('start');
  }
  function open(flow, auto) {
    build();
    hideTease(true);
    try { sessionStorage.setItem(AUTO, '1'); } catch (e) {}
    if (root.hidden) {
      lastFocus = document.activeElement;
      root.hidden = false;
      document.body.classList.add('wac-on');
      if (launcher) launcher.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(function () { root.classList.add('in'); });
      fit();
    }
    // A button such as "List it by chat instead" asks for one conversation: start it unless it is already under way.
    var want = flow && ORDER[flow] && (st.flow !== flow || /^(done|end)$/.test(st.step));
    if (want) {
      started = true;
      if (st.log.length || st.flow) restart(); else go('start');
      var g = gen;
      queue.then(function () { if (g === gen && st.step === 'start' && !st.flow) answer(flow, (chipList('start').filter(function (c) { return c[0] === flow; })[0] || [flow, flow])[1]); });
    } else if (!started) { started = true; if (st.log.length) restore(); else go('start'); }
    if (!auto) setTimeout(function () { var f = $('.wac-chip', repliesEl) || input; if (window.innerWidth > 640 || f !== input) try { f.focus({ preventScroll: true }); } catch (e) {} }, REDUCE ? 0 : 420);
  }
  function close() {
    if (!root || root.hidden) return;
    root.classList.remove('in');
    root.hidden = true;
    root.style.height = ''; root.style.bottom = '';
    document.body.classList.remove('wac-on');
    if (launcher) launcher.setAttribute('aria-expanded', 'false');
    if (lastFocus && document.contains(lastFocus)) try { lastFocus.focus({ preventScroll: true }); } catch (e) {}
  }

  // ------------------------------------------------------------ the little "Hi there" note
  var tease = null;
  function hideTease(remember) {
    if (tease) { tease.remove(); tease = null; }
    if (remember) try { localStorage.setItem(TEASED, String(Date.now())); } catch (e) {}
  }
  function showTease() {
    if (tease || st.log.length || (root && !root.hidden) || document.body.classList.contains('modal-open') || PAGE === 'account') return;
    try { if (Date.now() - (Number(localStorage.getItem(TEASED)) || 0) < 3 * 864e5) return; } catch (e) { return; }
    var msg = PAGE === 'post' ? 'Prefer a quick chat? Tell us about your property in a few taps, no login needed.' :
      ST.currentListing ? 'Questions about this property? Ask us here, it takes a few taps.' :
      'Buying, renting or listing a property? Tell us in a few taps, no long forms.';
    tease = document.createElement('div');
    tease.className = 'wac-tease' + (document.querySelector('.mobile-bar:not([hidden])') ? ' over-bar' : '') + (document.getElementById('pd-bar') ? ' over-pd' : '');
    tease.setAttribute('role', 'status');
    tease.innerHTML = '<button type="button" class="wac-tx" aria-label="Close">' + icon('x') + '</button>' +
      '<p><b>Hi there 👋</b><span>' + esc(msg) + '</span></p><button type="button" class="wac-tgo">' + icon('chat') + 'Start chat</button>';
    document.body.appendChild(tease);
    $('.wac-tx', tease).onclick = function () { hideTease(true); };
    $('.wac-tgo', tease).onclick = function () { open(PAGE === 'post' ? 'list' : ''); };
    requestAnimationFrame(function () { if (tease) tease.classList.add('in'); });
  }

  // ------------------------------------------------------------ wiring
  launcher = document.querySelector('.wa-float');
  if (!launcher) {
    // Pages without the usual WhatsApp button (property, post) still get a way into the chat on computers.
    launcher = document.createElement('a');
    launcher.className = 'wa-float';
    launcher.href = ST.wa('Hi Stand Tall Realty, I am looking for a property.');
    launcher.target = '_blank'; launcher.rel = 'noopener';
    launcher.innerHTML = icon('wa');
    document.body.appendChild(launcher);
  }
  launcher.setAttribute('aria-label', 'Chat with us');
  launcher.setAttribute('aria-haspopup', 'dialog');
  launcher.setAttribute('aria-expanded', 'false');

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('.wa-float, .mobile-bar:not(#pd-bar) a.wa, [data-quickchat]') : null;
    if (!t || e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    if (t.classList.contains('wa-float') && root && !root.hidden) { close(); return; }
    open(t.getAttribute('data-quickchat') || '');
  });
  /** The chat opens by itself a moment after the first page is shown, once per visit: leads are the point.
      It stays quiet for the rest of the visit once opened or closed, and after the visitor has sent an enquiry. */
  function autoOpen() {
    if (root && !root.hidden) return;
    if (st.step === 'done' || PAGE === 'account' || document.body.classList.contains('modal-open')) return;
    var a = document.activeElement;
    if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;   // do not interrupt someone who is typing
    try { if (sessionStorage.getItem(AUTO)) return; } catch (e) { return; }
    open(PAGE === 'post' ? 'list' : '', true);
  }
  setTimeout(autoOpen, 3000);
  setTimeout(showTease, PAGE === 'post' ? 7000 : 9000);

  ST.quickChat = { open: open, close: close };
})();
