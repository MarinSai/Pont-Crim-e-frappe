"""Zone d'occupation russe (ISW, 18 nov. 2026) : contrôle évalué + avancées évaluées, simplifiée pour la carte régionale.
Usage : python3 -I occupation.py <dossier ISW> <sortie json>"""
import sys, glob, os, json, math
import shapefile
from shapely.geometry import shape, box, Point, Polygon, MultiPolygon, GeometryCollection
from shapely.ops import unary_union
from shapely import make_valid
root, out = sys.argv[1], sys.argv[2]
def load(pref):
    shp = glob.glob(os.path.join(root, '**', pref + '*.shp'), recursive=True)[0]
    r = shapefile.Reader(shp)
    return make_valid(unary_union([make_valid(shape(s.__geo_interface__)) for s in r.shapes() if s.shapeType != 0]))
def polys(g):
    if g is None or g.is_empty: return []
    if isinstance(g, Polygon): return [g]
    if isinstance(g, (MultiPolygon, GeometryCollection)): return [p for q in g.geoms for p in polys(q)]
    return []
ao, adv = load('UkraineControlMapAO'), load('AssessedRussianAdvances')
km2 = lambda g: sum(p.area for p in polys(g)) * 111.2 * 111.2 * math.cos(math.radians(47.5))
print('contrôle : %.0f km² ; avancées : %.0f km² ; dont hors contrôle : %.0f km²' % (km2(ao), km2(adv), km2(adv.difference(ao))))
occ = make_valid(unary_union([ao, adv]).buffer(0.004).buffer(-0.004))
occ = occ.intersection(box(27.0, 42.8, 42.5, 50.8)).simplify(0.006, preserve_topology=True)
q = lambda c: [[round(x, 3), round(y, 3)] for x, y in c]
rings = []
for p in polys(occ):
    if p.area < 3e-4: continue
    rings.append(q(p.exterior.coords))
    rings += [q(i.coords) for i in p.interiors if Polygon(i).area > 2e-3]
print(len(rings), 'anneaux,', sum(len(r) for r in rings), 'points')
# points de contrôle
ARCH = (36.50556, 45.30845)
def dest(lon, lat, brg, d):
    R = 6371; dl = d / R; f1, l1, th = map(math.radians, (lat, lon, brg))
    f2 = math.asin(math.sin(f1) * math.cos(dl) + math.cos(f1) * math.sin(dl) * math.cos(th))
    l2 = l1 + math.atan2(math.sin(th) * math.sin(dl) * math.cos(f1), math.cos(dl) - math.sin(f1) * math.sin(f2))
    return math.degrees(l2), math.degrees(f2)
for nom, pts in (('salve large', [(291, 480), (299, 440), (306, 395), (314, 400), (322, 330), (330, 300), (338, 335), (346, 350)]), ('salve étroite', [(291, 480), (301, 430), (312, 400), (322, 330), (332, 300), (344, 350)]), ('relais', [(316, 330), (316, 225), (316, 120)])):
    print(nom)
    for b, d in pts:
        lon, lat = dest(*ARCH, b, d); pt = Point(lon, lat)
        print('   %3d° %3d km -> %.2f E %.2f N  %s  (à %.0f km de la zone)' % (b, d, lon, lat, 'OCCUPÉ' if occ.contains(pt) else 'libre', occ.distance(pt) * 85))
for nom, lon, lat in (('Kherson', 32.62, 46.64), ('Zaporijjia', 35.14, 47.84), ('Melitopol', 35.37, 46.85), ('Kertch', 36.47, 45.36), ('Marioupol', 37.55, 47.1), ('Kramatorsk', 37.56, 48.74), ('Kharkiv', 36.23, 49.99)):
    print('  ', nom, 'occupé' if occ.contains(Point(lon, lat)) else 'libre')
json.dump(rings, open(out, 'w'), separators=(',', ':'))
