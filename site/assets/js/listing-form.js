/* Listing form — used by "Post property" (step by step) and by the admin panel (all on one page). */
(function () {
  'use strict';
  var ST = window.ST, $ = ST.$, $$ = ST.$$, esc = ST.esc, icon = ST.icon;

  var TYPES = {
    Residential: ['Apartment / Flat', 'Independent house / Bungalow', 'Villa', 'Row house', 'Penthouse', 'Studio apartment', 'Farm house'],
    Commercial: ['Shop', 'Office space', 'Showroom', 'Warehouse / Godown', 'Commercial building', 'Co-working space', 'Industrial shed'],
    Plot: ['Residential plot', 'NA plot', 'Agricultural land', 'Commercial plot', 'Industrial plot']
  };
  var AMENITIES = ['Lift', 'Car parking', 'Power backup', 'Security', 'CCTV', 'Gym', 'Swimming pool', 'Club house', 'Garden',
    "Children's play area", 'Jogging track', 'Gas pipeline', 'Intercom', 'Water storage', 'Fire safety', 'Visitor parking', 'Rainwater harvesting', 'Wi-Fi'];
  var BHK = ['1 RK', '1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5+'];

  function radioCards(name, items, cls) {
    return '<div class="choice-grid ' + (cls || '') + '">' + items.map(function (it) {
      return '<label class="choice"><input type="radio" name="' + name + '" value="' + esc(it[0]) + '"><span>' + (it[2] ? icon(it[2]) : '') + '<b>' + esc(it[1]) + '</b>' + (it[3] ? '<small>' + esc(it[3]) + '</small>' : '') + '</span></label>';
    }).join('') + '</div>';
  }
  function chipRadios(name, items, labels) {
    return '<div class="chips">' + items.map(function (v, i) { return '<label class="chip"><input type="radio" name="' + name + '" value="' + esc(v) + '"><span>' + esc(labels ? labels[i] : v) + '</span></label>'; }).join('') + '</div>';
  }
  function chipChecks(name, items) {
    return '<div class="chips">' + items.map(function (v) { return '<label class="chip"><input type="checkbox" name="' + name + '" value="' + esc(v) + '" data-multi="1"><span>' + esc(v) + '</span></label>'; }).join('') + '</div>';
  }
  function input(name, label, attrs, hint) {
    return '<label class="field"><span>' + label + '</span><input name="' + name + '" ' + (attrs || '') + '>' + (hint ? '<small class="hint">' + hint + '</small>' : '') + '</label>';
  }
  function money(name, label, ph) {
    return '<label class="field"><span>' + label + '</span><div class="money"><i>₹</i><input name="' + name + '" inputmode="numeric" placeholder="' + (ph || '') + '" data-money></div><small class="hint" data-words="' + name + '"></small></label>';
  }
  function select(name, label, items, ph) {
    return '<label class="field"><span>' + label + '</span><select name="' + name + '"><option value="">' + (ph || 'Select') + '</option>' + items.map(function (v) { return '<option>' + esc(v) + '</option>'; }).join('') + '</select></label>';
  }
  function show(cond, inner) { return '<div class="cond" data-show="' + cond + '">' + inner + '</div>'; }

  function markup(admin) {
    var s1 = '<section class="lf-step" data-step="1" data-title="Basics">' +
      '<h2 class="lf-h">What are you listing?</h2>' +
      '<fieldset class="field"><legend>I want to</legend>' + radioCards('purpose', [['sale', 'Sell', 'key', 'Find a buyer'], ['rent', 'Rent out', 'bed', 'Find a tenant']], 'two') + '</fieldset>' +
      '<fieldset class="field"><legend>Property category</legend>' + radioCards('category', [['Residential', 'Residential', 'building', 'Flat, bungalow, villa'], ['Commercial', 'Commercial', 'building', 'Shop, office, godown'], ['Plot', 'Plot / land', 'area', 'NA, agricultural, industrial']], 'three') + '</fieldset>' +
      '<fieldset class="field cond" data-show="hasCat"><legend>Property type</legend><div data-types></div></fieldset>' +
      (admin ? '' : '<fieldset class="field"><legend>You are the</legend>' + chipRadios('ownerRole', ['Owner', 'Builder', 'Agent'], ['Owner', 'Builder / developer', 'Agent / broker']) + '</fieldset>') +
      '</section>';

    var s2 = '<section class="lf-step" data-step="2" data-title="Location">' +
      '<h2 class="lf-h">Where is it?</h2><div data-loc></div>' +
      input('projectName', 'Society / project name <em>(seen only by our team)</em>', 'maxlength="120" placeholder="e.g. Green Valley Society"') +
      (admin ? input('builderName', 'Builder name <em>(internal)</em>', 'maxlength="120"') : '') +
      '</section>';

    var s3 = '<section class="lf-step" data-step="3" data-title="Details">' +
      '<h2 class="lf-h">Property details</h2>' +
      show('project', '<div class="grid-2">' + input('configurations', 'Configurations', 'placeholder="e.g. 1, 2, 3 BHK"') + input('possessionDate', 'Possession by', 'placeholder="e.g. December 2027"') + '</div>' +
        input('reraNumber', 'MahaRERA registration no.', 'placeholder="e.g. P52100012345"')) +
      show('res', '<fieldset class="field"><legend>Size (BHK)' + (admin ? ' <em>— for projects you can add more, e.g. 2,3</em>' : '') + '</legend>' + chipRadios('bhkChip', BHK, BHK.map(function (b) { return b === '1 RK' ? '1 RK' : b + ' BHK'; })) +
        (admin ? input('bhk', 'BHK values', 'placeholder="e.g. 2,3 (used for search filters)"') : '') + '</fieldset>') +
      '<div class="grid-2"><label class="field"><span data-area-label>Carpet area</span><div class="combo"><input name="carpetArea" inputmode="decimal" placeholder="e.g. 850"><select name="areaUnit"><option>sq ft</option><option>sq m</option><option>sq yd</option><option>guntha</option><option>acre</option><option>hectare</option></select></div></label>' +
      show('notPlot', '<div class="grid-2 tight">' + input('floor', 'Floor', 'maxlength="20" placeholder="e.g. 4"') + input('totalFloors', 'Total floors', 'maxlength="20" placeholder="e.g. 12"') + '</div>') + '</div>' +
      show('res', '<div class="grid-3">' + select('bathrooms', 'Bathrooms', ['1', '2', '3', '4', '5+']) + select('balconies', 'Balconies', ['0', '1', '2', '3', '4+']) + select('parking', 'Parking', ['None', '1 covered', '2 covered', '1 open', '2 open', '3+']) + '</div>') +
      '<div class="grid-2">' + show('notPlot', select('furnishing', 'Furnishing', ['Unfurnished', 'Semi furnished', 'Fully furnished', 'Bare shell', 'Warm shell'])) +
        show('plot', select('plotType', 'Plot status', ['NA (non-agricultural)', 'Agricultural', 'Gunthewari', 'Collector NA', 'PMRDA approved', 'Gram panchayat'])) +
        select('facing', 'Facing', ['East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West']) + '</div>' +
      show('notPlot', '<fieldset class="field"><legend>Possession</legend>' + chipRadios('possession', ['Ready to move', 'Under construction']) + '</fieldset>') +
      show('uc', input('possessionDate2', 'Expected possession', 'placeholder="e.g. March 2027"')) +
      show('readySale', select('ageOfProperty', 'Age of property', ['New', 'Less than 1 year', '1–5 years', '5–10 years', 'More than 10 years'])) +
      show('rent', '<div class="grid-3">' + money('rent', 'Monthly rent', '25000') + money('deposit', 'Security deposit', '75000') + money('maintenance', 'Maintenance / month', '2500') + '</div>' +
        '<div class="grid-2">' + input('availableFrom', 'Available from', 'type="date"') + '<fieldset class="field"><legend>Preferred tenants</legend>' + chipChecks('tenantPreference', ['Family', 'Bachelors', 'Company lease', 'Anyone']) + '</fieldset></div>') +
      show('sale', '<div class="grid-2">' + money('price', 'Expected price', '8500000') + '<div>' + show('project', money('priceMax', 'Highest price (optional)', '15000000')) + '<label class="check"><input type="checkbox" name="negotiable"> Price is negotiable</label></div></div>' +
        show('notPlot', money('maintenance', 'Maintenance / month (optional)', '3000'))) +
      show('project', '<label class="field"><span>Price list by configuration <em>(optional)</em></span><textarea name="priceNote" rows="4" maxlength="1500" placeholder="2 BHK — 750 sq ft — from ₹81 Lakh&#10;3 BHK — 980 sq ft — from ₹1.05 Cr"></textarea></label>') +
      '</section>';

    var s4 = '<section class="lf-step" data-step="4" data-title="Photos">' +
      '<h2 class="lf-h">Photos and description</h2>' +
      '<div class="photo-up"><div class="photo-grid"></div><label class="photo-add"><input type="file" accept="image/*" multiple>' + icon('camera') + '<span>Add photos</span></label>' +
      '<p class="hint">Up to 10 photos. Bright, wide photos of the hall, kitchen, bedrooms and view get the most enquiries. The first photo is the cover.</p>' +
      (admin ? '<div class="combo"><input data-photo-url placeholder="…or paste an image link (https://…)"><button type="button" class="btn btn-ghost btn-sm" data-add-url>Add link</button></div>' : '') + '</div>' +
      show('notPlot', '<fieldset class="field"><legend>Amenities</legend>' + chipChecks('amenities', AMENITIES) + '</fieldset>') +
      '<label class="field"><span>Describe the property</span><textarea name="description" rows="5" maxlength="4000" placeholder="What makes it a good home or investment? Mention the view, nearby schools and markets, road access, condition, etc."></textarea></label>' +
      '<label class="field"><span>Highlights <em>(one per line, optional)</em></span><textarea name="highlights" rows="3" maxlength="1500" placeholder="Corner flat with 2 balconies&#10;5 min to NIBM Road"></textarea></label>' +
      '<div class="grid-2">' + input('title', 'Listing title <em>(optional)</em>', 'maxlength="120" placeholder="We will write one if you leave this empty"') + input('videoUrl', 'Video link <em>(YouTube / Instagram, optional)</em>', 'type="url" placeholder="https://"') + '</div>' +
      '</section>';

    var s5 = admin ? '' : '<section class="lf-step" data-step="5" data-title="Contact">' +
      '<h2 class="lf-h">How buyers reach you</h2>' +
      '<p class="muted">Buyers can always chat with you on this website. Choose who can see your phone number.</p>' +
      '<fieldset class="field">' + radioCards('phoneMode', [['approval', 'Only buyers I approve', 'lock', 'Buyers request your number in chat. You decide who gets it. (Recommended)'], ['direct', 'Show my number to buyers', 'phone', 'Logged-in buyers see your number and can call you directly.']], 'two tall') + '</fieldset>' +
      input('contactPhone', 'Phone number for this listing', 'type="tel" inputmode="numeric" maxlength="14" placeholder="10-digit mobile"', 'Leave as is to use your account number.') +
      '<label class="check"><input type="checkbox" name="confirm"> I confirm these details are correct and I am allowed to list this property.</label>' +
      '</section>';

    var sAdmin = admin ? '<section class="lf-step" data-step="9" data-title="Publishing">' +
      '<h2 class="lf-h">Publishing</h2>' +
      '<div class="grid-3"><label class="field"><span>Listing kind</span><select name="kind"><option value="property">Property (resale / rental)</option><option value="project">New project</option></select></label>' + select('segment', 'Show under', ['Under Construction', 'Ready to Move', 'Resale', 'Rental', 'Commercial', 'Plots'], 'Automatic') + select('status', 'Status', ['Approved', 'Pending', 'Rejected', 'Sold', 'Rented']) + '</div>' +
      '<div class="grid-2">' + input('tag', 'Badge on the card <em>(optional)</em>', 'list="tag-list" maxlength="30" placeholder="e.g. New launch"') + '<label class="check big"><input type="checkbox" name="featured"> Feature on the home page</label></div>' +
      '<datalist id="tag-list"><option value="New launch"><option value="Hot deal"><option value="Price drop"><option value="Ready possession"><option value="Sample flat ready"><option value="Few units left"></datalist>' +
      '<label class="field"><span>Internal notes <em>(only admins see this)</em></span><textarea name="adminNotes" rows="2" maxlength="1000"></textarea></label>' +
      '</section>' : '';
    return admin ? sAdmin + s1 + s2 + s3 + s4 : s1 + s2 + s3 + s4 + s5;
  }

  function mount(el, opts) {
    opts = opts || {};
    var admin = opts.mode === 'admin';
    el.innerHTML = '<form class="lf' + (admin ? ' lf-all' : '') + '" novalidate>' + markup(admin) + '</form>';
    var form = $('form', el);
    var loc = ST.locationPicker($('[data-loc]', form), { required: true, defaultCity: ST.S.defaultCity || 'Pune' });
    var photos = []; // {id} existing or {data} new

    function isList(f) { return f && f.length !== undefined && !f.tagName; }
    function checkable(x) { return x.type === 'radio' || x.type === 'checkbox'; }
    function val(name) {
      var f = form.elements[name]; if (!f) return '';
      if (isList(f)) {
        for (var i = 0; i < f.length; i++) { if (checkable(f[i]) ? f[i].checked : !f[i].disabled) return checkable(f[i]) ? f[i].value : f[i].value; }
        return '';
      }
      return f.type === 'checkbox' ? f.checked : f.value;
    }
    function setVal(name, v) {
      var f = form.elements[name]; if (!f) return;
      if (isList(f)) {
        var list = Array.isArray(v) ? v : String(v === undefined || v === null ? '' : v).split(/\s*,\s*/);
        for (var i = 0; i < f.length; i++) {
          if (!checkable(f[i])) f[i].value = v === undefined || v === null ? '' : v;
          else f[i].checked = f[i].type === 'radio' ? f[i].value === String(v) : list.indexOf(f[i].value) >= 0;
        }
        return;
      }
      if (f.type === 'checkbox') f.checked = v === true || v === 'Yes';
      else f.value = v === undefined || v === null ? '' : v;
    }
    function state() {
      var cat = val('category'), purpose = val('purpose'), role = admin ? '' : val('ownerRole');
      var kind = admin ? val('kind') : (role === 'Builder' && purpose === 'sale' && cat === 'Residential' ? 'project' : 'property');
      return { cat: cat, purpose: purpose, kind: kind, possession: val('possession') };
    }
    var CONDS = {
      hasCat: function (s) { return !!s.cat; }, res: function (s) { return s.cat === 'Residential'; }, plot: function (s) { return s.cat === 'Plot'; },
      notPlot: function (s) { return s.cat !== 'Plot'; }, rent: function (s) { return s.purpose === 'rent'; }, sale: function (s) { return s.purpose !== 'rent'; },
      project: function (s) { return s.kind === 'project'; }, uc: function (s) { return s.cat !== 'Plot' && s.possession === 'Under construction' && s.kind !== 'project'; },
      readySale: function (s) { return s.cat !== 'Plot' && s.purpose === 'sale' && s.possession === 'Ready to move' && s.kind !== 'project'; }
    };
    function refresh() {
      var s = state();
      $$('[data-show]', form).forEach(function (d) { d.hidden = !CONDS[d.dataset.show](s); });
      $$('input,select,textarea', form).forEach(function (x) { if (x.type !== 'file') x.disabled = !!x.closest('[data-show][hidden]'); });
      var tbox = $('[data-types]', form);
      if (s.cat && tbox.dataset.cat !== s.cat) {
        var cur = val('propertyType');
        tbox.innerHTML = chipRadios('propertyType', TYPES[s.cat]);
        tbox.dataset.cat = s.cat;
        if (cur) setVal('propertyType', cur);
      }
      $('[data-area-label]', form).textContent = s.cat === 'Plot' ? 'Plot area' : (s.cat === 'Commercial' ? 'Carpet / built-up area' : 'Carpet area');
      $$('[data-money]', form).forEach(function (m) { var n = Number(String(m.value).replace(/[^\d]/g, '')); var w = $('[data-words="' + m.name + '"]', form); if (w) w.textContent = n ? ST.inr(n) + (m.name === 'rent' || m.name === 'maintenance' ? ' per month' : '') : ''; });
    }
    form.addEventListener('change', function (e) {
      if (e.target.name === 'bhkChip' && form.elements.bhk && !form.elements.bhk.value) form.elements.bhk.value = e.target.value;
      refresh(); save();
    });
    form.addEventListener('input', function (e) {
      if (e.target.hasAttribute && e.target.hasAttribute('data-money')) {
        var n = Number(String(e.target.value).replace(/[^\d]/g, '')), w = $('[data-words="' + e.target.name + '"]', e.target.closest('.field'));
        if (w) w.textContent = n ? ST.inr(n) + (e.target.name === 'rent' || e.target.name === 'maintenance' ? ' per month' : '') : '';
      }
    });
    form.addEventListener('input', ST.debounce(function () { refresh(); save(); }, 250));

    // photos
    var grid = $('.photo-grid', form);
    function renderPhotos() {
      grid.innerHTML = photos.map(function (p, i) {
        var src = p.data || ST.photoUrl(p.id, 400);
        return '<figure class="ph' + (i === 0 ? ' cover' : '') + '"><img src="' + esc(src) + '" alt="Photo ' + (i + 1) + '">' +
          (i === 0 ? '<figcaption>Cover</figcaption>' : '<button type="button" class="ph-cover" data-cover="' + i + '">Make cover</button>') +
          '<button type="button" class="ph-x" data-rm="' + i + '" aria-label="Remove photo ' + (i + 1) + '">' + icon('x') + '</button></figure>';
      }).join('');
      $('.photo-add', form).hidden = photos.length >= 10;
    }
    grid.addEventListener('click', function (e) {
      var rm = e.target.closest('[data-rm]'), cv = e.target.closest('[data-cover]');
      if (rm) { photos.splice(+rm.dataset.rm, 1); renderPhotos(); }
      if (cv) { var p = photos.splice(+cv.dataset.cover, 1)[0]; photos.unshift(p); renderPhotos(); }
    });
    $('.photo-add input', form).addEventListener('change', function () {
      var files = Array.prototype.slice.call(this.files || []).slice(0, 10 - photos.length);
      var inputEl = this;
      var add = $('.photo-add span', form); add.textContent = 'Preparing…';
      files.reduce(function (p, f) {
        return p.then(function () { return ST.compressImage(f).then(function (data) { photos.push({ data: data }); renderPhotos(); }).catch(function (err) { ST.toast(err.message, 'error'); }); });
      }, Promise.resolve()).then(function () { add.textContent = 'Add photos'; inputEl.value = ''; });
    });
    var addUrl = $('[data-add-url]', form);
    if (addUrl) addUrl.addEventListener('click', function () {
      var i = $('[data-photo-url]', form), u = i.value.trim();
      if (!/^https:\/\/\S+$/i.test(u)) return ST.toast('Paste a full https:// image link.', 'error');
      photos.push({ id: u }); i.value = ''; renderPhotos();
    });

    // draft autosave (owner form only)
    var DKEY = 'st_draft';
    function save() { if (admin || opts.editId) return; try { var d = collect(true); ST.store.setJson(DKEY, d); } catch (e) {} }

    function collect(raw) {
      var d = ST.formData(form);
      var s = state();
      var out = {};
      ['purpose', 'category', 'propertyType', 'ownerRole', 'projectName', 'builderName', 'configurations', 'reraNumber', 'carpetArea', 'areaUnit',
        'floor', 'totalFloors', 'bathrooms', 'balconies', 'parking', 'furnishing', 'facing', 'plotType', 'possession', 'ageOfProperty', 'rent', 'deposit',
        'maintenance', 'availableFrom', 'price', 'priceMax', 'priceNote', 'description', 'highlights', 'title', 'videoUrl', 'phoneMode', 'contactPhone',
        'kind', 'segment', 'status', 'tag', 'adminNotes', 'bhk'].forEach(function (k) { if (d[k] !== undefined) out[k] = Array.isArray(d[k]) ? d[k].join(', ') : d[k]; });
      ['rent', 'deposit', 'maintenance', 'price', 'priceMax'].forEach(function (k) { if (out[k] !== undefined) out[k] = String(out[k]).replace(/[^\d]/g, ''); });
      if (s.possession === 'Under construction' && d.possessionDate2 && !d.possessionDate) out.possessionDate = d.possessionDate2;
      if (d.possessionDate) out.possessionDate = d.possessionDate;
      if (!admin) out.kind = s.kind;
      if (s.cat === 'Residential' && !out.bhk) out.bhk = d.bhkChip || '';
      if (s.cat !== 'Residential') out.bhk = admin ? (out.bhk || '') : '';
      out.amenities = (d.amenities || []).join(', ');
      out.tenantPreference = (d.tenantPreference || []).join(', ');
      out.negotiable = d.negotiable ? 'Yes' : 'No';
      if (admin) out.featured = d.featured ? 'Yes' : 'No';
      Object.assign(out, loc.get());
      if (!raw) out.photos = photos.filter(function (p) { return p.id; }).map(function (p) { return p.id; });
      return out;
    }
    function fill(l) {
      l = l || {};
      ['purpose', 'category'].forEach(function (k) { setVal(k, l[k]); });
      refresh();
      Object.keys(l).forEach(function (k) {
        if (['photos', 'state', 'city', 'district', 'locality', 'landmark', 'pincode', 'lat', 'lng', 'amenities', 'tenantPreference', 'possessionDate'].indexOf(k) >= 0) return;
        setVal(k, l[k]);
      });
      if (l.bhk) setVal('bhkChip', String(l.bhk).split(',')[0]);
      setVal('amenities', String(l.amenities || '').split(/\s*,\s*/));
      setVal('tenantPreference', String(l.tenantPreference || '').split(/\s*,\s*/));
      if (l.possessionDate) { setVal('possessionDate', l.possessionDate); setVal('possessionDate2', l.possessionDate); }
      setVal('negotiable', l.negotiable === 'Yes');
      if (admin) setVal('featured', l.featured === 'Yes');
      loc.set({ state: l.state || 'Maharashtra', city: l.city, locality: l.locality, landmark: l.landmark, pincode: l.pincode, lat: l.lat, lng: l.lng });
      photos = (l.photos || []).map(function (id) { return typeof id === 'string' ? { id: id } : id; });
      renderPhotos();
      refresh();
    }

    function stepErrors(step) {
      var s = state(), d = ST.formData(form);
      if (step === 1) {
        if (!s.purpose) return 'Choose whether you want to sell or rent out.';
        if (!s.cat) return 'Choose a property category.';
        if (!val('propertyType')) return 'Choose the property type.';
        if (!admin && !val('ownerRole')) return 'Tell us if you are the owner, builder or agent.';
      }
      if (step === 2) return loc.validate();
      if (step === 3) {
        if (s.cat === 'Residential' && !d.bhkChip && !(admin && d.bhk) && s.kind !== 'project') return 'Choose the size (BHK).';
        if (!d.carpetArea) return 'Enter the area.';
        if (s.purpose === 'rent' && !String(d.rent).replace(/\D/g, '')) return 'Enter the monthly rent.';
        if (s.purpose !== 'rent' && !String(d.price).replace(/\D/g, '')) return 'Enter the expected price.';
      }
      if (step === 4) {
        if (!admin && photos.length === 0) return 'Add at least one photo — listings without photos get very few enquiries.';
        if (!admin && (d.description || '').length < 30) return 'Write a short description (at least 30 characters).';
      }
      if (step === 5) {
        if (!d.phoneMode) return 'Choose who can see your phone number.';
        if (d.contactPhone && !ST.normPhone(d.contactPhone)) return 'Enter a valid 10-digit phone number or leave it empty.';
        if (!d.confirm) return 'Please confirm the details are correct.';
      }
      return '';
    }

    function uploadPending(onProgress) {
      var todo = photos.filter(function (p) { return !p.id; });
      var done = 0;
      return todo.reduce(function (pr, p) {
        return pr.then(function () {
          if (onProgress) onProgress(done + 1, todo.length);
          return ST.api('uploadPhoto', Object.assign({ data: p.data, mime: 'image/jpeg' }, admin ? { adminToken: ST.Admin.token() } : {})).then(function (r) { p.id = r.id; done++; });
        });
      }, Promise.resolve());
    }

    // initial state
    if (opts.listing) fill(opts.listing);
    else if (!admin) {
      var draft = ST.store.json(DKEY, null);
      if (draft && draft.category) { fill(draft); if (opts.onDraft) opts.onDraft(); }
      else { setVal('ownerRole', 'Owner'); setVal('phoneMode', 'approval'); }
    } else { setVal('status', 'Approved'); setVal('kind', 'property'); }
    if (!admin && !val('phoneMode')) setVal('phoneMode', 'approval');
    var u = ST.Auth.user();
    if (!admin && u && !val('contactPhone')) setVal('contactPhone', u.phone);
    refresh();
    renderPhotos();

    return {
      form: form, collect: collect, fill: fill, stepErrors: stepErrors, refresh: refresh, uploadPending: uploadPending,
      photos: function () { return photos; }, clearDraft: function () { ST.store.del(DKEY); }, location: loc
    };
  }
  window.ListingForm = { mount: mount, TYPES: TYPES };
})();
