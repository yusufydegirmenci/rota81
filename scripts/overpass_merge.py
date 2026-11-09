#!/usr/bin/env python3
"""Overpass onbellegi (overpass_fill.py fetch) + GTFS beslemelerini src/data/real/osm/{plaka}.json'a birlestirir.

Kullanim: python scripts/overpass_merge.py CACHE_DIR GTFS_DIR RAPOR_JSON
  GTFS_DIR/<ad>/feed.zip ; ad iz_* (Izmir BB) veya kk_<sehir> (Egezenn/kk-gtfs, KentKart topluluk derlemesi)
Kural: uydurma yok. Adsiz duraklar eklenmez (sayilir); ilce poligonu disindaki duraklar eklenmez.
Kisayol: GTFS hattinda her (hat,yon) icin ilk 4 seferden en uzunu temsil eder; sefer saati/sikligi alinmaz.
"""
import sys, os, json, re, csv, io, zipfile, glob, collections
sys.path.insert(0, os.path.dirname(__file__))
from overpass_fill import fold, stop_mode, OSMDIR, ROOT
from shapely.geometry import Point, LineString
from shapely.ops import polygonize, linemerge, unary_union
from shapely.strtree import STRtree

GEO_TS = os.path.join(ROOT, "src/data/turkiye.ts")
IZ = "CC BY 4.0 (İzmir BB Açık Veri Lisansı)"
GTFS_FEEDS = {
    "iz_bus-eshot-gtfs": ("ESHOT (İzmir BB)", IZ, "https://www.eshot.gov.tr/gtfs/bus-eshot-gtfs.zip"),
    "iz_rail-metro-gtfs": ("İzmir Metro", IZ, "https://www.izmirmetro.com.tr/gtfs/rail-metro-gtfs.zip"),
    "iz_rail-tramizmir-gtfs": ("İzmir Tramvay", IZ, "https://www.tramizmir.com/gtfs/rail-tramizmir-gtfs.zip"),
    "iz_rail-izban-gtfs": ("İZBAN", IZ, "https://www.izban.com.tr/gtfs/rail-izban-gtfs.zip"),
}
KK_URL = "https://github.com/Egezenn/kk-gtfs/raw/main/data/%s.zip"
MODE_LETTER = {"bus": "b", "tram": "t", "subway": "m", "light_rail": "l", "train": "r", "ferry": "f"}


def load_geo():
    t = open(GEO_TS, encoding="utf-8").read().split("\n")[4]
    g = json.loads(re.search(r"GEO: Record<string, Geo> = (\{.*\})\s*$", t).group(1))
    return {p: [d[0] for d in v["d"]] for p, v in g.items()}


AD = ""  # o an islenen ilin adi (il adiyla ayni ilce poligonu = Merkez)


def norm_dist(name):
    f = fold(name)
    return "merkez" if f.endswith(" merkez") or f == "merkez" or f == fold(AD) else f


def build_polys(elements):
    out = []
    for r in elements:
        if r.get("type") != "relation": continue
        ways = [[(p["lon"], p["lat"]) for p in m["geometry"]] for m in r.get("members", [])
                if m["type"] == "way" and m.get("role") in ("outer", "") and m.get("geometry")]
        ways = [w for w in ways if len(w) > 1]
        if not ways: continue
        try:
            poly = unary_union(list(polygonize(linemerge([LineString(w) for w in ways]))))
        except Exception:
            continue
        if not poly.is_empty:
            out.append((r["id"], r["tags"].get("name:tr") or r["tags"].get("name", ""), poly))
    return out


def count_by_district(stops, names):
    c = collections.Counter(norm_dist(s[3]) for s in stops if s[3])
    return {d: c.get(norm_dist(d), 0) for d in names}


