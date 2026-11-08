#!/usr/bin/env python3
"""OSM (Geofabrik turkey-latest.osm.pbf) -> public/data/real/{plaka}.json, intercity.json, index.json

Kullanim: PYTHONUTF8=1 python scripts/build_osm.py turkey-latest.osm.pbf il-ilce.json public/data/real
Bagimlilik: pip install osmium shapely
Veri: (c) OpenStreetMap contributors, ODbL. Uydurma veri yok; eslesmeyen/bulunamayan bos birakilir.

Cikti bicimi (il basina): {"s":[[ad,enlem,boylam,ilce,kod,mod]],"l":[[ref,ad,mod,isletmeci,[durak idx],[from,to]?]]}
Durak modu: b otobus, t tramvay, m metro, l hafif raylı, r tren, f vapur, o otogar.
"""
import sys, json, pickle, os, unicodedata
import osmium, shapely
from shapely import wkb as swkb
from shapely.strtree import STRtree

PBF, ILJSON, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
CACHE = PBF + ".raw.pkl"
MAX_IL_BYTES = 2_000_000
ROUTE_MODES = {"bus": "b", "trolleybus": "b", "tram": "t", "subway": "m",
               "light_rail": "l", "train": "r", "ferry": "f"}
STOP_ROLES = ("stop", "platform")  # prefix match: stop, stop_entry_only, platform_exit_only ...


def fold(s):
    s = (s or "").replace("İ", "i").replace("I", "ı").lower()
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    for a, b in (("ı", "i"), ("ş", "s"), ("ğ", "g"), ("ü", "u"), ("ö", "o"), ("ç", "c")):
        s = s.replace(a, b)
    return s.replace(" ili", "").replace(" ilcesi", "").strip()


def stop_mode(t):
    """Durak etiketlerinden mod; belirsizse None (hat uyeliginden cikarilir)."""
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
    return None


