"""İBB açık GTFS (CC-BY-4.0 / İBB Açık Veri Lisansı) -> src/data/real/istanbul.json (kompakt)."""
import csv, json, math, collections, sys
D = sys.argv[1]; OUT = sys.argv[2]
rd = lambda f: csv.DictReader(open(f'{D}/{f}', encoding='utf-8-sig'))
def fix(s):
    try:
        return s.encode('cp1252', errors='strict').decode('utf-8') if any(c in s for c in 'ÃÄÅ') else s
    except Exception:
        return s
def tt(x):
    x = x.replace('I', 'ı').replace('İ', 'i').lower() if x.isupper() else x.lower()
    return ' '.join(w[:1].replace('i', 'İ').replace('ı', 'I').upper() + w[1:] for w in x.split())
routes = {r['route_id']: r for r in rd('routes.txt')}
for r in routes.values():
    r['route_long_name'] = fix(r['route_long_name'])
trips = collections.defaultdict(list)  # route_id -> [(trip_id, dir, service)]
for t in rd('trips.txt'):
    trips[t['route_id']].append((t['trip_id'], t['direction_id'], t['service_id']))
svc_count = collections.Counter(t[2] for v in trips.values() for t in v)
weekday = svc_count.most_common(1)[0][0]
# her kısa ad için ana varyantı seç (route_code ..._D0 ya da en çok seferli)
by_short = collections.defaultdict(list)
for rid, r in routes.items(): by_short[r['route_short_name']].append(rid)
pick = {}
for sn, rids in by_short.items():
    rids.sort(key=lambda x: (not routes[x]['route_code'].endswith('D0'), -len(trips[x])))
    pick[sn] = rids[0]
want_trips = {}
for sn, rid in pick.items():
    ts = [t for t in trips[rid] if t[2] == weekday] or trips[rid]
    if not ts: continue
    d0 = [t for t in ts if t[1] == '0']
    want_trips[ts[0][0] if not d0 else d0[0][0]] = (sn, rid, len(d0) or len(ts))
seqs = collections.defaultdict(list)
for st in rd('stop_times.txt'):
    if st['trip_id'] in want_trips:
        seqs[st['trip_id']].append((int(st['stop_sequence']), st['stop_id']))
stops = {s['stop_id']: s for s in rd('stops.txt')}
used = {}; lines = []
for tid, (sn, rid, n) in want_trips.items():
    ids = [s for _, s in sorted(seqs[tid]) if s in stops]
    if len(ids) < 2: continue
    for s in ids: used.setdefault(s, len(used))
    headway = max(8, min(60, round(1020 / max(n, 1))))
    lines.append([sn, tt(stops[ids[0]]['stop_name']) + ' - ' + tt(stops[ids[-1]]['stop_name']), [used[s] for s in ids], headway])
order = sorted(used, key=used.get)
out = {'stops': [[stops[s]['stop_code'], tt(stops[s]['stop_name']), round(float(stops[s]['stop_lat']), 5), round(float(stops[s]['stop_lon']), 5)] for s in order], 'lines': lines}
json.dump(out, open(OUT, 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(out['stops']), 'durak', len(lines), 'hat')
