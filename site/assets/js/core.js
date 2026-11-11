/* Stand Tall Realty — shared website code */
(function () {
  'use strict';
  var S = window.SITE || {};
  var LOC = window.ST_LOC;
  var VER = '202611120200';
  var scriptSrc = (document.currentScript && document.currentScript.src) || '';
  var ASSETS = scriptSrc ? scriptSrc.replace(/js\/core\.js.*$/, '') : 'assets/';

  // ---------------------------------------------------------------- basics
  function $(sel, el) { return (el || document).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function debounce(fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); }; }
  function qs(name) { return new URLSearchParams(location.search).get(name) || ''; }
  var mem = {};
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return mem[k] === undefined ? null : mem[k]; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { delete mem[k]; } },
    json: function (k, d) { try { var v = store.get(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    setJson: function (k, v) { store.set(k, JSON.stringify(v)); }
  };

  // ---------------------------------------------------------------- formatting
  function trimNum(x) { return String(Math.round(x * 100) / 100); }
  function inr(n) {
    n = Number(n || 0); if (!n) return '';
    if (n >= 1e7) return '₹' + trimNum(n / 1e7) + ' Cr';
    if (n >= 1e5) return '₹' + trimNum(n / 1e5) + ' L';
    return '₹' + n.toLocaleString('en-IN');
  }
  function rupees(n) { n = Number(n || 0); return n ? '₹' + n.toLocaleString('en-IN') : ''; }
  function priceLabel(l) {
    if (l.purpose === 'rent') return l.rent ? rupees(l.rent) : 'Rent on request';
    if (!l.price) return 'Price on request';
    if (l.kind === 'project') return inr(l.price) + (l.priceMax && l.priceMax > l.price ? ' – ' + inr(l.priceMax) : ' onwards');
    return inr(l.price);
  }
  function priceSuffix(l) { return l.purpose === 'rent' && l.rent ? '/month' : ''; }
  function bhkLabel(l) {
    if (l.configurations) return l.configurations;
    var b = String(l.bhk || '');
    if (!b) return '';
    if (/rk/i.test(b)) return b.toUpperCase();
    return b.split(',').join(', ') + ' BHK';
  }
  function areaLabel(l) { return l.carpetArea ? Number(l.carpetArea).toLocaleString('en-IN') + ' ' + (l.areaUnit || 'sq ft') + (l.kind === 'project' ? ' onwards' : '') : ''; }
  function timeAgo(ms) {
    if (!ms) return '';
    var s = Math.max(1, Math.round((Date.now() - ms) / 1000));
    if (s < 60) return 'just now';
    var m = Math.round(s / 60); if (m < 60) return m + ' min ago';
    var h = Math.round(m / 60); if (h < 24) return h + (h === 1 ? ' hour ago' : ' hours ago');
    var d = Math.round(h / 24); if (d < 30) return d + (d === 1 ? ' day ago' : ' days ago');
    var mo = Math.round(d / 30); if (mo < 12) return mo + (mo === 1 ? ' month ago' : ' months ago');
    return Math.round(mo / 12) + ' yr ago';
  }
  function clock(ms) { var d = new Date(ms); return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }); }
  function dayLabel(ms) {
    var d = new Date(ms), t = new Date(); var y = new Date(); y.setDate(t.getDate() - 1);
    if (d.toDateString() === t.toDateString()) return 'Today';
    if (d.toDateString() === y.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: d.getFullYear() === t.getFullYear() ? undefined : 'numeric' });
  }
  function fmtPhone(p) { p = String(p || ''); return p.length === 10 ? '+91 ' + p.slice(0, 5) + ' ' + p.slice(5) : p; }
  function normPhone(p) { var d = String(p || '').replace(/\D/g, ''); if (d.length === 12 && d.indexOf('91') === 0) d = d.slice(2); if (d.length === 11 && d[0] === '0') d = d.slice(1); return /^[6-9]\d{9}$/.test(d) ? d : ''; }
  function tel(p) { return 'tel:+91' + String(p || S.phone); }
  function wa(text, p) { return 'https://wa.me/91' + String(p || S.whatsapp || S.phone) + (text ? '?text=' + encodeURIComponent(text) : ''); }
  function listingUrl(id) { return 'property.html?id=' + encodeURIComponent(id); }
  function absUrl(path) { return (S.domain || location.origin) + '/' + path; }
  function placeLabel(l) { return [l.locality, l.city].filter(Boolean).join(', '); }

  // ---------------------------------------------------------------- lead source (ads tracking)
  (function captureSource() {
    try {
      var p = new URLSearchParams(location.search), src = {};
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(function (k) { if (p.get(k)) src[k] = p.get(k).slice(0, 60); });
      if (p.get('fbclid')) src.fbclid = 1; if (p.get('gclid')) src.gclid = 1;
      if (!Object.keys(src).length && document.referrer && document.referrer.indexOf(location.host) < 0) {
        try { src.ref = new URL(document.referrer).hostname; } catch (e) {}
      }
      var old = store.json('st_src', null);
      if (Object.keys(src).length && (!old || Date.now() - old.at > 30 * 864e5)) { src.at = Date.now(); store.setJson('st_src', src); }
    } catch (e) {}
  })();
  function leadSource() {
    var s = store.json('st_src', null);
    if (!s) return 'direct';
    if (s.utm_source) return [s.utm_source, s.utm_medium, s.utm_campaign, s.utm_content].filter(Boolean).join(' / ');
    if (s.fbclid) return 'facebook / ad click';
    if (s.gclid) return 'google / ad click';
    if (s.ref) return 'referral / ' + s.ref;
    return 'direct';
  }

  // ---------------------------------------------------------------- API
  var API_URL = String(S.API_URL || '').trim();
  var DEMO = !API_URL;
  var demoPromise = null;
  function loadDemo() {
    if (!demoPromise) demoPromise = new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = ASSETS + 'js/demo-backend.js?v=' + VER;
      s.onload = function () { res(window.DemoBackend); };
      s.onerror = function () { rej(new Error('demo failed')); };
      document.head.appendChild(s);
    });
    return demoPromise;
  }
  function ApiError(message, code) { this.message = message; this.code = code; }
  ApiError.prototype = Object.create(Error.prototype);
  function api(action, payload) {
    var body = Object.assign({ action: action }, payload || {});
    var t = Auth.token(); if (t && !body.token) body.token = t;
    var at = Admin.token(); if (at && action.indexOf('admin') === 0 && !body.adminToken) body.adminToken = at;
    var run;
    if (DEMO) {
      run = loadDemo().then(function (D) { return sleep(90 + Math.random() * 160).then(function () { return D.call(body); }); });
    } else {
      run = fetch(API_URL, { method: 'POST', body: JSON.stringify(body), redirect: 'follow' })
        .catch(function () { throw new ApiError('Could not reach our server. Check your internet connection and try again.', 'NETWORK'); })
        .then(function (r) { return r.json().catch(function () { throw new ApiError('Our server sent an unexpected reply. Please try again in a minute.', 'SERVER'); }); });
    }
    return run.then(function (res) {
      if (res && res.ok && /^(admin(Set|Save|Delete)Listing|submitListing|listingAction)$/.test(action)) { store.del('st_pub'); listingsPromise = null; }
      if (!res || !res.ok) {
        var err = new ApiError((res && res.error) || 'Something went wrong. Please try again.', (res && res.code) || 'ERROR');
        if (res && res.debug && window.console) console.warn('[API]', action, res.debug);
        if ((err.code === 'LOGIN_REQUIRED' || err.code === 'BLOCKED') && t) { Auth.clear(); }
        if (err.code === 'ADMIN_REQUIRED') Admin.clear();
        throw err;
      }
      return res.data;
    });
  }

  // Is OTP switched on in Code.gs? Asked once, remembered for 10 minutes.
  var cfgPromise = null;
  function siteConfig() {
    if (cfgPromise) return cfgPromise;
    var c = store.json('st_cfg', null);
    if (c && c.u === API_URL && c.v && Date.now() - c.t < 600000) return (cfgPromise = Promise.resolve(c.v));
    cfgPromise = api('config').then(function (v) { store.setJson('st_cfg', { t: Date.now(), u: API_URL, v: v }); return v; })
      .catch(function () { cfgPromise = null; return { otp: false }; });
    return cfgPromise;
  }

  // ---------------------------------------------------------------- auth
  var Auth = {
    token: function () { return store.get('st_token'); },
    user: function () { return store.json('st_user', null); },
    set: function (token, user) { store.set('st_token', token); store.setJson('st_user', user); renderAccount(); refreshUnread(true); },
    setUser: function (user) { store.setJson('st_user', user); renderAccount(); },
    clear: function () { store.del('st_token'); store.del('st_user'); renderAccount(); setBadge(0); },
    require: function (reason) {
      if (Auth.user() && Auth.token()) return Promise.resolve(Auth.user());
      return openLogin(reason);
    }
  };
  var Admin = {
    token: function () { return store.get('st_admin'); },
    set: function (t) { store.set('st_admin', t); },
    clear: function () { store.del('st_admin'); }
  };

  // ---------------------------------------------------------------- toasts + modals
  function toast(msg, type) {
    var box = $('#toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    var t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 300); }, type === 'error' ? 5200 : 3200);
  }
  var modalSeq = 0;
  function openModal(opts) {
    var id = 'm' + (++modalSeq);
    var wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = '<div class="modal ' + (opts.size || '') + '" role="dialog" aria-modal="true" aria-labelledby="' + id + '">' +
      '<div class="modal-head"><h2 id="' + id + '">' + esc(opts.title || '') + '</h2><button type="button" class="modal-x" aria-label="Close">' + icon('x') + '</button></div>' +
      '<div class="modal-body"></div></div>';
    var body = $('.modal-body', wrap);
    if (typeof opts.body === 'string') body.innerHTML = opts.body; else if (opts.body) body.appendChild(opts.body);
    var prev = document.activeElement;
    var closed = false;
    function close(v) {
      if (closed) return; closed = true;
      wrap.classList.add('out');
      document.removeEventListener('keydown', onKey);
      setTimeout(function () { wrap.remove(); if (!$('.modal-wrap')) document.body.classList.remove('modal-open'); }, 180);
      if (prev && prev.focus) try { prev.focus(); } catch (e) {}
      if (opts.onClose) opts.onClose(v);
    }
    function onKey(e) {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {
        var f = $$('a[href],button:not([disabled]),input:not([type=hidden]):not([disabled]),select,textarea', wrap).filter(function (x) { return x.offsetParent !== null; });
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    }
    wrap.addEventListener('mousedown', function (e) { if (e.target === wrap) close(); });
    $('.modal-x', wrap).addEventListener('click', function () { close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(wrap);
    document.body.classList.add('modal-open');
    setTimeout(function () { var f = $('[autofocus]', wrap) || $('input:not([type=hidden]),select,textarea,button.btn', body); if (f) try { f.focus(); } catch (e) {} }, 40);
    return { el: wrap, body: body, close: close };
  }
  function confirmBox(title, text, okLabel, danger) {
    return new Promise(function (res) {
      var m = openModal({ title: title, size: 'sm', body: '<p class="muted">' + esc(text) + '</p><div class="row-end"><button type="button" class="btn btn-ghost" data-no>Cancel</button><button type="button" class="btn ' + (danger ? 'btn-danger' : 'btn-navy') + '" data-yes>' + esc(okLabel || 'Confirm') + '</button></div>', onClose: function (v) { res(!!v); } });
      $('[data-no]', m.el).onclick = function () { m.close(false); };
      $('[data-yes]', m.el).onclick = function () { m.close(true); };
    });
  }
  function busy(btn, on, label) {
    if (!btn) return;
    if (on) { btn.dataset.label = btn.innerHTML; btn.disabled = true; btn.classList.add('is-busy'); if (label) btn.textContent = label; }
    else { btn.disabled = false; btn.classList.remove('is-busy'); if (btn.dataset.label) btn.innerHTML = btn.dataset.label; }
  }
  function formData(form) {
    var o = {};
    $$('input,select,textarea', form).forEach(function (el) {
      if (!el.name || el.disabled) return;
      if (el.type === 'checkbox') { if (el.dataset.multi) { o[el.name] = o[el.name] || []; if (el.checked) o[el.name].push(el.value); } else o[el.name] = el.checked; }
      else if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; }
      else o[el.name] = el.value.trim();
    });
    return o;
  }
  function fieldError(form, msg) {
    var box = $('.form-error', form);
    if (!box) { box = document.createElement('p'); box.className = 'form-error'; box.setAttribute('role', 'alert'); var at = $('.form-actions', form) || form.lastElementChild; form.insertBefore(box, at); }
    box.textContent = msg || '';
    box.hidden = !msg;
  }

  // ---------------------------------------------------------------- OTP entry (enquiry forms + login)
  function otpBox(opts) {
    var el = document.createElement('div');
    el.className = 'otp-box';
    el.innerHTML =
      '<p class="otp-to">We sent a 6-digit OTP by SMS to <b>' + esc(fmtPhone(opts.phone)) + '</b>. <button type="button" class="btn-link" data-change>Change number</button></p>' +
      '<form class="stack" novalidate><label class="field"><span>Enter OTP</span><input class="otp-input" name="otp" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]*" maxlength="6" placeholder="6 digits" required></label>' +
      '<div class="form-actions"><button class="btn btn-gold btn-block" type="submit">' + esc(opts.verifyLabel || 'Verify') + '</button></div></form>' +
      '<p class="otp-resend small muted"><span data-wait></span><button type="button" class="btn-link" data-resend hidden>Resend OTP</button></p>' +
      '<p class="otp-demo small" data-demo-row hidden>Preview mode sends no SMS. Your OTP is <b data-demo></b></p>' +
      (opts.waText ? '<p class="otp-alt small muted">No SMS after a minute? <a href="' + wa(opts.waText) + '" target="_blank" rel="noopener">Message us on WhatsApp</a></p>' : '');
    var form = $('form', el), input = form.otp, btn = $('button[type=submit]', form), rs = $('[data-resend]', el), waitEl = $('[data-wait]', el);
    var timer = null, sending = false, seen = false;
    function demo(code) { var row = $('[data-demo-row]', el); row.hidden = !code; if (code) $('[data-demo]', el).textContent = code; }
    function countdown(sec) {
      clearInterval(timer);
      var left = Math.max(0, Math.round(sec || 0));
      function tick() {
        if (document.body.contains(el)) seen = true; else if (seen) { clearInterval(timer); return; } // stop once the box is gone
        rs.hidden = left > 0;
        waitEl.textContent = left > 0 ? 'Resend OTP in ' + left + ' s' : '';
        if (left-- <= 0) clearInterval(timer);
      }
      tick(); timer = setInterval(tick, 1000);
    }
    function submit() {
      var v = input.value.replace(/\D/g, '');
      if (v.length !== 6) { fieldError(form, 'Enter the 6-digit OTP from the SMS.'); input.focus(); return; }
      if (sending) return;
      sending = true; fieldError(form, ''); busy(btn, true, 'Checking…');
      Promise.resolve(opts.onVerify(v)).then(function () { clearInterval(timer); }).catch(function (err) {
        sending = false; busy(btn, false); fieldError(form, err.message);
        if (err.code === 'OTP_EXPIRED' || err.code === 'OTP_LOCKED') countdown(0);
        try { input.select(); } catch (e) {}
      });
    }
    input.addEventListener('input', function () {
      var v = input.value.replace(/\D/g, '').slice(0, 6);
      if (v !== input.value) input.value = v;
      if (v.length === 6 && !sending) submit();
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(); });
    rs.addEventListener('click', function () {
      busy(rs, true, 'Sending…'); fieldError(form, '');
      Promise.resolve(opts.onResend()).then(function (r) {
        busy(rs, false); input.value = ''; input.focus();
        countdown((r && r.resendIn) || 30); demo(r && r.demoOtp);
        toast('A new OTP is on its way.', 'ok');
      }).catch(function (err) {
        busy(rs, false); fieldError(form, err.message);
        if (err.code === 'OTP_WAIT') { var w = /(\d+) seconds/.exec(err.message); countdown(w ? Number(w[1]) : 30); }
      });
    });
    $('[data-change]', el).addEventListener('click', function () { clearInterval(timer); if (opts.onChange) opts.onChange(); });
    countdown(opts.resendIn === undefined ? 30 : opts.resendIn);
    demo(opts.demoOtp);
    setTimeout(function () { try { input.focus(); } catch (e) {} }, 60);
    return el;
  }
  function waitSeconds(err) { var w = /(\d+) seconds/.exec((err && err.message) || ''); return w ? Number(w[1]) : 30; }

  // ---------------------------------------------------------------- login / sign-up modal
  // OTP on (Code.gs has an SMS key): mobile → OTP → name for new numbers. OTP off: password log in / create account.
  function openLogin(reason, startTab) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var m = openModal({ title: 'Log in or sign up', size: 'sm', body: '<div class="skeleton" style="min-height:190px"></div>',
        onClose: function () { if (!done) reject(new ApiError('Login cancelled', 'CANCELLED')); } });
      var body = m.body;
      var reasonHtml = reason ? '<p class="modal-reason">' + esc(reason) + '</p>' : '';
      var terms = '<p class="small muted center">By continuing you agree to our <a href="terms.html" target="_blank">terms</a> and <a href="privacy.html" target="_blank">privacy policy</a>.</p>';
      function title(t) { $('h2', m.el).textContent = t; }
      function focusFirst() { setTimeout(function () { var f = $('input:not([type=hidden])', body); if (f) try { f.focus(); } catch (e) {} }, 40); }
      function finish(r, created) {
        done = true;
        Auth.set(r.token, r.user);
        toast((created ? 'Account created. Welcome, ' : 'Welcome back, ') + r.user.name.split(' ')[0] + '.', 'ok');
        m.close();
        resolve(r.user);
      }

      function phoneStep(prefill) {
        title('Log in or sign up');
        body.innerHTML = reasonHtml + '<form class="stack" data-step="phone" novalidate>' +
          '<label class="field"><span>Mobile number</span><input name="phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="10-digit mobile" required></label>' +
          '<div class="form-actions"><button class="btn btn-gold btn-block" type="submit">Get OTP</button></div>' +
          '<p class="small muted center" style="margin:0">New here? The same OTP creates your free account.</p>' +
          '<p class="center" style="margin:0"><button type="button" class="btn-link" data-pw>Log in with password instead</button></p>' + terms + '</form>';
        var form = $('form', body);
        if (prefill) form.phone.value = prefill;
        $('[data-pw]', body).onclick = function () { passwordStep(normPhone(form.phone.value) || ''); };
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var phone = normPhone(form.phone.value), btn = $('button[type=submit]', form);
          if (!phone) { form.phone.focus(); return fieldError(form, 'Enter a valid 10-digit mobile number.'); }
          fieldError(form, ''); busy(btn, true, 'Sending OTP…');
          api('sendOtp', { phone: phone, purpose: 'login' }).then(function (r) { otpStep(phone, r); }).catch(function (err) {
            busy(btn, false);
            if (err.code === 'OTP_WAIT') return otpStep(phone, { resendIn: waitSeconds(err) }); // the OTP sent a moment ago still works
            if (err.code === 'OTP_OFF') { store.del('st_cfg'); cfgPromise = null; return passwordTabs(); } // OTP was switched off
            fieldError(form, err.message);
          });
        });
        focusFirst();
      }

      function otpStep(phone, r) {
        title('Enter the OTP');
        body.innerHTML = reasonHtml;
        body.appendChild(otpBox({ phone: phone, resendIn: r.resendIn, demoOtp: r.demoOtp, verifyLabel: 'Verify and continue',
          onVerify: function (code) {
            return api('otpLogin', { phone: phone, otp: code }).then(function (x) { if (x.needName) nameStep(phone, x.proof); else finish(x, false); });
          },
          onResend: function () { return api('sendOtp', { phone: phone, purpose: 'login' }); },
          onChange: function () { phoneStep(phone); } }));
      }

      function nameStep(phone, proof) {
        title('Create your account');
        body.innerHTML = '<form class="stack" data-step="name" novalidate><p class="verified-note">' + icon('shield') + esc(fmtPhone(phone)) + ' verified</p>' +
          '<label class="field"><span>Full name</span><input name="name" autocomplete="name" required></label>' +
          '<label class="field"><span>Email <em>(optional, for chat alerts)</em></span><input name="email" type="email" autocomplete="email"></label>' +
          '<div class="form-actions"><button class="btn btn-gold btn-block" type="submit">Create account</button></div>' + terms + '</form>';
        var form = $('form', body);
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var d = formData(form), btn = $('button[type=submit]', form);
          if ((d.name || '').length < 2) { form.name.focus(); return fieldError(form, 'Enter your full name.'); }
          fieldError(form, ''); busy(btn, true, 'Creating account…');
          api('otpLogin', { proof: proof, name: d.name, email: d.email }).then(function (x) { finish(x, !!x.created); })
            .catch(function (err) { busy(btn, false); fieldError(form, err.message); if (err.code === 'OTP_EXPIRED') setTimeout(function () { phoneStep(phone); }, 1600); });
        });
        focusFirst();
      }

      function passwordStep(prefill) {
        title('Log in with password');
        body.innerHTML = reasonHtml + '<form class="stack" data-form="login" novalidate>' +
          '<label class="field"><span>Mobile number</span><input name="phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="10-digit mobile" required></label>' +
          '<label class="field"><span>Password</span><input name="password" type="password" autocomplete="current-password" required></label>' +
          '<div class="form-actions"><button class="btn btn-navy btn-block" type="submit">Log in</button></div>' +
          '<p class="small muted center" style="margin:0">No password, or forgot it? <button type="button" class="btn-link" data-otp>Log in with OTP</button></p></form>';
        var form = $('form', body);
        if (prefill) form.phone.value = prefill;
        $('[data-otp]', body).onclick = function () { phoneStep(normPhone(form.phone.value) || ''); };
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var d = formData(form), btn = $('button[type=submit]', form);
          if (!normPhone(d.phone)) return fieldError(form, 'Enter a valid 10-digit mobile number.');
          if (!d.password) return fieldError(form, 'Enter your password.');
          fieldError(form, ''); busy(btn, true, 'Logging in…');
          api('login', d).then(function (x) { finish(x, false); }).catch(function (err) { busy(btn, false); fieldError(form, err.message); });
        });
        if (prefill) setTimeout(function () { try { form.password.focus(); } catch (e) {} }, 40); else focusFirst();
      }

      // OTP switched off: classic tabs
      function passwordTabs() {
        body.innerHTML = reasonHtml +
          '<div class="seg-tabs" role="tablist"><button type="button" role="tab" data-tab="login" aria-selected="true">Log in</button><button type="button" role="tab" data-tab="register" aria-selected="false">Create account</button></div>' +
          '<form class="stack" data-form="login" novalidate>' +
          '<label class="field"><span>Mobile number</span><input name="phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="10-digit mobile" required></label>' +
          '<label class="field"><span>Password</span><input name="password" type="password" autocomplete="current-password" required></label>' +
          '<div class="form-actions"><button class="btn btn-navy btn-block" type="submit">Log in</button></div>' +
          '<p class="small muted center">Forgot password? <a href="' + wa('Hi, I forgot my password for the Stand Tall Realty website. My registered number is ') + '" target="_blank" rel="noopener">Message us on WhatsApp</a> and we will reset it.</p></form>' +
          '<form class="stack" data-form="register" novalidate hidden>' +
          '<label class="field"><span>Full name</span><input name="name" autocomplete="name" required></label>' +
          '<label class="field"><span>Mobile number</span><input name="phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="10-digit mobile" required></label>' +
          '<label class="field"><span>Email <em>(optional, for chat alerts)</em></span><input name="email" type="email" autocomplete="email"></label>' +
          '<label class="field"><span>Create a password</span><input name="password" type="password" autocomplete="new-password" minlength="6" placeholder="At least 6 characters" required></label>' +
          '<div class="form-actions"><button class="btn btn-gold btn-block" type="submit">Create account</button></div>' + terms + '</form>';
        function tab(name) {
          $$('[data-tab]', body).forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.tab === name)); });
          $$('[data-form]', body).forEach(function (f) { f.hidden = f.dataset.form !== name; });
          title(name === 'login' ? 'Log in to continue' : 'Create your free account');
          var f1 = $('[data-form="' + name + '"] input', body); if (f1) f1.focus();
        }
        $$('[data-tab]', body).forEach(function (b) { b.onclick = function () { tab(b.dataset.tab); }; });
        tab(startTab === 'register' ? 'register' : 'login');
        $$('form', body).forEach(function (form) {
          form.addEventListener('submit', function (e) {
            e.preventDefault();
            var d = formData(form), btn = $('button[type=submit]', form), reg = form.dataset.form === 'register';
            if (!normPhone(d.phone)) return fieldError(form, 'Enter a valid 10-digit mobile number.');
            if (reg && d.name.length < 2) return fieldError(form, 'Enter your full name.');
            if ((d.password || '').length < (reg ? 6 : 1)) return fieldError(form, reg ? 'Password must be at least 6 characters.' : 'Enter your password.');
            fieldError(form, '');
            busy(btn, true, reg ? 'Creating account…' : 'Logging in…');
            api(form.dataset.form, d).then(function (r) { finish(r, reg); }).catch(function (err) {
              busy(btn, false);
              if (err.code === 'OTP_REQUIRED') { store.del('st_cfg'); cfgPromise = null; return phoneStep(normPhone(d.phone)); } // OTP was just switched on
              fieldError(form, err.message);
              if (err.code === 'EXISTS') { tab('login'); $('[data-form="login"] [name=phone]', body).value = d.phone; }
            });
          });
        });
      }

      siteConfig().then(function (cfg) {
        if (!document.body.contains(m.el)) return;
        if (cfg && cfg.otp) phoneStep(''); else passwordTabs();
      });
    });
  }

  // ---------------------------------------------------------------- icons (inline SVG, 24px grid)
  var ICONS = {
    phone: '<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>',
    wa: '<path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3zm0 16.4c-1.4 0-2.8-.4-4-1.1l-.3-.2-2.7.7.7-2.6-.2-.3A7.4 7.4 0 1 1 12 19.4zm4.1-5.5c-.2-.1-1.3-.7-1.5-.7-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6 6 0 0 1-3-2.6c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.6c-.2-.4-.4-.4-.5-.4h-.4c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.3c.1.2 1.6 2.5 4 3.5 1.5.6 2 .7 2.8.6.4-.1 1.3-.5 1.5-1.1.2-.5.2-1 .1-1.1l-.4-.3z"/>',
    chat: '<path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-4.3 3.4A.5.5 0 0 1 4 20V5a1 1 0 0 1 0-1zm2 2v10.9L8.3 15H19V6H6z"/>',
    user: '<path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm0-2a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zm-8 11c0-3.9 3.6-7 8-7s8 3.1 8 7h-2c0-2.7-2.6-5-6-5s-6 2.3-6 5H4z"/>',
    pin: '<path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/>',
    locate: '<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm9 3h-2.1A7 7 0 0 0 13 5.1V3h-2v2.1A7 7 0 0 0 5.1 11H3v2h2.1a7 7 0 0 0 5.9 5.9V21h2v-2.1a7 7 0 0 0 5.9-5.9H21v-2zm-9 6a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/>',
    heart: '<path d="M12 20.3l-1.4-1.3C5.4 14.4 2 11.3 2 7.6 2 4.5 4.4 2.2 7.5 2.2c1.7 0 3.4.8 4.5 2.1a6 6 0 0 1 4.5-2.1c3.1 0 5.5 2.3 5.5 5.4 0 3.7-3.4 6.8-8.6 11.4L12 20.3z"/>',
    heartOutline: '<path d="M16.5 3.2c-1.7 0-3.4.8-4.5 2.1a6 6 0 0 0-4.5-2.1C4.4 3.2 2 5.6 2 8.6c0 3.8 3.4 6.8 8.6 11.5L12 21.3l1.4-1.2C18.6 15.4 22 12.4 22 8.6c0-3-2.4-5.4-5.5-5.4zm-4.4 15.4l-.1.1-.1-.1C7.1 14.2 4 11.4 4 8.6c0-1.9 1.5-3.4 3.5-3.4 1.5 0 3 1 3.6 2.4h1.9c.5-1.4 2-2.4 3.5-2.4 2 0 3.5 1.5 3.5 3.4 0 2.8-3.1 5.6-7.9 10z"/>',
    search: '<path d="M10 3a7 7 0 0 1 5.6 11.2l5.1 5.1-1.4 1.4-5.1-5.1A7 7 0 1 1 10 3zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/>',
    x: '<path d="M6.4 5L12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z"/>',
    menu: '<path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"/>',
    bed: '<path d="M3 5h2v7h6V8h7a3 3 0 0 1 3 3v8h-2v-3H5v3H3V5zm10 5v2h6v-1a1 1 0 0 0-1-1h-5zM8 9a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/>',
    area: '<path d="M4 4h6v2H6v4H4V4zm10 0h6v6h-2V6h-4V4zM4 14h2v4h4v2H4v-6zm14 0h2v6h-6v-2h4v-4z"/>',
    key: '<path d="M7 14a3 3 0 1 1 2.8-4H21v2h-2v2h-2v-2h-2v2h-2v-2H9.8A3 3 0 0 1 7 14zm0-2a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>',
    sofa: '<path d="M5 9V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v2a2 2 0 0 1 2 2v6h-2v2h-2v-2H7v2H5v-2H3v-6a2 2 0 0 1 2-2zm2 0a2 2 0 0 1 2 2v1h6v-1a2 2 0 0 1 2-2V7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v2zm-2 2v4h14v-4h-1v3H6v-3H5z"/>',
    building: '<path d="M4 21V5l8-3v5l8 3v11h-6v-4h-4v4H4zm2-2h2v-2H6v2zm0-4h2v-2H6v2zm0-4h2V9H6v2zm4 4h2v-2h-2v2zm0-4h2V9h-2v2zm4 4h2v-2h-2v2zm0 4h2v-2h-2v2z"/>',
    calendar: '<path d="M7 2h2v2h6V2h2v2h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3V2zm12 8H5v9h14v-9zM5 8h14V6H5v2z"/>',
    camera: '<path d="M9 4h6l1.5 2H20a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3.5L9 4zm3 13a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm0-2a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>',
    check: '<path d="M9.5 16.2L5.3 12l-1.4 1.4 5.6 5.6L20.1 8.4 18.7 7z"/>',
    shield: '<path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5l8-3zm-1.2 13.3l5.3-5.3-1.4-1.4-3.9 3.9-1.9-1.9-1.4 1.4 3.3 3.3z"/>',
    share: '<path d="M18 16a3 3 0 0 0-2.4 1.2l-6.7-3.4a3 3 0 0 0 0-1.6l6.7-3.4A3 3 0 1 0 15 7l-6.7 3.4a3 3 0 1 0 0 3.2L15 17a3 3 0 1 0 3-1z"/>',
    arrowLeft: '<path d="M10.8 5.6L12.2 7l-4 4H20v2H8.2l4 4-1.4 1.4L4.4 12z"/>',
    send: '<path d="M3 20.5V14l9-2-9-2V3.5L22 12z"/>',
    plus: '<path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/>',
    star: '<path d="M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z"/>',
    insta: '<path d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H8zm4 3.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zm0 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM17 6.3a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>',
    flag: '<path d="M5 3h10l1 2h4v10h-7l-1-2H7v8H5V3zm2 2v6h6.2l1 2H18V7h-3.2l-1-2H7z"/>',
    lock: '<path d="M7 10V8a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1zm2 0h6V8a3 3 0 0 0-6 0v2zm-2 2v7h10v-7H7z"/>',
    eye: '<path d="M12 5c5 0 8.6 4.3 9.8 6.4.2.4.2.8 0 1.2C20.6 14.7 17 19 12 19s-8.6-4.3-9.8-6.4a1.3 1.3 0 0 1 0-1.2C3.4 9.3 7 5 12 5zm0 2c-3.6 0-6.4 3-7.7 5 1.3 2 4.1 5 7.7 5s6.4-3 7.7-5c-1.3-2-4.1-5-7.7-5zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/>'
  };
  function icon(name, cls) { return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (ICONS[name] || '') + '</svg>'; }

  // ---------------------------------------------------------------- images
  function hash(s) { var h = 2166136261; s = String(s || 'x'); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var x = seed || 1; return function () { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 10000) / 10000; }; }
  var artSeq = 0;
  function art(l) {
    var r = rng(hash(l.id || l.title)), W = 320, H = 200, g = 168, s = '', u = 'g' + (++artSeq);
    var cat = l.category || 'Residential', type = String(l.propertyType || '');
    var defs = '<defs><linearGradient id="' + u + 'sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E1B31"/><stop offset="1" stop-color="#1F3A60"/></linearGradient>' +
      '<linearGradient id="' + u + 'gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7C9DCB"/><stop offset="1" stop-color="#2E4C77"/></linearGradient>' +
      '<linearGradient id="' + u + 'gl2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5D7EAE"/><stop offset="1" stop-color="#253F66"/></linearGradient></defs>';
    s += '<rect width="320" height="200" fill="url(#' + u + 'sk)"/>';
    var plot = cat === 'Plot', base = plot ? 140 : g;
    for (var k = 0; k < 14; k++) { var by = (plot ? 100 : 120) + r() * 30; s += '<rect x="' + (k * 24) + '" y="' + by + '" width="18" height="' + (base - by) + '" fill="#16294A" opacity=".7"/>'; }
    function tower(x, w, h, fill) {
      var top = g - h, slant = 6 + r() * 14, dir = r() > .5;
      s += '<polygon points="' + x + ',' + (top + (dir ? slant : 0)) + ' ' + (x + w) + ',' + (top + (dir ? 0 : slant)) + ' ' + (x + w) + ',' + g + ' ' + x + ',' + g + '" fill="url(#' + u + fill + ')"/>';
      var cols = Math.max(3, Math.round(w / 9)), rows = Math.round(h / 9);
      for (var c = 1; c < cols; c++) s += '<line x1="' + (x + c * w / cols) + '" y1="' + (top + slant) + '" x2="' + (x + c * w / cols) + '" y2="' + g + '" stroke="#B9CCE8" stroke-opacity=".35" stroke-width=".7"/>';
      for (var q = 1; q < rows; q++) { var yy = g - q * 9; if (yy > top + slant) s += '<line x1="' + x + '" y1="' + yy + '" x2="' + (x + w) + '" y2="' + yy + '" stroke="#B9CCE8" stroke-opacity=".35" stroke-width=".7"/>'; }
      for (var n = 0; n < rows * cols * .16; n++) {
        var cx = Math.floor(r() * cols), cy = Math.floor(r() * rows), wy = g - (cy + 1) * 9 + 2;
        if (wy > top + slant + 2) s += '<rect x="' + (x + cx * w / cols + 1.5) + '" y="' + wy + '" width="' + (w / cols - 3) + '" height="5" fill="#EBC97F" opacity="' + (.55 + r() * .45) + '"/>';
      }
    }
    function house(x, w, h) {
      s += '<rect x="' + x + '" y="' + (g - h) + '" width="' + w + '" height="' + h + '" fill="url(#' + u + 'gl)"/>';
      s += '<polygon points="' + (x - 6) + ',' + (g - h) + ' ' + (x + w / 2) + ',' + (g - h - w * .42) + ' ' + (x + w + 6) + ',' + (g - h) + '" fill="#D9B66A"/>';
      s += '<rect x="' + (x + w * .4) + '" y="' + (g - h * .55) + '" width="' + (w * .2) + '" height="' + (h * .55) + '" fill="#13233C"/>';
      s += '<rect x="' + (x + w * .12) + '" y="' + (g - h * .75) + '" width="' + (w * .18) + '" height="' + (h * .25) + '" fill="#EBC97F"/><rect x="' + (x + w * .7) + '" y="' + (g - h * .75) + '" width="' + (w * .18) + '" height="' + (h * .25) + '" fill="#EBC97F" opacity=".7"/>';
    }
    function tree(x, sz) { s += '<rect x="' + (x - 1.5) + '" y="' + (g - sz * .6) + '" width="3" height="' + (sz * .6) + '" fill="#2B3F5E"/><circle cx="' + x + '" cy="' + (g - sz * .8) + '" r="' + (sz * .42) + '" fill="#3F6B5C"/>'; }
    if (plot) {
      s += '<rect x="0" y="140" width="320" height="60" fill="#18304F"/><rect x="0" y="139" width="320" height="2" fill="#9DB6D6"/>';
      var px = 80 + r() * 30;
      s += '<polygon points="' + px + ',152 ' + (px + 140) + ',152 ' + (px + 168) + ',188 ' + (px - 28) + ',188" fill="#2A4A73" stroke="#D9B66A" stroke-width="2" stroke-dasharray="6 5"/>';
      [[px, 152], [px + 140, 152], [px + 168, 188], [px - 28, 188]].forEach(function (p) { s += '<rect x="' + (p[0] - 2.5) + '" y="' + (p[1] - 9) + '" width="5" height="10" fill="#F0DCAE"/>'; });
      var gg = g; g = 141; tree(36, 34); tree(282, 40); tree(256, 26); g = gg;
    } else if (cat === 'Commercial') {
      var bx = 40 + r() * 20, bw = 240;
      s += '<rect x="' + bx + '" y="' + (g - 92) + '" width="' + bw + '" height="92" fill="url(#' + u + 'gl2)"/>';
      for (var f = 0; f < 3; f++) for (var c2 = 0; c2 < 8; c2++) s += '<rect x="' + (bx + 8 + c2 * 29) + '" y="' + (g - 86 + f * 18) + '" width="22" height="11" fill="' + (r() > .7 ? '#EBC97F' : '#8FAAD3') + '" opacity=".75"/>';
      for (var sh = 0; sh < 4; sh++) {
        var sx = bx + 6 + sh * 59;
        s += '<rect x="' + sx + '" y="' + (g - 30) + '" width="52" height="30" fill="#0F1E36"/>';
        for (var st = 0; st < 6; st++) s += '<rect x="' + (sx + st * 8.7) + '" y="' + (g - 36) + '" width="8.7" height="8" fill="' + (st % 2 ? '#F0DCAE' : '#D9B66A') + '"/>';
        s += '<rect x="' + (sx + 4) + '" y="' + (g - 24) + '" width="44" height="24" fill="#EBC97F" opacity=".35"/>';
      }
    } else if (/villa|bungalow|row house|independent|farm/i.test(type)) {
      house(40, 92, 58); house(150, 74, 48); tree(250, 40); tree(282, 30); tree(24, 28);
    } else {
      var n2 = 3 + Math.floor(r() * 2), x0 = 30 + r() * 30, widths = [], tot = 0;
      for (var i = 0; i < n2; i++) { widths.push(42 + r() * 30); tot += widths[i]; }
      var gap = (250 - tot) / Math.max(1, n2 - 1);
      for (i = 0; i < n2; i++) { tower(x0, widths[i], 70 + r() * 80, i % 2 ? 'gl2' : 'gl'); x0 += widths[i] + Math.max(2, gap); }
    }
    if (!plot) s += '<rect x="0" y="' + g + '" width="320" height="2.5" fill="#9DB6D6"/>';
    return '<svg class="art" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + defs + s + '</svg>';
  }
  function photoUrl(id, w) {
    id = String(id || ''); w = w || 900;
    if (/^https?:\/\//i.test(id)) return id;
    if (DEMO && window.DemoBackend && window.DemoBackend.fileUrl) { var u = window.DemoBackend.fileUrl(id); if (u) return u; }
    return 'https://lh3.googleusercontent.com/d/' + encodeURIComponent(id) + '=w' + w;
  }
  function photoFallback(id, w) { return /^https?:/i.test(id) ? '' : 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w' + (w || 900); }
  function imgTag(id, w, alt, cls) {
    var fb = photoFallback(id, w);
    return '<img class="' + (cls || '') + '" src="' + esc(photoUrl(id, w)) + '"' + (fb ? ' data-fb="' + esc(fb) + '"' : '') + ' alt="' + esc(alt || '') + '" loading="lazy" decoding="async">';
  }
  document.addEventListener('error', function (e) {
    var t = e.target;
    if (!t || t.tagName !== 'IMG') return;
    if (t.dataset.fb) { var f = t.dataset.fb; delete t.dataset.fb; t.src = f; return; }
    t.classList.add('img-failed');
  }, true);

  // ---------------------------------------------------------------- saved
  var Saved = {
    all: function () { return store.json('st_saved', []); },
    has: function (id) { return Saved.all().indexOf(id) >= 0; },
    toggle: function (id) { var a = Saved.all(), i = a.indexOf(id); if (i >= 0) a.splice(i, 1); else a.unshift(id); store.setJson('st_saved', a.slice(0, 200)); return i < 0; }
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-save]');
    if (!b) return;
    e.preventDefault();
    var on = Saved.toggle(b.dataset.save);
    $$('[data-save="' + b.dataset.save + '"]').forEach(function (x) { x.setAttribute('aria-pressed', String(on)); x.innerHTML = icon(on ? 'heart' : 'heartOutline') + (x.dataset.label ? '<span>' + (on ? 'Saved' : 'Save') + '</span>' : ''); });
    toast(on ? 'Saved to your shortlist.' : 'Removed from your shortlist.');
  });

  // ---------------------------------------------------------------- listing card
  function segLabel(l) {
    var map = { 'Under Construction': 'Under construction', 'Ready to Move': 'Ready to move', 'Resale': 'Resale', 'Rental': 'For rent', 'Commercial': l.purpose === 'rent' ? 'Commercial for rent' : 'Commercial', 'Plots': 'Plot' };
    return map[l.segment] || l.segment || '';
  }
  function card(l, opts) {
    opts = opts || {};
    var media = art(l) + (l.photos && l.photos[0] ? imgTag(l.photos[0], 700, l.title, 'pc-img') : '');
    var saved = Saved.has(l.id);
    var specs = [];
    if (l.category !== 'Plot' && l.category !== 'Commercial' && bhkLabel(l)) specs.push(icon('bed') + esc(bhkLabel(l)));
    if (areaLabel(l)) specs.push(icon('area') + esc(areaLabel(l)));
    if (l.purpose === 'rent' && l.furnishing) specs.push(icon('sofa') + esc(l.furnishing));
    else if (l.segment === 'Under Construction' && l.possessionDate) specs.push(icon('calendar') + 'Possession ' + esc(l.possessionDate));
    else if (l.category === 'Commercial' && l.propertyType) specs.push(icon('building') + esc(l.propertyType));
    else if (l.category === 'Plot' && l.plotType) specs.push(icon('key') + esc(l.plotType));
    return '<article class="pcard' + (opts.wide ? ' pcard-wide' : '') + '">' +
      '<a class="pc-media" href="' + listingUrl(l.id) + '" tabindex="-1" aria-hidden="true">' + media +
      '<span class="pc-seg">' + esc(segLabel(l)) + '</span>' +
      (l.tag ? '<span class="pc-tag">' + esc(l.tag) + '</span>' : '') +
      (l.photoCount > 1 ? '<span class="pc-count">' + icon('camera') + l.photoCount + '</span>' : '') + '</a>' +
      '<button type="button" class="pc-save" data-save="' + esc(l.id) + '" aria-pressed="' + saved + '" aria-label="Save ' + esc(l.title) + '">' + icon(saved ? 'heart' : 'heartOutline') + '</button>' +
      '<div class="pc-body"><p class="pc-price">' + esc(priceLabel(l)) + '<small>' + priceSuffix(l) + '</small></p>' +
      '<h3 class="pc-title"><a href="' + listingUrl(l.id) + '">' + esc(l.title) + '</a></h3>' +
      '<p class="pc-loc">' + icon('pin') + esc(placeLabel(l)) + '</p>' +
      (specs.length ? '<ul class="pc-specs">' + specs.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' : '') +
      '<p class="pc-foot"><span class="pc-by">' + (l.isFirm ? icon('shield') + 'Stand Tall Realty' : esc(l.ownerName || 'Owner') + ' <em>(' + esc(String(l.ownerRole || 'Owner').toLowerCase()) + ')</em>') + '</span><span>' + esc(timeAgo(l.createdAt)) + '</span></p>' +
      '</div></article>';
  }

  // ---------------------------------------------------------------- listings cache (public)
  var listingsPromise = null;
  function getListings(force) {
    if (!force && listingsPromise) return listingsPromise;
    var cached = !force && store.json('st_pub', null);
    if (cached && Date.now() - cached.at < 60000 && !DEMO) { listingsPromise = Promise.resolve(cached.listings); return listingsPromise; }
    listingsPromise = api('listings').then(function (r) {
      try { if (!DEMO) store.setJson('st_pub', { at: Date.now(), listings: r.listings }); } catch (e) {}
      return r.listings;
    }).catch(function (e) { listingsPromise = null; throw e; });
    return listingsPromise;
  }

  // ---------------------------------------------------------------- header: account + unread
  function initials(n) { return String(n || '?').trim().split(/\s+/).slice(0, 2).map(function (x) { return x[0]; }).join('').toUpperCase(); }
  function renderAccount() {
    var u = Auth.user();
    $$('[data-account]').forEach(function (a) {
      if (u) { a.innerHTML = '<span class="avatar">' + esc(initials(u.name)) + '</span><span class="acct-label">' + esc(u.name.split(' ')[0]) + '</span>'; a.setAttribute('aria-label', 'My account'); }
      else { a.innerHTML = icon('user') + '<span class="acct-label">Log in</span>'; a.setAttribute('aria-label', 'Log in'); }
    });
  }
  function setBadge(n) {
    $$('[data-unread]').forEach(function (b) { b.textContent = n > 9 ? '9+' : String(n); b.hidden = !n; });
    try { document.title = document.title.replace(/^\(\d+\+?\) /, ''); if (n) document.title = '(' + n + ') ' + document.title; } catch (e) {}
  }
  var pollStamp = 0;
  function refreshUnread(force) {
    if (!Auth.token()) return;
    api('poll', { since: force ? 0 : pollStamp }).then(function (r) {
      if (r.changed) { pollStamp = r.stamp; setBadge(r.unread || 0); document.dispatchEvent(new CustomEvent('st:unread', { detail: r })); }
    }).catch(function () {});
  }

  // ---------------------------------------------------------------- geolocation
  function getPosition() {
    return new Promise(function (res, rej) {
      if (!navigator.geolocation) return rej(new Error('Your browser cannot share location. Please choose the area from the list.'));
      if (!window.isSecureContext && location.hostname !== 'localhost') return rej(new Error('Location works only on the secure (https) website.'));
      navigator.geolocation.getCurrentPosition(function (p) { res({ lat: p.coords.latitude, lng: p.coords.longitude }); }, function (err) {
        rej(new Error(err.code === 1 ? 'Location permission is off. Allow location for this site in your browser settings, or choose the area from the list.' : 'Could not find your location. Please choose the area from the list.'));
      }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 120000 });
    });
  }
  function reverseGeocode(lat, lng) {
    var nomi = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=17&addressdetails=1&accept-language=en&lat=' + lat + '&lon=' + lng;
    return fetch(nomi).then(function (r) { if (!r.ok) throw new Error('geo'); return r.json(); }).then(function (j) {
      var a = j.address || {};
      return { state: a.state || '', district: String(a.state_district || a.county || '').replace(/ District$/i, ''), city: a.city || a.town || a.municipality || a.village || '',
        locality: a.suburb || a.neighbourhood || a.quarter || a.city_district || a.residential || a.hamlet || a.village || '', pincode: a.postcode || '' };
    }).catch(function () {
      return fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=en&latitude=' + lat + '&longitude=' + lng)
        .then(function (r) { return r.json(); }).then(function (j) {
          return { state: j.principalSubdivision || '', district: '', city: j.city || '', locality: j.locality || '', pincode: j.postcode || '' };
        });
    }).then(function (a) {
      var city = LOC.matchCity(a.city) || LOC.matchCity(a.district) || a.city || a.district;
      var loc = LOC.matchLocality(city, a.locality) || a.locality;
      if (loc && city && loc.toLowerCase() === String(city).toLowerCase()) loc = '';
      return { state: a.state, city: city, district: LOC.districtOf(city) || a.district, locality: loc, pincode: a.pincode, lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 };
    });
  }
  function detectLocation() { return getPosition().then(function (p) { return reverseGeocode(p.lat, p.lng); }); }
  function distanceKm(a, b) {
    var R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }

  // ---------------------------------------------------------------- city select + locality datalist
  var dlSeq = 0;
  function cityOptions(selected, withAny) {
    var o = withAny ? '<option value="">' + esc(withAny) + '</option>' : '<option value="">Select city / town</option>';
    o += '<optgroup label="Popular cities">' + LOC.popular.map(function (c) { return '<option' + (c === selected ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</optgroup>';
    LOC.districts.forEach(function (d) {
      o += '<optgroup label="' + esc(d[0]) + ' district">' + d[1].map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join('') + '</optgroup>';
    });
    o += '<option value="__other">Other (type it)</option>';
    return o;
  }
  function fillLocalities(datalist, city) {
    var list = (LOC.localities[city] || []).slice();
    if (city === 'Pune') { var f = S.focusAreas || []; list = f.concat(list.filter(function (x) { return f.indexOf(x) < 0; })); }
    datalist.innerHTML = list.map(function (x) { return '<option value="' + esc(x) + '">'; }).join('');
  }

  // Location picker used in forms: State → City → Locality (+ use my location)
  function locationPicker(el, opts) {
    opts = opts || {};
    var id = 'dl' + (++dlSeq);
    el.classList.add('loc-picker');
    el.innerHTML =
      '<div class="loc-detect"><button type="button" class="btn btn-ghost btn-sm" data-detect>' + icon('locate') + 'Use my current location</button><span class="loc-status" aria-live="polite"></span></div>' +
      '<div class="grid-3">' +
      '<label class="field"><span>State</span><select data-k="state">' + LOC.states.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('') + '</select></label>' +
      '<label class="field"><span>City / town' + (opts.required ? ' <b>*</b>' : '') + '</span><select data-k="city">' + cityOptions('') + '</select><input data-k="cityText" placeholder="Type the city or town" hidden></label>' +
      '<label class="field"><span>Locality / area' + (opts.required ? ' <b>*</b>' : '') + '</span><input data-k="locality" list="' + id + '" autocomplete="off" placeholder="Start typing, e.g. Kondhwa"><datalist id="' + id + '"></datalist></label>' +
      '</div>' +
      (opts.details === false ? '' : '<div class="grid-2"><label class="field"><span>Landmark / road <em>(shown on the listing)</em></span><input data-k="landmark" maxlength="160" placeholder="e.g. Near D-Mart, NIBM Road"></label>' +
        '<label class="field"><span>Pincode</span><input data-k="pincode" inputmode="numeric" maxlength="6" placeholder="411048"></label></div>');
    var st = $('[data-k=state]', el), cs = $('[data-k=city]', el), ct = $('[data-k=cityText]', el), lc = $('[data-k=locality]', el), dl = $('#' + id, el);
    var coords = { lat: '', lng: '' };
    function cityVal() { return st.value !== 'Maharashtra' || cs.value === '__other' ? ct.value.trim() : cs.value; }
    function sync() {
      var mh = st.value === 'Maharashtra';
      cs.hidden = !mh; ct.hidden = mh && cs.value !== '__other';
      fillLocalities(dl, cityVal());
    }
    st.addEventListener('change', sync);
    cs.addEventListener('change', function () { sync(); if (cs.value === '__other') ct.focus(); });
    ct.addEventListener('input', debounce(sync, 200));
    var status = $('.loc-status', el);
    $('[data-detect]', el).addEventListener('click', function () {
      var b = this; busy(b, true, 'Finding you…'); status.className = 'loc-status'; status.textContent = '';
      detectLocation().then(function (a) {
        api_set(a); busy(b, false);
        status.className = 'loc-status ok';
        status.textContent = 'Found: ' + [a.locality, a.city].filter(Boolean).join(', ') + '. Change it below if needed.';
        if (opts.onDetect) opts.onDetect(a);
      }).catch(function (err) { busy(b, false); status.className = 'loc-status bad'; status.textContent = err.message || 'Could not find your location.'; });
    });
    function api_set(v) {
      v = v || {};
      st.value = LOC.states.indexOf(v.state) >= 0 ? v.state : (v.state ? st.value : 'Maharashtra');
      if (st.value === 'Maharashtra') {
        var c = LOC.matchCity(v.city) || v.city || '';
        if (c && !$$('option', cs).some(function (o) { return o.value === c; })) { cs.value = '__other'; ct.value = c; }
        else { cs.value = c; ct.value = ''; }
      } else ct.value = v.city || '';
      sync();
      lc.value = v.locality || '';
      if ($('[data-k=landmark]', el) && v.landmark !== undefined) $('[data-k=landmark]', el).value = v.landmark || '';
      if ($('[data-k=pincode]', el) && v.pincode !== undefined) $('[data-k=pincode]', el).value = v.pincode || '';
      if (v.lat && v.lng) coords = { lat: v.lat, lng: v.lng };
    }
    api_set(Object.assign({ state: 'Maharashtra', city: opts.defaultCity || '' }, opts.value || {}));
    lc.addEventListener('input', function () { coords = { lat: '', lng: '' }; });
    return {
      get: function () {
        var city = cityVal();
        return { state: st.value, city: city, district: st.value === 'Maharashtra' ? LOC.districtOf(city) : '', locality: lc.value.trim(),
          landmark: $('[data-k=landmark]', el) ? $('[data-k=landmark]', el).value.trim() : '', pincode: $('[data-k=pincode]', el) ? $('[data-k=pincode]', el).value.trim() : '',
          lat: coords.lat, lng: coords.lng };
      },
      set: api_set,
      validate: function () {
        var v = this.get();
        if (!v.city) { (cs.hidden ? ct : cs).focus(); return 'Choose the city or town.'; }
        if (!v.locality) { lc.focus(); return 'Enter the locality / area.'; }
        if (v.pincode && !/^\d{6}$/.test(v.pincode)) return 'Pincode should be 6 digits.';
        return '';
      }
    };
  }

  // ---------------------------------------------------------------- photo compression
  function compressImage(file, maxDim, quality) {
    maxDim = maxDim || 1600; quality = quality || 0.82;
    return new Promise(function (res, rej) {
      if (!/^image\//.test(file.type) && !/\.(jpe?g|png|webp|heic)$/i.test(file.name)) return rej(new Error(file.name + ' is not a photo.'));
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, maxDim / Math.max(w, h));
        var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
        var ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        res(c.toDataURL('image/jpeg', quality));
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error(file.name + ': this photo format is not supported. Please use JPG or PNG.')); };
      img.src = url;
    });
  }

  // ---------------------------------------------------------------- enquiry (lead) form
  var INTENTS = [
    ['buy', 'Buy a home', 'key'], ['rent', 'Take on rent', 'bed'], ['sell', 'Sell my property', 'building'], ['rentout', 'Rent out my property', 'sofa'],
    ['plot_buy', 'Buy a plot', 'area'], ['plot_sell', 'Sell a plot', 'area'], ['commercial', 'Shop / office', 'building'], ['project', 'New project / invest', 'star']
  ];
  var BUY_BUDGETS = ['Under ₹50 L', '₹50 L – ₹75 L', '₹75 L – ₹1 Cr', '₹1 Cr – ₹1.5 Cr', '₹1.5 Cr – ₹2 Cr', '₹2 Cr – ₹3 Cr', 'Above ₹3 Cr'];
  var RENT_BUDGETS = ['Under ₹15,000', '₹15,000 – ₹25,000', '₹25,000 – ₹40,000', '₹40,000 – ₹60,000', '₹60,000 – ₹1 L', 'Above ₹1 L'];
  function sel(name, label, options, ph) { return '<label class="field"><span>' + label + '</span><select name="' + name + '"><option value="">' + (ph || 'Select') + '</option>' + options.map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select></label>'; }
  function txt(name, label, ph, extra) { return '<label class="field"><span>' + label + '</span><input name="' + name + '" placeholder="' + esc(ph || '') + '" ' + (extra || '') + '></label>'; }
  function chipsField(name, label, options) {
    return '<fieldset class="field chips-field"><legend>' + label + '</legend><div class="chips">' + options.map(function (o) {
      return '<label class="chip"><input type="checkbox" name="' + name + '" value="' + esc(o) + '" data-multi="1"><span>' + esc(o) + '</span></label>';
    }).join('') + '</div></fieldset>';
  }
  function intentFields(intent) {
    var area = '<label class="field"><span>Preferred area(s)</span><input name="area" list="lead-areas" placeholder="e.g. NIBM, Kondhwa, Undri"></label>';
    var where = '<label class="field"><span>Where is the property?</span><input name="area" list="lead-areas" placeholder="Locality, city"></label>';
    var types = ['Flat / apartment', 'Bungalow / villa', 'Row house', 'Penthouse'];
    switch (intent) {
      case 'buy': return area + chipsField('bhk', 'Size', ['1 BHK', '2 BHK', '3 BHK', '4+ BHK']) + '<div class="grid-2">' + sel('budget', 'Budget', BUY_BUDGETS) + sel('when', 'When do you plan to buy?', ['Immediately', 'Within 3 months', '3–6 months', 'Just exploring']) + '</div>' + sel('ptype', 'Property type', types, 'Any');
      case 'rent': return area + chipsField('bhk', 'Size', ['1 RK', '1 BHK', '2 BHK', '3 BHK', '4+ BHK']) + '<div class="grid-2">' + sel('budget', 'Monthly rent budget', RENT_BUDGETS) + sel('when', 'Move-in', ['Immediately', 'Within a month', '1–3 months']) + '</div>' + '<div class="grid-2">' + sel('tenant', 'You are', ['Family', 'Bachelor(s)', 'Company lease']) + sel('furnishing', 'Furnishing', ['Any', 'Fully furnished', 'Semi furnished', 'Unfurnished']) + '</div>';
      case 'sell': return where + '<div class="grid-2">' + sel('ptype', 'Property type', types.concat(['Shop / office'])) + sel('bhk', 'Size', ['1 RK', '1 BHK', '2 BHK', '3 BHK', '4 BHK', '5+ BHK', 'Not applicable']) + '</div>' + txt('expected', 'Expected price', 'e.g. ₹85 Lakh');
      case 'rentout': return where + '<div class="grid-2">' + sel('ptype', 'Property type', types.concat(['Shop', 'Office'])) + sel('bhk', 'Size', ['1 RK', '1 BHK', '2 BHK', '3 BHK', '4 BHK', '5+ BHK', 'Not applicable']) + '</div><div class="grid-2">' + txt('expected', 'Expected rent per month', 'e.g. ₹25,000') + sel('furnishing', 'Furnishing', ['Fully furnished', 'Semi furnished', 'Unfurnished']) + '</div>';
      case 'plot_buy': return area + '<div class="grid-2">' + txt('size', 'Plot size you need', 'e.g. 2,000 sq ft or 5 guntha') + sel('budget', 'Budget', BUY_BUDGETS) + '</div>' + sel('ptype', 'Plot type', ['NA residential plot', 'Agricultural land', 'Commercial plot', 'Industrial plot', 'Any']);
      case 'plot_sell': return where + '<div class="grid-2">' + txt('size', 'Plot size', 'e.g. 2,000 sq ft or 5 guntha') + txt('expected', 'Expected price', 'e.g. ₹40 Lakh') + '</div>' + sel('ptype', 'Plot type', ['NA residential plot', 'Agricultural land', 'Commercial plot', 'Industrial plot']);
      case 'commercial': return chipsField('deal', 'I want to', ['Buy', 'Take on rent / lease', 'Sell', 'Rent out']) + '<div class="grid-2">' + sel('ptype', 'Space', ['Shop', 'Office', 'Showroom', 'Warehouse / godown', 'Commercial plot']) + txt('size', 'Size', 'e.g. 500 sq ft') + '</div>' + area + txt('budget', 'Budget or expected price / rent', 'e.g. ₹40,000 per month');
      case 'project': return area + chipsField('bhk', 'Size', ['1 BHK', '2 BHK', '3 BHK', '4+ BHK']) + '<div class="grid-2">' + sel('budget', 'Budget', BUY_BUDGETS) + sel('possession', 'Possession', ['Ready to move', 'Under construction', 'Either']) + '</div>';
      default: return '';
    }
  }
  var FIELD_NAMES = { area: 'Area', bhk: 'Size', budget: 'Budget', when: 'Timeline', ptype: 'Type', tenant: 'Tenant', furnishing: 'Furnishing', expected: 'Expected', size: 'Size', deal: 'Wants to', possession: 'Possession', calltime: 'Call time', visit: 'Site visit' };
  function leadForm(el, opts) {
    opts = opts || {};
    var intents = opts.intents || INTENTS;
    var start = opts.intent || '';
    el.innerHTML =
      '<form class="lead-form stack" novalidate>' +
      (opts.listing ? '' : '<fieldset class="field intent-pick"><legend>' + esc(opts.question || 'What are you looking for?') + '</legend><div class="intent-grid">' +
        intents.map(function (i) { return '<label class="intent"><input type="radio" name="intent" value="' + i[0] + '"' + (i[0] === start ? ' checked' : '') + '><span>' + icon(i[2]) + esc(i[1]) + '</span></label>'; }).join('') + '</div></fieldset>') +
      '<div class="intent-fields stack"></div>' +
      '<div class="grid-2">' + txt('name', 'Your name', '', 'autocomplete="name" required') + txt('phone', 'Mobile number', '10-digit mobile', 'type="tel" inputmode="numeric" autocomplete="tel" required') + '</div>' +
      (opts.compact ? '' : '<div class="grid-2">' + txt('email', 'Email <em>(optional)</em>', '', 'type="email" autocomplete="email"') + sel('calltime', 'Best time to call', ['Any time', 'Morning (10–1)', 'Afternoon (1–5)', 'Evening (5–8)'], 'Any time') + '</div>') +
      (opts.listing ? '<label class="check"><input type="checkbox" name="visit"> I would like a site visit</label>' : '') +
      '<label class="field"><span>Message <em>(optional)</em></span><textarea name="message" rows="' + (opts.compact ? 2 : 3) + '" maxlength="1500" placeholder="' + esc(opts.messagePh || 'Anything else we should know?') + '"></textarea></label>' +
      '<input class="hp" name="company" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<p class="small muted consent">By sending this, you agree that Stand Tall Realty may call or WhatsApp you about your enquiry.</p>' +
      '<div class="form-actions"><button class="btn btn-gold btn-block" type="submit">' + esc(opts.submitLabel || 'Send enquiry') + '</button></div>' +
      '<datalist id="lead-areas">' + (S.focusAreas || []).concat((LOC.localities.Pune || []).slice(0, 80)).filter(function (x, i, a) { return a.indexOf(x) === i; }).map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist>' +
      '</form>';
    var form = $('form', el), box = $('.intent-fields', form);
    function show(intent) { box.innerHTML = intentFields(intent); box.hidden = !box.innerHTML; }
    show(start);
    form.addEventListener('change', function (e) { if (e.target.name === 'intent') show(e.target.value); });
    var u = Auth.user();
    if (u) { form.name.value = u.name; form.phone.value = u.phone; if (form.email) form.email.value = u.email || ''; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = formData(form), btn = $('button[type=submit]', form);
      var intent = opts.listing ? (d.visit ? 'site_visit' : 'listing') : d.intent;
      if (!intent) return fieldError(form, 'Choose what you are looking for.');
      if ((d.name || '').length < 2) { form.name.focus(); return fieldError(form, 'Enter your name.'); }
      if (!normPhone(d.phone)) { form.phone.focus(); return fieldError(form, 'Enter a valid 10-digit mobile number.'); }
      fieldError(form, '');
      var details = Object.keys(FIELD_NAMES).map(function (k) {
        var v = d[k]; if (Array.isArray(v)) v = v.join(', '); if (v === true) v = 'Yes';
        return v && v !== 'Any time' ? FIELD_NAMES[k] + ': ' + v : '';
      }).filter(Boolean).join(' | ');
      busy(btn, true, 'Sending…');
      api('lead', { intent: intent, name: d.name, phone: d.phone, email: d.email || '', details: details, message: d.message, company: d.company,
        listingId: opts.listing ? opts.listing.id : '', listingTitle: opts.listing ? opts.listing.title : '', page: location.pathname.split('/').pop() || 'index.html', source: leadSource() })
        .then(function (r) {
          var label = (intents.filter(function (i) { return i[0] === intent; })[0] || [0, opts.listing ? 'this property' : 'your enquiry'])[1];
          var waText = 'Hi Stand Tall Realty, I am ' + d.name + '. ' + (opts.listing ? 'I am interested in ' + opts.listing.id + ' – ' + opts.listing.title + '.' : 'I enquired on your website: ' + label + '.') + (details ? ' ' + details : '');
          var phone = normPhone(d.phone);
          function finished(verified) {
            track('Lead', { content_name: intent });
            el.innerHTML = '<div class="lead-done" role="status">' + icon('check', 'ic-done') + '<h3>Thanks, ' + esc(d.name.split(' ')[0]) + '. We have your enquiry.</h3>' +
              (verified ? '<p class="verified-note">' + icon('shield') + 'Mobile number verified</p>' : '') +
              '<p>Our team will call you on <b>' + esc(fmtPhone(phone)) + '</b> soon. Want a faster reply?</p>' +
              '<a class="btn btn-wa" href="' + wa(waText) + '" target="_blank" rel="noopener">' + icon('wa') + 'Continue on WhatsApp</a>' +
              '<button type="button" class="btn btn-link" data-again>Send another enquiry</button></div>';
            $('[data-again]', el).onclick = function () { leadForm(el, opts); };
            if (opts.onDone) opts.onDone();
          }
          if (!r || !r.otp) return finished(!!(r && r.verified));
          // Step 2: the enquiry is saved; confirm the number with the OTP we just sent.
          var step = document.createElement('div');
          step.className = 'lead-otp stack';
          step.innerHTML = '<div><h3>Verify your mobile number</h3><p class="muted small" style="margin:0">One last step, so our team calls you on the right number.</p></div>';
          step.appendChild(otpBox({ phone: r.otp.phone || phone, resendIn: r.otp.resendIn, demoOtp: r.otp.demoOtp, verifyLabel: 'Verify number', waText: waText,
            onVerify: function (code) { return api('verifyLead', { id: r.id, phone: r.otp.phone || phone, otp: code }).then(function () { finished(true); }); },
            onResend: function () { return api('sendOtp', { phone: r.otp.phone || phone, purpose: 'lead', leadId: r.id }); },
            onChange: function () { el.innerHTML = ''; el.appendChild(form); busy(btn, false); form.phone.focus(); try { form.phone.select(); } catch (e) {} } }));
          el.innerHTML = '';
          el.appendChild(step);
        }).catch(function (err) { busy(btn, false); fieldError(form, err.message); });
    });
    return form;
  }
  function openEnquiry(opts) {
    opts = opts || {};
    var div = document.createElement('div');
    var m = openModal({ title: opts.title || 'Talk to Stand Tall Realty', size: opts.listing ? 'sm' : '', body: div });
    leadForm(div, Object.assign({ compact: true }, opts));
    return m;
  }

  // ---------------------------------------------------------------- budgets (s: = sale price, r: = monthly rent)
  var BUDGET_SALE = [['s:0-5000000', 'Under ₹50 L'], ['s:5000000-7500000', '₹50 L – ₹75 L'], ['s:7500000-10000000', '₹75 L – ₹1 Cr'], ['s:10000000-15000000', '₹1 Cr – ₹1.5 Cr'],
    ['s:15000000-20000000', '₹1.5 Cr – ₹2 Cr'], ['s:20000000-30000000', '₹2 Cr – ₹3 Cr'], ['s:30000000-', 'Above ₹3 Cr']];
  var BUDGET_RENT = [['r:0-15000', 'Under ₹15,000'], ['r:15000-25000', '₹15,000 – ₹25,000'], ['r:25000-40000', '₹25,000 – ₹40,000'], ['r:40000-60000', '₹40,000 – ₹60,000'],
    ['r:60000-100000', '₹60,000 – ₹1 L'], ['r:100000-', 'Above ₹1 L']];
  function budgetOptions(purpose, selected) {
    function opts(list) { return list.map(function (b) { return '<option value="' + b[0] + '"' + (b[0] === selected ? ' selected' : '') + '>' + esc(b[1]) + '</option>'; }).join(''); }
    if (purpose === 'rent') return '<option value="">Any rent</option>' + opts(BUDGET_RENT);
    if (purpose === 'sale') return '<option value="">Any budget</option>' + opts(BUDGET_SALE);
    return '<option value="">Any budget</option><optgroup label="To buy">' + opts(BUDGET_SALE) + '</optgroup><optgroup label="Monthly rent">' + opts(BUDGET_RENT) + '</optgroup>';
  }
  function inBudget(l, b) {
    if (!b) return true;
    var kind = b.slice(0, 1), r = b.slice(2).split('-'), min = Number(r[0]) || 0, max = r[1] ? Number(r[1]) : Infinity;
    if (kind === 'r') { if (l.purpose !== 'rent') return false; var v = Number(l.rent) || 0; return v >= min && v <= max; }
    if (l.purpose !== 'sale') return false;
    var lo = Number(l.price) || 0, hi = Number(l.priceMax) || lo;
    return hi >= min && lo <= max;
  }

  // ---------------------------------------------------------------- analytics (optional)
  function track(ev, params) {
    try { if (window.fbq) window.fbq('track', ev, params || {}); } catch (e) {}
    try { if (window.gtag) window.gtag('event', ev === 'Lead' ? 'generate_lead' : ev, params || {}); } catch (e) {}
  }
  function loadAnalytics() {
    if (S.metaPixelId) {
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', S.metaPixelId); window.fbq('track', 'PageView');
    }
    if (S.googleAnalyticsId) {
      var g = document.createElement('script'); g.async = true; g.src = 'https://www.googletagmanager.com/gtag/js?id=' + S.googleAnalyticsId; document.head.appendChild(g);
      window.dataLayer = window.dataLayer || []; window.gtag = function () { window.dataLayer.push(arguments); }; window.gtag('js', new Date()); window.gtag('config', S.googleAnalyticsId);
    }
  }

  // ---------------------------------------------------------------- page chrome
  function init() {
    renderAccount();
    var page = document.body.dataset.page;
    $$('.main-nav a, .mobile-menu a').forEach(function (a) { if (a.dataset.nav && a.dataset.nav === document.body.dataset.nav) a.setAttribute('aria-current', 'page'); });
    var mb = $('.menu-btn'), mm = $('#mobile-menu');
    if (mb && mm) mb.addEventListener('click', function () {
      var open = mm.hidden; mm.hidden = !open; mb.setAttribute('aria-expanded', String(open)); document.body.classList.toggle('menu-open', open);
      mb.innerHTML = icon(open ? 'x' : 'menu');
    });
    $$('[data-account]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (Auth.user()) return;
        e.preventDefault();
        openLogin('Log in to see your listings, chats and saved properties.').then(function () { location.href = 'account.html'; }).catch(function () {});
      });
    });
    $$('[data-enquire]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); openEnquiry({ intent: b.dataset.enquire || '' }); }); });
    $$('[data-year]').forEach(function (y) { y.textContent = new Date().getFullYear(); });
    if (DEMO && page !== 'admin') {
      var bar = document.createElement('div');
      bar.className = 'demo-bar';
      bar.innerHTML = '<b>Preview mode.</b> Enquiries, listings and chats are saved only in this browser until the Google Sheet is connected.';
      document.body.insertBefore(bar, document.body.firstChild);
    }
    refreshUnread(true);
    setInterval(function () { if (!document.hidden) refreshUnread(false); }, 45000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) refreshUnread(false); });
    loadAnalytics();
  }

  window.ST = {
    S: S, DEMO: DEMO, ASSETS: ASSETS, $: $, $$: $$, esc: esc, sleep: sleep, debounce: debounce, qs: qs, store: store,
    inr: inr, rupees: rupees, priceLabel: priceLabel, priceSuffix: priceSuffix, bhkLabel: bhkLabel, areaLabel: areaLabel, timeAgo: timeAgo,
    clock: clock, dayLabel: dayLabel, fmtPhone: fmtPhone, normPhone: normPhone, tel: tel, wa: wa, listingUrl: listingUrl, absUrl: absUrl,
    placeLabel: placeLabel, segLabel: segLabel, api: api, ApiError: ApiError, Auth: Auth, Admin: Admin, toast: toast, openModal: openModal,
    confirmBox: confirmBox, busy: busy, formData: formData, fieldError: fieldError, openLogin: openLogin, icon: icon, art: art,
    photoUrl: photoUrl, imgTag: imgTag, Saved: Saved, card: card, getListings: getListings, setBadge: setBadge, refreshUnread: refreshUnread,
    detectLocation: detectLocation, reverseGeocode: reverseGeocode, distanceKm: distanceKm, cityOptions: cityOptions, fillLocalities: fillLocalities,
    locationPicker: locationPicker, compressImage: compressImage, leadForm: leadForm, openEnquiry: openEnquiry, INTENTS: INTENTS, otpBox: otpBox, siteConfig: siteConfig,
    BUY_BUDGETS: BUY_BUDGETS, RENT_BUDGETS: RENT_BUDGETS, budgetOptions: budgetOptions, inBudget: inBudget, track: track, leadSource: leadSource, initials: initials
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
