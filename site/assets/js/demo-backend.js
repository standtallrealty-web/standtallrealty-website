/* DEMO MODE ONLY — runs the real backend code inside your browser so the site can be tried before the
   Google Sheet is connected. Not used once API_URL is set in config.js. Generated 202611122329. */
/*
 * Minimal Google Apps Script runtime emulator.
 * Used (1) by the automated tests in Node and (2) by the website's demo mode in the browser,
 * so the exact same Code.gs logic runs everywhere.
 */
(function (root) {
  'use strict';

  // ---------- bytes / utf8 / base64 / sha256 ----------
  function utf8(str) {
    if (typeof TextEncoder !== 'undefined') return Array.from(new TextEncoder().encode(String(str)));
    return unescape(encodeURIComponent(String(str))).split('').map(function (c) { return c.charCodeAt(0); });
  }
  function fromUtf8(bytes) {
    var u = Uint8Array.from(bytes.map(function (b) { return b & 255; }));
    if (typeof TextDecoder !== 'undefined') return new TextDecoder().decode(u);
    var s = ''; u.forEach(function (b) { s += String.fromCharCode(b); }); return decodeURIComponent(escape(s));
  }
  function toSigned(bytes) { return bytes.map(function (b) { b &= 255; return b > 127 ? b - 256 : b; }); }
  function toBytes(data) { return typeof data === 'string' ? utf8(data) : data.map(function (b) { return b & 255; }); }
  var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  function b64enc(bytes) {
    var out = '', i;
    for (i = 0; i + 2 < bytes.length; i += 3) {
      var n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
      out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + B64[n & 63];
    }
    var rem = bytes.length - i;
    if (rem === 1) { var n1 = bytes[i] << 16; out += B64[(n1 >> 18) & 63] + B64[(n1 >> 12) & 63] + '=='; }
    else if (rem === 2) { var n2 = (bytes[i] << 16) | (bytes[i + 1] << 8); out += B64[(n2 >> 18) & 63] + B64[(n2 >> 12) & 63] + B64[(n2 >> 6) & 63] + '='; }
    return out;
  }
  function b64dec(str) {
    str = String(str).replace(/-/g, '+').replace(/_/g, '/').replace(/[^A-Za-z0-9+/]/g, '');
    var out = [], buf = 0, bits = 0;
    for (var i = 0; i < str.length; i++) {
      buf = (buf << 6) | B64.indexOf(str[i]); bits += 6;
      if (bits >= 8) { bits -= 8; out.push((buf >> bits) & 255); }
    }
    return out;
  }
  var K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  function sha256(bytes) {
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var l = bytes.length, m = bytes.slice();
    m.push(0x80);
    while ((m.length % 64) !== 56) m.push(0);
    var bitLen = l * 8;
    for (var s = 7; s >= 0; s--) m.push(s >= 4 ? 0 : (bitLen >>> (8 * s)) & 255);
    var w = new Array(64);
    for (var off = 0; off < m.length; off += 64) {
      for (var t = 0; t < 16; t++) w[t] = (m[off + 4 * t] << 24) | (m[off + 4 * t + 1] << 16) | (m[off + 4 * t + 2] << 8) | m[off + 4 * t + 3];
      for (t = 16; t < 64; t++) {
        var x = w[t - 15], y = w[t - 2];
        var s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
        var s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (t = 0; t < 64; t++) {
        var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[t] + w[t]) | 0;
        var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        var mj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + mj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    var out = [];
    H.forEach(function (v) { out.push((v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255); });
    return out;
  }
  function hmac(keyBytes, msgBytes) {
    if (keyBytes.length > 64) keyBytes = sha256(keyBytes);
    var k = keyBytes.slice(); while (k.length < 64) k.push(0);
    var ipad = k.map(function (b) { return b ^ 0x36; }), opad = k.map(function (b) { return b ^ 0x5c; });
    return sha256(opad.concat(sha256(ipad.concat(msgBytes))));
  }
  function uuid() {
    var c = root.crypto || (typeof globalThis !== 'undefined' && globalThis.crypto);
    var r = new Array(16);
    if (c && c.getRandomValues) { var a = new Uint8Array(16); c.getRandomValues(a); r = Array.from(a); }
    else for (var i = 0; i < 16; i++) r[i] = Math.floor(Math.random() * 256);
    r[6] = (r[6] & 15) | 64; r[8] = (r[8] & 63) | 128;
    var h = r.map(function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }

  // ---------- serialisation with Date support ----------
  function enc(v) { return JSON.stringify(v, function (k, val) { return this[k] instanceof Date ? { $d: this[k].getTime() } : val; }); }
  function dec(s) { return JSON.parse(s, function (k, v) { return v && typeof v === 'object' && Object.keys(v).length === 1 && typeof v.$d === 'number' ? new Date(v.$d) : v; }); }

  function createGasRuntime(opts) {
    opts = opts || {};
    var persist = opts.persist || null; // {load: () => string|null, save: (string) => void}
    var state = null;
    if (persist) { try { var raw = persist.load(); if (raw) state = dec(raw); } catch (e) { state = null; } }
    if (!state) state = { spreadsheets: {}, props: {}, folders: {}, files: {}, active: null };
    var dirty = false;
    function save() { if (!persist) return; dirty = true; }
    function flush() { if (persist && dirty) { dirty = false; try { persist.save(enc(state)); } catch (e) { if (opts.onSaveError) opts.onSaveError(e); } } }

    // ---------- Spreadsheet model ----------
    function OutOfBounds() { return new Error('The coordinates of the range are outside the dimensions of the sheet.'); }
    function SheetObj(ssData, sd) { this._ss = ssData; this._d = sd; }
    function lastRowOf(sd) { for (var r = sd.data.length - 1; r >= 0; r--) { if (sd.data[r] && sd.data[r].some(function (v) { return v !== '' && v !== null && v !== undefined; })) return r + 1; } return 0; }
    function lastColOf(sd) { var m = 0; sd.data.forEach(function (row) { if (!row) return; for (var c = row.length - 1; c >= 0; c--) { if (row[c] !== '' && row[c] !== null && row[c] !== undefined) { m = Math.max(m, c + 1); break; } } }); return m; }
    SheetObj.prototype = {
      getName: function () { return this._d.name; },
      setName: function (n) { this._d.name = n; save(); return this; },
      getLastRow: function () { return lastRowOf(this._d); },
      getLastColumn: function () { return lastColOf(this._d); },
      getMaxRows: function () { return this._d.maxRows; },
      getMaxColumns: function () { return this._d.maxCols; },
      insertRowsAfter: function (after, n) { this._d.maxRows += n; var ins = []; for (var i = 0; i < n; i++) ins.push([]); this._d.data.splice(after, 0, ...ins); save(); return this; },
      insertColumnsAfter: function (after, n) { this._d.maxCols += n; save(); return this; },
      deleteRow: function (r) { this._d.data.splice(r - 1, 1); this._d.maxRows -= 1; save(); return this; },
      getRange: function (row, col, nr, nc) {
        nr = nr === undefined ? 1 : nr; nc = nc === undefined ? 1 : nc;
        if (row < 1 || col < 1 || nr < 1 || nc < 1 || row + nr - 1 > this._d.maxRows || col + nc - 1 > this._d.maxCols) throw OutOfBounds();
        return new RangeObj(this, row, col, nr, nc);
      },
      setFrozenRows: function () { return this; }, setColumnWidth: function () { return this; }, setColumnWidths: function () { return this; },
      autoResizeColumns: function () { return this; }, setConditionalFormatRules: function () { return this; }, getConditionalFormatRules: function () { return []; },
      setTabColor: function () { return this; }, hideColumns: function () { return this; }
    };
    function RangeObj(sheet, r, c, nr, nc) { this._s = sheet; this._r = r; this._c = c; this._nr = nr; this._nc = nc; }
    RangeObj.prototype = {
      getRow: function () { return this._r; }, getColumn: function () { return this._c; },
      getNumRows: function () { return this._nr; }, getNumColumns: function () { return this._nc; },
      getValues: function () {
        var d = this._s._d.data, out = [];
        for (var i = 0; i < this._nr; i++) {
          var row = d[this._r - 1 + i] || [], o = [];
          for (var j = 0; j < this._nc; j++) {
            var v = row[this._c - 1 + j];
            o.push(v === undefined || v === null ? '' : (v instanceof Date ? new Date(v.getTime()) : v));
          }
          out.push(o);
        }
        return out;
      },
      getValue: function () { return this.getValues()[0][0]; },
      setValues: function (vals) {
        if (!Array.isArray(vals) || vals.length !== this._nr || vals.some(function (r) { return !Array.isArray(r); })) throw new Error('The number of rows in the data does not match the number of rows in the range.');
        var self = this, sd = this._s._d;
        sd.fmt = sd.fmt || {};
        vals.forEach(function (row, i) {
          if (row.length !== self._nc) throw new Error('The number of columns in the data does not match the number of columns in the range.');
          var ri = self._r - 1 + i;
          while (sd.data.length <= ri) sd.data.push([]);
          var target = sd.data[ri];
          row.forEach(function (v, j) {
            var ci = self._c - 1 + j;
            var f = (sd.fmt[ri] || {})[ci] || '';
            if (typeof v === 'string' && f !== '@') {
              if (/^-?\d+(\.\d+)?$/.test(v.trim()) && v.trim().length < 16) v = Number(v);
            }
            if (typeof v === 'string' && v.charAt(0) === '=') throw new Error('MOCK: formula injection reached the sheet: ' + v);
            if (typeof v === 'number' && f === '@') v = String(v);
            while (target.length < ci) target.push('');
            target[ci] = v;
          });
        });
        save();
        return this;
      },
      setValue: function (v) { return this.setValues([[v]]); },
      setNumberFormat: function (f) { var a = []; for (var i = 0; i < this._nr; i++) { var r = []; for (var j = 0; j < this._nc; j++) r.push(f); a.push(r); } return this.setNumberFormats(a); },
      setNumberFormats: function (fmts) {
        var sd = this._s._d, self = this; sd.fmt = sd.fmt || {};
        fmts.forEach(function (row, i) { var ri = self._r - 1 + i; sd.fmt[ri] = sd.fmt[ri] || {}; row.forEach(function (f, j) { sd.fmt[ri][self._c - 1 + j] = f; }); });
        return this;
      },
      clearContent: function () { var e = []; for (var i = 0; i < this._nr; i++) { var r = []; for (var j = 0; j < this._nc; j++) r.push(''); e.push(r); } return this.setValues(e); },
      setFontWeight: function () { return this; }, setBackground: function () { return this; }, setFontColor: function () { return this; },
      setFontSize: function () { return this; }, setWrap: function () { return this; }, setHorizontalAlignment: function () { return this; },
      setDataValidation: function () { return this; },
      createTextFinder: function (text) {
        var range = this, entire = false, mcase = false, pos = -1;
        var finder = {
          matchEntireCell: function (b) { entire = !!b; return finder; },
          matchCase: function (b) { mcase = !!b; return finder; },
          _all: function () {
            var vals = range.getValues(), hits = [];
            var needle = mcase ? String(text) : String(text).toLowerCase();
            for (var i = 0; i < vals.length; i++) for (var j = 0; j < vals[i].length; j++) {
              var v = vals[i][j]; var sv = v instanceof Date ? String(v) : String(v);
              if (!mcase) sv = sv.toLowerCase();
              if (entire ? sv === needle : sv.indexOf(needle) >= 0) hits.push(new RangeObj(range._s, range._r + i, range._c + j, 1, 1));
            }
            return hits;
          },
          findAll: function () { return finder._all(); },
          findNext: function () { var a = finder._all(); pos++; return a[pos] || null; }
        };
        return finder;
      }
    };
    function SpreadsheetObj(sd) { this._d = sd; }
    SpreadsheetObj.prototype = {
      getId: function () { return this._d.id; },
      getName: function () { return this._d.name; },
      getUrl: function () { return 'https://docs.google.com/spreadsheets/d/' + this._d.id + '/edit'; },
      getSheets: function () { var self = this; return this._d.sheets.map(function (s) { return new SheetObj(self._d, s); }); },
      getSheetByName: function (n) { var s = this._d.sheets.filter(function (x) { return x.name === n; })[0]; return s ? new SheetObj(this._d, s) : null; },
      insertSheet: function (n) {
        if (this.getSheetByName(n)) throw new Error('A sheet with the name "' + n + '" already exists.');
        var sd = { name: n, data: [], maxRows: 1000, maxCols: 26, fmt: {} }; this._d.sheets.push(sd); save(); return new SheetObj(this._d, sd);
      },
      deleteSheet: function (sh) { this._d.sheets = this._d.sheets.filter(function (s) { return s !== sh._d; }); save(); }
    };
    function newSS(name) {
      var id = 'mock-' + uuid().replace(/-/g, '').slice(0, 20);
      state.spreadsheets[id] = { id: id, name: name, sheets: [{ name: 'Sheet1', data: [], maxRows: 1000, maxCols: 26, fmt: {} }] };
      save();
      return new SpreadsheetObj(state.spreadsheets[id]);
    }
    if (opts.bound && !state.active) { state.active = newSS('Bound sheet').getId(); }
    function builder() { var b = {}; ['requireValueInList', 'setAllowInvalid', 'whenTextEqualTo', 'setBackground', 'setFontColor', 'setRanges', 'setHelpText'].forEach(function (m) { b[m] = function () { return b; }; }); b.build = function () { return {}; }; return b; }
    var SpreadsheetApp = {
      getActiveSpreadsheet: function () { return state.active && state.spreadsheets[state.active] ? new SpreadsheetObj(state.spreadsheets[state.active]) : null; },
      openById: function (id) { if (!state.spreadsheets[id]) throw new Error('Spreadsheet not found'); return new SpreadsheetObj(state.spreadsheets[id]); },
      create: function (name) { return newSS(name); },
      newDataValidation: builder, newConditionalFormatRule: builder, flush: function () {}
    };

    // ---------- Cache / Properties / Lock ----------
    var cacheStore = {};
    var Cache = {
      get: function (k) { var e = cacheStore[k]; if (!e) return null; if (e.x < Date.now()) { delete cacheStore[k]; return null; } return e.v; },
      put: function (k, v, ttl) {
        v = String(v); if (v.length > 100000) throw new Error('Argument too large: value');
        cacheStore[k] = { v: v, x: Date.now() + 1000 * Math.min(ttl || 600, 21600) };
      },
      getAll: function (keys) { var o = {}; keys.forEach(function (k) { var v = Cache.get(k); if (v !== null) o[k] = v; }); return o; },
      putAll: function (obj, ttl) { Object.keys(obj).forEach(function (k) { Cache.put(k, obj[k], ttl); }); },
      remove: function (k) { delete cacheStore[k]; }, removeAll: function (keys) { keys.forEach(function (k) { delete cacheStore[k]; }); }
    };
    var CacheService = { getScriptCache: function () { return Cache; }, getUserCache: function () { return Cache; } };
    var Props = {
      getProperty: function (k) { return Object.prototype.hasOwnProperty.call(state.props, k) ? state.props[k] : null; },
      setProperty: function (k, v) { state.props[k] = String(v); save(); return Props; },
      deleteProperty: function (k) { delete state.props[k]; save(); return Props; },
      getProperties: function () { return Object.assign({}, state.props); }
    };
    var PropertiesService = { getScriptProperties: function () { return Props; } };
    var lockHeld = false;
    var LockService = {
      getScriptLock: function () {
        return {
          waitLock: function () { lockHeld = true; }, tryLock: function () { lockHeld = true; return true; },
          releaseLock: function () { lockHeld = false; }, hasLock: function () { return lockHeld; }
        };
      }
    };

    // ---------- Utilities ----------
    function Blob(bytes, type, name) { this._b = bytes; this._t = type || 'application/octet-stream'; this._n = name || ''; }
    Blob.prototype = {
      getBytes: function () { return toSigned(this._b); }, getDataAsString: function () { return fromUtf8(this._b); },
      getContentType: function () { return this._t; }, getName: function () { return this._n; }, setName: function (n) { this._n = n; return this; }
    };
    var Utilities = {
      DigestAlgorithm: { SHA_256: 'SHA_256' }, Charset: { UTF_8: 'UTF_8' },
      getUuid: uuid,
      computeDigest: function (alg, value) { if (alg !== 'SHA_256') throw new Error('Only SHA_256 in mock'); return toSigned(sha256(toBytes(value))); },
      computeHmacSha256Signature: function (value, key) { return toSigned(hmac(toBytes(key), toBytes(value))); },
      base64Encode: function (d) { return b64enc(toBytes(d)); },
      base64EncodeWebSafe: function (d) { return b64enc(toBytes(d)).replace(/\+/g, '-').replace(/\//g, '_'); },
      base64Decode: function (s) { return toSigned(b64dec(s)); },
      base64DecodeWebSafe: function (s) { return toSigned(b64dec(s)); },
      newBlob: function (data, type, name) { return new Blob(typeof data === 'string' ? utf8(data) : data.map(function (b) { return b & 255; }), type, name); },
      sleep: function () {},
      // subset of Java SimpleDateFormat used by Code.gs (yyyy MMM MM dd d EEE HH h mm a); Asia/Kolkata = UTC+5:30
      formatDate: function (date, tz, fmt) {
        var off = /Kolkata|Calcutta|IST|\+05:?30/.test(String(tz)) ? 330 : 0;
        var d = new Date(new Date(date).getTime() + off * 60000);
        var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        var p2 = function (n) { return ('0' + n).slice(-2); }, h = d.getUTCHours();
        return String(fmt).replace(/yyyy|MMM|MM|dd|d|EEE|HH|h|mm|a/g, function (t) {
          return { yyyy: d.getUTCFullYear(), MMM: MON[d.getUTCMonth()], MM: p2(d.getUTCMonth() + 1), dd: p2(d.getUTCDate()), d: d.getUTCDate(),
            EEE: DAY[d.getUTCDay()], HH: p2(h), h: (h % 12) || 12, mm: p2(d.getUTCMinutes()), a: h < 12 ? 'AM' : 'PM' }[t];
        });
      }
    };

    // ---------- Drive ----------
    function FileObj(fd) { this._d = fd; }
    FileObj.prototype = {
      getId: function () { return this._d.id; }, getName: function () { return this._d.name; }, getMimeType: function () { return this._d.mime; },
      getUrl: function () { return 'https://drive.google.com/file/d/' + this._d.id + '/view'; },
      setSharing: function (a, p) { this._d.sharing = a + ':' + p; save(); return this; },
      setTrashed: function (t) { this._d.trashed = !!t; save(); return this; }
    };
    function FolderObj(fd) { this._d = fd; }
    FolderObj.prototype = {
      getId: function () { return this._d.id; }, getName: function () { return this._d.name; },
      createFile: function (blob) {
        var id = 'mockfile' + uuid().replace(/-/g, '').slice(0, 18);
        state.files[id] = { id: id, name: blob.getName(), mime: blob.getContentType(), data: b64enc(blob._b), folder: this._d.id, trashed: false, sharing: '' };
        save();
        return new FileObj(state.files[id]);
      }
    };
    var DriveApp = {
      Access: { ANYONE_WITH_LINK: 'ANYONE_WITH_LINK', ANYONE: 'ANYONE', PRIVATE: 'PRIVATE' },
      Permission: { VIEW: 'VIEW', EDIT: 'EDIT' },
      createFolder: function (name) { var id = 'mockfolder' + uuid().replace(/-/g, '').slice(0, 12); state.folders[id] = { id: id, name: name }; save(); return new FolderObj(state.folders[id]); },
      getFolderById: function (id) { if (!state.folders[id]) throw new Error('No item with the given ID could be found.'); return new FolderObj(state.folders[id]); },
      getFileById: function (id) { if (!state.files[id]) throw new Error('No item with the given ID could be found.'); return new FileObj(state.files[id]); }
    };

    // ---------- Mail / Content / Session / Logger ----------
    var mails = [];
    var MailApp = {
      sendEmail: function (a, b, c) { mails.push(typeof a === 'object' ? a : { to: a, subject: b, body: c }); },
      getRemainingDailyQuota: function () { return 100; }
    };
    var ContentService = {
      MimeType: { JSON: 'JSON', TEXT: 'TEXT' },
      createTextOutput: function (s) { var o = { _s: s, _m: 'TEXT', setMimeType: function (m) { o._m = m; return o; }, getContent: function () { return o._s; }, getMimeType: function () { return o._m; } }; return o; }
    };
    var Session = {
      getEffectiveUser: function () { return { getEmail: function () { return opts.email || 'owner@example.com'; } }; },
      getActiveUser: function () { return { getEmail: function () { return opts.email || 'owner@example.com'; } }; },
      getScriptTimeZone: function () { return 'Asia/Kolkata'; }
    };
    var Logger = { log: function () { if (opts.verbose) console.log.apply(console, arguments); } };

    // ---------- ScriptApp: time triggers are only recorded (tests call the handler themselves) ----------
    state.triggers = state.triggers || [];
    function TriggerObj(t) { this._t = t; }
    TriggerObj.prototype = { getHandlerFunction: function () { return this._t.fn; }, getUniqueId: function () { return this._t.id; } };
    var ScriptApp = {
      getProjectTriggers: function () { return state.triggers.map(function (t) { return new TriggerObj(t); }); },
      deleteTrigger: function (tr) { state.triggers = state.triggers.filter(function (t) { return t.id !== tr._t.id; }); save(); },
      newTrigger: function (fn) {
        var t = { fn: fn, id: uuid() };
        var b = { timeBased: function () { return b; }, everyMinutes: function (n) { t.everyMinutes = n; return b; },
          everyHours: function (n) { t.everyHours = n; return b; }, at: function (dt) { t.at = new Date(dt).getTime(); return b; },
          create: function () { state.triggers.push(t); save(); return new TriggerObj(t); } };
        return b;
      }
    };

    // ---------- UrlFetch: tests plug in a fake SMS provider (opts.fetch). The browser preview never calls it. ----------
    var fetches = [];
    function HTTPResponse(code, body) { this._c = code; this._b = typeof body === 'string' ? body : JSON.stringify(body); }
    HTTPResponse.prototype = { getResponseCode: function () { return this._c; }, getContentText: function () { return this._b; } };
    var UrlFetchApp = {
      fetch: function (url, params) {
        params = params || {};
        var req = { url: String(url), method: String(params.method || 'get').toLowerCase(), headers: params.headers || {},
          payload: params.payload, contentType: params.contentType, mute: !!params.muteHttpExceptions };
        fetches.push(req);
        if (!opts.fetch) throw new Error('Address unavailable: ' + url);
        var r = opts.fetch(req) || {};
        if (r.throws) throw new Error(r.throws);
        var res = new HTTPResponse(r.code || 200, r.body === undefined ? '' : r.body);
        if (res._c >= 400 && !params.muteHttpExceptions) throw new Error('Request failed for ' + url + ' returned code ' + res._c);
        return res;
      }
    };

    return {
      SpreadsheetApp: SpreadsheetApp, CacheService: CacheService, PropertiesService: PropertiesService, LockService: LockService,
      Utilities: Utilities, DriveApp: DriveApp, MailApp: MailApp, ContentService: ContentService, Session: Session, Logger: Logger,
      UrlFetchApp: UrlFetchApp, ScriptApp: ScriptApp, __fetches: fetches,
      __state: function () { return state; }, __mails: mails, __flush: flush,
      __file: function (id) { return state.files[id] || null; },
      __sha256hex: function (s) { return sha256(utf8(s)).map(function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); },
      __hmachex: function (k, s) { return hmac(utf8(k), utf8(s)).map(function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
    };
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { createGasRuntime: createGasRuntime };
  else root.createGasRuntime = createGasRuntime;
})(typeof self !== 'undefined' ? self : this);

(function () {
  var KEY = 'st_demo_db_v4';
  var rt = createGasRuntime({ bound: true, email: 'demo@standtallrealty.com', persist: {
    load: function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } },
    save: function (s) { try { localStorage.setItem(KEY, s); } catch (e) { /* storage full: keep in memory */ } } } });
  var SpreadsheetApp = rt.SpreadsheetApp, CacheService = rt.CacheService, PropertiesService = rt.PropertiesService, LockService = rt.LockService,
    Utilities = rt.Utilities, DriveApp = rt.DriveApp, MailApp = rt.MailApp, ContentService = rt.ContentService, Session = rt.Session, Logger = rt.Logger,
    UrlFetchApp = rt.UrlFetchApp, ScriptApp = rt.ScriptApp;
/**
 * ==========================================================================
 *  STAND TALL REALTY — Website backend (Google Apps Script)
 *  Everything is stored in the Google Sheet this script is attached to:
 *    Listings · Leads · Users · Chats · Messages · Activity
 * --------------------------------------------------------------------------
 *  ONE-TIME SETUP (full steps are in the guide):
 *   1. Type an admin password in ADMIN_PASSWORD below (it is remembered after setup).
 *   2. Select the function "setup" at the top and press ▶ Run. Allow access.
 *   3. Deploy → New deployment → Web app
 *        Execute as: Me      Who has access: Anyone      → Deploy
 *   4. Copy the Web app URL and paste it in  assets/js/config.js  (API_URL).
 *   5. Real OTP by SMS: paste your Fast2SMS API key in FAST2SMS_API_KEY below.
 *  After editing this code later: Deploy → Manage deployments → ✏️ →
 *  Version: "New version" → Deploy  (the URL stays the same).
 * ==========================================================================
 */

// ============================ SETTINGS ===================================
var ADMIN_PASSWORD     = 'demo1234';                    // admin panel password: type one between the quotes
var NOTIFY_EMAIL       = '';                    // new leads/listings go here. Blank = this Google account
var SITE_URL           = '';
var BRAND              = 'Stand Tall Realty';
var SHOW_PROJECT_NAMES = false;                 // false = society/project & builder names stay private
var SEED_STARTER_LISTINGS = true;               // adds your 5 earlier properties as "Pending" on first setup
var FIRM_PHONE         = '9920079048';         // shared when a buyer asks Stand Tall Realty for a number

// ---- Real OTP by SMS (guide, Step 7). Fill ONE provider, Save, then deploy a New version.
// ---- All empty = OTP off: forms and login still work, numbers are just not verified.
// ---- Passwords, keys and the email above are remembered after the first run, so a newer Code.gs with
// ---- empty quotes keeps using them. To remove a remembered value, type  off  between the quotes.
var FAST2SMS_API_KEY   = '';    // Fast2SMS → Dev API → "API Authorization Key"
var FAST2SMS_OTP_ID    = '';    // leave empty (only for Fast2SMS "Smart OTP" with your own DLT / WhatsApp template)
var MSGCENTRAL_CUSTOMER_ID = '';  // OR Message Central VerifyNow: Customer ID (looks like C-XXXXXXXXXXXXXXX)
var MSGCENTRAL_PASSWORD    = '';  //    and your Message Central login password
var OTP_DAILY_LIMIT    = 300;   // safety cap on OTP SMS per day (protects your SMS balance)
var OTP_ON_ENQUIRY     = true;  // true = enquiry forms ask the client to verify the number by OTP
// =========================================================================

var OTP_DEMO = true;   // website preview only (codes shown on screen). Never true on the live site.
var VERSION = 4;
var SEGMENTS = ['Under Construction', 'Ready to Move', 'Resale', 'Rental', 'Commercial', 'Plots'];
var LISTING_STATUSES = ['Pending', 'Approved', 'Rejected', 'Sold', 'Rented', 'Deleted'];
var LEAD_STATUSES = ['New', 'Contacted', 'Site visit', 'Negotiation', 'Closed', 'Not interested'];

var SCHEMA = {
  Listings: ['id', 'status', 'featured', 'tag', 'createdAt', 'updatedAt', 'approvedAt', 'source', 'kind', 'segment',
    'purpose', 'category', 'propertyType', 'title', 'projectName', 'builderName', 'bhk', 'configurations', 'carpetArea',
    'areaUnit', 'price', 'priceMax', 'priceNote', 'rent', 'deposit', 'maintenance', 'negotiable', 'furnishing', 'floor',
    'totalFloors', 'facing', 'parking', 'bathrooms', 'balconies', 'ageOfProperty', 'possession', 'possessionDate',
    'tenantPreference', 'availableFrom', 'plotType', 'reraNumber', 'amenities', 'highlights', 'description', 'state',
    'district', 'city', 'locality', 'landmark', 'address', 'pincode', 'lat', 'lng', 'photos', 'videoUrl', 'ownerId',
    'ownerName', 'ownerRole', 'contactPhone', 'phoneMode', 'views', 'chats', 'rejectReason', 'adminNotes'],
  Leads: ['id', 'createdAt', 'status', 'intent', 'name', 'phone', 'verified', 'email', 'details', 'message', 'listingId',
    'listingTitle', 'page', 'source', 'notes', 'userId', 'followUpAt', 'followUpNote', 'remindedAt'],
  Users: ['id', 'createdAt', 'name', 'phone', 'verified', 'email', 'status', 'lastLoginAt', 'passHash', 'salt'],
  Chats: ['id', 'createdAt', 'updatedAt', 'listingId', 'listingTitle', 'buyerId', 'buyerName', 'ownerId', 'ownerName',
    'lastMessage', 'lastSender', 'buyerUnread', 'ownerUnread', 'phoneStatus', 'log'],
  Messages: ['id', 'chatId', 'createdAt', 'senderRole', 'senderName', 'type', 'text'],
  Activity: ['createdAt', 'type', 'listingId', 'userId', 'detail']
};
var TIME_COLS = { createdAt: 1, updatedAt: 1, approvedAt: 1, lastLoginAt: 1, followUpAt: 1, remindedAt: 1 };
var MONEY_COLS = { price: 1, priceMax: 1, rent: 1, deposit: 1, maintenance: 1 };
var NUM_COLS = { carpetArea: 1, lat: 1, lng: 1, views: 1, chats: 1, buyerUnread: 1, ownerUnread: 1 };
var STATUS_COL = { Listings: ['status', LISTING_STATUSES], Leads: ['status', LEAD_STATUSES], Users: ['status', ['Active', 'Blocked']] };

var REQ = { memo: {} };

// ============================== ENTRY POINTS ==============================

/** Run this once from the editor (▶ Run) to create the sheets and allow access.
 *  It is the first function in the file so the editor picks it by default. */
function setup() {
  REQ = { memo: {} };
  ensureSetup_(true);
  rememberSettings_();
  var ss = ss_();
  if (!setting_('ADMIN_PASSWORD', ADMIN_PASSWORD)) Logger.log('⚠️ Type an admin password in ADMIN_PASSWORD (Code.gs settings), Save, and run setup again.');
  Logger.log(ensureFollowUpTrigger_() ? '✅ Follow-up email reminders are on (checked every minute).' : '⚠️ Could not switch on follow-up reminders. Run setup again and allow access.');
  Logger.log('✅ Setup complete. Sheet: ' + ss.getUrl());
  Logger.log('Next: Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).');
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === 'listings' || p.action === 'listing') return json_(route_({ action: p.action, id: p.id }));
  return json_({ ok: true, data: { service: BRAND + ' website API', status: 'running', time: new Date().toISOString() } });
}

function doPost(e) {
  var body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { body = {}; }
  return json_(route_(body));
}

/** When you edit the sheet by hand (e.g. change a Status), refresh the website quickly. */
function onEdit(e) {
  try { CacheService.getScriptCache().put('pub_ver', String(Date.now()), 21600); } catch (err) {}
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

var ACTIONS = {
  // public
  listings: { fn: apiListings_ },
  listing: { fn: apiListing_ },
  config: { fn: apiConfig_ },
  lead: { fn: apiLead_, write: true },
  verifyLead: { fn: apiVerifyLead_, write: true },
  sendOtp: { fn: apiSendOtp_, write: true },
  otpLogin: { fn: apiOtpLogin_, write: true },
  report: { fn: apiReport_, write: true },
  register: { fn: apiRegister_, write: true },
  login: { fn: apiLogin_, write: true },
  // signed-in users
  me: { fn: apiMe_, user: true },
  updateProfile: { fn: apiUpdateProfile_, user: true, write: true },
  changePassword: { fn: apiChangePassword_, user: true, write: true },
  uploadPhoto: { fn: apiUploadPhoto_ },
  submitListing: { fn: apiSubmitListing_, user: true, write: true },
  myListings: { fn: apiMyListings_, user: true },
  myListing: { fn: apiMyListing_, user: true },
  listingAction: { fn: apiListingAction_, user: true, write: true },
  revealPhone: { fn: apiRevealPhone_, user: true, write: true },
  startChat: { fn: apiStartChat_, user: true, write: true },
  chats: { fn: apiChats_, user: true },
  messages: { fn: apiMessages_, user: true },
  sendMessage: { fn: apiSendMessage_, user: true, write: true },
  requestPhone: { fn: apiRequestPhone_, user: true, write: true },
  respondPhone: { fn: apiRespondPhone_, user: true, write: true },
  sharePhone: { fn: apiSharePhone_, user: true, write: true },
  poll: { fn: apiPoll_, user: true },
  // admin
  adminLogin: { fn: apiAdminLogin_ },
  adminOverview: { fn: adminOverview_, admin: true },
  adminListings: { fn: adminListings_, admin: true },
  adminSetListing: { fn: adminSetListing_, admin: true, write: true },
  adminSaveListing: { fn: adminSaveListing_, admin: true, write: true },
  adminDeleteListing: { fn: adminDeleteListing_, admin: true, write: true },
  adminLeads: { fn: adminLeads_, admin: true },
  adminUpdateLead: { fn: adminUpdateLead_, admin: true, write: true },
  adminSaveLead: { fn: adminSaveLead_, admin: true, write: true },
  adminDeleteLeads: { fn: adminDeleteLeads_, admin: true, write: true },
  adminUsers: { fn: adminUsers_, admin: true },
  adminSetUser: { fn: adminSetUser_, admin: true, write: true },
  adminChats: { fn: adminChats_, admin: true },
  adminMessages: { fn: adminMessages_, admin: true, write: true },
  adminSend: { fn: adminSend_, admin: true, write: true }
};

function route_(body) {
  REQ = { memo: {}, now: new Date() };
  body = body || {};
  var lock = null;
  try {
    var spec = ACTIONS[String(body.action || '')];
    if (!spec) throw uerr_('Unknown request.', 'BAD_ACTION');
    ensureSetup_(false);
    var ctx = { uid: null, admin: false, user: null };
    if (body.token) {
      var t = verify_(body.token);
      if (t && t.r === 'u') ctx.uid = t.u;
    }
    if (body.adminToken) {
      var at = verify_(body.adminToken);
      if (at && at.r === 'a') ctx.admin = true;
    }
    if (spec.admin && !ctx.admin) throw uerr_('Please log in to the admin panel again.', 'ADMIN_REQUIRED');
    if (spec.write) {
      lock = LockService.getScriptLock();
      lock.waitLock(25000);
    }
    if (spec.user) ctx.user = requireUser_(ctx);
    var data = spec.fn(body, ctx);
    return { ok: true, data: data };
  } catch (e) {
    if (e && e.userMessage) return { ok: false, error: e.userMessage, code: e.code || 'ERROR' };
    return { ok: false, error: 'Something went wrong on our side. Please try again.', code: 'SERVER', debug: String((e && e.message) || e) };
  } finally {
    if (lock) { try { lock.releaseLock(); } catch (e2) {} }
  }
}

function uerr_(msg, code) { var e = new Error(msg); e.userMessage = msg; e.code = code || 'ERROR'; return e; }

/** A setting typed in Code.gs wins and is remembered; an empty one falls back to the remembered value. */
function setting_(key, typed) {
  REQ.cfg = REQ.cfg || {};
  if (Object.prototype.hasOwnProperty.call(REQ.cfg, key)) return REQ.cfg[key];
  var props = PropertiesService.getScriptProperties(), name = 'SET_' + key, saved = props.getProperty(name);
  var v = str_(typed).trim();
  if (v.toLowerCase() === 'off') { if (saved !== null) props.deleteProperty(name); v = ''; }
  else if (v) { if (saved !== v) props.setProperty(name, v); }
  else v = str_(saved).trim();
  REQ.cfg[key] = v;
  return v;
}
function rememberSettings_() {
  setting_('ADMIN_PASSWORD', ADMIN_PASSWORD); setting_('NOTIFY_EMAIL', NOTIFY_EMAIL); setting_('FAST2SMS_API_KEY', FAST2SMS_API_KEY);
  setting_('FAST2SMS_OTP_ID', FAST2SMS_OTP_ID); setting_('MSGCENTRAL_CUSTOMER_ID', MSGCENTRAL_CUSTOMER_ID); setting_('MSGCENTRAL_PASSWORD', MSGCENTRAL_PASSWORD);
}

// ============================== SHEET LAYER ==============================

function ss_() {
  if (REQ.ss) return REQ.ss;
  var props = PropertiesService.getScriptProperties();
  var ss = null;
  try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) { ss = null; }
  if (ss) {
    if (props.getProperty('SHEET_ID') !== ss.getId()) props.setProperty('SHEET_ID', ss.getId());
  } else {
    var id = props.getProperty('SHEET_ID');
    if (id) ss = SpreadsheetApp.openById(id);
    else {
      ss = SpreadsheetApp.create(BRAND + ' – Website Data');
      props.setProperty('SHEET_ID', ss.getId());
    }
  }
  REQ.ss = ss;
  return ss;
}

function ensureSetup_(force) {
  var props = PropertiesService.getScriptProperties();
  if (!force && props.getProperty('SETUP_VERSION') === String(VERSION)) return;
  var ss = ss_();
  var firstTime = !ss.getSheetByName('Listings');
  Object.keys(SCHEMA).forEach(function (name) { sheet_(name); });
  // remove the empty default tab if present
  var def = ss.getSheetByName('Sheet1');
  if (def && ss.getSheets().length > 1 && def.getLastRow() === 0) { try { ss.deleteSheet(def); } catch (e) {} }
  photoFolder_();
  secret_();
  if (firstTime && SEED_STARTER_LISTINGS && readAll_('Listings').rows.length === 0) seedStarterListings_();
  props.setProperty('SETUP_VERSION', String(VERSION));
}

function sheet_(name) {
  if (REQ.sheets && REQ.sheets[name]) return REQ.sheets[name];
  var ss = ss_();
  var sh = ss.getSheetByName(name);
  if (!sh) sh = createSheet_(ss, name);
  else ensureHeaders_(sh, name);
  REQ.sheets = REQ.sheets || {};
  REQ.sheets[name] = sh;
  return sh;
}

function createSheet_(ss, name) {
  var cols = SCHEMA[name];
  var sh = ss.insertSheet(name);
  if (sh.getMaxColumns() < cols.length) sh.insertColumnsAfter(sh.getMaxColumns(), cols.length - sh.getMaxColumns());
  sh.getRange(1, 1, 1, cols.length).setValues([cols])
    .setFontWeight('bold').setBackground('#13233C').setFontColor('#FFFFFF');
  sh.setFrozenRows(1);
  try {
    var st = STATUS_COL[name];
    if (st) {
      var col = cols.indexOf(st[0]) + 1;
      var rng = sh.getRange(2, col, sh.getMaxRows() - 1, 1);
      rng.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(st[1], true).setAllowInvalid(true).build());
      var colors = { Approved: '#DCF3E4', Pending: '#FFF1CC', Rejected: '#FBE0DC', New: '#FFF1CC', Contacted: '#E3ECFA', Closed: '#DCF3E4', Blocked: '#FBE0DC' };
      var rules = Object.keys(colors).map(function (k) {
        return SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(k).setBackground(colors[k]).setRanges([rng]).build();
      });
      sh.setConditionalFormatRules(rules);
    }
    if (name === 'Listings') {
      var fcol = cols.indexOf('featured') + 1;
      sh.getRange(2, fcol, sh.getMaxRows() - 1, 1).setDataValidation(
        SpreadsheetApp.newDataValidation().requireValueInList(['Yes', 'No'], true).setAllowInvalid(true).build());
    }
    sh.setColumnWidth(1, 90);
  } catch (e) { /* cosmetic only */ }
  return sh;
}

function ensureHeaders_(sh, name) {
  var cols = SCHEMA[name];
  var lc = Math.max(sh.getLastColumn(), 1);
  var head = sh.getRange(1, 1, 1, lc).getValues()[0].map(String);
  var missing = cols.filter(function (c) { return head.indexOf(c) === -1; });
  if (!missing.length) return;
  var start = sh.getLastColumn() + 1;
  var need = start + missing.length - 1;
  if (sh.getMaxColumns() < need) sh.insertColumnsAfter(sh.getMaxColumns(), need - sh.getMaxColumns());
  sh.getRange(1, start, 1, missing.length).setValues([missing]).setFontWeight('bold').setBackground('#13233C').setFontColor('#FFFFFF');
  if (REQ.heads) delete REQ.heads[name];
}

function header_(name) {
  REQ.heads = REQ.heads || {};
  if (REQ.heads[name]) return REQ.heads[name];
  var sh = sheet_(name);
  var lc = sh.getLastColumn();
  REQ.heads[name] = sh.getRange(1, 1, 1, lc).getValues()[0].map(String);
  return REQ.heads[name];
}

/** Chats without the (large) message log column. */
function chatsLite_() {
  var h = header_('Chats');
  var li = h.indexOf('log');
  return readAll_('Chats', li > 0 ? li : h.length);
}

/** Reads a whole tab as objects (memoised for this request). */
function readAll_(name, maxCol) {
  var key = name + (maxCol ? ':' + maxCol : '');
  if (REQ.memo[key]) return REQ.memo[key];
  var sh = sheet_(name);
  var head = header_(name);
  var lr = sh.getLastRow();
  var nc = maxCol ? Math.min(maxCol, head.length) : head.length;
  var vals = lr > 1 ? sh.getRange(2, 1, lr - 1, nc).getValues() : [];
  var rows = [];
  for (var i = 0; i < vals.length; i++) {
    var o = { _row: i + 2 };
    var empty = true;
    for (var j = 0; j < nc; j++) {
      if (head[j]) { o[head[j]] = vals[i][j]; if (vals[i][j] !== '' && vals[i][j] !== null) empty = false; }
    }
    if (!empty) rows.push(o);
  }
  REQ.memo[key] = { head: head, rows: rows };
  return REQ.memo[key];
}

function invalidate_(name) {
  Object.keys(REQ.memo).forEach(function (k) { if (k === name || k.indexOf(name + ':') === 0) delete REQ.memo[k]; });
}

function fmt_(col) {
  if (TIME_COLS[col]) return 'dd-mmm-yyyy hh:mm';
  if (MONEY_COLS[col]) return '#,##0';
  if (NUM_COLS[col]) return '0.######';
  return '@';
}

function cell_(col, v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v;
  if (TIME_COLS[col]) return v ? new Date(v) : '';
  if (MONEY_COLS[col] || NUM_COLS[col]) {
    if (v === '') return '';
    var n = Number(v);
    return isFinite(n) ? n : '';
  }
  var s = String(v);
  if (/^[=]/.test(s)) s = ' ' + s; // never let user text become a formula
  return s;
}

function appendObj_(name, obj) {
  var sh = sheet_(name);
  var head = header_(name);
  var row = sh.getLastRow() + 1;
  if (row > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), 100);
  var rng = sh.getRange(row, 1, 1, head.length);
  rng.setNumberFormats([head.map(fmt_)]);
  rng.setValues([head.map(function (h) { return cell_(h, obj[h]); })]);
  invalidate_(name);
  return row;
}

function updateRow_(name, row, patch) {
  var sh = sheet_(name);
  var head = header_(name);
  var rng = sh.getRange(row, 1, 1, head.length);
  var cur = rng.getValues()[0];
  var changed = false;
  for (var j = 0; j < head.length; j++) {
    if (Object.prototype.hasOwnProperty.call(patch, head[j])) { cur[j] = cell_(head[j], patch[head[j]]); changed = true; }
  }
  if (!changed) return;
  rng.setNumberFormats([head.map(fmt_)]);
  rng.setValues([cur]);
  invalidate_(name);
}

function getRowObj_(name, row) {
  var head = header_(name);
  var vals = sheet_(name).getRange(row, 1, 1, head.length).getValues()[0];
  var o = { _row: row };
  head.forEach(function (h, j) { if (h) o[h] = vals[j]; });
  return o;
}

function findRow_(name, id) {
  if (!id) return -1;
  var sh = sheet_(name);
  var lr = sh.getLastRow();
  if (lr < 2) return -1;
  var hit = sh.getRange(2, 1, lr - 1, 1).createTextFinder(String(id)).matchEntireCell(true).findNext();
  return hit ? hit.getRow() : -1;
}

function findObj_(name, id) {
  var r = findRow_(name, id);
  return r > 0 ? getRowObj_(name, r) : null;
}

function deleteRow_(name, row) {
  sheet_(name).deleteRow(row);
  invalidate_(name);
}

// ============================== HELPERS ==============================

function now_() { return REQ.now || new Date(); }
function ms_(v) { if (!v) return 0; if (v instanceof Date) return v.getTime(); var d = new Date(v); return isNaN(d.getTime()) ? 0 : d.getTime(); }
function str_(v) { return v === null || v === undefined ? '' : String(v); }
function num_(v) {
  if (v === null || v === undefined || v === '') return '';
  var n = Number(String(v).replace(/[^0-9.\-]/g, ''));
  return isFinite(n) && String(v).replace(/[^0-9]/g, '') !== '' ? n : '';
}
function clean_(v, max) {
  var s = str_(v).replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '').replace(/\n{3,}/g, '\n\n').trim();
  return max ? s.slice(0, max) : s;
}
function normPhone_(p) {
  var d = str_(p).replace(/\D/g, '');
  if (d.length === 12 && d.indexOf('91') === 0) d = d.slice(2);
  if (d.length === 11 && d.charAt(0) === '0') d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : '';
}
function validEmail_(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e); }
function rid_(prefix) { return prefix + Utilities.getUuid().replace(/-/g, '').slice(0, 10).toUpperCase(); }
function hex_(bytes) { return bytes.map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join(''); }
function firstName_(n) { return str_(n).trim().split(/\s+/)[0] || 'Owner'; }
function splitList_(v) { return str_(v).split(/[\n,]+/).map(function (s) { return s.trim(); }).filter(String); }
function fmtPhone_(p) { p = str_(p); return p.length === 10 ? '+91 ' + p.slice(0, 5) + ' ' + p.slice(5) : p; }
function esc_(s) { return str_(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

function seq_(key, start) {
  var props = PropertiesService.getScriptProperties();
  var n = Number(props.getProperty(key) || start) + 1;
  props.setProperty(key, String(n));
  return n;
}

function cache_() { return CacheService.getScriptCache(); }
function stamp_(key) {
  try {
    var prev = Number(cache_().get(key) || 0), now = Date.now();
    cache_().put(key, String(now > prev ? now : prev + 1), 21600);
  } catch (e) {}
}
function idNum_(id) { return Number(str_(id).replace(/\D/g, '')) || 0; }
function newestFirst_(a, b) { return (b.createdAt || 0) - (a.createdAt || 0) || idNum_(b.id) - idNum_(a.id); }
function getStamp_(key) { return Number(cache_().get(key) || 0); }

// ============================== AUTH ==============================

function secret_() {
  var props = PropertiesService.getScriptProperties();
  var s = props.getProperty('TOKEN_SECRET');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); props.setProperty('TOKEN_SECRET', s); }
  return s;
}

function sign_(payload) {
  var p = Utilities.base64EncodeWebSafe(JSON.stringify(payload), Utilities.Charset.UTF_8);
  var sig = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(p, secret_(), Utilities.Charset.UTF_8));
  return p + '.' + sig;
}

function verify_(token) {
  try {
    if (typeof token !== 'string') return null;
    var parts = token.split('.');
    if (parts.length !== 2) return null;
    var sig = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(parts[0], secret_(), Utilities.Charset.UTF_8));
    if (sig !== parts[1]) return null;
    var obj = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString());
    if (!obj || !obj.e || obj.e < Date.now()) return null;
    return obj;
  } catch (e) { return null; }
}

function hashPw_(pw, salt) {
  var h = salt + '|' + pw;
  for (var i = 0; i < 150; i++) {
    h = hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, h + '|' + salt, Utilities.Charset.UTF_8));
  }
  return h;
}

