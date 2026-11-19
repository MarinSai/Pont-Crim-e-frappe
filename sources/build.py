"""Assemble le fichier HTML autonome : gabarit + polices + données + textes + script.
Usage : python3 build.py [fr|es|it]"""
import sys, json, os, re
here = os.path.dirname(os.path.abspath(__file__))
lang = sys.argv[1] if len(sys.argv) > 1 else 'fr'
rd = lambda f: open(os.path.join(here, 'src', f), encoding='utf-8').read()
tx = json.loads(rd('textes.json'))[lang]
html = rd('gabarit.html')
rep = {'lang': tx['lang'], 'titre': tx['titre'], 'chapo': tx['chapo'], 'aria': tx['aria'], 'lire': tx['lire'], 'source': tx['source'], 'note': tx['note']}
for i, c in enumerate(tx['cle']): rep['cle%d' % i] = c
for i, e in enumerate(tx['etapes']): rep['etape%d' % i] = e
# les légendes (titre, paragraphe) ne sont plus affichées ; celles du français restent dans textes.json
NBSP = chr(160)
nb = (lambda s: re.sub(r' ([:;!?»])', NBSP + r'\1', s).replace('« ', '«' + NBSP)) if lang == 'fr' else (lambda s: s)   # insécables avant la ponctuation haute, en français seulement
for k, v in rep.items(): html = html.replace('{{%s}}' % k, nb(v) if k not in ('lang', 'source', 'note') else v)
assert '{{' not in html, re.findall(r'\{\{\w+\}\}', html)
js = {'pause': tx['pause'], 'lire': tx['lire'], 'rejouer': tx['rejouer'], 'c': tx['c']}
html = html.replace('/*FONTS*/', rd('fonts.css').strip())
html = html.replace('__DATA__', rd('data.json')).replace('__TX__', json.dumps(js, ensure_ascii=False))
html = html.replace('/*SCRIPT*/', rd('scene.js'))
os.makedirs(os.path.join(here, 'dist'), exist_ok=True)
out = os.path.join(here, 'dist', tx['fichier'])
open(out, 'w', encoding='utf-8').write(html)
print(out, os.path.getsize(out), 'octets')
