#!/usr/bin/env python3
"""Holt die Zählerstände von abacus (nur /get) und führt ein Besuchsprotokoll.

Jede Seite zählt doppelt: einmal den Gesamtwert (z. B. "monami-views") und
einmal einen 10-Minuten-Zähler ("monami-views_202611181020", Zeit in UTC).
Steigt ein Gesamtwert, sucht dieses Skript die 10-Minuten-Zähler seit der
letzten Prüfung ab und schreibt die gefundenen Besuche in besuche.json.

Aufruf: zaehler.py <ordner mit bisherigen dateien>  (schreibt dorthin zurück)
"""
import json
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

BASE = "https://abacus.jasoncameron.dev/get/nicolasrossi-ch/"
KEYS = [
    "family-views", "family-sound", "family-paywall",
    "monami-views", "monami-lastpage",
    "rosarot-views", "missionpadel-views",
]
SLOT = timedelta(minutes=10)
MAX_LOOKBACK = timedelta(days=14)
ZH = ZoneInfo("Europe/Zurich")


def get(key):
    """Zahl, 0 bei 404, None bei technischem Fehler."""
    for _ in range(3):
        try:
            with urllib.request.urlopen(BASE + key, timeout=20) as r:
                return int(json.load(r).get("value", 0))
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return 0
        except Exception:
            pass
    return None


def slot_floor(t):
    return t.replace(minute=t.minute // 10 * 10, second=0, microsecond=0)


def slot_id(t):
    return t.strftime("%Y%m%d%H%M")


def main(folder):
    folder = Path(folder)
    now = datetime.now(timezone.utc)
    cur_slot = slot_floor(now)

    def load(name, default):
        p = folder / name
        try:
            return json.loads(p.read_text())
        except Exception:
            return default

    prev = load("aufrufe.json", {})
    log = load("besuche.json", {"geprueft_bis": {}, "besuche": []})
    log.setdefault("geprueft_bis", {})
    log.setdefault("besuche", [])

    with ThreadPoolExecutor(8) as ex:
        totals = dict(zip(KEYS, ex.map(get, KEYS)))

    besuche = {(b["key"], b["slot"]): b for b in log["besuche"]}
    for key in KEYS:
        total = totals[key]
        if total is None:
            continue
        before = prev.get(key) if isinstance(prev.get(key), int) else None
        start_s = log["geprueft_bis"].get(key)
        if start_s is None:
            # Erster Lauf für diesen Zähler: nur Startpunkt merken.
            log["geprueft_bis"][key] = slot_id(cur_slot)
            continue
        if before is not None and total <= before:
            log["geprueft_bis"][key] = slot_id(cur_slot)
            continue
        start = datetime.strptime(start_s, "%Y%m%d%H%M").replace(tzinfo=timezone.utc)
        start = max(start - SLOT, cur_slot - MAX_LOOKBACK)
        slots = []
        t = start
        while t <= cur_slot:
            slots.append(t)
            t += SLOT
        with ThreadPoolExecutor(8) as ex:
            values = list(ex.map(lambda s: get(f"{key}_{slot_id(s)}"), slots))
        if any(v is None for v in values):
            print(f"{key}: einzelne Zeitzähler nicht erreichbar, nächstes Mal erneut")
        else:
            log["geprueft_bis"][key] = slot_id(cur_slot)
        for s, v in zip(slots, values):
            if v:
                besuche[(key, slot_id(s))] = {
                    "key": key,
                    "slot": slot_id(s),
                    "zeit": s.astimezone(ZH).strftime("%Y-%m-%d %H:%M"),
                    "anzahl": v,
                }

    log["besuche"] = sorted(besuche.values(), key=lambda b: (b["slot"], b["key"]), reverse=True)
    stand = now.astimezone(ZH).strftime("%Y-%m-%d %H:%M")
    log["stand"] = stand

    out = {"stand": stand}
    for key in KEYS:
        out[key] = totals[key] if totals[key] is not None else "fehler"
    (folder / "aufrufe.json").write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n")
    (folder / "besuche.json").write_text(json.dumps(log, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps(out, indent=2, ensure_ascii=False))
    print(f"{len(log['besuche'])} Einträge im Besuchsprotokoll")


if __name__ == "__main__":
    main(sys.argv[1])
