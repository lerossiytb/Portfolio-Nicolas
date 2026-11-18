/* Abgleich der Aufrufzähler – läuft im Browser (/aufrufe/) und in der GitHub Action (Node).
 *
 * Zähler bei abacus (Namespace nicolasrossi-ch):
 *   <id>-views                 Total Aufrufe einer Seite
 *   <id>-views_<slot>          Aufrufe, die in diesem 10-Minuten-Fenster begonnen haben (UTC, JJJJMMTTHHmm)
 *   <id>_<slot>_s<i>           Besuche aus diesem Fenster, die Abschnitt i erreicht haben
 *   <id>_<slot>_t<sek>         Besuche aus diesem Fenster, die mindestens <sek> Sekunden geblieben sind
 *   <event>, <event>_<slot>    Ereignisse wie family-sound
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.NrKern = factory();
})(this, function () {
  var SLOT = 6e5; // 10 Minuten
  var LOOKBACK = 14 * 864e5;
  var RECHECK = 3 * 36e5; // Details junger Besuche erneut prüfen
  var API = "https://abacus.jasoncameron.dev/get/nicolasrossi-ch/";

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function slotId(ms) {
    var d = new Date(Math.floor(ms / SLOT) * SLOT);
    return "" + d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + pad(d.getUTCHours()) + pad(d.getUTCMinutes());
  }
  function slotMs(s) {
    return Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8), +s.slice(8, 10), +s.slice(10, 12));
  }

  // Zahl, 0 bei 404, null bei technischem Fehler
  function getVal(key) {
    var tries = 0;
    function once() {
      return fetch(API + key, { cache: "no-store" }).then(function (r) {
        if (r.status === 404) return 0;
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json().then(function (j) { return j.value | 0; });
      }).catch(function () {
        return ++tries < 3 ? new Promise(function (ok) { setTimeout(ok, 800 * tries); }).then(once) : null;
      });
    }
    return once();
  }

  // Führt Aufgaben mit höchstens n gleichzeitig aus
  function pool(items, n, fn) {
    var out = new Array(items.length), i = 0;
    function next() {
      if (i >= items.length) return Promise.resolve();
      var k = i++;
      return Promise.resolve(fn(items[k], k)).then(function (v) { out[k] = v; return next(); });
    }
    var w = [];
    for (var j = 0; j < Math.min(n, items.length); j++) w.push(next());
    return Promise.all(w).then(function () { return out; });
  }

  function zaehlerListe(cfg) {
    var keys = [];
    cfg.seiten.forEach(function (s) {
      keys.push(s.id + "-views");
      Object.keys(s.events || {}).forEach(function (e) { keys.push(e); });
    });
    return keys;
  }

  function abgleich(state, cfg, opts) {
    opts = opts || {};
    var get = opts.get || getVal;
    var now = opts.now || Date.now();
    var cur = slotId(now);
    state = JSON.parse(JSON.stringify(state || {}));
    state.geprueft_bis = state.geprueft_bis || {};
    state.totale = state.totale || {};
    state.besuche = state.besuche || [];
    var byId = {};
    state.besuche.forEach(function (b) { byId[b.key + "|" + b.slot] = b; });
    var keys = zaehlerListe(cfg);
    var seiteVon = {};
    cfg.seiten.forEach(function (s) { seiteVon[s.id + "-views"] = s; });

    return pool(keys, 6, get).then(function (totals) {
      var jobs = [];
      keys.forEach(function (key, i) {
        var total = totals[i];
        if (total == null) return;
        var prev = state.totale[key], from = state.geprueft_bis[key];
        if (from == null) { state.geprueft_bis[key] = cur; return; } // erster Lauf: Startpunkt
        if (typeof prev === "number" && total <= prev) { state.geprueft_bis[key] = cur; return; }
        var start = Math.max(slotMs(from) - SLOT, now - LOOKBACK), slots = [];
        for (var t = start; t <= now; t += SLOT) slots.push(slotId(t));
        jobs.push(pool(slots, 6, function (s) { return get(key + "_" + s); }).then(function (vals) {
          if (vals.indexOf(null) === -1) state.geprueft_bis[key] = cur;
          vals.forEach(function (v, j) {
            if (!v) return;
            var id = key + "|" + slots[j];
            if (!byId[id]) { byId[id] = { key: key, slot: slots[j] }; state.besuche.push(byId[id]); }
            byId[id].anzahl = v;
          });
        }));
      });
      return Promise.all(jobs).then(function () {
        totals.forEach(function (v, i) { if (v != null) state.totale[keys[i]] = v; });
      });
    }).then(function () {
      // Details (Abschnitte, Dauer) für junge oder noch unvollständige Besuche
      var todo = state.besuche.filter(function (b) {
        return seiteVon[b.key] && (!b.abschnitte || now - slotMs(b.slot) < RECHECK);
      });
      return pool(todo, 2, function (b) {
        var s = seiteVon[b.key], dk = [];
        for (var i = 0; i < s.abschnitte.length; i++) dk.push(s.id + "_" + b.slot + "_s" + i);
        cfg.dauer.forEach(function (d) { dk.push(s.id + "_" + b.slot + "_t" + d); });
        return pool(dk, 6, get).then(function (v) {
          if (v.indexOf(null) !== -1) return;
          b.abschnitte = v.slice(0, s.abschnitte.length);
          b.dauer = {};
          cfg.dauer.forEach(function (d, j) { b.dauer[d] = v[s.abschnitte.length + j]; });
        });
      });
    }).then(function () {
      state.besuche.sort(function (a, b) { return a.slot < b.slot ? 1 : a.slot > b.slot ? -1 : a.key < b.key ? -1 : 1; });
      state.stand_ms = now;
      return state;
    });
  }

  return { abgleich: abgleich, slotId: slotId, slotMs: slotMs, zaehlerListe: zaehlerListe, getVal: getVal };
});
