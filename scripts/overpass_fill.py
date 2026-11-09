#!/usr/bin/env python3
"""Overpass ile il basina durak + ilce siniri indirir (onbellege), mevcut OSM JSON'larina birlestirir.

Kullanim:
  python scripts/overpass_fill.py fetch CACHE_DIR [plaka ...]    # Overpass'tan indir (yeniden denenebilir)
  python scripts/overpass_fill.py merge CACHE_DIR                # src/data/real/osm/*.json'a ekle + rapor verisi yaz
Veri: (c) OpenStreetMap contributors, ODbL. Uydurma yok: adsiz duraklar eklenmez, sadece sayilir.
"""
import sys, os, json, time, re, unicodedata, urllib.request, urllib.parse, collections

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
OSMDIR = os.path.join(ROOT, "src/data/real/osm")
MIRRORS = ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter",
           "https://overpass.kumi.systems/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"]
UA = {"User-Agent": "Rota81DataBot/1.0 (https://github.com/yusufydegirmenci/rota81)"}

STOPS_Q = """[out:json][timeout:300];
area["ISO3166-2"="TR-%s"]["boundary"="administrative"]->.a;
(nwr(area.a)["highway"="bus_stop"];
 nwr(area.a)["public_transport"~"^(platform|stop_position|station)$"];
 nwr(area.a)["railway"~"^(tram_stop|station|halt)$"];
 nwr(area.a)["amenity"~"^(ferry_terminal|bus_station)$"];);
out center tags;"""
DIST_Q = """[out:json][timeout:300];
area["ISO3166-2"="TR-%s"]["boundary"="administrative"]->.a;
rel(area.a)["boundary"="administrative"]["admin_level"="6"];
out geom;"""


def fold(s):
    s = (s or "").replace("İ", "i").replace("I", "ı").lower()
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    for a, b in (("ı", "i"), ("ş", "s"), ("ğ", "g"), ("ü", "u"), ("ö", "o"), ("ç", "c")):
        s = s.replace(a, b)
    return re.sub(r"\s+(ilcesi|ili|belediyesi)$", "", s.strip())


def stop_mode(t):
    rw, pt, am = t.get("railway"), t.get("public_transport"), t.get("amenity")
    if am == "ferry_terminal": return "f"
    if am == "bus_station": return "o"
    if rw == "tram_stop": return "t"
    if rw in ("station", "halt") or pt == "station" or t.get("station"):
        if t.get("station") == "subway" or t.get("subway") == "yes": return "m"
        if t.get("station") == "light_rail" or t.get("light_rail") == "yes": return "l"
        if rw in ("station", "halt"): return "r"
    if t.get("highway") == "bus_stop": return "b"
    if pt in ("platform", "stop_position"):
        for k, m in (("subway", "m"), ("light_rail", "l"), ("tram", "t"), ("train", "r"),
                     ("ferry", "f"), ("bus", "b"), ("trolleybus", "b")):
            if t.get(k) == "yes": return m
        return "b"
    return None


def post(q, log):
    err = None
    for attempt in range(6):
        m = MIRRORS[attempt % len(MIRRORS)] if attempt else MIRRORS[0]
        try:
            req = urllib.request.Request(m, data=urllib.parse.urlencode({"data": q}).encode(), headers=UA)
            body = urllib.request.urlopen(req, timeout=400).read()
            d = json.loads(body)
            if "elements" in d:
                log.append((m, "ok")); return d
            err = "no elements: " + str(d)[:100]
        except Exception as e:
            err = f"{type(e).__name__} {e}"
        log.append((m, "FAIL " + str(err)[:100]))
        time.sleep(5 + attempt * 10)
    raise RuntimeError(err)


def fetch(cache, plakas):
    os.makedirs(cache, exist_ok=True)
    logf = os.path.join(cache, "fetch_log.json")
    logs = json.load(open(logf)) if os.path.exists(logf) else {}
    for p in plakas:
        for kind, q in (("stops", STOPS_Q), ("dist", DIST_Q)):
            fn = os.path.join(cache, f"{p}_{kind}.json")
            if os.path.exists(fn): continue
            log = []
            try:
                d = post(q % p, log)
                json.dump(d, open(fn, "w", encoding="utf-8"), ensure_ascii=False)
                print(p, kind, len(d["elements"]), flush=True)
            except Exception as e:
                print(p, kind, "FAILED", e, flush=True)
            logs[f"{p}_{kind}"] = log
            json.dump(logs, open(logf, "w"), ensure_ascii=False, indent=1)
            time.sleep(3)


if __name__ == "__main__":
    cmd, cache = sys.argv[1], sys.argv[2]
    if cmd == "fetch":
        ps = sys.argv[3:] or [f"{i:02d}" for i in range(1, 82)]
        fetch(cache, ps)
