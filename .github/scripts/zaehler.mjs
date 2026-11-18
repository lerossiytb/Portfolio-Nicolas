// GitHub Action: Zähler abgleichen und auf Branch "zaehler" speichern.
// Aufruf: node zaehler.mjs <datenordner>
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const kern = require("../../aufrufe/kern.js");
const cfg = JSON.parse(fs.readFileSync(new URL("../../aufrufe/seiten.json", import.meta.url)));

const dir = process.argv[2];
const read = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(dir, f))); } catch { return d; } };
let state = read("besuche.json", {});
// Übergang vom alten Format: bisherige Totale als Ausgangspunkt
if (!state.totale) {
  const alt = read("aufrufe.json", {});
  state.totale = Object.fromEntries(Object.entries(alt).filter(([, v]) => typeof v === "number"));
}

state = await kern.abgleich(state, cfg);
const zh = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Zurich", dateStyle: "short", timeStyle: "short" });
state.stand = zh.format(new Date(state.stand_ms));
for (const b of state.besuche) b.zeit = zh.format(new Date(kern.slotMs(b.slot)));

const out = { stand: state.stand };
for (const k of kern.zaehlerListe(cfg)) out[k] = k in state.totale ? state.totale[k] : "fehler";
fs.writeFileSync(path.join(dir, "aufrufe.json"), JSON.stringify(out, null, 2) + "\n");
fs.writeFileSync(path.join(dir, "besuche.json"), JSON.stringify(state, null, 2) + "\n");
console.log(JSON.stringify(out, null, 2));
console.log(`${state.besuche.length} Einträge im Besuchsprotokoll`);
