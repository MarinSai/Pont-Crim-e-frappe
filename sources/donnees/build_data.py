"""Prépare data.json pour l'animation « pont de Crimée ».
- détroit de Kertch : trait de côte OpenStreetMap (cote_osm.txt, entiers delta en 1e-4 degré) -> polygones de terre
- tracé du pont : voie ferrée OSM (pont ferroviaire, 18,1 km), bornée par les culées
- carte régionale : Natural Earth 10 m (terres, frontières vues d'Ukraine, Dniepr)
Usage : python3 build_data.py <dossier Natural Earth> <sortie data.json>"""
import sys, json, math, os
import shapefile
from shapely.geometry import shape, box, LineString, Polygon, MultiPolygon, Point, GeometryCollection, MultiLineString
from shapely.ops import unary_union, polygonize, linemerge
from shapely import make_valid

ne, out = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))

def polys(g):
    if g is None or g.is_empty: return []
    if isinstance(g, Polygon): return [g]
    if isinstance(g, (MultiPolygon, GeometryCollection)): return [p for q in g.geoms for p in polys(q)]
    return []
def lines(g):
    if g is None or g.is_empty: return []
    if isinstance(g, LineString): return [g]
    if isinstance(g, (MultiLineString, GeometryCollection)): return [p for q in g.geoms for p in lines(q)]
    return []

# ---------- Détroit ----------
BB = (36.285, 45.105, 36.855, 45.465)
coast = []
for l in open(os.path.join(here, 'cote_osm.txt')).read().strip().split(';'):
    v = list(map(int, l.split())); x, y = v[0], v[1]; pts = [(x/1e4, y/1e4)]
    for i in range(2, len(v), 2):
        x += v[i]; y += v[i+1]; pts.append((x/1e4, y/1e4))
    coast.append(pts)
frame = box(*BB)
net = unary_union([frame.boundary] + [LineString(c) for c in coast])
land = []
for p in polygonize(net):
    if not frame.buffer(1e-9).contains(p): continue
    # règle OSM : la terre est à gauche du sens du trait de côte
    verdict = None
    for c in coast:
        for (x0, y0), (x1, y1) in zip(c[:-1], c[1:]):
            seg = LineString([(x0, y0), (x1, y1)])
            if seg.length < 2e-4: continue
            mx, my = (x0+x1)/2, (y0+y1)/2
            if p.boundary.distance(Point(mx, my)) > 1e-9: continue
            dx, dy = (x1-x0)/seg.length, (y1-y0)/seg.length
            left = Point(mx - dy*3e-5, my + dx*3e-5)
            verdict = p.contains(left); break
        if verdict is not None: break
    if verdict: land.append(p)
strait_land = unary_union(land)
q4 = lambda pts: [[round(x, 4), round(y, 4)] for x, y in pts]
strait = [q4(p.exterior.coords) for p in polys(strait_land)]
print('détroit : %d polygones, %d points' % (len(strait), sum(len(r) for r in strait)))

RAIL = [[36.45237,45.32297],[36.46066,45.32642],[36.46348,45.32746],[36.46516,45.32786],[36.46643,45.328],[36.46818,45.3281],[36.46944,45.32804],[36.47249,45.32761],[36.4874,45.32365],[36.49092,45.32232],[36.49455,45.32032],[36.49697,45.31848],[36.49886,45.31659],[36.5184,45.29284],[36.52067,45.29041],[36.52312,45.2883],[36.52546,45.28664],[36.53432,45.28164],[36.53831,45.27871],[36.54046,45.2767],[36.5548,45.26154],[36.55786,45.25877],[36.55986,45.2573],[36.56201,45.25595],[36.56546,45.25415],[36.58801,45.2453],[36.59107,45.24387],[36.59445,45.2419],[36.59653,45.24043],[36.5989,45.23844],[36.60082,45.23649],[36.60241,45.23451],[36.60384,45.23232],[36.60501,45.23002],[36.60595,45.2274],[36.60645,45.2252],[36.607,45.21668],[36.60728,45.21491],[36.60772,45.21343],[36.60868,45.21131],[36.60984,45.2095],[36.61148,45.2076],[36.61325,45.20599],[36.61474,45.20488],[36.61648,45.20383],[36.61889,45.2026],[36.62062,45.20191],[36.6501,45.19303]]
# culées du pont ferroviaire (Structurae) : 45°19'35.17"N 36°28'36.68"E et 45°12'27.58"N 36°36'41.14"E
KERCH_END, TAMAN_END = (36.47686, 45.32644), (36.61143, 45.20766)
full = LineString(RAIL)
a, b = full.project(Point(KERCH_END)), full.project(Point(TAMAN_END))
def cut(line, d0, d1):
    pts = [line.interpolate(d0).coords[0]]; acc = 0
    c = list(line.coords)
    for p0, p1 in zip(c[:-1], c[1:]):
        acc += math.dist(p0, p1)
        if d0 < acc < d1: pts.append(p1)
    pts.append(line.interpolate(d1).coords[0]); return pts