function userToken_(uid) { return sign_({ u: uid, r: 'u', e: Date.now() + 1000 * 60 * 60 * 24 * 60 }); }

function requireUser_(ctx) {
  if (!ctx.uid) throw uerr_('Please log in to continue.', 'LOGIN_REQUIRED');
  var u = findObj_('Users', ctx.uid);
  if (!u) throw uerr_('Please log in to continue.', 'LOGIN_REQUIRED');
  if (u.status === 'Blocked') throw uerr_('Your account has been paused. Please contact ' + BRAND + '.', 'BLOCKED');
  return u;
}

function userView_(u) {
  return { id: u.id, name: str_(u.name), phone: str_(u.phone), email: str_(u.email), since: ms_(u.createdAt),
    verified: str_(u.verified) === 'Yes', hasPassword: !!str_(u.passHash) };
}

function userByPhone_(phone) {
  var u = null;
  readAll_('Users').rows.forEach(function (r) { if (str_(r.phone) === phone) u = r; });
  return u;
}

function loginUser_(u, viaOtp) {
  if (u.status === 'Blocked') throw uerr_('Your account has been paused. Please contact ' + BRAND + '.', 'BLOCKED');
  var patch = { lastLoginAt: now_() };
  if (viaOtp) { patch.verified = 'Yes'; u.verified = 'Yes'; }
  updateRow_('Users', u._row, patch);
  return { token: userToken_(u.id), user: userView_(u) };
}

