/* Log in page: the Android app's first screen, and /login on the website. */
(function () {
  var ST = window.ST;
  var raw = '';
  try { raw = new URLSearchParams(location.search).get('next') || ''; } catch (e) {}
  var next = /^\/(?!\/)[^\s\\]*$/.test(raw) && !/^\/login\b/.test(raw) ? raw : 'index.html';
  if (ST.Auth.user() && ST.Auth.token()) { location.replace(next); return; }
  var box = document.getElementById('login-box');
  ST.openLogin('', 'login', { container: box }).then(function () {
    setTimeout(function () { location.replace(next); }, 500);
  });
})();
