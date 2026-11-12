/* Stand Tall Realty: Cloudflare Worker in front of the static website (./site).

   It runs only for the paths listed in wrangler.jsonc ("run_worker_first"):
   - /x.html               -> 301 to /x. Cloudflare would answer 307; a 301 tells Google the clean URL is the real one.
   - /property?id=ST1234   -> the static page with that listing's title, description, canonical URL, structured
                              data and text already in the HTML, so Google can read it without running JavaScript.
   - /property-in-*        -> the area page with links to that area's live listings.
   - /sitemap.xml          -> static pages, area pages and every live listing.
   Listing data comes from the Google Apps Script API (the same one the website uses) and is cached for 15 minutes.
   If the API is slow or down, visitors still get the normal page. */

const SITE = 'https://www.standtallrealty.com';
const BRAND = 'Stand Tall Realty';
const TTL = 900;            // seconds to keep API answers in the edge cache
const TIMEOUT = 8000;       // ms to wait for Apps Script
const SSR_MARK = '<!--area-ssr--><div class="skeleton" style="min-height:280px;grid-column:1/-1"></div>';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    try {
      if (path.endsWith('.html')) return cleanUrl(request, env, url);
      if (path === '/property') return await propertyPage(request, env, ctx, url);
      if (path === '/sitemap.xml') return await sitemap(env, ctx, url);
      if (path.startsWith('/property-in-')) return await areaPage(request, env, ctx, url);
    } catch (err) {
      console.log('worker error', path, err && err.stack || err);
    }
    return env.ASSETS.fetch(request);
  }
};

// ------------------------------------------------------------------ /x.html -> /x
function cleanUrl(request, env, url) {
  if (url.pathname === '/404.html') return env.ASSETS.fetch(request);
  let clean = url.pathname.slice(0, -5);
  if (clean === '/index' || clean.endsWith('/index')) clean = clean.slice(0, -5) || '/';
  return Response.redirect(url.origin + clean + url.search, 301);
}

// ------------------------------------------------------------------ helpers
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function unesc(s) {
  return String(s).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}
function trimNum(x) { return String(Math.round(x * 100) / 100); }
function inr(n) {
  n = Number(n || 0); if (!n) return '';
  if (n >= 1e7) return '₹' + trimNum(n / 1e7) + ' Cr';
  if (n >= 1e5) return '₹' + trimNum(n / 1e5) + ' L';
  return '₹' + n.toLocaleString('en-IN');
}
function rupees(n) { n = Number(n || 0); return n ? '₹' + n.toLocaleString('en-IN') : ''; }
function priceLabel(l) {
  if (l.purpose === 'rent') return l.rent ? rupees(l.rent) + '/month' : 'Rent on request';
  if (!l.price) return 'Price on request';
  if (l.kind === 'project') return inr(l.price) + (l.priceMax && l.priceMax > l.price ? ' – ' + inr(l.priceMax) : ' onwards');
  return inr(l.price);
}
function bhkLabel(l) {
  if (l.configurations) return String(l.configurations);
  const b = String(l.bhk || '');
  if (!b) return '';
  return /rk/i.test(b) ? b.toUpperCase() : b.split(',').join(', ') + ' BHK';
}
function areaLabel(l) { return l.carpetArea ? Number(l.carpetArea).toLocaleString('en-IN') + ' ' + (l.areaUnit || 'sq ft') + (l.kind === 'project' ? ' onwards' : '') : ''; }
function placeLabel(l) { return [l.locality, l.city].filter(Boolean).join(', '); }
function photoUrl(id, w) {
  id = String(id || '');
  if (/^https?:\/\//i.test(id)) return id;
  return id ? 'https://lh3.googleusercontent.com/d/' + encodeURIComponent(id) + '=w' + (w || 1200) : '';
}
function iso(ms) { const d = new Date(Number(ms) || 0); return isNaN(d) || !Number(ms) ? '' : d.toISOString(); }
function listingUrl(id) { return SITE + '/property?id=' + encodeURIComponent(id); }

let AREAS = null;     // [{slug, name, url, match}]
async function areas(env, url) {
  if (AREAS) return AREAS;
  try { AREAS = await (await env.ASSETS.fetch(new Request(new URL('/assets/areas.json', url)))).json(); } catch (e) { AREAS = []; }
  return AREAS;
}
function areaFor(list, locality) {
  const loc = String(locality || '').toLowerCase();
  return list.find(a => a.match.some(m => loc.indexOf(m.toLowerCase()) >= 0)) || null;
}

let API_URL = null;   // read from the website's config.js so there is one place to change it
async function apiUrl(env, url) {
  if (API_URL !== null) return API_URL;
  try {
    const t = await (await env.ASSETS.fetch(new Request(new URL('/assets/js/config.js', url)))).text();
    const m = t.match(/API_URL:\s*'([^']*)'/);
    API_URL = m ? m[1].trim() : '';
  } catch (e) { API_URL = ''; }
  return API_URL;
}