/** A short-lived signed note that says "this phone number was verified by OTP". */
function phoneProof_(phone) { return sign_({ r: 'p', ph: phone, e: Date.now() + 1000 * 60 * 30 }); }
function proofPhone_(proof) { var p = verify_(proof); return p && p.r === 'p' ? str_(p.ph) : ''; }

function tooMany_(key, limit, seconds) {
  var c = cache_();
  var n = Number(c.get(key) || 0) + 1;
  c.put(key, String(n), seconds);
  return n > limit;
}

function apiRegister_(b) {
  var name = clean_(b.name, 60), phone = normPhone_(b.phone), email = clean_(b.email, 120).toLowerCase(), pw = str_(b.password);
  if (name.length < 2) throw uerr_('Please enter your full name.', 'VALIDATION');
  if (!phone) throw uerr_('Please enter a valid 10-digit mobile number.', 'VALIDATION');
  if (email && !validEmail_(email)) throw uerr_('Please enter a valid email address or leave it empty.', 'VALIDATION');
  if (pw.length < 6) throw uerr_('Password must be at least 6 characters.', 'VALIDATION');
  // With OTP switched on, new accounts must prove the number first (see otpLogin).
  var proven = otpOn_() && proofPhone_(b.proof) === phone;
  if (otpOn_() && !proven) throw uerr_('Please verify your mobile number with OTP first.', 'OTP_REQUIRED');
  if (tooMany_('reg_' + phone, 5, 900)) throw uerr_('Too many attempts. Please try again in 15 minutes.', 'RATE');
  if (userByPhone_(phone)) throw uerr_('An account with this mobile number already exists. Please log in.', 'EXISTS');
  var salt = Utilities.getUuid();
  var u = { id: rid_('U'), createdAt: now_(), name: name, phone: phone, email: email, status: 'Active', lastLoginAt: now_(),
    passHash: hashPw_(pw, salt), salt: salt, verified: proven ? 'Yes' : '' };
  appendObj_('Users', u);
  return { token: userToken_(u.id), user: userView_(u) };
}