def gtfs_load(zpath):
    zf = zipfile.ZipFile(zpath)
    names = set(zf.namelist())
    rd = lambda n: csv.DictReader(io.TextIOWrapper(zf.open(n), encoding="utf-8-sig"))
    stops = {s["stop_id"]: s for s in rd("stops.txt")}
    routes = {r["route_id"]: r for r in rd("routes.txt")}
    agency = {a.get("agency_id", ""): a.get("agency_name", "") for a in rd("agency.txt")} if "agency.txt" in names else {}
    best = {}
    if "trips.txt" in names and "stop_times.txt" in names:
        cand = collections.defaultdict(list)
        for t in rd("trips.txt"):
            k = (t["route_id"], t.get("direction_id", ""))
            if len(cand[k]) < 4: cand[k].append(t["trip_id"])
        want = {t for v in cand.values() for t in v}
        seqs = collections.defaultdict(list)
        for st in rd("stop_times.txt"):
            if st["trip_id"] in want: seqs[st["trip_id"]].append((int(st["stop_sequence"]), st["stop_id"]))
        for k, tl in cand.items():
            ss = [[s for _, s in sorted(seqs[t])] for t in tl if seqs.get(t)]
            if ss: best[k] = max(ss, key=len)
    return stops, routes, agency, best


def rtype_mode(rt):
    try: rt = int(rt)
    except Exception: return "bus"
    if rt == 0 or 900 <= rt < 1000: return "tram"
    if rt == 1 or 400 <= rt < 500: return "subway"
    if rt == 2 or 100 <= rt < 200: return "train"
    if rt == 4 or 1000 <= rt < 1100: return "ferry"
    return "bus"


