/* Aufrufzähler für nicolasrossi.ch – nur Zahlen, keine Personen- oder Gerätedaten, keine Cookies.
 * Erfasst pro Besuch: Startzeit (10-Minuten-Fenster), erreichte Abschnitte, Verweildauer.
 * Einbinden: <script src="/zaehler.js" data-page="home" defer></script>
 * Eigene Besuche ausschliessen: Seite einmal mit ?ich=1 öffnen oder /aufrufe/ besuchen. */
(function () {
  var me = document.currentScript, page = me && me.getAttribute("data-page");
  var q = window.nrQ || [], qs = window.nrS || [];
  window.nrHit = function () {};
  window.nrSec = function () {};
  if (!page) return;
  try {
    if (/[?&]ich=1/.test(location.search)) localStorage.setItem("nr_me", "1");
    if (localStorage.getItem("nr_me") === "1" || /[?&]danke=1/.test(location.search)) return;
  } catch (e) {}

  var API = "https://abacus.jasoncameron.dev/hit/nicolasrossi-ch/";
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function send(k) { try { fetch(API + k, { mode: "cors", keepalive: true }).catch(function () {}); } catch (e) {} }
  function once(k) { if (ss("nrk_" + k)) return; ss("nrk_" + k, "1"); send(k); }

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  var d = new Date(), slot = ss("nrv_" + page);
  if (!slot) {
    slot = "" + d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + pad(d.getUTCHours()) + pad(Math.floor(d.getUTCMinutes() / 10) * 10);
    ss("nrv_" + page, slot);
    send(page + "-views");
    send(page + "-views_" + slot);
  }

  window.nrHit = function (k) { once(k); once(k + "_" + slot); };
  window.nrSec = function (i) { once(page + "_" + slot + "_s" + i); };
  q.forEach(function (k) { window.nrHit(k); });
  qs.forEach(function (i) { window.nrSec(i); });

  // Verweildauer: nur Zeit, in der die Seite sichtbar ist
  var marks = [10, 30, 60, 120, 300, 600], sec = +(ss("nrt_" + page) || 0);
  var iv = setInterval(function () {
    if (document.visibilityState !== "visible") return;
    sec++;
    if (sec % 5 === 0) ss("nrt_" + page, sec);
    marks.forEach(function (m) { if (sec >= m) once(page + "_" + slot + "_t" + m); });
    if (sec >= marks[marks.length - 1]) clearInterval(iv);
  }, 1000);

  // Abschnitte: gilt als erreicht, wenn sein Anfang die Bildschirmmitte passiert oder er fast ganz sichtbar ist
  fetch("/aufrufe/seiten.json").then(function (r) { return r.json(); }).then(function (cfg) {
    var s = (cfg.seiten || []).filter(function (x) { return x.id === page; })[0];
    if (!s || s.manuell || !s.sel || !("IntersectionObserver" in window)) return;
    var els = Array.prototype.slice.call(document.querySelectorAll(s.sel));
    function cb(es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = els.indexOf(e.target);
        if (i > -1) window.nrSec(i);
      });
    }
    var a = new IntersectionObserver(cb, { rootMargin: "0px 0px -50% 0px", threshold: 0 });
    var b = new IntersectionObserver(cb, { threshold: 0.9 });
    els.forEach(function (el) { a.observe(el); b.observe(el); });
  }).catch(function () {});
})();