function apiLogin_(b) {
  var phone = normPhone_(b.phone), pw = str_(b.password);
  if (!phone || !pw) throw uerr_('Enter your mobile number and password.', 'VALIDATION');
  if (Number(cache_().get('fail_' + phone) || 0) >= 6) throw uerr_('Too many wrong attempts. Please try again in 15 minutes.', 'RATE');
  var u = userByPhone_(phone);
  if (u && !str_(u.passHash)) throw uerr_('This account logs in with OTP. Choose "Log in with OTP" instead.', 'USE_OTP');
  if (!u || hashPw_(pw, str_(u.salt)) !== str_(u.passHash)) {
    tooMany_('fail_' + phone, 6, 900);
    throw uerr_('Mobile number or password is incorrect.', 'BAD_LOGIN');
  }
  return loginUser_(u, false);
}

function apiMe_(b, ctx) {
  return { user: userView_(ctx.user), unread: unreadFor_(ctx.user.id) };
}

function apiUpdateProfile_(b, ctx) {
  var name = clean_(b.name, 60), email = clean_(b.email, 120).toLowerCase();
  if (name.length < 2) throw uerr_('Please enter your full name.', 'VALIDATION');
  if (email && !validEmail_(email)) throw uerr_('Please enter a valid email address.', 'VALIDATION');
  updateRow_('Users', ctx.user._row, { name: name, email: email });
  ctx.user.name = name; ctx.user.email = email;
  return { user: userView_(ctx.user) };
}

function apiChangePassword_(b, ctx) {
  // Accounts made with OTP have no password yet: they can set one without the "current password".
  if (str_(ctx.user.passHash) && hashPw_(str_(b.oldPassword), str_(ctx.user.salt)) !== str_(ctx.user.passHash)) throw uerr_('Current password is incorrect.', 'BAD_LOGIN');
  if (str_(b.newPassword).length < 6) throw uerr_('New password must be at least 6 characters.', 'VALIDATION');
  var salt = Utilities.getUuid();
  ctx.user.passHash = hashPw_(str_(b.newPassword), salt); ctx.user.salt = salt;
  updateRow_('Users', ctx.user._row, { passHash: ctx.user.passHash, salt: salt });
  return { done: true, user: userView_(ctx.user) };
}

// ============================== OTP (SMS) ==============================
// Fast2SMS "OTP SMS" route: we create the 6-digit code, Fast2SMS delivers "Your OTP: 123456".
// Fast2SMS Smart OTP and Message Central VerifyNow create and check the code on their side.

var OTP_TTL = 600;        // seconds an OTP stays valid
var OTP_RESEND = 30;      // seconds before "Resend OTP" works
var OTP_MAX_TRIES = 5;    // wrong codes allowed per OTP
var OTP_PER_HOUR = 5;     // OTP SMS per mobile number per hour
var OTP_NAMES = { fast2sms: 'Fast2SMS', fast2sms_smart: 'Fast2SMS Smart OTP', msgcentral: 'Message Central', demo: 'Preview (no SMS)' };

function otpProvider_() {
  if (setting_('FAST2SMS_API_KEY', FAST2SMS_API_KEY)) return setting_('FAST2SMS_OTP_ID', FAST2SMS_OTP_ID) ? 'fast2sms_smart' : 'fast2sms';
  if (setting_('MSGCENTRAL_CUSTOMER_ID', MSGCENTRAL_CUSTOMER_ID) && setting_('MSGCENTRAL_PASSWORD', MSGCENTRAL_PASSWORD)) return 'msgcentral';
  return OTP_DEMO ? 'demo' : '';
}
function otpOn_() { return !!otpProvider_(); }
function istDay_() { return new Date(Date.now() + 19800000).toISOString().slice(0, 10); }
function parseJson_(s) { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function otpKey_(purpose, phone) { return 'otp_' + purpose + '_' + phone; }
function otpHash_(code, phone) { return hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, code + '|' + phone + '|' + secret_(), Utilities.Charset.UTF_8)); }
function newOtp_() { return String(100000 + parseInt(Utilities.getUuid().replace(/-/g, '').slice(0, 12), 16) % 900000); }

function otpUsage_() {
  var v = str_(PropertiesService.getScriptProperties().getProperty('OTP_USAGE')).split(':');
  return v[0] === istDay_() ? Number(v[1] || 0) : 0;
}

function apiConfig_() {
  return { otp: otpOn_(), otpEnquiry: otpOn_() && !!OTP_ON_ENQUIRY };
}

/** Sends an OTP to a 10-digit number. purpose: 'login' or 'lead'. */
function sendOtp_(phone, purpose) {
  var prov = otpProvider_();
  if (!prov) throw uerr_('OTP is switched off.', 'OTP_OFF');
  var c = cache_(), key = otpKey_(purpose, phone), now = Date.now();
  var prev = parseJson_(c.get(key));
  if (prev && now - prev.t < OTP_RESEND * 1000) {
    var wait = Math.ceil((OTP_RESEND * 1000 - (now - prev.t)) / 1000);
    var e = uerr_('Please wait ' + wait + ' seconds before asking for a new OTP.', 'OTP_WAIT'); e.wait = wait;
    throw e;
  }
  if (Number(c.get('otph_' + phone) || 0) >= OTP_PER_HOUR) throw uerr_('Too many OTPs were sent to this number. Please try again after an hour.', 'OTP_RATE');
  if (otpUsage_() >= OTP_DAILY_LIMIT) {
    otpAlert_('limit', 'Today\'s OTP limit of ' + OTP_DAILY_LIMIT + ' SMS is used up (OTP_DAILY_LIMIT in Code.gs).');
    throw uerr_('We could not send an OTP right now.', 'OTP_LIMIT');
  }
  var rec = { t: now, x: now + OTP_TTL * 1000, n: 0, p: prov }, code = '';
  if (prov === 'msgcentral') rec.v = mcSend_(phone);
  else if (prov === 'fast2sms_smart') f2sSmartSend_(phone);
  else {
    code = newOtp_();
    rec.h = otpHash_(code, phone);
    if (prov === 'fast2sms') f2sSend_(phone, code);
  }
  c.put(key, JSON.stringify(rec), OTP_TTL);
  tooMany_('otph_' + phone, OTP_PER_HOUR, 3600);
  PropertiesService.getScriptProperties().setProperty('OTP_USAGE', istDay_() + ':' + (otpUsage_() + 1));
  var out = { sent: true, phone: phone, resendIn: OTP_RESEND };
  if (prov === 'demo') out.demoOtp = code;
  return out;
}

/** Throws a friendly error unless the code matches. Each OTP works once. */
function checkOtp_(phone, purpose, code) {
  code = str_(code).replace(/\D/g, '');
  var c = cache_(), key = otpKey_(purpose, phone), rec = parseJson_(c.get(key));
  if (!rec || rec.x < Date.now()) throw uerr_('This OTP has expired. Tap "Resend OTP" to get a new one.', 'OTP_EXPIRED');
  if (rec.n >= OTP_MAX_TRIES) throw uerr_('Too many wrong tries. Tap "Resend OTP" to get a new one.', 'OTP_LOCKED');
  if (!/^\d{4,8}$/.test(code)) throw uerr_('Enter the 6-digit OTP from the SMS.', 'VALIDATION');
  var good;
  if (rec.p === 'msgcentral') good = mcValidate_(phone, rec.v, code);
  else if (rec.p === 'fast2sms_smart') good = f2sSmartVerify_(phone, code);
  else good = rec.h === otpHash_(code, phone);
  if (!good) {
    rec.n++;
    c.put(key, JSON.stringify(rec), Math.max(1, Math.ceil((rec.x - Date.now()) / 1000)));
    if (rec.n >= OTP_MAX_TRIES) throw uerr_('Too many wrong tries. Tap "Resend OTP" to get a new one.', 'OTP_LOCKED');
    throw uerr_('That OTP is not correct. Please check the SMS and try again.', 'OTP_WRONG');
  }
  c.remove(key);
  return true;
}

function fetch_(url, opts) {
  opts = opts || {};
  opts.muteHttpExceptions = true;
  try {
    var res = UrlFetchApp.fetch(url, opts), text = res.getContentText();
    return { code: res.getResponseCode(), json: parseJson_(text), text: text };
  } catch (e) {
    return { code: 0, json: null, text: String((e && e.message) || e) };
  }
}

function f2sKey_() { return setting_('FAST2SMS_API_KEY', FAST2SMS_API_KEY); }

function f2sSend_(phone, code) {
  var r = fetch_('https://www.fast2sms.com/dev/bulkV2?authorization=' + encodeURIComponent(f2sKey_()) +
    '&route=otp&variables_values=' + code + '&flash=0&numbers=' + phone, { method: 'get' });
  if (r.json && r.json.return === true) return true;
  smsFail_('Fast2SMS', r);
}

function f2sPost_(path, payload) {
  return fetch_('https://www.fast2sms.com/dev/otp/' + path, { method: 'post', contentType: 'application/json',
    headers: { Authorization: f2sKey_(), accept: 'application/json' }, payload: JSON.stringify(payload) });
}
function f2sSmartSend_(phone) {
  var r = f2sPost_('send', { otp_id: setting_('FAST2SMS_OTP_ID', FAST2SMS_OTP_ID), mobile: phone });
  if (r.json && r.json.return === true) return true;
  smsFail_('Fast2SMS', r);
}
function f2sSmartVerify_(phone, code) {
  var r = f2sPost_('verify', { mobile: phone, otp: code });
  if (r.json && r.json.return === true) return true;
  var sc = Number((r.json && r.json.status_code) || r.code), msg = str_(r.json && r.json.message);
  if (sc === 404) throw uerr_('This OTP has expired. Tap "Resend OTP" to get a new one.', 'OTP_EXPIRED');
  if (sc === 400 && /otp/i.test(msg)) return false;
  smsFail_('Fast2SMS', r);
}

var MC_BASE = 'https://cpaas.messagecentral.com';
function mcId_() { return encodeURIComponent(setting_('MSGCENTRAL_CUSTOMER_ID', MSGCENTRAL_CUSTOMER_ID)); }
function mcToken_(fresh) {
  var c = cache_();
  if (!fresh) { var t = c.get('mc_token'); if (t) return t; }
  var r = fetch_(MC_BASE + '/auth/v1/authentication/token?customerId=' + mcId_() + '&key=' +
    encodeURIComponent(Utilities.base64Encode(setting_('MSGCENTRAL_PASSWORD', MSGCENTRAL_PASSWORD))) + '&scope=NEW&country=91', { method: 'get', headers: { accept: '*/*' } });
  if (r.json && r.json.token) { c.put('mc_token', String(r.json.token), 1800); return String(r.json.token); }
  smsFail_('Message Central', r);
}
function mcCall_(method, path) {
  var r = fetch_(MC_BASE + path, { method: method, headers: { authToken: mcToken_(false) } });
  if (r.code === 401) r = fetch_(MC_BASE + path, { method: method, headers: { authToken: mcToken_(true) } });
  return r;
}
function mcSend_(phone) {
  var r = mcCall_('post', '/verification/v3/send?countryCode=91&customerId=' + mcId_() + '&flowType=SMS&mobileNumber=' + phone + '&otpLength=6');
  var j = r.json || {}, d = j.data || {}, vid = d.verificationId || d.verficationId;
  if (Number(j.responseCode) === 200 && vid) return String(vid);
  if (Number(j.responseCode || d.responseCode) === 506) {
    var e = uerr_('An OTP was sent a moment ago. Please wait a minute and try again.', 'OTP_WAIT'); e.wait = 60;
    throw e;
  }
  smsFail_('Message Central', r);
}
function mcValidate_(phone, vid, code) {
  var r = mcCall_('get', '/verification/v3/validateOtp?countryCode=91&mobileNumber=' + phone + '&verificationId=' + encodeURIComponent(vid) +
    '&customerId=' + mcId_() + '&code=' + code);
  var j = r.json || {}, d = j.data || {}, rc = Number(j.responseCode || d.responseCode || 0), status = str_(d.verificationStatus);
  if (status === 'VERIFICATION_COMPLETED' || rc === 703) return true;
  if (rc === 705 || /EXPIRED/.test(status)) throw uerr_('This OTP has expired. Tap "Resend OTP" to get a new one.', 'OTP_EXPIRED');
  if (rc === 800) throw uerr_('Too many wrong tries. Tap "Resend OTP" to get a new one.', 'OTP_LOCKED');
  if (rc === 702 || rc === 700 || /FAILED|WRONG/.test(status)) return false;
  smsFail_('Message Central', r);
}

/** Provider said no: tell the admin (at most every 6 hours) and give the visitor a calm message. */
function smsFail_(who, r) {
  var j = r.json || {}, msg = j.message || j.errorMessage || (j.data && j.data.errorMessage) || r.text || 'no reply';
  if (Array.isArray(msg)) msg = msg.join(' ');
  otpAlert_('fail', who + ' error ' + (j.status_code || j.responseCode || r.code || '') + ': ' + str_(msg).slice(0, 300));
  throw uerr_('We could not send the OTP right now. Please try again in a few minutes.', 'OTP_FAIL');
}

function otpAlert_(kind, detail) {
  try {
    PropertiesService.getScriptProperties().setProperty('OTP_LAST_ERROR', JSON.stringify({ t: Date.now(), d: detail }));
    logActivity_('otp_' + kind, '', '', detail);
    var k = 'otp_alert_' + kind;
    if (cache_().get(k)) return;
    cache_().put(k, '1', 21600);
    notifyAdmin_('Website OTP problem: ' + (kind === 'limit' ? 'daily limit reached' : 'SMS not sent'),
      '<p>' + esc_(detail) + '</p><p>Enquiries are still saved. They show as <b>Not verified</b> in the admin panel until OTP works again.</p>' +
      (kind === 'fail' ? '<p>Common reasons: SMS balance is over, Fast2SMS OTP KYC is not complete yet, or the API key was copied wrongly.</p>' : ''));
  } catch (e) {}
}

function apiSendOtp_(b) {
  var phone = normPhone_(b.phone), purpose = b.purpose === 'lead' ? 'lead' : 'login';
  if (!phone) throw uerr_('Please enter a valid 10-digit mobile number.', 'VALIDATION');
  if (!otpOn_()) throw uerr_('OTP is not available right now. Please log in with your password.', 'OTP_OFF');
  if (purpose === 'lead') {
    var l = findObj_('Leads', b.leadId);
    if (!l || str_(l.phone) !== phone) throw uerr_('We could not find this enquiry. Please send it again.', 'NOT_FOUND');
    if (str_(l.verified) === 'Yes') return { sent: false, verified: true, phone: phone };
  }
  return sendOtp_(phone, purpose);
}

/** Log in (or sign up) with an OTP. Step 1: {phone, otp}. New number → {needName, proof}. Step 2: {proof, name, email}. */
function apiOtpLogin_(b) {
  if (!otpOn_()) throw uerr_('OTP login is not available right now. Please log in with your password.', 'OTP_OFF');
  if (b.proof) {
    var phone = proofPhone_(b.proof);
    if (!phone) throw uerr_('Your OTP session has expired. Please start again.', 'OTP_EXPIRED');
    var existing = userByPhone_(phone);
    if (existing) return loginUser_(existing, true);
    var name = clean_(b.name, 60), email = clean_(b.email, 120).toLowerCase();
    if (name.length < 2) throw uerr_('Please enter your full name.', 'VALIDATION');
    if (email && !validEmail_(email)) throw uerr_('Please enter a valid email address or leave it empty.', 'VALIDATION');
    var u = { id: rid_('U'), createdAt: now_(), name: name, phone: phone, verified: 'Yes', email: email, status: 'Active',
      lastLoginAt: now_(), passHash: '', salt: '' };
    appendObj_('Users', u);
    return { token: userToken_(u.id), user: userView_(u), created: true };
  }
  var ph = normPhone_(b.phone);
  if (!ph) throw uerr_('Please enter a valid 10-digit mobile number.', 'VALIDATION');
  checkOtp_(ph, 'login', b.otp);
  var user = userByPhone_(ph);
  if (!user) return { needName: true, proof: phoneProof_(ph), phone: ph };
  return loginUser_(user, true);
}

function apiAdminLogin_(b) {
  if (Number(cache_().get('adminfail') || 0) >= 20) throw uerr_('Too many wrong attempts. Try again in 15 minutes.', 'RATE');
  var pw = setting_('ADMIN_PASSWORD', ADMIN_PASSWORD);
  if (!pw) throw uerr_('The admin password is not set yet. In Code.gs, type a password in ADMIN_PASSWORD, Save, then deploy a new version.', 'NO_ADMIN_PASSWORD');
  if (str_(b.password) !== pw) {
    tooMany_('adminfail', 20, 900);
    throw uerr_('Wrong admin password.', 'BAD_LOGIN');
  }
  return { adminToken: sign_({ r: 'a', e: Date.now() + 1000 * 60 * 60 * 24 * 7 }) };
}