/** Calls the Apps Script API; answers are kept in the edge cache for TTL seconds. Returns {ok, data, code}. */
async function api(env, ctx, url, action, payload, key) {
  const endpoint = await apiUrl(env, url);
  if (!endpoint) throw new Error('no API_URL');
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const cacheKey = new Request(SITE + '/__worker_cache/' + key);
  if (cache) {
    const hit = await cache.match(cacheKey);
    if (hit) return hit.json();
  }
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT);
  let body;
  try {
    const r = await fetch(endpoint, {
      method: 'POST', redirect: 'follow', signal: ac.signal,
      headers: { 'content-type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({ action: action, noCount: true }, payload || {}))
    });
    body = await r.json();
  } finally { clearTimeout(timer); }
  const out = body && body.ok ? { ok: true, data: body.data } : { ok: false, code: (body && body.code) || 'ERROR' };
  // keep good answers and "not found" answers; retry other errors on the next request
  if (cache && (out.ok || out.code === 'NOT_FOUND' || out.code === 'GONE')) {
    // a listing that is "not found" may be approved any minute, so that answer is kept only briefly
    const ttl = out.ok ? TTL : 60;
    const res = new Response(JSON.stringify(out), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=' + ttl } });
    const put = cache.put(cacheKey, res);
    if (ctx && ctx.waitUntil) ctx.waitUntil(put); else await put;
  }
  return out;
}

// Fresh headers (the same security headers as site/_headers, which Cloudflare does not add to Worker responses)
function htmlResponse(html, status) {
  return new Response(html, {
    status: status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'x-frame-options': 'SAMEORIGIN',
      'permissions-policy': 'geolocation=(self), camera=(), microphone=()'
    }
  });
}
function setMeta(html, attr, name, value) {
  const re = new RegExp('<meta ' + attr + '="' + name + '" content="[^"]*">');
  const tag = '<meta ' + attr + '="' + name + '" content="' + esc(value) + '">';
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', tag + '\n</head>');
}