bridge = cut(full, a, b)
def km(pts):
    d = 0
    for (x0, y0), (x1, y1) in zip(pts[:-1], pts[1:]):
        d += math.hypot((x1-x0)*math.cos(math.radians((y0+y1)/2))*111.32, (y1-y0)*110.57)
    return d
print('pont ferroviaire : %.1f km (référence : 18,1 km)' % km(bridge))
arch = full.project(Point(36.50556, 45.30845))
print('arche à %.2f km de la culée de Kertch' % (km(cut(full, a, arch))))

# ---------- Carte régionale ----------
RB = (27.0, 42.8, 42.5, 50.8)
rframe = box(*RB)
def read(name):
    r = shapefile.Reader(os.path.join(ne, name))
    f = [x[0] for x in r.fields[1:]]
    return [(dict(zip(f, rec)), shape(s.__geo_interface__)) for rec, s in zip(r.records(), r.shapes()) if s.shapeType != 0]
landg = unary_union([make_valid(g).intersection(rframe) for _, g in read('ne_10m_land') if g.intersects(rframe)])
landg = landg.simplify(0.006, preserve_topology=True)
q3 = lambda pts: [[round(x, 3), round(y, 3)] for x, y in pts]
region = [q3(p.exterior.coords) for p in polys(landg) if p.area > 2e-4]
holes = [q3(i.coords) for p in polys(landg) for i in p.interiors if Polygon(i).area > 2e-3]
print('région : %d polygones, %d trous, %d points' % (len(region), len(holes), sum(len(r) for r in region + holes)))

countries = [(rec, make_valid(g)) for rec, g in read('ne_10m_admin_0_countries_ukr') if g.intersects(rframe)]
names = [rec.get('NAME') or rec.get('ADMIN') for rec, _ in countries]
print('pays :', names)
ukr = [g for rec, g in countries if (rec.get('ADM0_A3') or rec.get('ADM0_A3_UA')) == 'UKR' or rec.get('NAME') == 'Ukraine'][0]
print('Crimée dans l\'Ukraine :', ukr.contains(Point(34.1, 45.2)))
borders = []
for i in range(len(countries)):
    for j in range(i+1, len(countries)):
        gi, gj = countries[i][1], countries[j][1]
        if not gi.intersects(gj): continue
        sh = gi.boundary.intersection(gj.boundary)
        ls = lines(sh)
        if ls:
            m = linemerge(ls) if len(ls) > 1 else ls[0]
            for l in lines(m.intersection(rframe)):
                l = l.simplify(0.006)
                if l.length > 0.02: borders.append((names[i], names[j], q3(l.coords)))
print('frontières :', len(borders), sorted(set((a, b) for a, b, _ in borders)))
# zone d'occupation russe (ISW, contrôle évalué + avancées évaluées), préparée par occupation.py
occ_rings = json.load(open(os.path.join(here, '..', 'src', 'occupation.json')))
occ_poly = make_valid(unary_union([make_valid(Polygon(r)) for r in occ_rings if len(r) > 3]))
front = occ_poly.boundary.intersection(ukr.buffer(-0.04))          # sans les côtes ni la frontière internationale
fronts = [q3(l.coords) for l in lines(linemerge(lines(front)) if len(lines(front)) > 1 else front) if l.length > 0.03]
print('occupation : %d anneaux ; front : %d tronçons, %d points' % (len(occ_rings), len(fronts), sum(len(f) for f in fronts)))
rivers = []
for rec, g in read('ne_10m_rivers_lake_centerlines'):
    n = (rec.get('name') or rec.get('name_en') or '')
    if n in ('Dnipro', 'Dnieper', 'Dnepr') and g.intersects(rframe):
        for l in lines(g.intersection(rframe)): rivers.append(q3(l.simplify(0.006).coords))
print('Dniepr :', len(rivers), 'tronçons')

data = {
    'strait': {'bbox': BB, 'land': strait},
    'bridge': [[round(x, 5), round(y, 5)] for x, y in bridge],
    'rail': RAIL,
    'region': {'bbox': RB, 'land': region, 'holes': holes,
               'ukr': [c for a_, b_, c in borders if 'Ukraine' in (a_, b_)],
               'autres': [c for a_, b_, c in borders if 'Ukraine' not in (a_, b_)],
               'dnipro': rivers, 'occ': occ_rings, 'front': fronts},
}
json.dump(data, open(out, 'w'), separators=(',', ':'))
print('écrit', out, os.path.getsize(out), 'octets')
