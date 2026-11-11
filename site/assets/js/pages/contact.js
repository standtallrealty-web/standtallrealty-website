/* Contact page */
(function () {
  'use strict';
  var ST = window.ST, $ = ST.$, esc = ST.esc, icon = ST.icon, S = ST.S;
  $('#c-address').textContent = S.address;
  $('#c-hours').textContent = S.hours;
  $('#c-people').innerHTML = (S.contacts || []).map(function (c) {
    return '<div class="cc-phone" style="background:#F3F6FB"><div><small class="muted">' + esc(c.name) + '</small><br><b>' + esc(ST.fmtPhone(c.phone)) + '</b></div>' +
      '<div style="display:flex;gap:6px"><a class="btn btn-navy btn-sm" href="tel:+91' + esc(c.phone) + '" aria-label="Call ' + esc(c.name) + '">' + icon('phone') + '</a>' +
      '<a class="btn btn-wa btn-sm" href="' + ST.wa('Hi ' + c.name.split(' ')[0] + ', I found Stand Tall Realty online.', c.phone) + '" target="_blank" rel="noopener" aria-label="WhatsApp ' + esc(c.name) + '">' + icon('wa') + '</a></div></div>';
  }).join('') + (S.email ? '<p style="margin:6px 0 0">Email: <a href="mailto:' + esc(S.email) + '">' + esc(S.email) + '</a></p>' : '');
  $('#c-wa').href = ST.wa('Hi Stand Tall Realty, I would like to talk about a property.');
  $('#c-map').src = 'https://www.google.com/maps?q=' + encodeURIComponent(S.mapQuery || S.address) + '&z=16&output=embed';
  $('#c-chat').addEventListener('click', function () {
    var b = this;
    ST.Auth.require('Log in to chat with Stand Tall Realty.').then(function () { ST.busy(b, true, 'Opening chat…'); return ST.api('startChat', {}); })
      .then(function (r) { location.href = 'chats.html?c=' + encodeURIComponent(r.chatId); })
      .catch(function (err) { ST.busy(b, false); if (err.code !== 'CANCELLED') ST.toast(err.message, 'error'); });
  });
  ST.leadForm($('#contact-lead'), { intent: ST.qs('intent') });
})();
