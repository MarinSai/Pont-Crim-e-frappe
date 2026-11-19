# Animation : la frappe ukrainienne sur le pont de Crimée (16-17 novembre 2026)

Fichier unique `dist/pont_crimee_frappe_FR.html`, prévu pour une intégration en iframe (hauteur automatique via iframe-resizer v5).

- Textes (titre, chapô, clé, étapes, légendes, étiquettes de la scène, source) : `src/textes.json` (une entrée par langue).
- Déroulé et mises en scène : `src/scene.js` (`S1`…`END`, `WIDE` et `NARROW`, frappes dans `HITS`).
- Données : `python3 donnees/build_data.py donnees/ne src/data.json` (côte du détroit : OpenStreetMap, `donnees/cote_osm.txt` ; carte régionale : Natural Earth 10 m, vue d'Ukraine).
- Zone d'occupation russe (étape 2) : `python3 -I donnees/occupation.py <dossier des shapefiles ISW> src/occupation.json` (contrôle évalué + avancées évaluées, ISW, 18 novembre 2026), puis relancer `build_data.py`.
- Assembler : `python3 build.py fr`, `es` ou `it` (sortie dans `dist/`).
- Contrôle des étiquettes (chevauchements, bords) : `node outils/chevauchements.mjs dist/<fichier>.html`.
- `?t=31.5` dans l'adresse fige l'animation à la seconde 31,5 (contrôle visuel).
- Étapes 3 et 4 : deux palettes (`PJ` jour, `PN` nuit) ; la nuit inverse aussi les encres des étiquettes (`NU`).
- Géométrie du pont (repère local en mètres) : axes, piles du chenal, îlots et chenal relevés sur OpenStreetMap ; points d'impact, trajectoires et défenses schématiques.