// ------------------------------------------------------------------ /property?id=...
async function propertyPage(request, env, ctx, url) {
  const tpl = await env.ASSETS.fetch(new Request(new URL('/property', url)));
  const id = String(url.searchParams.get('id') || '').trim().toUpperCase();
  if (tpl.status !== 200 || !/^ST\d{3,}$/.test(id)) return tpl;
  let html = await tpl.text();
  let res;
  try { res = await api(env, ctx, url, 'listing', { id: id }, 'listing/' + id); }
  catch (e) { return htmlResponse(html, 200); }   // API down: normal page, the browser loads the listing
  if (!res.ok) {
    if (res.code === 'NOT_FOUND' || res.code === 'GONE') {
      return htmlResponse(html.replace('</head>', '<meta name="robots" content="noindex">\n</head>'), 404);
    }
    return htmlResponse(html, 200);
  }
  const L = res.data || {};
  const price = priceLabel(L);
  const place = placeLabel(L);
  const canon = listingUrl(L.id || id);
  const title = L.title + ' – ' + price + ' | ' + BRAND;
  const facts = [bhkLabel(L), areaLabel(L), L.furnishing, L.possession && (L.possession + (L.possessionDate ? ', ' + L.possessionDate : ''))].filter(Boolean);
  const desc = (price + ' – ' + L.title + ' in ' + place + '. ' + (facts.length ? facts.join(' · ') + '. ' : '') + String(L.description || '').replace(/\s+/g, ' ')).slice(0, 158).trim();
  const photos = (L.photos || []).map(p => photoUrl(p, 1200)).filter(Boolean);
  const all = await areas(env, url);
  const area = areaFor(all, L.locality);

  html = html.replace(/<title>[^<]*<\/title>/, '<title>' + esc(title) + '</title>');
  html = setMeta(html, 'name', 'description', desc);
  html = setMeta(html, 'property', 'og:title', title);
  html = setMeta(html, 'property', 'og:description', desc);
  html = setMeta(html, 'property', 'og:url', canon);
  if (photos[0]) html = setMeta(html, 'property', 'og:image', photos[0]);
  const crumbs = [{ name: 'Home', item: SITE + '/' }];
  if (area) crumbs.push({ name: area.name, item: SITE + '/' + area.url });
  crumbs.push({ name: L.title, item: canon });
  const ld = [
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.item })) },
    {
      '@context': 'https://schema.org', '@type': 'RealEstateListing', name: L.title, url: canon, description: desc,
      datePosted: iso(L.createdAt) || undefined, image: photos.length ? photos.slice(0, 6) : undefined,
      offers: (L.purpose === 'rent' ? L.rent : L.price) ? { '@type': 'Offer', price: Number(L.purpose === 'rent' ? L.rent : L.price), priceCurrency: 'INR', businessFunction: L.purpose === 'rent' ? 'http://purl.org/goodrelations/v1#LeaseOut' : 'http://purl.org/goodrelations/v1#Sell' } : undefined,
      contentLocation: { '@type': 'Place', name: place, address: { '@type': 'PostalAddress', addressLocality: L.locality || undefined, addressRegion: L.state || 'Maharashtra', addressCountry: 'IN' } },
      provider: { '@type': 'RealEstateAgent', name: BRAND, url: SITE, telephone: '+91-9920079048' }
    }
  ];
  html = html.replace('</head>', '<link rel="canonical" href="' + esc(canon) + '">\n<script type="application/ld+json">' +
    JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>\n</head>');

  // readable content for crawlers; the page script replaces it with the full page for visitors
  const keyFacts = [['Configuration', bhkLabel(L)], ['Carpet area', areaLabel(L)], ['Possession', [L.possession, L.possessionDate].filter(Boolean).join(', ')],
    ['Furnishing', L.furnishing], ['Floor', L.floor ? L.floor + (L.totalFloors ? ' of ' + L.totalFloors : '') : ''], ['Parking', L.parking],
    ['MahaRERA no.', L.reraNumber], ['Listing ID', L.id]].filter(f => f[1]);
  const lines = s => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);
  const body =
    '<nav class="crumbs" aria-label="Breadcrumb" style="color:var(--muted)"><a href="/" style="color:var(--muted)">Home</a> / ' +
    (area ? '<a href="/' + area.url + '" style="color:var(--muted)">' + esc(area.name) + '</a> / ' : '') + esc(L.id) + '</nav>' +
    '<div class="pd-top"><div><h1>' + esc(L.title) + '</h1><p class="pd-loc">' + esc([L.landmark, place].filter(Boolean).join(', ')) + '</p></div></div>' +
    (photos[0] ? '<p><img src="' + esc(photoUrl(L.photos[0], 900)) + '" alt="' + esc(L.title) + '" width="900" height="560" style="border-radius:16px;width:100%;height:auto"></p>' : '') +
    '<p class="price-box"><span class="p">' + esc(price) + '</span></p>' +
    (keyFacts.length ? '<section class="pd-section"><h2>Key details</h2><dl class="facts">' + keyFacts.map(f => '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>').join('') + '</dl></section>' : '') +
    (lines(L.priceNote).length ? '<section class="pd-section"><h2>Price list</h2><ul>' + lines(L.priceNote).map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></section>' : '') +
    (lines(L.highlights).length ? '<section class="pd-section"><h2>Highlights</h2><ul>' + lines(L.highlights).map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></section>' : '') +
    (L.description ? '<section class="pd-section"><h2>About this property</h2><p class="desc">' + esc(L.description) + '</p></section>' : '') +
    (L.amenities ? '<section class="pd-section"><h2>Amenities</h2><p>' + esc(L.amenities) + '</p></section>' : '') +
    '<section class="pd-section"><h2>Talk to ' + BRAND + '</h2><p>Call or WhatsApp <a href="tel:+919920079048">+91 99200 79048</a> for a site visit, the brochure or the latest price.' +
    (area ? ' See more <a href="/' + area.url + '">property in ' + esc(area.name) + '</a>.' : '') + '</p></section>';
  html = html.replace('<div class="skeleton" style="min-height:420px"></div>', body);
  return htmlResponse(html, 200);
}

// ------------------------------------------------------------------ /property-in-<area>-pune
async function areaPage(request, env, ctx, url) {
  const res = await env.ASSETS.fetch(new Request(new URL(url.pathname, url)));
  if (res.status !== 200 || !/text\/html/.test(res.headers.get('content-type') || '')) return env.ASSETS.fetch(request);
  let html = await res.text();
  const m = html.match(/data-area-match="([^"]*)"/);
  if (!m || html.indexOf(SSR_MARK) < 0) return htmlResponse(html, 200);
  const match = unesc(m[1]).split('|').map(s => s.trim().toLowerCase()).filter(Boolean);
  let list = [];
  try {
    const r = await api(env, ctx, url, 'listings', {}, 'listings');
    if (r.ok && r.data && Array.isArray(r.data.listings)) list = r.data.listings;
  } catch (e) { /* show the page without the list */ }
  const mine = list.filter(l => match.some(x => String(l.locality || '').toLowerCase().indexOf(x) >= 0)).slice(0, 60);
  if (mine.length) {
    const items = mine.map(l => '<li><a href="/property?id=' + encodeURIComponent(l.id) + '">' + esc(l.title) + '</a> – ' + esc(priceLabel(l)) +
      (bhkLabel(l) ? ' · ' + esc(bhkLabel(l)) : '') + (l.locality ? ' · ' + esc(l.locality) : '') + '</li>').join('');
    html = html.replace(SSR_MARK, '<ul class="ssr-list">' + items + '</ul>');
  }
  return htmlResponse(html, 200);
}

// ------------------------------------------------------------------ /sitemap.xml
async function sitemap(env, ctx, url) {
  let statics = [];
  try { statics = await (await env.ASSETS.fetch(new Request(new URL('/assets/sitemap-static.json', url)))).json(); } catch (e) {}
  if (!Array.isArray(statics) || !statics.length) return env.ASSETS.fetch(new Request(new URL('/sitemap.xml', url)));
  let list = [];
  try {
    const r = await api(env, ctx, url, 'listings', {}, 'listings');
    if (r.ok && r.data && Array.isArray(r.data.listings)) list = r.data.listings;
  } catch (e) { /* static pages only */ }
  const entries = statics.map(u => ({ loc: SITE + '/' + u }))
    .concat(list.map(l => ({ loc: listingUrl(l.id), lastmod: iso(l.createdAt).slice(0, 10) })));
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    entries.map(x => '  <url><loc>' + esc(x.loc) + '</loc>' + (x.lastmod ? '<lastmod>' + x.lastmod + '</lastmod>' : '') + '</url>\n').join('') +
    '</urlset>\n';
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=900' } });
}
