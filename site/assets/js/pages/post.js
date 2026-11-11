/* Post / edit a property (step by step) */
(function () {
  'use strict';
  var ST = window.ST, $ = ST.$, $$ = ST.$$, esc = ST.esc, icon = ST.icon;
  var editId = ST.qs('edit');
  var lf, steps, step = 1;

  function setup(listing) {
    lf = window.ListingForm.mount($('#lf'), { listing: listing, editId: editId, onDraft: function () { $('#draft-note').hidden = false; } });
    steps = $$('.lf-step', lf.form);
    $('#progress').innerHTML = steps.map(function (s) { return '<li>' + esc(s.dataset.title) + '</li>'; }).join('');
    go(1);
  }
  function go(n) {
    step = n;
    steps.forEach(function (s, i) { s.classList.toggle('on', i === n - 1); });
    $$('#progress li').forEach(function (li, i) { li.className = i < n - 1 ? 'done' : i === n - 1 ? 'now' : ''; if (i === n - 1) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
    $('#back').style.visibility = n === 1 ? 'hidden' : 'visible';
    $('#next').textContent = n === steps.length ? (editId ? 'Save and resubmit' : 'Submit for review') : 'Next';
    $('#next').className = 'btn ' + (n === steps.length ? 'btn-gold' : 'btn-navy');
    ST.fieldError(lf.form, '');
    var top = $('#post-card').getBoundingClientRect().top + window.scrollY - 90;
    if (window.scrollY > top) window.scrollTo({ top: top, behavior: 'smooth' });
  }
  function showError(msg) {
    var box = $('.form-error', lf.form);
    if (!box) { box = document.createElement('p'); box.className = 'form-error'; box.setAttribute('role', 'alert'); lf.form.appendChild(box); }
    box.textContent = msg; box.hidden = !msg;
    if (msg) box.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  $('#back').addEventListener('click', function () { if (step > 1) go(step - 1); });
  $('#next').addEventListener('click', function () {
    var err = lf.stepErrors(step);
    if (err) return showError(err);
    showError('');
    if (step < steps.length) return go(step + 1);
    submit();
  });
  $('#draft-clear').addEventListener('click', function () { lf.clearDraft(); location.reload(); });

  function submit() {
    var btn = $('#next');
    ST.Auth.require('Create a free account (or log in) so you can manage this listing and reply to buyers.').then(function (u) {
      var data = lf.collect();
      if (!data.contactPhone) data.contactPhone = u.phone;
      ST.busy(btn, true, 'Uploading photos…');
      var prog = document.createElement('div'); prog.className = 'upload-progress'; prog.innerHTML = '<i></i>';
      $('.wiz-nav').after(prog);
      return lf.uploadPending(function (i, n) { btn.textContent = 'Uploading photo ' + i + ' of ' + n + '…'; $('i', prog).style.width = Math.round((i - 1) / n * 100) + '%'; })
        .then(function () {
          $('i', prog).style.width = '100%';
          btn.textContent = 'Submitting…';
          var final = lf.collect();
          if (!final.contactPhone) final.contactPhone = u.phone;
          return ST.api('submitListing', { listing: final, id: editId || undefined });
        }).then(function (r) {
          lf.clearDraft();
          ST.track('SubmitApplication', { content_name: 'listing' });
          $('#progress').innerHTML = $$('#progress li').map(function (li) { return '<li class="done">' + li.textContent + '</li>'; }).join('');
          $('#post-card').innerHTML = '<div class="done-card" role="status">' + icon('check', 'ic-done') +
            '<h2>' + (editId ? 'Changes submitted' : 'Your listing is submitted') + '</h2>' +
            '<p class="muted" style="max-width:52ch;margin:0 auto 6px">Listing ID <b>' + esc(r.id) + '</b>. Our team reviews every listing, usually ' + esc(ST.S.approvalTime || 'within 24 hours') + '. We will let you know once it is live.</p>' +
            '<p class="muted" style="max-width:52ch;margin:0 auto 20px">When buyers chat with you or ask for your number, you will see it under Chats.</p>' +
            '<p style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><a class="btn btn-navy" href="account.html">Go to my listings</a><a class="btn btn-ghost" href="property.html?id=' + encodeURIComponent(r.id) + '">Preview listing</a><a class="btn btn-ghost" href="post-property.html">Post another</a></p></div>';
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }).catch(function (err) { prog.remove(); throw err; });
    }).catch(function (err) {
      ST.busy(btn, false);
      if (err.code === 'CANCELLED') return;
      showError(err.message);
    });
  }

  if (editId) {
    $('#post-title').textContent = 'Edit your listing';
    $('#lf').innerHTML = '<div class="skeleton" style="min-height:300px"></div>';
    ST.Auth.require('Log in to edit your listing.').then(function () { return ST.api('myListing', { id: editId }); })
      .then(function (l) { setup(l); })
      .catch(function (err) { $('#post-card').innerHTML = '<div class="empty"><h3>Could not open this listing</h3><p>' + esc(err.code === 'CANCELLED' ? 'Please log in to edit your listing.' : err.message) + '</p><a class="btn btn-navy" href="account.html">My listings</a></div>'; });
  } else setup(null);
})();