def parse():
    stops, routes, areas = {}, [], []
    wkbf = osmium.geom.WKBFactory()
    tf = osmium.filter.TagFilter(
        ("highway", "bus_stop"), ("public_transport", "platform"), ("public_transport", "stop_position"),
        ("public_transport", "station"), ("railway", "station"), ("railway", "halt"), ("railway", "tram_stop"),
        ("amenity", "bus_station"), ("amenity", "ferry_terminal"), ("type", "route"), ("boundary", "administrative"))
    fp = (osmium.FileProcessor(PBF).with_locations()
          .with_areas(osmium.filter.TagFilter(("boundary", "administrative")))
          .with_filter(tf))
    n = 0
    for o in fp:
        n += 1
        if n % 200000 == 0: print("..", n, len(stops), len(routes), len(areas), flush=True)
        if o.is_node() or o.is_way():
            t = o.tags
            name = t.get("name")
            if not name or not stop_mode(t) and not (t.get("public_transport") in ("platform", "stop_position")
                                                     or t.get("highway") == "bus_stop"):
                continue
            if o.is_node():
                if not o.location.valid(): continue
                lat, lon = o.location.lat, o.location.lon
            else:
                try:
                    ls = [(n_.lat, n_.lon) for n_ in o.nodes if n_.location.valid()]
                except Exception:
                    continue
                if not ls: continue
                lat, lon = ls[len(ls) // 2]
            stops[(o.type_str(), o.id)] = [name, lat, lon, stop_mode(t), t.get("ref") or t.get("local_ref") or ""]
        elif o.is_relation():
            t = o.tags
            if t.get("type") != "route" or t.get("route") not in ROUTE_MODES: continue
            mem = [(m.type, m.ref) for m in o.members
                   if m.type in "nw" and m.role.startswith(STOP_ROLES)]
            routes.append((t.get("route"), t.get("ref", ""), t.get("name", ""), t.get("operator", "") or t.get("network", ""),
                           t.get("from", ""), t.get("to", ""), mem))
        elif o.is_area():
            t = o.tags
            if t.get("boundary") != "administrative" or t.get("admin_level") not in ("4", "6"): continue
            try:
                g = swkb.loads(wkbf.create_multipolygon(o), hex=True)
            except Exception:
                continue
            areas.append((t["admin_level"], t.get("name:tr") or t.get("name", ""), g))
    return stops, routes, areas


def main():
    if os.path.exists(CACHE):
        stops, routes, areas = pickle.load(open(CACHE, "rb"))
    else:
        stops, routes, areas = parse()
        pickle.dump((stops, routes, areas), open(CACHE, "wb"))
    print("ham:", len(stops), "durak", len(routes), "hat", len(areas), "sinir", flush=True)

    # ---- iller / ilceler
    iljson = json.load(open(ILJSON, encoding="utf-8"))["data"]
    plaka_of, il_name, ilce_list = {}, {}, {}
    for il in iljson:
        p = il["plaka_kodu"].strip().zfill(2)
        plaka_of[fold(il["il_adi"])] = p
        il_name[p] = il["il_adi"]
        ilce_list[p] = [i["ilce_adi"] for i in il["ilceler"]]
    prov = {}  # plaka -> union poligon
    for lvl, name, g in areas:
        if lvl == "4" and fold(name) in plaka_of:
            p = plaka_of[fold(name)]
            prov[p] = prov[p].union(g) if p in prov else g
    missing = sorted(set(il_name) - set(prov))
    print("sinir bulunamayan il:", missing, flush=True)
    pk = sorted(prov)
    ptree = STRtree([prov[p] for p in pk])
    dist = [(name, g) for lvl, name, g in areas if lvl == "6" and name]
    dtree = STRtree([g for _, g in dist])

    # ---- durak modu: etiketi belirsizse hat uyeliginden, o da yoksa otobus
    for mode, ref, name, op, fr, to, mem in routes:
        for k in mem:
            if k in stops and stops[k][3] is None: stops[k][3] = ROUTE_MODES[mode]
    for s in stops.values():
        if s[3] is None: s[3] = "b"

    # ---- yakin ayni-ad duraklari birlestir (platform + stop_position), ~40 m hucre
    merged, key2idx, raw2idx = [], {}, {}
    for k, (nm, lat, lon, m, kod) in stops.items():
        key = (m, fold(nm), round(lat * 2500), round(lon * 2500))
        if key not in key2idx:
            key2idx[key] = len(merged)
            merged.append([nm, round(lat, 5), round(lon, 5), m, kod])
        elif kod and not merged[key2idx[key]][4]:
            merged[key2idx[key]][4] = kod
        raw2idx[k] = key2idx[key]

    # ---- il / ilce atamasi (vektorel nokta-poligon)
    pts = shapely.points([s[2] for s in merged], [s[1] for s in merged])
    s_prov, s_ilce = [None] * len(merged), [""] * len(merged)
    ii, jj = ptree.query(pts, predicate="within")
    for i, j in zip(ii, jj):
        if s_prov[i] is None: s_prov[i] = pk[j]
    rest = [i for i in range(len(merged)) if s_prov[i] is None]
    if rest:  # kiyi/iskele noktalari: en yakin il (<~10 km)
        a, b = ptree.query_nearest(pts[rest], max_distance=0.1, all_matches=False)
        for x, j in zip(a, b): s_prov[rest[x]] = pk[j]
    ii, jj = dtree.query(pts, predicate="within")
    for i, j in zip(ii, jj):
        if not s_ilce[i]: s_ilce[i] = dist[j][0]
    for i, s in enumerate(merged): s.append(s_ilce[i])

    # ---- hatlar
    lines = []  # (mode, ref, name, op, from, to, [stop idx])
    for mode, ref, name, op, fr, to, mem in routes:
        seq = []
        for k in mem:
            if k in raw2idx and (not seq or seq[-1] != raw2idx[k]): seq.append(raw2idx[k])
        if len(seq) >= 2: lines.append((mode, ref, name, op, fr, to, seq))

    ISTANBUL_OK = set("mtlrf")  # 34: yalniz raylı + vapur (otobus/IETT ayri veri)
    per = {p: {"stops": {}, "lines": []} for p in il_name}  # global idx -> yerel idx
    inter_lines, bus_station = [], []
    for i, s in enumerate(merged):
        p = s_prov[i]
        if p and not (p == "34" and s[3] not in ISTANBUL_OK):
            per[p]["stops"][i] = None
            if s[3] == "o": bus_station.append([s[0], s[1], s[2], p, s[5]])

    for mode, ref, name, op, fr, to, seq in lines:
        by = {}
        for i in seq:
            p = s_prov[i]
            if p and i in per[p]["stops"]: by.setdefault(p, []).append(i)
        for p, sq in by.items():
            if len(sq) >= 2: per[p]["lines"].append((ref, name, mode, op, sq, fr, to))
        if len(by) > 1 and mode in ("bus", "train", "ferry"):
            inter_lines.append({"ref": ref, "ad": name, "mod": mode, "isletmeci": op, "il": sorted(by),
                                "d": [[merged[i][0], s_prov[i]] for i in seq if s_prov[i] in by]})

    os.makedirs(OUT, exist_ok=True)
    index, total = {}, 0
    for p in sorted(per):
        d = per[p]
        used = {i for l in d["lines"] for i in l[4]}
        order = sorted(d["stops"])
        # boyut siniri: hatsiz en seyrek duraklari at (ızgara yogunluguna gore)
        def build(keep):
            idx = {g: n for n, g in enumerate(keep)}
            S = [[merged[g][0], merged[g][1], merged[g][2], merged[g][5], merged[g][4], merged[g][3]] for g in keep]
            L = [[r, nm, md, op, [idx[g] for g in sq]] + ([[f, t]] if f or t else []) for r, nm, md, op, sq, f, t in d["lines"]]
            return {"s": S, "l": L}, idx
        data, idx = build(order)
        js = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
        if len(js.encode()) > MAX_IL_BYTES:
            dens = {}
            for g in order:
                c = (round(merged[g][1] * 50), round(merged[g][2] * 50)); dens[c] = dens.get(c, 0) + 1
            orphan = sorted((g for g in order if g not in used),
                            key=lambda g: dens[(round(merged[g][1] * 50), round(merged[g][2] * 50))])
            drop = set()
            while len(js.encode()) > MAX_IL_BYTES and len(drop) < len(orphan):
                drop |= set(orphan[:max(1, len(orphan) // 10)]) if not drop else set(orphan[:len(drop) + max(1, len(orphan) // 10)])
                data, idx = build([g for g in order if g not in drop])
                js = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
        open(f"{OUT}/{p}.json", "w", encoding="utf-8").write(js)
        total += len(js.encode())
        have = {fold(merged[g][5]) for g in idx}
        index[p] = {"ad": il_name[p], "durak": len(data["s"]), "hat": len(data["l"]), "bayt": len(js.encode()),
                    "sinir": p in prov, "ilceDurakYok": [x for x in ilce_list[p] if fold(x) not in have]}
    ic = {"otogar": bus_station, "hatlar": inter_lines}
    js = json.dumps(ic, ensure_ascii=False, separators=(",", ":"))
    open(f"{OUT}/intercity.json", "w", encoding="utf-8").write(js)
    total += len(js.encode())
    open(f"{OUT}/index.json", "w", encoding="utf-8").write(json.dumps(
        {"kaynak": "OpenStreetMap contributors, ODbL", "mod": {"b": "otobus", "t": "tramvay", "m": "metro", "l": "hafif raylı",
         "r": "tren", "f": "vapur", "o": "otogar"}, "il": index, "toplamBayt": total, "illerArasiHat": len(inter_lines),
         "otogar": len(bus_station)}, ensure_ascii=False, indent=1))
    open(f"{OUT}/ATTRIBUTION.txt", "w", encoding="utf-8").write("© OpenStreetMap contributors, ODbL\nhttps://www.openstreetmap.org/copyright\n")
    nz = sum(len(v["ilceDurakYok"]) for v in index.values())
    print("toplam bayt", total, "| ilce durak yok:", nz, "| illerarasi hat", len(inter_lines), "| otogar", len(bus_station))


if __name__ == "__main__":
    main()
