/* =====================================================================
   Stand Tall Realty — English | हिन्दी switch
   The website is written in English. When a visitor picks हिन्दी at the
   bottom of any page, the choice is remembered on that device, hi.js (the
   dictionary) is loaded, and every visible text, placeholder and label is
   swapped — including text that scripts add later (cards, forms, messages).
   The admin panel always stays in English.
   ===================================================================== */
(function () {
  var KEY = 'st_lang';
  var lang = 'en';
  try { lang = localStorage.getItem(KEY) === 'hi' ? 'hi' : 'en'; } catch (e) {}
  if (/\/admin(\.html)?$/.test(location.pathname)) lang = 'en';
  window.ST_LANG = lang;

  // Footer buttons: <button data-lang="en|hi">
  document.addEventListener('click', function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest('[data-lang]') : null;
    if (!b) return;
    ev.preventDefault();
    var want = b.getAttribute('data-lang') === 'hi' ? 'hi' : 'en';
    if (want === window.ST_LANG) return;
    try { localStorage.setItem(KEY, want); } catch (e) {}
    location.reload();
  });
  function markButtons() {
    var bs = document.querySelectorAll('[data-lang]');
    for (var i = 0; i < bs.length; i++) bs[i].setAttribute('aria-pressed', String(bs[i].getAttribute('data-lang') === window.ST_LANG));
  }
  document.addEventListener('DOMContentLoaded', markButtons);

  if (lang !== 'hi') return;

  var root = document.documentElement;
  root.setAttribute('lang', 'hi');
  root.className += ' lang-hi i18n-wait';
  var safety = setTimeout(function () { root.classList.remove('i18n-wait'); }, 2500);
  // Load the dictionary before the page body is read, so nothing flashes in English.
  var me = document.currentScript;
  var src = me && me.src ? me.src.replace(/i18n\.js/, 'hi.js') : 'assets/js/hi.js';
  document.write('<script src="' + src + '"><\/script>');

  var D = null, P = [];
  var ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  var SKIP = 'script,style,noscript,textarea,code,pre,title,[data-no-i18n],[contenteditable]';
  var SKIP_ATTR = 'script,style,noscript,[data-no-i18n],[contenteditable]';
  var done = typeof WeakMap === 'function' ? new WeakMap() : null;

  function ready() {
    if (D) return true;
    var H = window.ST_HI;
    if (!H) return false;
    D = H.t || {}; P = H.p || [];
    return true;
  }
  function norm(s) { return String(s).replace(/\s+/g, ' ').trim(); }
  function tr(s) {
    var k = norm(s);
    if (!k || !/[A-Za-z]/.test(k)) return null;
    if (Object.prototype.hasOwnProperty.call(D, k)) return D[k];
    for (var i = 0; i < P.length; i++) {
      var m = k.match(P[i][0]);
      if (m) return typeof P[i][1] === 'function' ? P[i][1].apply(null, m) : k.replace(P[i][0], P[i][1]);
    }
    return null;
  }
  function skipped(el) { return !el || !!el.closest(SKIP); }
  function doText(n) {
    if (done && done.get(n) === n.nodeValue) return;
    var p = n.parentElement;
    if (skipped(p)) return;
    var v = n.nodeValue, t = tr(v);
    if (t == null) return;
    // a select option without a value attribute submits its text: keep the English value
    if (p.tagName === 'OPTION' && !p.hasAttribute('value')) p.setAttribute('value', norm(v));
    var out = v.match(/^\s*/)[0] + t + v.match(/\s*$/)[0];
    n.nodeValue = out;
    if (done) done.set(n, out);
  }
  function doAttrs(el) {
    if (!el || el.closest(SKIP_ATTR)) return;
    for (var i = 0; i < ATTRS.length; i++) {
      var v = el.getAttribute(ATTRS[i]);
      if (!v) continue;
      var t = tr(v);
      if (t != null) el.setAttribute(ATTRS[i], t);
    }
    if (el.tagName === 'INPUT' && /^(button|submit|reset)$/i.test(el.type) && el.value) {
      var tv = tr(el.value); if (tv != null) el.value = tv;
    }
    if (el.tagName === 'OPTGROUP') {
      var l = el.getAttribute('label'), tl = l ? tr(l) : null;
      if (tl != null) el.setAttribute('label', tl);
    }
  }
  function walk(node) {
    if (!node) return;
    if (node.nodeType === 3) { doText(node); return; }
    if (node.nodeType !== 1 || node.closest(SKIP_ATTR)) return;
    doAttrs(node);
    var w = document.createTreeWalker(node, 5 /* elements + text */, null), n;
    while ((n = w.nextNode())) {
      if (n.nodeType === 3) doText(n); else doAttrs(n);
    }
  }
  var lastTitle = '';
  function title() {
    if (document.title === lastTitle) return;
    var parts = document.title.split(' | '), changed = false;
    for (var i = 0; i < parts.length; i++) { var t = tr(parts[i]); if (t != null) { parts[i] = t; changed = true; } }
    if (changed) document.title = parts.join(' | ');
    lastTitle = document.title;
  }

  // Translate while the page is being read, and keep translating whatever scripts add later.
  var queue = [];
  var mo = new MutationObserver(function (list) {
    if (!ready()) { queue.push.apply(queue, list); return; }
    if (queue.length) { list = queue.concat(list); queue = []; }
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      if (m.type === 'childList') { for (var j = 0; j < m.addedNodes.length; j++) walk(m.addedNodes[j]); }
      else if (m.type === 'characterData') doText(m.target);
      else if (m.type === 'attributes') doAttrs(m.target);
    }
    title();
  });
  mo.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS.concat(['value', 'label']) });

  document.addEventListener('DOMContentLoaded', function () {
    if (ready()) { walk(document.body); title(); }
    clearTimeout(safety);
    root.classList.remove('i18n-wait');
  });

  // Small helper for scripts that build text outside the page (share text, confirm boxes).
  window.ST_T = function (s) { return ready() ? (tr(s) || s) : s; };
})();