// ============================== LISTINGS ==============================

var LISTING_INPUT = {
  kind: ['enum', ['property', 'project']], purpose: ['enum', ['sale', 'rent']], category: ['enum', ['Residential', 'Commercial', 'Plot']],
  propertyType: ['text', 60], title: ['text', 120], projectName: ['text', 120], builderName: ['text', 120],
  bhk: ['text', 30], configurations: ['text', 200], carpetArea: ['num'], areaUnit: ['text', 20],
  price: ['num'], priceMax: ['num'], priceNote: ['text', 1500], rent: ['num'], deposit: ['num'], maintenance: ['num'],
  negotiable: ['yesno'], furnishing: ['text', 40], floor: ['text', 20], totalFloors: ['text', 20], facing: ['text', 30],
  parking: ['text', 30], bathrooms: ['text', 10], balconies: ['text', 10], ageOfProperty: ['text', 40],
  possession: ['text', 40], possessionDate: ['text', 40], tenantPreference: ['text', 80], availableFrom: ['text', 40],
  plotType: ['text', 60], reraNumber: ['text', 60], amenities: ['text', 800], highlights: ['text', 1500],
  description: ['text', 4000], state: ['text', 60], district: ['text', 60], city: ['text', 80], locality: ['text', 120],
  landmark: ['text', 160], address: ['text', 300], pincode: ['text', 10], lat: ['num'], lng: ['num'],
  photos: ['photos'], videoUrl: ['url'], ownerRole: ['enum', ['Owner', 'Builder', 'Agent']],
  contactPhone: ['phone'], phoneMode: ['enum', ['approval', 'direct']]
};
var ADMIN_INPUT = {
  segment: ['enum', SEGMENTS], status: ['enum', LISTING_STATUSES], featured: ['yesno'], tag: ['text', 30],
  adminNotes: ['text', 1000], ownerRole: ['text', 40], ownerName: ['text', 80]
};

function sanitizeListing_(input, admin) {
  input = input || {};
  var out = {};
  var specs = [LISTING_INPUT];
  if (admin) specs.push(ADMIN_INPUT);
  specs.forEach(function (spec) {
    Object.keys(spec).forEach(function (k) {
      if (!Object.prototype.hasOwnProperty.call(input, k)) return;
      var t = spec[k], v = input[k];
      if (t[0] === 'text') out[k] = clean_(v, t[1]);
      else if (t[0] === 'num') out[k] = num_(v);
      else if (t[0] === 'enum') { var s = clean_(v, 60); out[k] = t[1].indexOf(s) >= 0 ? s : ''; }
      else if (t[0] === 'yesno') out[k] = (v === true || /^(yes|true|1)$/i.test(str_(v))) ? 'Yes' : 'No';
      else if (t[0] === 'phone') out[k] = normPhone_(v);
      else if (t[0] === 'url') { var u = clean_(v, 300); out[k] = /^https?:\/\/[^\s]+$/i.test(u) ? u : ''; }
      else if (t[0] === 'photos') {
        var arr = Array.isArray(v) ? v : splitList_(v);
        out[k] = arr.map(function (x) { return clean_(x, 400); })
          .filter(function (x) { return /^[\w-]{10,}$/.test(x) || /^https:\/\/[^\s,]+$/i.test(x); }).slice(0, 20).join(',');
      }
    });
  });
  return out;
}

function computeSegment_(l) {
  if (l.category === 'Plot') return 'Plots';
  if (l.category === 'Commercial') return 'Commercial';
  if (l.purpose === 'rent') return 'Rental';
  if (l.kind === 'project') return /under/i.test(str_(l.possession)) ? 'Under Construction' : 'Ready to Move';
  return 'Resale';
}

function shortType_(t) {
  var parts = str_(t).split(/\s*\/\s*/);
  return parts.sort(function (x, y) { return x.length - y.length; })[0] || '';
}

function autoTitle_(l) {
  var where = l.locality ? ' in ' + l.locality : '';
  var type = shortType_(l.propertyType);
  var forWhat = l.purpose === 'rent' ? ' for rent' : ' for sale';
  if (l.category === 'Plot') {
    var area = l.carpetArea ? Number(l.carpetArea).toLocaleString('en-IN') + ' ' + (l.areaUnit || 'sq ft') + ' ' : '';
    return (area + (type || 'Plot')).trim() + forWhat + where;
  }
  if (l.category === 'Commercial') return (type || 'Commercial space') + forWhat + where;
  var bhk = str_(l.bhk);
  var b = bhk ? (/rk/i.test(bhk) ? bhk.toUpperCase() + ' ' : bhk.split(',')[0] + ' BHK ') : '';
  if (l.kind === 'project') return (l.configurations ? l.configurations + ' homes' : 'New homes') + where;
  var noun = type || 'Flat';
  return (b ? b + noun.toLowerCase() : noun).trim() + forWhat + where;
}

function validateListing_(l) {
  if (!l.purpose) throw uerr_('Choose whether you want to sell or rent out.', 'VALIDATION');
  if (!l.category) throw uerr_('Choose a property category.', 'VALIDATION');
  if (!l.propertyType) throw uerr_('Choose the property type.', 'VALIDATION');
  if (!l.city || !l.locality) throw uerr_('Add the city and locality of the property.', 'VALIDATION');
  if (l.purpose === 'rent' && !l.rent) throw uerr_('Enter the monthly rent.', 'VALIDATION');
  if (l.purpose === 'sale' && !l.price) throw uerr_('Enter the expected price.', 'VALIDATION');
}

function apiUploadPhoto_(b, ctx) {
  var okUser = false;
  if (ctx.admin) okUser = true;
  else if (ctx.uid) { requireUser_(ctx); okUser = true; }
  if (!okUser) throw uerr_('Please log in to upload photos.', 'LOGIN_REQUIRED');
  var mime = str_(b.mime);
  if (['image/jpeg', 'image/png', 'image/webp'].indexOf(mime) < 0) throw uerr_('Photos must be JPG, PNG or WebP.', 'VALIDATION');
  var data = str_(b.data).replace(/^data:[^,]+,/, '');
  if (data.length > 6 * 1024 * 1024) throw uerr_('Photo is too large. Please use a smaller photo.', 'VALIDATION');
  var key = 'up_' + (ctx.uid || 'admin');
  if (!ctx.admin && tooMany_(key, 60, 3600)) throw uerr_('Too many uploads. Please try again later.', 'RATE');
  var bytes = Utilities.base64Decode(data);
  var ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  var blob = Utilities.newBlob(bytes, mime, 'photo-' + Date.now() + '.' + ext);
  var file = photoFolder_().createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { id: file.getId() };
}

function photoFolder_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('PHOTO_FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var f = DriveApp.createFolder(BRAND + ' – Listing Photos');
  props.setProperty('PHOTO_FOLDER_ID', f.getId());
  return f;
}

function apiSubmitListing_(b, ctx) {
  var u = ctx.user;
  var l = sanitizeListing_(b.listing, false);
  var existing = null;
  if (b.id) {
    existing = findObj_('Listings', b.id);
    if (!existing || str_(existing.ownerId) !== u.id) throw uerr_('You can only edit your own listings.', 'FORBIDDEN');
    var merged = {};
    SCHEMA.Listings.forEach(function (k) { merged[k] = existing[k]; });
    Object.keys(l).forEach(function (k) { merged[k] = l[k]; });
    l = merged;
  }
  l.ownerRole = l.ownerRole || 'Owner';
  l.kind = (l.ownerRole === 'Builder' && l.purpose === 'sale' && l.category === 'Residential') ? 'project' : 'property';
  l.contactPhone = l.contactPhone || str_(u.phone);
  l.phoneMode = l.phoneMode || 'approval';
  l.state = l.state || 'Maharashtra';
  validateListing_(l);
  l.segment = computeSegment_(l);
  if (!l.title) l.title = autoTitle_(l);
  l.updatedAt = now_();
  l.status = 'Pending';
  l.ownerId = u.id;
  l.ownerName = str_(u.name);
  l.source = 'owner';
  if (existing) {
    l.rejectReason = '';
    updateRow_('Listings', existing._row, l);
  } else {
    l.id = 'ST' + seq_('SEQ_LISTING', 1000);
    l.createdAt = now_();
    l.featured = 'No';
    l.views = 0; l.chats = 0;
    appendObj_('Listings', l);
  }
  bumpPublic_();
  notifyAdmin_('New listing to review: ' + l.id + ' — ' + l.title,
    '<p><b>' + esc_(u.name) + '</b> (' + fmtPhone_(u.phone) + ') ' + (existing ? 'edited' : 'posted') + ' a listing. It is waiting for your approval.</p>' +
    table_([['ID', l.id], ['Title', l.title], ['Type', l.propertyType], ['For', l.purpose === 'rent' ? 'Rent' : 'Sale'],
      ['Price / rent', l.purpose === 'rent' ? '₹' + money_(l.rent) + '/month' : '₹' + money_(l.price)], ['Location', [l.locality, l.city].join(', ')],
      ['Number visible', l.phoneMode === 'direct' ? 'Directly to buyers' : 'Only after owner approves']]) +
    btn_(SITE_URL + '/admin.html', 'Review in admin panel'));
  return { id: l.id, status: 'Pending' };
}

function apiMyListings_(b, ctx) {
  var uid = ctx.user.id;
  var rows = readAll_('Listings').rows.filter(function (r) { return str_(r.ownerId) === uid && r.status !== 'Deleted'; });
  var chatCounts = {};
  chatsLite_().rows.forEach(function (c) {
    if (str_(c.ownerId) === uid) {
      var k = str_(c.listingId);
      chatCounts[k] = chatCounts[k] || { chats: 0, requests: 0 };
      chatCounts[k].chats++;
      if (c.phoneStatus === 'requested') chatCounts[k].requests++;
    }
  });
  return rows.map(function (r) {
    var o = publicView_(r, false);
    o.status = str_(r.status);
    o.rejectReason = str_(r.rejectReason);
    o.views = Number(r.views || 0) + Number(cache_().get('v_' + r.id) || 0);
    o.chats = (chatCounts[r.id] || {}).chats || 0;
    o.requests = (chatCounts[r.id] || {}).requests || 0;
    o.phoneMode = str_(r.phoneMode);
    return o;
  }).sort(newestFirst_);
}

function apiMyListing_(b, ctx) {
  var r = findObj_('Listings', b.id);
  if (!r || str_(r.ownerId) !== ctx.user.id) throw uerr_('Listing not found.', 'NOT_FOUND');
  var o = fullView_(r);
  return o;
}

function apiListingAction_(b, ctx) {
  var r = findObj_('Listings', b.id);
  if (!r || str_(r.ownerId) !== ctx.user.id) throw uerr_('Listing not found.', 'NOT_FOUND');
  var map = { sold: 'Sold', rented: 'Rented', delete: 'Deleted' };
  var st = map[str_(b.op)];
  if (!st) throw uerr_('Unknown action.', 'BAD_ACTION');
  updateRow_('Listings', r._row, { status: st, updatedAt: now_() });
  bumpPublic_();
  return { id: r.id, status: st };
}

var CARD_FIELDS = ['id', 'kind', 'segment', 'purpose', 'category', 'propertyType', 'title', 'bhk', 'configurations',
  'carpetArea', 'areaUnit', 'price', 'priceMax', 'rent', 'deposit', 'negotiable', 'furnishing', 'possession',
  'possessionDate', 'plotType', 'tenantPreference', 'state', 'district', 'city', 'locality', 'lat', 'lng', 'featured', 'tag', 'ownerRole', 'reraNumber'];
var DETAIL_FIELDS = CARD_FIELDS.concat(['priceNote', 'maintenance', 'floor', 'totalFloors', 'facing', 'parking',
  'bathrooms', 'balconies', 'ageOfProperty', 'availableFrom', 'amenities', 'highlights', 'description',
  'landmark', 'pincode', 'videoUrl', 'phoneMode']);

function publicView_(r, detail) {
  var o = {};
  (detail ? DETAIL_FIELDS : CARD_FIELDS).forEach(function (f) {
    var v = r[f];
    o[f] = v instanceof Date ? v.getTime() : (v === undefined || v === null ? '' : v);
  });
  var photos = splitList_(r.photos);
  o.photos = detail ? photos : photos.slice(0, 1);
  o.photoCount = photos.length;
  o.isFirm = r.source === 'admin';
  o.ownerName = o.isFirm ? BRAND : firstName_(r.ownerName);
  o.ownerRole = o.isFirm ? BRAND : str_(r.ownerRole || 'Owner');
  o.createdAt = ms_(r.approvedAt) || ms_(r.createdAt);
  if (SHOW_PROJECT_NAMES) { o.projectName = str_(r.projectName); o.builderName = str_(r.builderName); }
  return o;
}

function fullView_(r) {
  var o = {};
  SCHEMA.Listings.forEach(function (f) { var v = r[f]; o[f] = v instanceof Date ? v.getTime() : (v === undefined || v === null ? '' : v); });
  o.photos = splitList_(r.photos);
  return o;
}

function bumpPublic_() { try { cache_().put('pub_ver', String(Date.now()), 21600); } catch (e) {} }

function apiListings_() {
  var c = cache_();
  var ver = c.get('pub_ver') || '0';
  var meta = c.get('pub_meta_' + ver);
  if (meta) {
    var n = Number(meta), keys = [];
    for (var i = 0; i < n; i++) keys.push('pub_' + ver + '_' + i);
    var parts = c.getAll(keys), s = '', ok = true;
    for (i = 0; i < n; i++) { if (parts[keys[i]] === undefined || parts[keys[i]] === null) { ok = false; break; } s += parts[keys[i]]; }
    if (ok) { try { return JSON.parse(s); } catch (e) {} }
  }
  var list = readAll_('Listings').rows.filter(function (r) { return r.status === 'Approved'; })
    .map(function (r) { return publicView_(r, false); })
    .sort(newestFirst_);
  var out = { listings: list, at: Date.now() };
  try {
    var json = JSON.stringify(out), size = 40000, cnt = Math.max(1, Math.ceil(json.length / size)), map = {};
    for (var j = 0; j < cnt; j++) map['pub_' + ver + '_' + j] = json.substr(j * size, size);
    map['pub_meta_' + ver] = String(cnt);
    if (cnt < 40) c.putAll(map, 300);
  } catch (e) {}
  return out;
}

function apiListing_(b, ctx) {
  var r = findObj_('Listings', b.id);
  if (!r) throw uerr_('This listing is not available.', 'NOT_FOUND');
  var isOwner = ctx && ctx.uid && str_(r.ownerId) === ctx.uid;
  var isAdmin = ctx && ctx.admin;
  if (r.status !== 'Approved' && !isOwner && !isAdmin) {
    if (r.status === 'Sold' || r.status === 'Rented') throw uerr_('This property has been ' + r.status.toLowerCase() + '.', 'GONE');
    throw uerr_('This listing is not available.', 'NOT_FOUND');
  }
  var o = publicView_(r, true);
  if (isOwner || isAdmin) { o.status = str_(r.status); o.rejectReason = str_(r.rejectReason); }
  o.isOwner = !!isOwner;
  if (!isOwner && r.status === 'Approved' && !b.noCount) {
    try {
      var c = cache_(), k = 'v_' + r.id, n = Number(c.get(k) || 0) + 1;
      if (n >= 10) {
        var lock = LockService.getScriptLock();
        if (lock.tryLock(3000)) {
          try { updateRow_('Listings', r._row, { views: Number(r.views || 0) + n }); c.remove(k); } finally { lock.releaseLock(); }
        } else c.put(k, String(n), 21600);
      } else c.put(k, String(n), 21600);
    } catch (e) {}
  }
  return o;
}

// ============================== LEADS ==============================

var INTENTS = {
  buy: 'Buy a property', rent: 'Take a property on rent', sell: 'Sell my property', rentout: 'Rent out my property',
  plot_buy: 'Buy a plot / land', plot_sell: 'Sell a plot / land', commercial: 'Commercial – buy / rent / lease',
  project: 'New project / investment', listing: 'Enquiry on a listing', site_visit: 'Site visit request',
  callback: 'Call back request', chat: 'Started a chat', viewed_number: "Viewed seller's number",
  number_request: "Asked for seller's number", report: 'Reported a listing', other: 'Other'
};