def main(cache, gtfsdir, report_out):
    geo = load_geo()
    seen, P = set(), []
    global AD
    ILAD = {p: v["ad"] for p, v in json.load(open(os.path.join(OSMDIR, "index.json"), encoding="utf-8"))["il"].items()}
    for p in sorted(geo):
        AD = ILAD[p]
        fn = os.path.join(cache, f"{p}_dist.json")
        if not os.path.exists(fn): continue
        names = {norm_dist(n) for n in geo[p]}
        for rid, nm, poly in build_polys(json.load(open(fn, encoding="utf-8"))["elements"]):
            if norm_dist(nm) in names and (p, rid) not in seen:
                seen.add((p, rid)); P.append((p, nm, poly))
    tree = STRtree([x[2] for x in P])

    def locate(lat, lon, only=None):
        for i in tree.query(Point(lon, lat), predicate="within"):
            if only is None or P[i][0] == only: return P[i]
        return None

    key = lambda m, nm, la, lo: (m, fold(nm), round(la * 2500), round(lo * 2500))
    stats = {}
    for p in sorted(geo):
        AD = ILAD[p]
        data = json.load(open(os.path.join(OSMDIR, f"{p}.json"), encoding="utf-8"))
        S = data["s"]
        info = {"onceDurak": len(S), "onceHat": len(data["l"]), "once": count_by_district(S, geo[p]),
                "ovpNew": 0, "ovpUnnamed": 0, "ovpOutside": 0, "gtfsNew": 0, "gtfsLines": 0, "kaynak": [], "ilceler": geo[p],
                "poligon": sum(1 for x in P if x[0] == p)}
        have = {key(s[5], s[0], s[1], s[2]): i for i, s in enumerate(S)}
        codes = {s[4] for s in S if s[4]}
        sfn = os.path.join(cache, f"{p}_stops.json")
        if os.path.exists(sfn):
            for e in json.load(open(sfn, encoding="utf-8"))["elements"]:
                t = e.get("tags", {}); nm = t.get("name")
                la = e.get("lat", (e.get("center") or {}).get("lat")); lo = e.get("lon", (e.get("center") or {}).get("lon"))
                m = stop_mode(t)
                if m is None or la is None or (p == "34" and m not in "mtlrf"): continue
                if not nm: info["ovpUnnamed"] += 1; continue
                if key(m, nm, la, lo) in have: continue
                h = locate(la, lo, p)
                if not h: info["ovpOutside"] += 1; continue
                code = t.get("ref") or t.get("local_ref") or ""
                if code in codes: code = ""
                if code: codes.add(code)
                have[key(m, nm, la, lo)] = len(S); S.append([nm, round(la, 5), round(lo, 5), h[1], code, m]); info["ovpNew"] += 1
        stats[p] = (data, info, have, codes)

    for d in sorted(glob.glob(os.path.join(gtfsdir, "*", "feed.zip"))):
        fid = os.path.basename(os.path.dirname(d))
        if fid in GTFS_FEEDS: src, lic, url = GTFS_FEEDS[fid]
        elif fid.startswith("kk_"):
            src, lic, url = f"KentKart GTFS ({fid[3:]}), topluluk derlemesi Egezenn/kk-gtfs", "CC0 (derleyenin beyanı; belediye/KentKart hakları doğrulanmadı)", KK_URL % fid[3:]
        else: continue
        try: stops, routes, agency, best = gtfs_load(d)
        except Exception as ex:
            print("GTFS atlandi", fid, ex); continue
        used = collections.defaultdict(collections.Counter)
        for (rid, _), seq in best.items():
            for sid in seq: used[sid][MODE_LETTER[rtype_mode(routes[rid].get("route_type"))]] += 1
        idxmap, touched = {}, set()
        for sid, s in stops.items():
            try: la, lo = float(s["stop_lat"]), float(s["stop_lon"])
            except Exception: continue
            nm = s.get("stop_name", "").strip()
            if not nm: continue
            h = locate(la, lo)
            if not h: continue
            p = h[0]; data, info, have, codes = stats[p]; S = data["s"]
            m = used[sid].most_common(1)[0][0] if used[sid] else "b"
            k = key(m, nm, la, lo); touched.add(p)
            if k in have: idxmap[sid] = (p, have[k]); continue
            code = (s.get("stop_code") or s.get("stop_id") or "").strip()
            if code in codes: code = f"g{code}"
            codes.add(code)
            have[k] = len(S); S.append([nm, round(la, 5), round(lo, 5), h[1], code, m]); idxmap[sid] = (p, have[k]); info["gtfsNew"] += 1
        for (rid, _), seq in best.items():
            r = routes[rid]; mode = rtype_mode(r.get("route_type"))
            by = collections.defaultdict(list)
            for sid in seq:
                if sid in idxmap:
                    p, i = idxmap[sid]
                    if not by[p] or by[p][-1] != i: by[p].append(i)
            ref = r.get("route_short_name") or r.get("route_id"); nm = r.get("route_long_name") or ref
            op = agency.get(r.get("agency_id", ""), "") or next(iter(agency.values()), "")
            for p, sq in by.items():
                if len(sq) < 2: continue
                data, info = stats[p][0], stats[p][1]
                if any(l[0] == ref and l[2] == mode and l[3] == op and l[4] == sq for l in data["l"]): continue
                data["l"].append([ref, nm, mode, op, sq, [data["s"][sq[0]][0], data["s"][sq[-1]][0]]]); info["gtfsLines"] += 1
        for p in touched: stats[p][1]["kaynak"].append(f"{src} | {lic} | {url}")
        print("GTFS", fid, len(idxmap), "durak eslesti", flush=True)

    idx = json.load(open(os.path.join(OSMDIR, "index.json"), encoding="utf-8"))
    total = 0
    for p, (data, info, have, codes) in stats.items():
        AD = ILAD[p]
        js = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
        open(os.path.join(OSMDIR, f"{p}.json"), "w", encoding="utf-8").write(js)
        info["bayt"] = len(js.encode()); total += info["bayt"]
        info["sonra"] = count_by_district(data["s"], geo[p])
        info["sonraDurak"], info["sonraHat"] = len(data["s"]), len(data["l"])
        idx["il"][p].update({"durak": len(data["s"]), "hat": len(data["l"]), "bayt": info["bayt"],
                             "ilceDurakYok": [d for d, n in info["sonra"].items() if n == 0]})
    idx["toplamBayt"] = total + os.path.getsize(os.path.join(OSMDIR, "intercity.json"))
    json.dump(idx, open(os.path.join(OSMDIR, "index.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump({p: s[1] for p, s in stats.items()}, open(report_out, "w", encoding="utf-8"), ensure_ascii=False)
    print("tamam, toplam bayt", total)


if __name__ == "__main__":
    main(*sys.argv[1:4])
