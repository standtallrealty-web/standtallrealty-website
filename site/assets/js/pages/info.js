/* About, Sell / rent out, NRI services and Moving to Pune pages: each enquiry form is set up from its data attributes. */
(function () {
  'use strict';
  var ST = window.ST;
  ST.$$('[data-leadform]').forEach(function (el) {
    var d = el.dataset;
    ST.leadForm(el, { intent: d.intent || '', fixed: d.fixed === '1', compact: d.compact === '1', submitLabel: d.submit || '', messagePh: d.msgph || '' });
  });
  // Links such as "Free price check" scroll to the form on this page instead of opening the chat.
  ST.$$('a[href^="#"][data-quickchat]').forEach(function (a) { a.removeAttribute('data-quickchat'); });
  if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) setTimeout(function () { t.scrollIntoView(); }, 60); }
})();