function apiLead_(b, ctx) {
  if (str_(b.company)) return { id: 'L0', saved: true }; // honeypot: bots fill hidden fields
  var name = clean_(b.name, 80), phone = normPhone_(b.phone), email = clean_(b.email, 120);
  if (name.length < 2) throw uerr_('Please enter your name.', 'VALIDATION');
  if (!phone) throw uerr_('Please enter a valid 10-digit mobile number.', 'VALIDATION');
  if (email && !validEmail_(email)) email = '';
  if (tooMany_('lead_' + phone, 8, 600)) throw uerr_('We have your request. Our team will call you shortly.', 'RATE');
  var user = ctx && ctx.uid ? findObj_('Users', ctx.uid) : null;
  var known = !!(user && str_(user.phone) === phone && str_(user.verified) === 'Yes');
  var askOtp = otpOn_() && !!OTP_ON_ENQUIRY && !known;
  var lead = saveLead_({
    intent: INTENTS[str_(b.intent)] || clean_(b.intent, 60) || INTENTS.other,
    name: name, phone: phone, email: email, details: clean_(b.details, 1500), message: clean_(b.message, 1500),
    listingId: clean_(b.listingId, 20), listingTitle: clean_(b.listingTitle, 160), page: clean_(b.page, 200),
    source: clean_(b.source, 200), userId: (ctx && ctx.uid) || '', verified: known ? 'Yes' : askOtp ? 'No' : ''
  }, !askOtp);
  if (!askOtp) return { id: lead.id, saved: true, verified: known };
  // The enquiry is already saved. Now verify the number; the admin email goes out once it is verified.
  try {
    return { id: lead.id, saved: true, otp: sendOtp_(phone, 'lead') };
  } catch (e) {
    if (e.code === 'OTP_WAIT') return { id: lead.id, saved: true, otp: { sent: false, phone: phone, resendIn: e.wait || OTP_RESEND } };
    notifyLead_(lead, 'Not verified: the OTP SMS could not be sent.');
    return { id: lead.id, saved: true, otpError: e.userMessage || '' };
  }
}

/** Enquiry form step 2: the client types the OTP. Marks this (and any other fresh unverified) enquiry as verified. */
function apiVerifyLead_(b, ctx) {
  var phone = normPhone_(b.phone), row = findRow_('Leads', b.id);
  var lead = row > 0 ? getRowObj_('Leads', row) : null;
  if (!phone || !lead || str_(lead.phone) !== phone) throw uerr_('We could not find this enquiry. Please send it again.', 'NOT_FOUND');
  if (str_(lead.verified) === 'Yes') return { verified: true };
  checkOtp_(phone, 'lead', b.otp);
  var since = Date.now() - 3600 * 1000;
  readAll_('Leads').rows.filter(function (r) {
    return str_(r.phone) === phone && str_(r.verified) === 'No' && (str_(r.id) === str_(lead.id) || ms_(r.createdAt) > since);
  }).forEach(function (r) {
    updateRow_('Leads', r._row, { verified: 'Yes' });
    r.verified = 'Yes';
    notifyLead_(r, 'Mobile number verified by OTP.');
  });
  var u = ctx && ctx.uid ? findObj_('Users', ctx.uid) : null;
  if (u && str_(u.phone) === phone && str_(u.verified) !== 'Yes') updateRow_('Users', u._row, { verified: 'Yes' });
  stamp_('u_ADMIN');
  return { verified: true };
}

function saveLead_(l, notify, note) {
  l.id = 'L' + seq_('SEQ_LEAD', 10000);
  l.createdAt = now_();
  l.status = 'New';
  if (l.verified === undefined) {
    var u = l.userId ? findObj_('Users', l.userId) : null;
    l.verified = u && str_(u.verified) === 'Yes' && str_(u.phone) === str_(l.phone) ? 'Yes' : '';
  }
  appendObj_('Leads', l);
  stamp_('u_ADMIN');
  if (notify) notifyLead_(l, note || (l.verified === 'Yes' ? 'Mobile number verified by OTP.' : ''));
  return l;
}

function notifyLead_(l, note) {
  var ok = str_(l.verified) === 'Yes';
  notifyAdmin_((ok ? 'Verified enquiry: ' : 'New enquiry: ') + l.intent + ' — ' + l.name + ' (' + fmtPhone_(l.phone) + ')',
    (note ? '<p style="margin:0 0 4px;padding:8px 12px;border-radius:6px;background:' + (ok ? '#E2F3E9;color:#1E7B4F' : '#FFF2D2;color:#8C5B00') + '"><b>' + esc_(note) + '</b></p>' : '') +
    table_([['Looking for', l.intent], ['Name', l.name], ['Mobile', fmtPhone_(l.phone)], ['Email', l.email],
      ['Details', l.details], ['Message', l.message], ['Listing', l.listingId ? l.listingId + ' — ' + l.listingTitle : ''],
      ['Source', l.source], ['Enquiry no.', l.id]]) +
    btn_('tel:+91' + l.phone, 'Call ' + l.name) + ' ' + btn_('https://wa.me/91' + l.phone, 'WhatsApp'));
}

function apiReport_(b, ctx) {
  var r = findObj_('Listings', b.listingId);
  if (!r) throw uerr_('Listing not found.', 'NOT_FOUND');
  var name = clean_(b.name, 80) || 'Website visitor', phone = normPhone_(b.phone) || '0000000000';
  if (tooMany_('report_' + (ctx.uid || phone), 5, 3600)) return { saved: true };
  saveLead_({ intent: INTENTS.report, name: name, phone: phone, details: clean_(b.reason, 500), listingId: r.id,
    listingTitle: str_(r.title), page: 'property.html', source: '', userId: ctx.uid || '' }, true);
  return { saved: true };
}

// ============================== PHONE + CHAT ==============================

function listingForContact_(id) {
  var r = findObj_('Listings', id);
  if (!r || r.status !== 'Approved') throw uerr_('This listing is not available any more.', 'NOT_FOUND');
  return r;
}

function apiRevealPhone_(b, ctx) {
  var r = listingForContact_(b.listingId), u = ctx.user;
  if (r.source === 'admin') return { phone: '', firm: true };
  if (str_(r.ownerId) === u.id) return { phone: str_(r.contactPhone), own: true };
  if (r.phoneMode !== 'direct') return { phone: '', needsApproval: true };
  logActivity_('number_view', r.id, u.id, '');
  if (!cache_().get('nv_' + r.id + '_' + u.id)) {
    cache_().put('nv_' + r.id + '_' + u.id, '1', 21600);
    saveLead_({ intent: INTENTS.viewed_number, name: str_(u.name), phone: str_(u.phone), email: str_(u.email),
      details: 'Owner: ' + str_(r.ownerName) + ' (' + fmtPhone_(r.contactPhone) + ')', listingId: r.id, listingTitle: str_(r.title),
      page: 'property.html', source: '', userId: u.id }, false);
  }
  return { phone: str_(r.contactPhone) };
}

function chatRow_(id) {
  var row = findRow_('Chats', id);
  if (row < 0) throw uerr_('Chat not found.', 'NOT_FOUND');
  return getRowObj_('Chats', row);
}

function parseLog_(c) { try { var a = JSON.parse(str_(c.log) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }

function pushMessage_(c, m) {
  // m: {s: senderRole, n: senderName, k: type, x: text}
  m.i = rid_('M');
  var log = parseLog_(c);
  var lastT = log.length ? Number(log[log.length - 1].t || 0) : 0;
  m.t = Math.max(Date.now(), lastT + 1);
  log.push(m);
  var json = JSON.stringify(log);
  while (json.length > 45000 && log.length > 20) { log.shift(); json = JSON.stringify(log); }
  appendObj_('Messages', { id: m.i, chatId: c.id, createdAt: new Date(m.t), senderRole: m.s, senderName: m.n, type: m.k, text: m.x });
  var preview = m.k === 'phone' ? '📞 Phone number shared' : m.k === 'phone_request' ? '📞 Phone number requested' : str_(m.x).slice(0, 120);
  var patch = { log: json, lastMessage: preview, lastSender: m.s, updatedAt: new Date(m.t) };
  if (m.s === 'buyer') patch.ownerUnread = Number(c.ownerUnread || 0) + 1;
  else if (m.s === 'owner') patch.buyerUnread = Number(c.buyerUnread || 0) + 1;
  else { patch.buyerUnread = Number(c.buyerUnread || 0) + 1; if (c.ownerId !== 'ADMIN') patch.ownerUnread = Number(c.ownerUnread || 0) + 1; }
  updateRow_('Chats', c._row, patch);
  Object.keys(patch).forEach(function (k) { c[k] = patch[k]; });
  stamp_('c_' + c.id); stamp_('u_' + c.buyerId); stamp_('u_' + c.ownerId); stamp_('u_ADMIN');
  return m;
}

function apiStartChat_(b, ctx) {
  var u = ctx.user;
  var listing = null, ownerId = 'ADMIN', ownerName = BRAND, title = 'General enquiry';
  if (b.listingId) {
    listing = listingForContact_(b.listingId);
    title = str_(listing.title);
    if (listing.source !== 'admin') { ownerId = str_(listing.ownerId); ownerName = str_(listing.ownerName); }
    if (ownerId === u.id) throw uerr_('This is your own listing.', 'OWN_LISTING');
  }
  var lid = listing ? listing.id : '';
  var found = null;
  chatsLite_().rows.forEach(function (c) { if (str_(c.buyerId) === u.id && str_(c.listingId) === lid && str_(c.ownerId) === ownerId) found = c; });
  var c;
  if (found) c = chatRow_(found.id);
  else {
    var id = rid_('C');
    var obj = { id: id, createdAt: now_(), updatedAt: now_(), listingId: lid, listingTitle: title, buyerId: u.id, buyerName: str_(u.name),
      ownerId: ownerId, ownerName: ownerName, lastMessage: '', lastSender: '', buyerUnread: 0, ownerUnread: 0, phoneStatus: '', log: '[]' };
    var row = appendObj_('Chats', obj);
    obj._row = row;
    c = obj;
    if (listing) updateRow_('Listings', listing._row, { chats: Number(listing.chats || 0) + 1 });
    saveLead_({ intent: INTENTS.chat, name: str_(u.name), phone: str_(u.phone), email: str_(u.email),
      details: listing ? 'Chat with ' + (ownerId === 'ADMIN' ? BRAND : 'owner ' + ownerName) : 'Chat with ' + BRAND,
      message: clean_(b.text, 500), listingId: lid, listingTitle: listing ? title : '', page: 'chat', source: '', userId: u.id }, ownerId === 'ADMIN');
  }
  var text = clean_(b.text, 2000);
  if (text) {
    pushMessage_(c, { s: 'buyer', n: str_(u.name), k: 'text', x: text });
    notifyChat_(c, 'owner', str_(u.name) + ' sent you a message', text);
  }
  if (b.requestPhone) requestPhoneOn_(c, u, listing);
  return { chatId: c.id };
}

function myRole_(c, uid) {
  if (str_(c.buyerId) === uid) return 'buyer';
  if (str_(c.ownerId) === uid) return 'owner';
  return '';
}

function chatSummary_(c, role, listingsById) {
  var l = listingsById[str_(c.listingId)] || null;
  return {
    id: c.id, role: role, listingId: str_(c.listingId), listingTitle: str_(c.listingTitle),
    listing: l ? { id: l.id, title: str_(l.title), photo: splitList_(l.photos)[0] || '', price: l.price, rent: l.rent, purpose: str_(l.purpose),
      locality: str_(l.locality), city: str_(l.city), category: str_(l.category), kind: str_(l.kind), status: str_(l.status) } : null,
    other: role === 'buyer' ? str_(c.ownerName) : str_(c.buyerName),
    otherIsFirm: role === 'buyer' && c.ownerId === 'ADMIN',
    lastMessage: str_(c.lastMessage), lastSender: str_(c.lastSender), updatedAt: ms_(c.updatedAt),
    unread: Number(role === 'buyer' ? c.buyerUnread : c.ownerUnread) || 0, phoneStatus: str_(c.phoneStatus)
  };
}

function listingsMap_() {
  var m = {};
  readAll_('Listings').rows.forEach(function (r) { m[str_(r.id)] = r; });
  return m;
}

function apiChats_(b, ctx) {
  var uid = ctx.user.id, lm = listingsMap_();
  var out = [];
  chatsLite_().rows.forEach(function (c) {
    var role = myRole_(c, uid);
    if (role) out.push(chatSummary_(c, role, lm));
  });
  out.sort(function (a, b2) { return b2.updatedAt - a.updatedAt; });
  return { chats: out, stamp: getStamp_('u_' + uid) };
}

function unreadFor_(uid) {
  var n = 0;
  chatsLite_().rows.forEach(function (c) {
    if (str_(c.buyerId) === uid) n += Number(c.buyerUnread || 0);
    else if (str_(c.ownerId) === uid) n += Number(c.ownerUnread || 0);
  });
  return n;
}

function apiPoll_(b, ctx) {
  var st = getStamp_('u_' + ctx.user.id);
  if (b.since && st && st <= Number(b.since)) return { changed: false, stamp: st };
  return { changed: true, stamp: st || Date.now(), unread: unreadFor_(ctx.user.id) };
}

function messagesView_(c, after) {
  var log = parseLog_(c);
  if (after) {
    var idx = -1;
    for (var i = 0; i < log.length; i++) if (log[i].i === after) idx = i;
    if (idx >= 0) log = log.slice(idx + 1);
  }
  var list = log.map(function (m) {
    return { id: m.i, t: m.t, from: m.s, name: m.n, type: m.k, text: m.x };
  });
  return list;
}

function apiMessages_(b, ctx) {
  var uid = ctx.user.id;
  var since = Number(b.since || 0);
  var st = getStamp_('c_' + b.chatId);
  if (since && st && st <= since) return { unchanged: true, stamp: st };
  var c = chatRow_(b.chatId);
  var role = myRole_(c, uid);
  if (!role) throw uerr_('Chat not found.', 'NOT_FOUND');
  var unreadKey = role === 'buyer' ? 'buyerUnread' : 'ownerUnread';
  if (Number(c[unreadKey] || 0) > 0) {
    var lock = LockService.getScriptLock();
    if (lock.tryLock(8000)) {
      try { var p = {}; p[unreadKey] = 0; updateRow_('Chats', c._row, p); c[unreadKey] = 0; } finally { lock.releaseLock(); }
      stamp_('u_' + uid);
    }
  }
  var listing = c.listingId ? findObj_('Listings', c.listingId) : null;
  var lm = {};
  if (listing) lm[listing.id] = listing;
  return {
    chat: chatSummary_(c, role, lm),
    messages: messagesView_(c, str_(b.after)),
    phoneMode: listing ? str_(listing.phoneMode) : '',
    stamp: st || Date.now()
  };
}

function apiSendMessage_(b, ctx) {
  var u = ctx.user, c = chatRow_(b.chatId), role = myRole_(c, u.id);
  if (!role) throw uerr_('Chat not found.', 'NOT_FOUND');
  var text = clean_(b.text, 2000);
  if (!text) throw uerr_('Type a message first.', 'VALIDATION');
  if (tooMany_('msg_' + u.id, 40, 60)) throw uerr_('You are sending messages too quickly. Please wait a moment.', 'RATE');
  var m = pushMessage_(c, { s: role, n: str_(u.name), k: 'text', x: text });
  notifyChat_(c, role === 'buyer' ? 'owner' : 'buyer', str_(u.name) + ' sent you a message', text);
  return { message: { id: m.i, t: m.t, from: m.s, name: m.n, type: m.k, text: m.x } };
}

function requestPhoneOn_(c, u, listing) {
  if (c.phoneStatus === 'shared') return 'shared';
  if (c.ownerId === 'ADMIN') {
    pushMessage_(c, { s: 'system', n: BRAND, k: 'phone', x: firmPhone_() });
    updateRow_('Chats', c._row, { phoneStatus: 'shared' });
    return 'shared';
  }
  if (listing && listing.phoneMode === 'direct') {
    pushMessage_(c, { s: 'system', n: str_(c.ownerName), k: 'phone', x: str_(listing.contactPhone) });
    updateRow_('Chats', c._row, { phoneStatus: 'shared' });
    return 'shared';
  }
  if (c.phoneStatus === 'requested') return 'requested';
  pushMessage_(c, { s: 'buyer', n: str_(u.name), k: 'phone_request', x: str_(u.name) + ' asked for your phone number.' });
  updateRow_('Chats', c._row, { phoneStatus: 'requested' });
  if (listing) saveLead_({ intent: INTENTS.number_request, name: str_(u.name), phone: str_(u.phone), email: str_(u.email),
    details: 'Owner: ' + str_(listing.ownerName), listingId: listing.id, listingTitle: str_(listing.title), page: 'chat', source: '', userId: u.id }, false);
  notifyChat_(c, 'owner', str_(u.name) + ' asked for your phone number', 'Open your chats on ' + BRAND + ' to share your number or reply.');
  return 'requested';
}

function firmPhone_() { return FIRM_PHONE; }

function apiRequestPhone_(b, ctx) {
  var u = ctx.user, c = chatRow_(b.chatId);
  if (myRole_(c, u.id) !== 'buyer') throw uerr_('Only the buyer can ask for the number.', 'FORBIDDEN');
  var listing = c.listingId ? findObj_('Listings', c.listingId) : null;
  return { phoneStatus: requestPhoneOn_(c, u, listing) };
}

function apiRespondPhone_(b, ctx) {
  var u = ctx.user, c = chatRow_(b.chatId);
  if (myRole_(c, u.id) !== 'owner') throw uerr_('Only the owner can share this number.', 'FORBIDDEN');
  var listing = c.listingId ? findObj_('Listings', c.listingId) : null;
  if (b.approve) {
    var phone = (listing && str_(listing.contactPhone)) || str_(u.phone);
    pushMessage_(c, { s: 'owner', n: str_(u.name), k: 'phone', x: phone });
    updateRow_('Chats', c._row, { phoneStatus: 'shared' });
    notifyChat_(c, 'buyer', str_(u.name) + ' shared their phone number', 'Open your chats on ' + BRAND + ' to see it.');
    return { phoneStatus: 'shared' };
  }
  pushMessage_(c, { s: 'system', n: BRAND, k: 'system', x: str_(u.name) + ' prefers to continue on chat for now.' });
  updateRow_('Chats', c._row, { phoneStatus: 'declined' });
  return { phoneStatus: 'declined' };
}

function apiSharePhone_(b, ctx) {
  var u = ctx.user, c = chatRow_(b.chatId), role = myRole_(c, u.id);
  if (!role) throw uerr_('Chat not found.', 'NOT_FOUND');
  pushMessage_(c, { s: role, n: str_(u.name), k: 'phone', x: str_(u.phone) });
  if (role === 'owner') updateRow_('Chats', c._row, { phoneStatus: 'shared' });
  notifyChat_(c, role === 'buyer' ? 'owner' : 'buyer', str_(u.name) + ' shared their phone number', 'Open your chats on ' + BRAND + ' to see it.');
  return { shared: true };
}

// ============================== ADMIN ==============================

function adminOverview_() {
  var L = readAll_('Listings').rows, leads = readAll_('Leads').rows, users = readAll_('Users').rows, chats = chatsLite_().rows;
  var dayAgo = Date.now() - 86400000;
  var count = function (arr, f) { return arr.filter(f).length; };
  return {
    pending: count(L, function (r) { return r.status === 'Pending'; }),
    live: count(L, function (r) { return r.status === 'Approved'; }),
    total: L.length,
    newLeads: count(leads, function (r) { return r.status === 'New'; }),
    leadsToday: count(leads, function (r) { return ms_(r.createdAt) > dayAgo; }),
    users: users.length,
    chats: chats.length,
    adminUnread: chats.reduce(function (n, c) { return n + (c.ownerId === 'ADMIN' ? Number(c.ownerUnread || 0) : 0); }, 0),
    verifiedToday: count(leads, function (r) { return ms_(r.createdAt) > dayAgo && str_(r.verified) === 'Yes'; }),
    followUpsDue: count(leads, function (r) { var t = ms_(r.followUpAt); return t && t <= endOfDayIst_() && r.status !== 'Closed' && r.status !== 'Not interested'; }),
    otp: otpStatus_(),
    sheetUrl: ss_().getUrl(),
    stamp: getStamp_('u_ADMIN')
  };
}

function endOfDayIst_() {
  var off = 330 * 60000, d = new Date(Date.now() + off);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59) - off;
}

function otpStatus_() {
  var last = parseJson_(PropertiesService.getScriptProperties().getProperty('OTP_LAST_ERROR'));
  return { on: otpOn_(), provider: OTP_NAMES[otpProvider_()] || '', enquiry: !!OTP_ON_ENQUIRY, sentToday: otpUsage_(), limit: OTP_DAILY_LIMIT,
    lastError: last && last.t > Date.now() - 2 * 86400000 ? last.d : '', lastErrorAt: last ? last.t : 0 };
}

function adminListings_() {
  var users = {};
  readAll_('Users').rows.forEach(function (u) { users[u.id] = u; });
  return readAll_('Listings').rows.filter(function (r) { return r.status !== 'Deleted'; }).map(function (r) {
    var o = fullView_(r);
    var u = users[str_(r.ownerId)];
    o.owner = u ? { name: str_(u.name), phone: str_(u.phone), email: str_(u.email), since: ms_(u.createdAt) } : null;
    o.views = Number(r.views || 0) + Number(cache_().get('v_' + r.id) || 0);
    return o;
  }).sort(newestFirst_);
}

function adminSetListing_(b) {
  var r = findObj_('Listings', b.id);
  if (!r) throw uerr_('Listing not found.', 'NOT_FOUND');
  var patch = { updatedAt: now_() };
  if (b.status) {
    if (LISTING_STATUSES.indexOf(b.status) < 0) throw uerr_('Unknown status.', 'VALIDATION');
    patch.status = b.status;
    if (b.status === 'Approved' && !r.approvedAt) patch.approvedAt = now_();
    if (b.status === 'Rejected') patch.rejectReason = clean_(b.rejectReason, 300);
    if (b.status === 'Approved') patch.rejectReason = '';
  }
  if (b.featured !== undefined) patch.featured = b.featured ? 'Yes' : 'No';
  if (b.tag !== undefined) patch.tag = clean_(b.tag, 30);
  updateRow_('Listings', r._row, patch);
  bumpPublic_();
  if (b.status && r.status !== b.status && r.source === 'owner') {
    var u = findObj_('Users', r.ownerId);
    if (u) {
      stamp_('u_' + u.id);
      if (b.status === 'Approved') notifyUser_(u, 'Your listing is live: ' + r.title,
        '<p>Good news — your listing <b>' + esc_(r.title) + '</b> (' + r.id + ') is now live on ' + BRAND + '.</p>' + btn_(SITE_URL + '/property.html?id=' + r.id, 'View your listing'));
      if (b.status === 'Rejected') notifyUser_(u, 'Your listing needs changes: ' + r.title,
        '<p>Your listing <b>' + esc_(r.title) + '</b> (' + r.id + ') was not approved.</p><p>Reason: ' + esc_(patch.rejectReason || 'Please check the details.') + '</p>' + btn_(SITE_URL + '/account.html', 'Edit and resubmit'));
    }
  }
  return { id: r.id, status: patch.status || r.status, featured: patch.featured || r.featured };
}

function adminSaveListing_(b) {
  var l = sanitizeListing_(b.listing, true);
  var existing = b.id ? findObj_('Listings', b.id) : null;
  if (b.id && !existing) throw uerr_('Listing not found.', 'NOT_FOUND');
  if (existing) {
    var merged = {};
    SCHEMA.Listings.forEach(function (k) { merged[k] = existing[k]; });
    Object.keys(l).forEach(function (k) { merged[k] = l[k]; });
    l = merged;
  }
  l.state = l.state || 'Maharashtra';
  if (!l.category || !l.purpose || !l.city || !l.locality) throw uerr_('Category, sale/rent, city and locality are required.', 'VALIDATION');
  if (!l.segment) l.segment = computeSegment_(l);
  if (!l.title) l.title = autoTitle_(l);
  l.updatedAt = now_();
  if (existing) {
    if (l.status === 'Approved' && !existing.approvedAt) l.approvedAt = now_();
    updateRow_('Listings', existing._row, l);
  } else {
    l.id = 'ST' + seq_('SEQ_LISTING', 1000);
    l.createdAt = now_();
    l.source = 'admin';
    l.ownerId = 'ADMIN';
    l.ownerName = BRAND;
    l.ownerRole = BRAND;
    l.status = l.status || 'Approved';
    if (l.status === 'Approved') l.approvedAt = now_();
    l.featured = l.featured || 'No';
    l.views = 0; l.chats = 0;
    appendObj_('Listings', l);
  }
  bumpPublic_();
  return { id: l.id, status: l.status };
}

function adminDeleteListing_(b) {
  var row = findRow_('Listings', b.id);
  if (row < 0) throw uerr_('Listing not found.', 'NOT_FOUND');
  var r = getRowObj_('Listings', row);
  if (b.trashPhotos) splitList_(r.photos).forEach(function (id) { if (!/^https?:/i.test(id)) { try { DriveApp.getFileById(id).setTrashed(true); } catch (e) {} } });
  deleteRow_('Listings', row);
  bumpPublic_();
  return { deleted: b.id };
}

function adminLeads_() {
  return readAll_('Leads').rows.map(function (r) {
    return { id: str_(r.id), createdAt: ms_(r.createdAt), status: str_(r.status), intent: str_(r.intent), name: str_(r.name),
      phone: str_(r.phone), verified: str_(r.verified), email: str_(r.email), details: str_(r.details), message: str_(r.message), listingId: str_(r.listingId),
      listingTitle: str_(r.listingTitle), page: str_(r.page), source: str_(r.source), notes: str_(r.notes),
      followUpAt: ms_(r.followUpAt), followUpNote: str_(r.followUpNote), remindedAt: ms_(r.remindedAt) };
  }).sort(function (a, b) { return b.createdAt - a.createdAt; });
}

/** Admin CRM: add a lead by hand (walk-in, phone call, Instagram...) or edit any lead, including its follow-up time. */
function adminSaveLead_(b) {
  var L = b.lead || {}, out = {};
  if (L.name !== undefined) out.name = clean_(L.name, 80);
  if (L.phone !== undefined) {
    out.phone = normPhone_(L.phone);
    if (!out.phone) throw uerr_('Enter a valid 10-digit mobile number.', 'VALIDATION');
  }
  if (L.email !== undefined) { out.email = clean_(L.email, 120); if (out.email && !validEmail_(out.email)) throw uerr_('That email address does not look right.', 'VALIDATION'); }
  if (L.intent !== undefined) out.intent = INTENTS[str_(L.intent)] || clean_(L.intent, 60) || INTENTS.other;
  if (L.details !== undefined) out.details = clean_(L.details, 1500);
  if (L.message !== undefined) out.message = clean_(L.message, 1500);
  if (L.source !== undefined) out.source = clean_(L.source, 200);
  if (L.notes !== undefined) out.notes = clean_(L.notes, 1000);
  if (L.status !== undefined) { if (LEAD_STATUSES.indexOf(L.status) < 0) throw uerr_('Unknown status.', 'VALIDATION'); out.status = L.status; }
  if (L.followUpNote !== undefined) out.followUpNote = clean_(L.followUpNote, 300);
  if (L.followUpAt !== undefined) {
    var t = Number(L.followUpAt) || 0;
    out.followUpAt = t ? new Date(t) : '';
    out.remindedAt = '';   // a new time means a new reminder
  }
  var id = str_(b.id);
  if (id) {
    var row = findRow_('Leads', id);
    if (row < 0) throw uerr_('Lead not found.', 'NOT_FOUND');
    if (out.name !== undefined && out.name.length < 2) throw uerr_('Enter the name.', 'VALIDATION');
    updateRow_('Leads', row, out);
  } else {
    if (!out.name || out.name.length < 2) throw uerr_('Enter the name.', 'VALIDATION');
    if (!out.phone) throw uerr_('Enter a valid 10-digit mobile number.', 'VALIDATION');
    var status = out.status;
    var lead = saveLead_(Object.assign({ intent: INTENTS.other, page: 'admin', source: 'Added by admin', verified: '' }, out), false);
    id = lead.id;
    if (status && status !== 'New') updateRow_('Leads', findRow_('Leads', id), { status: status });
  }
  if (out.followUpAt) noteFollowUp_(out.followUpAt.getTime());
  var reminders = out.followUpAt ? ensureFollowUpTrigger_() : null;
  return { id: id, reminders: reminders };
}

/** Deletes several leads at once (bottom rows first, so row numbers stay right). */
function adminDeleteLeads_(b) {
  var ids = (Array.isArray(b.ids) ? b.ids : []).map(str_).filter(Boolean).slice(0, 500);
  var rows = ids.map(function (id) { return findRow_('Leads', id); }).filter(function (r) { return r > 0; })
    .sort(function (x, y) { return y - x; });
  rows.forEach(function (r) { deleteRow_('Leads', r); });
  invalidate_('Leads');
  return { deleted: rows.length };
}

// ------------------------------ follow-up reminders (email) ------------------------------
var FOLLOWUP_EVERY_MIN = 1;                  // the reminder check runs every minute...
var FOLLOWUP_EARLY_MS = 30000;               // ...sends up to 30 seconds early, so a reminder is at most about a minute late
var FOLLOWUP_FULL_CHECK_MS = 15 * 60000;     // and looks at every lead at least every 15 minutes (catches edits made in the Sheet)

/** Time trigger, every minute: emails a reminder for each lead whose follow-up time has come.
 *  Stays cheap: it only reads the Leads sheet when the next saved follow-up time is near. */
function checkFollowUps() {
  var props = PropertiesService.getScriptProperties(), now = Date.now();
  var next = Number(props.getProperty('FU_NEXT')) || 0, last = Number(props.getProperty('FU_CHECKED')) || 0;
  if ((!next || next > now + FOLLOWUP_EARLY_MS) && now - last < FOLLOWUP_FULL_CHECK_MS) return 0;
  REQ = { memo: {}, now: new Date() };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return 0;
  var sent = 0, nextDue = 0;
  var later = function (t) { if (!nextDue || t < nextDue) nextDue = t; };
  try {
    var soon = Date.now() + FOLLOWUP_EARLY_MS;
    readAll_('Leads').rows.forEach(function (r) {
      var t = ms_(r.followUpAt);
      if (!t || ms_(r.remindedAt) || r.status === 'Closed' || r.status === 'Not interested') return;
      if (t > soon || sent >= 20) return later(t);                        // not yet, or the rest go on the next run
      if (sendFollowUpMail_(r)) { updateRow_('Leads', r._row, { remindedAt: new Date() }); sent++; }
      else later(Date.now() + 10 * 60000);                                // email failed (daily limit?): try again in 10 minutes
    });
    if (nextDue) props.setProperty('FU_NEXT', String(nextDue)); else props.deleteProperty('FU_NEXT');
    props.setProperty('FU_CHECKED', String(Date.now()));
  } finally { lock.releaseLock(); }
  return sent;
}

/** A follow-up time was saved: make sure the minute check looks at it in time. */
function noteFollowUp_(t) {
  if (!t) return;
  var props = PropertiesService.getScriptProperties(), next = Number(props.getProperty('FU_NEXT')) || 0;
  if (!next || t < next) props.setProperty('FU_NEXT', String(t));
}

function sendFollowUpMail_(r) {
  try {
    var to = adminEmail_();
    if (!to || MailApp.getRemainingDailyQuota() < 2) return false;
    var when = Utilities.formatDate(new Date(ms_(r.followUpAt)), 'Asia/Kolkata', 'EEE d MMM, h:mm a');
    var wa = 'https://wa.me/91' + str_(r.phone) + '?text=' + encodeURIComponent('Hi ' + firstName_(r.name) + ', this is ' + BRAND + '.');
    MailApp.sendEmail({
      to: to, name: BRAND + ' Reminders',
      subject: 'Call now: ' + str_(r.name) + ' (' + fmtPhone_(r.phone) + ')' + (r.followUpNote ? ' – ' + str_(r.followUpNote) : ''),
      htmlBody: wrapMail_('<p style="margin:0 0 10px;padding:8px 12px;border-radius:6px;background:#FFF2D2;color:#8C5B00"><b>Follow-up time: ' + esc_(when) + '</b></p>' +
        table_([['Name', r.name], ['Mobile', fmtPhone_(r.phone)], ['Reminder', r.followUpNote], ['Looking for', r.intent], ['Details', r.details],
          ['Message', r.message], ['Your notes', r.notes], ['Status', r.status], ['Lead no.', r.id]]) +
        btn_('tel:+91' + str_(r.phone), 'Call ' + firstName_(r.name)) + ' ' + btn_(wa, 'WhatsApp') + ' ' + btn_(SITE_URL + '/admin#leads', 'Open leads'))
    });
    return true;
  } catch (e) { return false; }
}

/** Makes sure the every-minute reminder check is installed (once). Needs permission the first time setup runs. */
function ensureFollowUpTrigger_() {
  try {
    var has = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'checkFollowUps'; });
    if (!has) ScriptApp.newTrigger('checkFollowUps').timeBased().everyMinutes(FOLLOWUP_EVERY_MIN).create();
    return true;
  } catch (e) { return false; }
}

function adminUpdateLead_(b) {
  var row = findRow_('Leads', b.id);
  if (row < 0) throw uerr_('Lead not found.', 'NOT_FOUND');
  var patch = {};
  if (b.status !== undefined) { if (LEAD_STATUSES.indexOf(b.status) < 0) throw uerr_('Unknown status.', 'VALIDATION'); patch.status = b.status; }
  if (b.notes !== undefined) patch.notes = clean_(b.notes, 1000);
  if (b.delete) { deleteRow_('Leads', row); return { deleted: b.id }; }
  updateRow_('Leads', row, patch);
  return { id: b.id };
}

function adminUsers_() {
  var counts = {};
  readAll_('Listings').rows.forEach(function (r) { var k = str_(r.ownerId); counts[k] = (counts[k] || 0) + 1; });
  return readAll_('Users').rows.map(function (u) {
    return { id: u.id, name: str_(u.name), phone: str_(u.phone), email: str_(u.email), status: str_(u.status),
      verified: str_(u.verified) === 'Yes', createdAt: ms_(u.createdAt), lastLoginAt: ms_(u.lastLoginAt), listings: counts[u.id] || 0 };
  }).sort(function (a, b) { return b.createdAt - a.createdAt; });
}

function adminSetUser_(b) {
  var row = findRow_('Users', b.id);
  if (row < 0) throw uerr_('User not found.', 'NOT_FOUND');
  if (b.resetPassword) {
    var temp = 'ST' + Math.floor(100000 + Math.random() * 899999);
    var salt = Utilities.getUuid();
    updateRow_('Users', row, { passHash: hashPw_(temp, salt), salt: salt });
    try { cache_().remove('fail_' + str_(getRowObj_('Users', row).phone)); } catch (e) {}
    return { tempPassword: temp };
  }
  if (b.status) {
    if (['Active', 'Blocked'].indexOf(b.status) < 0) throw uerr_('Unknown status.', 'VALIDATION');
    updateRow_('Users', row, { status: b.status });
  }
  return { id: b.id, status: b.status };
}

function adminChats_() {
  var lm = listingsMap_();
  return chatsLite_().rows.map(function (c) {
    var s = chatSummary_(c, 'owner', lm);
    s.buyerName = str_(c.buyerName); s.ownerName = str_(c.ownerName); s.firm = c.ownerId === 'ADMIN';
    s.unread = c.ownerId === 'ADMIN' ? Number(c.ownerUnread || 0) : 0;
    return s;
  }).sort(function (a, b) { return b.updatedAt - a.updatedAt; });
}

function adminMessages_(b) {
  var c = chatRow_(b.chatId);
  if (c.ownerId === 'ADMIN' && Number(c.ownerUnread || 0) > 0) updateRow_('Chats', c._row, { ownerUnread: 0 });
  var users = {};
  [c.buyerId, c.ownerId].forEach(function (id) { var u = id && id !== 'ADMIN' ? findObj_('Users', id) : null; if (u) users[id] = { name: str_(u.name), phone: str_(u.phone) }; });
  return { chat: { id: c.id, buyerName: str_(c.buyerName), ownerName: str_(c.ownerName), listingId: str_(c.listingId), listingTitle: str_(c.listingTitle),
    firm: c.ownerId === 'ADMIN', phoneStatus: str_(c.phoneStatus), buyer: users[c.buyerId] || null, owner: users[c.ownerId] || null },
    messages: messagesView_(c, '') };
}

function adminSend_(b) {
  var c = chatRow_(b.chatId);
  var text = clean_(b.text, 2000);
  if (!text) throw uerr_('Type a message first.', 'VALIDATION');
  var role = c.ownerId === 'ADMIN' ? 'owner' : 'admin';
  var m = pushMessage_(c, { s: role, n: BRAND, k: 'text', x: text });
  notifyChat_(c, 'buyer', BRAND + ' replied to you', text);
  if (role === 'admin') notifyChat_(c, 'owner', BRAND + ' sent a message in your chat', text);
  return { message: { id: m.i, t: m.t, from: m.s, name: m.n, type: m.k, text: m.x } };
}

// ============================== EMAIL + LOG ==============================

function money_(n) { n = Number(n || 0); return n ? n.toLocaleString('en-IN') : '—'; }

function table_(rows) {
  return '<table style="border-collapse:collapse;font:14px Arial,sans-serif;margin:12px 0">' + rows.filter(function (r) { return r[1]; }).map(function (r) {
    return '<tr><td style="padding:6px 12px 6px 0;color:#5B6B85;vertical-align:top">' + esc_(r[0]) + '</td><td style="padding:6px 0;color:#14213A"><b>' + esc_(r[1]).replace(/\n/g, '<br>') + '</b></td></tr>';
  }).join('') + '</table>';
}

function btn_(href, label) {
  return '<a href="' + esc_(href) + '" style="display:inline-block;margin:6px 6px 0 0;padding:10px 16px;background:#13233C;color:#fff;border-radius:6px;text-decoration:none;font:600 14px Arial,sans-serif">' + esc_(label) + '</a>';
}

function wrapMail_(html) {
  return '<div style="font:14px/1.5 Arial,sans-serif;color:#14213A;max-width:560px">' +
    '<div style="background:#13233C;color:#fff;padding:14px 18px;border-radius:8px 8px 0 0;font:700 16px Georgia,serif">' + BRAND +
    '<div style="color:#D9B66A;font:italic 13px Georgia,serif">Where Your Dreams Stand Tall</div></div>' +
    '<div style="border:1px solid #E2E7F0;border-top:0;padding:16px 18px;border-radius:0 0 8px 8px">' + html + '</div></div>';
}

function adminEmail_() {
  var to = setting_('NOTIFY_EMAIL', NOTIFY_EMAIL);
  if (to) return to;
  try { return Session.getEffectiveUser().getEmail(); } catch (e) { return ''; }
}

function notifyAdmin_(subject, html) {
  try {
    var to = adminEmail_();
    if (!to || MailApp.getRemainingDailyQuota() < 3) return;
    MailApp.sendEmail({ to: to, subject: subject, htmlBody: wrapMail_(html), name: BRAND + ' Website' });
  } catch (e) {}
}

function notifyUser_(u, subject, html) {
  try {
    if (!u || !u.email || MailApp.getRemainingDailyQuota() < 10) return;
    MailApp.sendEmail({ to: str_(u.email), subject: subject, htmlBody: wrapMail_('<p>Hi ' + esc_(firstName_(u.name)) + ',</p>' + html), name: BRAND });
  } catch (e) {}
}

function notifyChat_(c, toRole, subject, text) {
  try {
    var uid = toRole === 'buyer' ? c.buyerId : c.ownerId;
    if (uid === 'ADMIN') {
      var k0 = 'mail_' + c.id + '_ADMIN';
      if (cache_().get(k0)) return;
      cache_().put(k0, '1', 1800);
      notifyAdmin_('Chat: ' + subject, '<p>' + esc_(text) + '</p>' + btn_(SITE_URL + '/admin.html#chats', 'Reply in admin panel'));
      return;
    }
    var k = 'mail_' + c.id + '_' + uid;
    if (cache_().get(k)) return;
    var u = findObj_('Users', uid);
    if (!u || !u.email) return;
    cache_().put(k, '1', 1800);
    notifyUser_(u, subject, '<p>' + esc_(str_(text).slice(0, 300)) + '</p>' + btn_(SITE_URL + '/chats.html?c=' + c.id, 'Open chat'));
  } catch (e) {}
}

function logActivity_(type, listingId, userId, detail) {
  try { appendObj_('Activity', { createdAt: now_(), type: type, listingId: listingId || '', userId: userId || '', detail: detail || '' }); } catch (e) {}
}

// ============================== STARTER DATA ==============================

function seedStarterListings_() {
  var note = 'Added from details you shared earlier. Please check everything, add photos, then Approve.';
  var base = { status: 'Pending', featured: 'No', source: 'admin', ownerId: 'ADMIN', ownerName: BRAND, ownerRole: BRAND,
    state: 'Maharashtra', district: 'Pune', city: 'Pune', views: 0, chats: 0, adminNotes: note };
  var items = [
    { kind: 'project', purpose: 'sale', category: 'Residential', propertyType: 'Apartment', segment: 'Under Construction',
      title: '2 BHK, 4 BHK & 4 BHK duplex homes on NIBM Road', bhk: '2,4',
      configurations: '2 BHK, 4 BHK, 4 BHK Duplex', carpetArea: 777, areaUnit: 'sq ft', price: 8900000, priceMax: 19000000,
      priceNote: '2 BHK — 777 & 795 sq ft carpet — from ₹89 Lakh\n4 BHK — 1,590 sq ft carpet — ₹1.78 Cr\n4 BHK Duplex — 1,590 sq ft carpet — ₹1.90 Cr',
      possession: 'Under construction', reraNumber: 'PR1260002500843', locality: 'NIBM Road',
      amenities: 'Smart door lock', highlights: 'Sample flat ready to visit\nSmart lock at every entrance\nMahaRERA registered project',
      description: 'Spacious 2 BHK, 4 BHK and 4 BHK duplex homes on NIBM Road, Pune. 2 BHK homes start at ₹89 Lakh with 777–795 sq ft carpet area. The 4 BHK (1,590 sq ft carpet) is priced at ₹1.78 Cr and the 4 BHK duplex at ₹1.90 Cr. Book a sample flat visit with Stand Tall Realty.',
      adminNotes: note + ' Confirm possession status.' },
    { kind: 'project', purpose: 'sale', category: 'Residential', propertyType: 'Apartment', segment: 'Under Construction',
      title: '1, 2, 3 BHK & 4 BHK duplex homes at Parge Nagar, Kondhwa', bhk: '1,2,3,4',
      configurations: '1 BHK, 2 BHK, 3 BHK, 4 BHK Duplex', carpetArea: 421, areaUnit: 'sq ft', price: 4900000,
      priceNote: '1 BHK — 421–539 sq ft — from ₹49 Lakh\n2 BHK — 732–740 sq ft — from ₹81 Lakh\n3 BHK — 882–887 sq ft — from ₹99 Lakh\n4 BHK Duplex — 1,549 sq ft — price on request',
      possession: 'Under construction', possessionDate: 'September 2027', locality: 'Parge Nagar', landmark: 'Kondhwa',
      highlights: '22-storey tower\nPossession September 2027\nSample flat ready to visit',
      description: 'New 1, 2 and 3 BHK homes and 4 BHK duplexes in a 22-storey tower at Parge Nagar, Kondhwa. 1 BHK from ₹49 Lakh, 2 BHK from ₹81 Lakh and 3 BHK from ₹99 Lakh. Possession September 2027.' },
    { kind: 'property', purpose: 'rent', category: 'Residential', propertyType: 'Apartment', segment: 'Rental',
      title: '4.5 BHK flat for rent near NIBM High Street', bhk: '4.5', rent: 60000, deposit: 150000,
      possession: 'Ready to move', floor: '4', parking: '2', locality: 'NIBM', landmark: 'NIBM High Street',
      highlights: 'Ready to move in\n4th floor\n2 car parkings',
      description: 'Large 4.5 BHK flat for rent near NIBM High Street. Rent ₹60,000 per month, deposit ₹1.5 Lakh. 4th floor with 2 car parkings. Ready to move in.' },
    { kind: 'property', purpose: 'rent', category: 'Residential', propertyType: 'Apartment', segment: 'Rental',
      title: 'Fully furnished 3 BHK for rent near D-Mart, Kondhwa', bhk: '3', rent: 30000, deposit: 55000, furnishing: 'Fully furnished',
      possession: 'Ready to move', locality: 'Kondhwa', landmark: 'Near D-Mart, Kondhwa',
      amenities: 'Swimming pool, Lift, Power backup',
      highlights: 'View of Bopdev Ghat\n2 lifts and 2 staircases, 4 flats per floor\nInverter backup\nClose to Parge Nagar, NIBM and D-Mart',
      description: 'Fully furnished 3 BHK flat for rent near D-Mart, Kondhwa. Rent ₹30,000 per month with ₹55,000 deposit. Bopdev Ghat view, swimming pool, 2 lifts and 2 staircases with just 4 flats per floor, and inverter backup.' },
    { kind: 'property', purpose: 'sale', category: 'Residential', propertyType: 'Apartment', segment: 'Resale',
      title: 'Fully furnished 3 BHK for sale near D-Mart, Kondhwa', bhk: '3', price: 12000000, negotiable: 'Yes', furnishing: 'Fully furnished',
      possession: 'Ready to move', locality: 'Kondhwa', landmark: 'Near D-Mart, Kondhwa',
      amenities: 'Swimming pool, Lift, Power backup',
      highlights: 'View of Bopdev Ghat\n2 lifts and 2 staircases, 4 flats per floor\nPrice negotiable',
      description: 'Fully furnished 3 BHK flat for sale near D-Mart, Kondhwa at ₹1.20 Cr (negotiable). Bopdev Ghat view, swimming pool, 2 lifts and 2 staircases with 4 flats per floor. Also available on rent.' }
  ];
  items.forEach(function (it) {
    var l = {};
    Object.keys(base).forEach(function (k) { l[k] = base[k]; });
    Object.keys(it).forEach(function (k) { l[k] = it[k]; });
    l.id = 'ST' + seq_('SEQ_LISTING', 1000);
    l.createdAt = now_(); l.updatedAt = now_();
    appendObj_('Listings', l);
  });
}

  var fresh = !rt.__state().props.SETUP_VERSION;
  route_({ action: 'listings' });
  if (fresh) { OTP_DEMO = false; /* Demo-mode sample data (runs once in the visitor's browser when API_URL is empty). */
var A = route_({ action: 'adminLogin', password: 'demo1234' }).data.adminToken;
var coords = { ST1001: [18.4769, 73.9067], ST1002: [18.4612, 73.8990], ST1003: [18.4735, 73.9105], ST1004: [18.4673, 73.8907], ST1005: [18.4676, 73.8911] };
Object.keys(coords).forEach(function (id) {
  route_({ action: 'adminSaveListing', adminToken: A, id: id, listing: { lat: coords[id][0], lng: coords[id][1] } });
  route_({ action: 'adminSetListing', adminToken: A, id: id, status: 'Approved', featured: id === 'ST1001' || id === 'ST1002' });
});
var ravi = route_({ action: 'register', name: 'Ravi Deshmukh', phone: '9000011111', password: 'demo1234', email: '' }).data.token;
var sneha = route_({ action: 'register', name: 'Sneha Patil', phone: '9000022222', password: 'demo1234', email: '' }).data.token;
var samples = [
  [ravi, { purpose: 'sale', category: 'Residential', propertyType: 'Apartment / Flat', bhk: '2', carpetArea: 850, areaUnit: 'sq ft', price: 7200000, negotiable: 'Yes',
    furnishing: 'Semi furnished', floor: '6', totalFloors: '12', facing: 'East', parking: '1 covered', bathrooms: '2', balconies: '2', possession: 'Ready to move', ageOfProperty: '1–5 years',
    city: 'Pune', district: 'Pune', locality: 'Undri', landmark: 'Off NIBM–Undri Road', lat: 18.4521, lng: 73.9142, amenities: 'Lift, Car parking, Security, Gym, Power backup',
    description: 'Sample listing. Bright east-facing 2 BHK on the 6th floor with two balconies and a covered parking. Society has a gym and 24-hour security.', ownerRole: 'Owner', phoneMode: 'approval' }],
  [ravi, { purpose: 'rent', category: 'Commercial', propertyType: 'Shop', carpetArea: 450, areaUnit: 'sq ft', rent: 35000, deposit: 200000, furnishing: 'Bare shell', floor: 'Ground', possession: 'Ready to move',
    city: 'Pune', district: 'Pune', locality: 'Kondhwa', landmark: 'Kondhwa Main Road', lat: 18.4712, lng: 73.8879,
    description: 'Sample listing. Ground-floor shop on a busy stretch of Kondhwa Main Road with a 20 ft frontage. Suitable for a clinic, pharmacy or showroom.', ownerRole: 'Owner', phoneMode: 'direct' }],
  [sneha, { purpose: 'sale', category: 'Plot', propertyType: 'NA plot', plotType: 'NA (non-agricultural)', carpetArea: 2500, areaUnit: 'sq ft', price: 3800000, facing: 'North',
    city: 'Pune', district: 'Pune', locality: 'Uruli Devachi', landmark: 'Near Saswad Road', lat: 18.4521, lng: 73.9562,
    description: 'Sample listing. Clear-title NA plot with road access on two sides, in a growing residential pocket near Saswad Road.', ownerRole: 'Owner', phoneMode: 'approval' }],
  [sneha, { purpose: 'rent', category: 'Residential', propertyType: 'Apartment / Flat', bhk: '1', carpetArea: 520, areaUnit: 'sq ft', rent: 18000, deposit: 60000, maintenance: 1200,
    furnishing: 'Semi furnished', floor: '3', totalFloors: '7', possession: 'Ready to move', tenantPreference: 'Family', availableFrom: '2026-12-01',
    city: 'Pune', district: 'Pune', locality: 'Wanowrie', landmark: 'Near Jagtap Chowk', lat: 18.4881, lng: 73.9015, amenities: 'Lift, Security, Water storage',
    description: 'Sample listing. Neat 1 BHK in a quiet lane close to Jagtap Chowk, with a modular kitchen and wardrobes.', ownerRole: 'Owner', phoneMode: 'direct' }]
];
samples.forEach(function (s) {
  var id = route_({ action: 'submitListing', token: s[0], listing: s[1] }).data.id;
  route_({ action: 'adminSetListing', adminToken: A, id: id, status: 'Approved', tag: 'Sample' });
});
route_({ action: 'adminSaveListing', adminToken: A, listing: { kind: 'project', purpose: 'sale', category: 'Residential', propertyType: 'Apartment / Flat',
  configurations: '2, 3 BHK', bhk: '2,3', carpetArea: 760, areaUnit: 'sq ft', price: 8600000, priceMax: 11500000, possession: 'Ready to move',
  priceNote: '2 BHK — 760 sq ft — from ₹86 Lakh\n3 BHK — 1,020 sq ft — from ₹1.15 Cr', city: 'Pune', district: 'Pune', locality: 'Mohammadwadi',
  landmark: 'Near NIBM Annexe', lat: 18.4789, lng: 73.9231, amenities: 'Lift, Car parking, Swimming pool, Club house, Gym, Garden', tag: 'Sample', featured: 'Yes',
  highlights: 'Ready possession\nClub house and pool\n5 minutes to NIBM Annexe',
  description: 'Sample listing. Ready-to-move 2 and 3 BHK homes in Mohammadwadi with a club house, pool and landscaped garden.' } });
 OTP_DEMO = true; }
  rt.__flush();
  window.DemoBackend = {
    call: function (body) { var r = JSON.parse(JSON.stringify(route_(JSON.parse(JSON.stringify(body))))); rt.__flush(); return r; },
    fileUrl: function (id) { var f = rt.__file(id); return f ? 'data:' + f.mime + ';base64,' + f.data : ''; },
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); },
    mails: rt.__mails
  };
})();
