(() => {
  const css = getComputedStyle(document.documentElement);
  const tok = n => css.getPropertyValue(n).trim();
  const C = { papier: tok('--papier'), encre: tok('--encre'), gris: tok('--gris'), filet: tok('--filet'),
              rouge: tok('--rouge'), bleu: tok('--bleu'),
              mer: '#e7f1f0', rivage: '#b9d6d3', merTexte: '#86aeab', vague: '#cbe0dd', pays: '#4b4b50',
              eteint: '#a3a3a8', beton: '#f0ede7', tablier: '#f8f7f4', route: '#e2e0db', acier: '#ffffff',
              ombre: 'rgba(46,88,92,.17)', noye: 'rgba(110,158,154,.5)' };
  const FONT = tok('--texte'), TITRE = tok('--titre');
  const T = TX.c;
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = k => 1 - Math.pow(1 - clamp(k), 3);
  const easeIO = k => { k = clamp(k); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const win = (t, a, b, f = .4) => clamp((t - a) / f) * clamp((b - t) / f);   // fenêtre d'apparition
  const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  // ---------- Déroulé ----------
  const S1 = 0, S2 = 9, S3 = 22, S4 = 39, END = 50;
  const TL = { steps: [[S1, S2], [S2, S3], [S3, S4], [S4, END]], end: END, still: [8.2, S2 + 11.6, S3 + 16, END - .05] };

  // ---------- Géographie ----------
  const ARCH = [36.50556, 45.30845];                     // milieu des arches (OSM)
  const CANAL = [[36.4614,45.2034],[36.4734,45.2273],[36.4697,45.2566],[36.4908,45.3008],[36.4994,45.3074],[36.5768,45.3288],[36.605,45.3342],[36.6522,45.3529],[36.657,45.3572],[36.6735,45.4029],[36.6817,45.425]]; // chenal Kertch-Iénikalé (OSM)
  const D2R = Math.PI / 180;
  const mercD = lat => Math.log(Math.tan(Math.PI / 4 + lat * D2R / 2)) / D2R;
  function dest(lon, lat, brg, d){
    const R = 6371, dl = d / R, f1 = lat * D2R, l1 = lon * D2R, th = brg * D2R;
    const f2 = Math.asin(Math.sin(f1) * Math.cos(dl) + Math.cos(f1) * Math.sin(dl) * Math.cos(th));
    const l2 = l1 + Math.atan2(Math.sin(th) * Math.sin(dl) * Math.cos(f1), Math.cos(dl) - Math.sin(f1) * Math.sin(f2));
    return [l2 / D2R, f2 / D2R];
  }

  // ---------- Deux mises en scène : large et étroite (téléphone) ----------
  const ROADY_ = -50;
  const WIDE = {
    VW: 1000, VH: 600, full: true,
    strait: { lon: 36.57, lat: 45.285, kpu: .044 },
    region: { lon: 34.3, lat: 46.55, kpu: .86 },
    pont: { mpu: .70, cx: 462, cy: 304 },
    s1: { crimee: [36.372, 45.335], russie: [36.775, 45.205], azov: [36.636, 45.381], noire: [36.545, 45.185], touzla: [36.563, 45.262, 'left'],
          pont: [36.612, 45.296], card: [26, 322, 262, 132], loc: [940, 62, 44], coude: 'h', chenal: [36.574, 45.341, 'left'] },
    s2: { ukraine: [31.2, 48.25], russie: [39.0, 47.55], crimee: [34.35, 44.8], noire: [31.4, 44.95], azov: [37.35, 46.38],
          villes: [['odessa', 30.73, 46.48, 'right'], ['mykolaiv', 32.0, 46.97, 'left'], ['dnipro', 35.05, 48.46, 'left'], ['zapo', 35.14, 47.84, 'left']],
          salve: [[291, 480], [299, 440], [306, 395], [314, 400, 1], [322, 330], [330, 345], [338, 335], [346, 350]], defLabel: [254, 262] },
    s3: { chip: [18, 30, 'left'], vagues: 150, chenalY: 215,
          pal: [700, 364], mis: [169, 263], routier: [735, 475, 200], ferro: [317, 455, 40], crimee: [236, 75, 'right'], russieL: [520, 568, 'right'] },
    s4: { route: [505, 50], routeC: [20, ROADY_ - 15], rail: [60, 380], railC: [-177, 9.5], chenal: [735, 292], chenalC: [4, -150] }
  };
  const NARROW = {
    VW: 500, VH: 640, full: false,
    strait: { lon: 36.555, lat: 45.285, kpu: .056 },
    region: { lon: 33.8, lat: 46.9, kpu: 1.286 },
    pont: { mpu: .88, cx: 232, cy: 322 },
    s1: { crimee: [36.412, 45.378], russie: [36.7, 45.19], azov: [36.618, 45.4], noire: [36.535, 45.253], touzla: [36.566, 45.262, 'left'],
          pont: [36.578, 45.304], card: [12, 438, 318, 148], loc: [452, 48, 34], coude: 'v', chenal: null, tamanCote: 'right' },
    s2: { ukraine: [32.6, 48.6], russie: [37.5, 44.93], crimee: null, pontGauche: true, noire: [31.6, 44.5], azov: [37.25, 46.42],
          villes: [['odessa', 30.73, 46.48, 'left'], ['dnipro', 35.05, 48.46, 'left'], ['zapo', 35.14, 47.84, 'left'], ['kharkiv', 36.23, 49.99, 'left']],
          salve: [[291, 480], [301, 430], [312, 400, 1], [322, 330], [332, 345], [344, 350]], defLabel: [252, 262] },
    s3: { chip: [482, 30, 'right'], vagues: 100, chenalY: 112,
          pal: [400, 452], mis: [88, 330], routier: [300, 88, -200], ferro: [20, 520, 140], crimee: [482, 58, 'right'], russieL: [320, 598, 'right'] },
    s4: { route: [270, 130], routeC: [20, ROADY_ - 15], rail: [18, 500], railC: [40, 9.2], chenal: [326, 306], chenalC: [4, -128] }
  };

  let L = null, s = 1, u = 1, dpr = 1;        // u = 1 px écran exprimé en unités de scène
  const cv = document.getElementById('c'), sceneEl = document.getElementById('scene');
  let ctx = cv.getContext('2d');
  const main = ctx;

  function proj(f){
    const k = 111.32 * Math.cos(f.lat * D2R) / f.kpu, m0 = mercD(f.lat);
    return (lon, lat) => [L.VW / 2 + (lon - f.lon) * k, L.VH / 2 - (mercD(lat) - m0) * k];
  }
  function layer(draw){
    const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height;
    const g = c.getContext('2d'); g.setTransform(dpr * s, 0, 0, dpr * s, 0, 0);
    const keep = ctx; ctx = g; draw(); ctx = keep; return c;
  }
  const ring = (pts, P) => { pts.forEach((p, i) => { const q = P(p[0], p[1]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); };

  // ---------- Outils de dessin ----------
  const DBG = /[?&]t=/.test(location.search), ETQ = window.__etq = [];   // boîtes des étiquettes de la dernière image, en px (contrôle visuel)
  const boite = (txt, x0, y0, x1, y1, g) => { if (DBG && ctx === main && ctx.globalAlpha > .55) ETQ.push([txt, x0 / u, y0 / u, x1 / u, y1 / u, g || '']); };
  let NU = 0, voileN = 0;                // NU : 0 = jour, 1 = nuit (inverse les encres des étiquettes)
  const FOND_NUIT = [12, 30, 48], BORD = 18;   // BORD : marge minimale des étiquettes, en px écran
  const h2 = c => { if (c[0] === '#'){ const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; } return c.match(/\d+/g).slice(0, 3).map(Number); };
  const mixA = (a, b, k) => [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * k));
  const mix = (a, b, k) => { const m = mixA(h2(a), h2(b), clamp(k)); return `rgb(${m[0]},${m[1]},${m[2]})`; };
  const ENCRES = { '#141414': '#f2f5f8', '#6e6e73': '#a9b8c6', '#1f4aa8': '#9dbdff', '#dd203c': '#ff7386', '#86aeab': '#5f8299', '#3b3b40': '#cdd6de', '#ffffff': '#0c1e30', '#4b4b50': '#b9c5d0' };
  const tc = col => { if (NU <= 0) return col; const n = ENCRES[col.toLowerCase()]; return n ? mix(col, n, NU) : col; };
  const halo = (a = .92) => { const m = mixA([255, 255, 255], FOND_NUIT, NU); return `rgba(${m[0]},${m[1]},${m[2]},${a})`; };
  const dash = (...d) => ctx.setLineDash(d.map(v => v * u));
  function label(txt, x, y, o = {}){
    const { color = C.encre, align = 'center', w = 500, size = 12, halo: hl = true, font = FONT, italic = false, clampX = true, g = '', dbg = true } = o;
    ctx.font = `${italic ? 'italic ' : ''}${w} ${size * u}px ${font}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
    const tw = ctx.measureText(txt).width;
    if (clampX){
      if (align === 'center') x = clamp(x, tw / 2 + BORD * u, L.VW - tw / 2 - BORD * u);
      else if (align === 'left') x = clamp(x, BORD * u, L.VW - tw - BORD * u);
      else x = clamp(x, tw + BORD * u, L.VW - BORD * u);
      y = clamp(y, (BORD - 4) * u, L.VH - (BORD - 4) * u);
    }
    if (hl){ ctx.lineJoin = 'round'; ctx.lineWidth = 3.5 * u; ctx.strokeStyle = halo(); ctx.strokeText(txt, x, y); }
    ctx.fillStyle = tc(color); ctx.fillText(txt, x, y);
    if (dbg){ const x0 = align === 'center' ? x - tw / 2 : align === 'left' ? x : x - tw; boite(txt, x0, y - size * u * .55, x0 + tw, y + size * u * .55, g); }
    return tw;
  }
  function caps(txt, x, y, o = {}){       // capitales espacées (noms de pays)
    const { color = C.pays, size = 10.5, sp = 2.4, w = 600 } = o;
    ctx.font = `${w} ${size * u}px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const ws = [...txt].map(ch => ctx.measureText(ch).width), tot = ws.reduce((a, b) => a + b, 0) + sp * u * (txt.length - 1);
    let cx = clamp(x - tot / 2, BORD * u, L.VW - tot - BORD * u);
    boite(txt, cx, y - size * u * .55, cx + tot, y + size * u * .55);
    ctx.lineJoin = 'round'; ctx.lineWidth = 3 * u; ctx.strokeStyle = 'rgba(255,255,255,.85)';
    [...txt].forEach((ch, i) => { ctx.strokeText(ch, cx, y); ctx.fillStyle = color; ctx.fillText(ch, cx, y); cx += ws[i] + sp * u; });
  }
  function sea(lines, x, y, size = 13){
    lines.forEach((l, i) => label(l, x, y + (i - (lines.length - 1) / 2) * size * 1.15 * u, { color: C.merTexte, italic: true, size, halo: false, w: 400 }));
  }
  function city(txt, x, y, side = 'left', o = {}){
    ctx.fillStyle = C.encre; ctx.beginPath(); ctx.arc(x, y, 2.3 * u, 0, 7); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1 * u; ctx.stroke();
    label(txt, x + (side === 'left' ? 7 : -7) * u, y - .5 * u, { align: side === 'left' ? 'left' : 'right', size: 13, w: 500, ...o });
  }
  function chip(txt, x, y, color, fill = C.papier, ink = color, align = 'center'){
    ctx.font = `600 ${11.5 * u}px ${FONT}`;
    const w = ctx.measureText(txt).width + 18 * u, h = 22 * u;
    if (align === 'left') x += w / 2; else if (align === 'right') x -= w / 2;
    x = clamp(x, w / 2 + BORD * u, L.VW - w / 2 - BORD * u); y = Math.max(y, (BORD - 4) * u + h / 2);
    const x0 = x - w / 2, y0 = y - h / 2, r = h / 2;
    ctx.beginPath(); ctx.moveTo(x0 + r, y0); ctx.arcTo(x0 + w, y0, x0 + w, y0 + h, r); ctx.arcTo(x0 + w, y0 + h, x0, y0 + h, r);
    ctx.arcTo(x0, y0 + h, x0, y0, r); ctx.arcTo(x0, y0, x0 + w, y0, r); ctx.closePath();
    boite(txt, x0, y0, x0 + w, y0 + h);
    ctx.fillStyle = tc(fill); ctx.fill(); ctx.lineWidth = 1.2 * u; ctx.strokeStyle = tc(color); ctx.stroke();
    ctx.fillStyle = tc(ink); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y + .5 * u);
  }
  function delta(x, y, size, fill, stroke, rot = 0, alpha = 1){
    const k = size * u;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath(); ctx.moveTo(k, 0); ctx.lineTo(-k * .85, -k * .72); ctx.lineTo(-k * .42, 0); ctx.lineTo(-k * .85, k * .72); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill(); ctx.lineJoin = 'round'; ctx.lineWidth = 1.4 * u; ctx.strokeStyle = stroke; ctx.stroke();
    ctx.restore();
  }
  function filet(pts, fin = true){       // filet de renvoi : trait fin doublé d'un liseré, terminé par un point
    const tr = () => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); };
    ctx.lineJoin = 'miter'; ctx.lineCap = 'butt'; dash();
    ctx.strokeStyle = halo(.95); ctx.lineWidth = 3 * u; tr();
    ctx.strokeStyle = tc(C.encre); ctx.lineWidth = .8 * u; tr();
    if (fin){ const e = pts[pts.length - 1]; ctx.fillStyle = tc(C.encre); ctx.beginPath(); ctx.arc(e[0], e[1], 2.2 * u, 0, 7); ctx.fill(); }
  }
  function lueur(x, y, r, rgb, a){        // halo lumineux additif (nuit)
    if (a <= .004) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.4, `rgba(${rgb},${a * .35})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.restore();
  }
  function impact(x, y, age, k = 1){     // éclair, onde rouge ; la nuit, l'explosion éclaire l'eau
    if (age < 0 || age > 1.3) return;
    if (NU > .3 && age < 1) lueur(x, y, (46 + 60 * ease(age)) * k * u, '255,178,96', .55 * NU * (1 - age));
    if (age < .28){
      const f = age / .28;
      const g = ctx.createRadialGradient(x, y, 0, x, y, (9 + 22 * f) * k * u);
      g.addColorStop(0, `rgba(255,255,255,${1 - f * .5})`); g.addColorStop(.35, `rgba(255,214,120,${.9 * (1 - f)})`); g.addColorStop(1, 'rgba(221,32,60,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, (9 + 22 * f) * k * u, 0, 7); ctx.fill();
    }
    for (let i = 0; i < 2; i++){
      const a = age - i * .16; if (a <= 0 || a > 1) continue;
      ctx.save(); ctx.globalAlpha *= (1 - a) * .9; ctx.strokeStyle = tc(C.rouge); ctx.lineWidth = (2.2 - a) * u;
      ctx.beginPath(); ctx.arc(x, y, (5 + 34 * ease(a)) * k * u, 0, 7); ctx.stroke(); ctx.restore();
    }
  }
  function voile(){                      // voile blanc sur les bords (plus étroit la nuit)
    const m = lerp(16, 5, voileN) * u, W = L.VW, H = L.VH;
    [[0, 0, 0, m, 0, 0, W, m], [0, H, 0, H - m, 0, H - m, W, m], [0, 0, m, 0, 0, 0, m, H], [W, 0, W - m, 0, W - m, 0, m, H]].forEach(([x0, y0, x1, y1, rx, ry, rw, rh]) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(rx, ry, rw, rh);
    });
  }
  function echelle(txt, len){
    const x = BORD * u, y = L.VH - BORD * u;
    ctx.strokeStyle = tc(C.gris); ctx.lineWidth = 1 * u; dash(); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
    label(txt, x, y - 9 * u, { align: 'left', color: C.gris, size: 11, halo: true });
  }
  function fond(land, extra){            // mer, rivage estompé, terres blanches
    ctx.fillStyle = C.mer; ctx.fillRect(0, 0, L.VW, L.VH);
    ctx.lineJoin = 'round';
    [[18, .14], [12, .2], [7, .3], [3, .5]].forEach(([w, a]) => { ctx.strokeStyle = rgba(C.rivage, a); ctx.lineWidth = w * u; ctx.stroke(land); });
    ctx.fillStyle = '#fff'; ctx.fill(land, 'evenodd');
    ctx.strokeStyle = '#a9c9c6'; ctx.lineWidth = .7 * u; ctx.stroke(land);
    if (extra) extra();
  }

  // =====================================================================
  // Étape 1 : le détroit
  // =====================================================================
  let P1, lay1, pont1, canal1, P2, lay2, R2, locLay, lay3;
  function polyLen(pts){ const d = [0]; for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return d; }
  function along(pts, cum, dd){
    dd = clamp(dd, 0, cum[cum.length - 1]);
    for (let i = 1; i < pts.length; i++) if (dd <= cum[i]){ const k = (dd - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1);
      return { x: lerp(pts[i - 1][0], pts[i][0], k), y: lerp(pts[i - 1][1], pts[i][1], k), a: Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]) }; }
    const e = pts[pts.length - 1]; return { x: e[0], y: e[1], a: 0 };
  }
  function plan1(){
    P1 = proj(L.strait);
    const land = new Path2D(); const keep = ctx; ctx = land; DATA.strait.land.forEach(r => { ring(r, P1); land.closePath(); }); ctx = keep;
    const b = DATA.bridge.map(p => P1(p[0], p[1])).reverse();          // de Taman vers Kertch
    pont1 = { pts: b, cum: polyLen(b), arch: P1(ARCH[0], ARCH[1]) };
    const c = CANAL.map(p => P1(p[0], p[1])); canal1 = { pts: c, cum: polyLen(c) };
    lay1 = layer(() => fond(land, () => {
      // voie ferrée et route d'accès, en filigrane sur les terres
      ctx.save(); ctx.clip(land, 'evenodd'); ctx.strokeStyle = '#e3ddd5'; ctx.lineWidth = 1.6 * u; ctx.beginPath(); ring(DATA.rail, P1); ctx.stroke(); ctx.restore();
    }));
    locLay = layer(localisation);
  }
  function navire(x, y, a, k = 1, col = '#5a6067'){
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    const l = 6.2 * k * u, w = 2.1 * k * u;
    ctx.beginPath(); ctx.moveTo(l, 0); ctx.lineTo(l * .45, -w); ctx.lineTo(-l, -w); ctx.lineTo(-l, w); ctx.lineTo(l * .45, w); ctx.closePath();
    ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = .8 * u; ctx.stroke();
    ctx.restore();
  }
  function carteRect(){
    const [x0, y0, w0, h0] = L.s1.card;
    ctx.font = `700 ${14 * u}px ${TITRE}`; const tw14 = ctx.measureText(T.carteTitre).width;
    const corps = clamp(14 * (w0 - 28 * u) / tw14, 11.5, 14), tw = tw14 * corps / 14;      // le titre rétrécit un peu avant d'élargir l'encadré
    const w = Math.min(Math.max(w0, tw + 28 * u), L.VW - 2 * BORD * u), h = h0 * clamp(u / (L.full ? 1 : 1.28), 1, 1.5);
    return [Math.min(x0, L.VW - BORD * u - w), L.full ? y0 : y0 + h0 - h, w, h, corps];     // sur téléphone, l'encadré grandit vers le haut
  }
  function carteArches(t, a){
    const [x, y, w, h, corps] = carteRect();
    boite('[encadré]', x, y, x + w, y + h, 'carte');
    ctx.save(); ctx.globalAlpha *= a;
    ctx.fillStyle = 'rgba(255,255,255,.96)'; ctx.strokeStyle = C.filet; ctx.lineWidth = 1 * u;
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.fill(); ctx.stroke();
    label(T.carteTitre, x + 12 * u, y + 17 * u, { align: 'left', font: TITRE, w: 700, size: corps, halo: false, clampX: false, g: 'carte' });
    // élévation : 227 m de portée, tablier à 35 m, flèche de 45 m
    const k = Math.min((w - 98 * u) / 227, (h - 68 * u) / 80), bx = x + 74 * u + (w - 98 * u - 227 * k) / 2, wy = y + h - 16 * u, dy = wy - 35 * k, top = dy - 45 * k;
    ctx.save(); ctx.beginPath(); ctx.rect(x + 1, y + 26 * u, w - 2, h - 27 * u); ctx.clip();
    ctx.fillStyle = C.mer; ctx.fillRect(x, wy, w, y + h - wy);
    // navire qui passe sous l'arche (vu de l'avant)
    const sk = ((t * .1) % 1), sx = lerp(bx + 30 * k, bx + 197 * k, .5 + .16 * Math.sin(sk * 6.283));
    ctx.fillStyle = '#5a6067'; ctx.beginPath(); ctx.moveTo(sx - 13 * k, wy - 6 * k); ctx.lineTo(sx + 13 * k, wy - 6 * k); ctx.lineTo(sx + 10 * k, wy + 1); ctx.lineTo(sx - 10 * k, wy + 1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#5a6067'; ctx.lineWidth = .8 * u; ctx.beginPath(); ctx.rect(sx - 6 * k, wy - 19 * k, 12 * k, 13 * k); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#5a6067'; ctx.beginPath(); ctx.moveTo(sx, wy - 19 * k); ctx.lineTo(sx, wy - 27 * k); ctx.stroke();
    ctx.strokeStyle = '#a9c9c6'; ctx.lineWidth = .8 * u; ctx.beginPath(); ctx.moveTo(x, wy); ctx.lineTo(x + w, wy); ctx.stroke();
    // piles, tablier, arche, suspentes
    ctx.fillStyle = '#d9d6cf'; [0, 227].forEach(px => { const pw = 9 * k; ctx.fillRect(bx + px * k - pw / 2, dy, pw, wy - dy + 2); });
    ctx.strokeStyle = C.encre; ctx.lineWidth = 1.1 * u; ctx.beginPath();
    for (let i = 0; i <= 30; i++){ const f = i / 30, ax = bx + 227 * k * f, ay = dy - 45 * k * (1 - Math.pow(2 * f - 1, 2)); i ? ctx.lineTo(ax, ay) : ctx.moveTo(ax, ay); }
    ctx.stroke();
    ctx.lineWidth = .6 * u; ctx.beginPath();
    for (let i = 1; i < 14; i++){ const f = i / 14, ax = bx + 227 * k * f; ctx.moveTo(ax, dy - 45 * k * (1 - Math.pow(2 * f - 1, 2))); ctx.lineTo(ax, dy); }
    ctx.stroke();
    ctx.lineWidth = 2.2 * u; ctx.beginPath(); ctx.moveTo(x, dy); ctx.lineTo(x + w, dy); ctx.stroke();
    ctx.restore();
    // cotes
    ctx.strokeStyle = C.gris; ctx.lineWidth = .8 * u; dash();
    const cy = top - 9 * u;
    ctx.beginPath(); ctx.moveTo(bx, cy); ctx.lineTo(bx + 227 * k, cy); ctx.moveTo(bx, cy - 3 * u); ctx.lineTo(bx, cy + 3 * u); ctx.moveTo(bx + 227 * k, cy - 3 * u); ctx.lineTo(bx + 227 * k, cy + 3 * u); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.96)'; ctx.fillRect(bx + 227 * k / 2 - 22 * u, cy - 7 * u, 44 * u, 14 * u);
    label(T.portee, bx + 227 * k / 2, cy, { size: 12, w: 600, halo: false, clampX: false, g: 'carte' });
    const cx = bx - 22 * u;
    ctx.beginPath(); ctx.moveTo(cx, dy); ctx.lineTo(cx, wy); ctx.moveTo(cx - 3 * u, dy); ctx.lineTo(cx + 3 * u, dy); ctx.moveTo(cx - 3 * u, wy); ctx.lineTo(cx + 3 * u, wy); ctx.stroke();
    label(T.tirant, cx - 6 * u, (dy + wy) / 2, { size: 12, w: 600, halo: false, align: 'right', clampX: false, g: 'carte' });
    ctx.restore();
  }
  function localisation(){
    const [x, y, r] = L.s1.loc, f = { lon: 34.6, lat: 46.6, kpu: 9.5 };
    const k = 111.32 * Math.cos(f.lat * D2R) / f.kpu, m0 = mercD(f.lat), P = (lon, lat) => [x + (lon - f.lon) * k * u, y - (mercD(lat) - m0) * k * u];
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.16)'; ctx.shadowBlur = 8 * u * dpr * s; ctx.shadowOffsetY = 1 * u * dpr * s;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r * u, 0, 7); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.beginPath(); ctx.arc(x, y, r * u, 0, 7); ctx.clip();
    ctx.fillStyle = '#d9d9d9'; ctx.beginPath(); DATA.region.land.forEach(rg => { ring(rg, P); ctx.closePath(); }); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = .8 * u; ctx.beginPath(); DATA.region.ukr.forEach(b => ring(b, P)); ctx.stroke();
    const a = P(ARCH[0], ARCH[1]); ctx.strokeStyle = C.rouge; ctx.lineWidth = 1.6 * u; ctx.strokeRect(a[0] - 4 * u, a[1] - 3.2 * u, 8 * u, 6.4 * u);
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 1 * u; ctx.beginPath(); ctx.arc(x, y, r * u, 0, 7); ctx.stroke();
  }
  function draw1(t, a){
    if (a <= 0) return;
    const o = L.s1;
    ctx.save(); ctx.globalAlpha = a;
    ctx.drawImage(lay1, 0, 0, L.VW, L.VH);
    // chenal et navires
    dash(5, 4); ctx.strokeStyle = '#9cc5c1'; ctx.lineWidth = 1.2 * u; ctx.lineJoin = 'round';
    ctx.beginPath(); canal1.pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); dash();
    const cl = canal1.cum[canal1.cum.length - 1];
    [[0, 1], [.37, 1], [.71, -1]].forEach(([off, dir]) => {
      const f = ((t * .028 * dir + off) % 1 + 1) % 1, p = along(canal1.pts, canal1.cum, f * cl);
      if (p.x > 0 && p.x < L.VW && p.y > 0 && p.y < L.VH) navire(p.x, p.y, p.a + (dir < 0 ? Math.PI : 0));
    });
    // étiquettes de fond
    sea(T.azov, ...P1(o.azov[0], o.azov[1]));
    { const p = P1(o.noire[0], o.noire[1]), cr = carteRect(); if (L.full || p[1] + 18 * u < cr[1]) sea(T.noire, p[0], p[1]); }     // masquée si l'encadré la recouvre
    caps(T.crimee, ...P1(o.crimee[0], o.crimee[1])); caps(T.russie, ...P1(o.russie[0], o.russie[1]));
    { const p = P1(o.touzla[0], o.touzla[1]); label(T.touzla, p[0], p[1], { size: 11.5, color: C.gris, italic: true, align: o.touzla[2] }); }
    if (o.chenal){ const p = P1(o.chenal[0], o.chenal[1]); label(T.chenal, p[0], p[1], { size: 11.5, color: C.merTexte, italic: true, align: o.chenal[2], halo: false }); }
    city(T.kertch, ...P1(36.4671, 45.3563), 'right'); city(T.taman, ...P1(36.7191, 45.2159), o.tamanCote || 'left');
    // le pont se trace de Taman vers Kertch
    const k = ease((t - .7) / 2.8), tot = pont1.cum[pont1.cum.length - 1], dd = tot * k;
    const tr = () => { ctx.beginPath(); for (let i = 0; i < pont1.pts.length; i++){ if (pont1.cum[i] <= dd){ const p = pont1.pts[i]; i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } else { const p = along(pont1.pts, pont1.cum, dd); ctx.lineTo(p.x, p.y); break; } } ctx.stroke(); };
    if (k > 0){
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 6 * u; tr();
      ctx.strokeStyle = C.encre; ctx.lineWidth = 2.3 * u; tr(); ctx.lineCap = 'butt';
      if (k < 1){ const p = along(pont1.pts, pont1.cum, dd); ctx.fillStyle = C.rouge; ctx.beginPath(); ctx.arc(p.x, p.y, 3.4 * u, 0, 7); ctx.fill(); }
    }
    const aL = clamp((t - 3.2) / .6);
    if (aL > 0){
      ctx.save(); ctx.globalAlpha *= aL;
      const p = P1(o.pont[0], o.pont[1]);
      label(T.pont, p[0], p[1], { font: TITRE, w: 700, size: 17, align: 'left' });
      label(T.km19, p[0], p[1] + 19 * u, { color: C.rouge, w: 600, size: 13.5, align: 'left' });
      ctx.restore();
    }
    // les arches
    const aA = clamp((t - 4.1) / .6);
    if (aA > 0){
      const [ax, ay] = pont1.arch, [cx, cy, cw, ch] = carteRect();
      ctx.save(); ctx.globalAlpha *= aA;
      for (let i = 0; i < 2; i++){ const f = ((t * .5 + i / 2) % 1); ctx.strokeStyle = rgba(C.rouge, .5 * (1 - f)); ctx.lineWidth = 1.4 * u; ctx.beginPath(); ctx.arc(ax, ay, (9 + 16 * f) * u, 0, 7); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.strokeStyle = C.rouge; ctx.lineWidth = 1.8 * u; ctx.beginPath(); ctx.arc(ax, ay, 8.5 * u, 0, 7); ctx.fill(); ctx.stroke();
      if (ax > cx + cw + 10 * u) filet([[cx + cw, cy + ch / 2], [ax, cy + ch / 2], [ax, ay + 8.5 * u]], false);
      else filet([[ax, cy], [ax, ay + 8.5 * u]], false);
      ctx.restore();
      carteArches(t, aA);
    }
    ctx.drawImage(locLay, 0, 0, L.VW, L.VH); { const [gx, gy, gr] = L.s1.loc; boite('[globe]', gx - gr * u, gy - gr * u, gx + gr * u, gy + gr * u, 'globe'); }
    echelle(T.km5, 5 / L.strait.kpu);
    ctx.restore();
  }

  // =====================================================================
  // Étape 2 : le couloir
  // =====================================================================
  const TA = 11.0, V2 = 100;     // arrivée de la salve (s), vitesse de défilement (km/s d'animation)
  function plan2(){
    P2 = proj(L.region);
    const land = new Path2D(); const keep = ctx; ctx = land; DATA.region.land.forEach(r => { ring(r, P2); land.closePath(); }); ctx = keep;
    const occ = new Path2D(); ctx = occ; DATA.region.occ.forEach(r => { ring(r, P2); occ.closePath(); }); ctx = keep;
    lay2 = layer(() => fond(land, () => {
      ctx.save(); ctx.clip(land, 'evenodd');
      // zone d'occupation russe (ISW) : rouge léger hachuré, ligne de front
      ctx.save(); ctx.clip(occ, 'evenodd');
      ctx.fillStyle = rgba(C.rouge, .065); ctx.fillRect(0, 0, L.VW, L.VH);
      ctx.strokeStyle = rgba(C.rouge, .3); ctx.lineWidth = .8 * u; ctx.beginPath();
      for (let k = -L.VH; k < L.VW; k += 6 * u){ ctx.moveTo(k, L.VH); ctx.lineTo(k + L.VH, 0); } ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = '#cfe2df'; ctx.lineWidth = 1.5 * u; ctx.lineJoin = 'round'; ctx.beginPath(); DATA.region.dnipro.forEach(r => ring(r, P2)); ctx.stroke();
      ctx.strokeStyle = rgba(C.rouge, .7); ctx.lineWidth = 1.1 * u; ctx.beginPath(); DATA.region.front.forEach(r => ring(r, P2)); ctx.stroke();
      const b = arr => { ctx.beginPath(); arr.forEach(r => ring(r, P2)); ctx.stroke(); };
      ctx.strokeStyle = 'rgba(123,123,128,.12)'; ctx.lineWidth = 4 * u; b(DATA.region.ukr); b(DATA.region.autres);
      ctx.strokeStyle = '#7b7b80'; ctx.lineWidth = .8 * u; b(DATA.region.ukr);
      ctx.strokeStyle = '#b4b4b8'; b(DATA.region.autres);
      ctx.restore();
    }));
    const B = ARCH, o = L.s2;
    R2 = { b: P2(B[0], B[1]), segs: [], pont: DATA.bridge.map(p => P2(p[0], p[1])) };
    [115, 180, 245].forEach((r, ri) => {
      const n = [6, 7, 8][ri], b0 = 258, b1 = 372, w = (b1 - b0) / n;
      for (let i = 0; i < n; i++){
        const a0 = b0 + i * w + w * .1, a1 = b0 + (i + 1) * w - w * .1, mid = (a0 + a1) / 2, pts = [];
        for (let k = 0; k <= 8; k++) pts.push(P2(...dest(B[0], B[1], a0 + (a1 - a0) * k / 8, r)));
        const way = mid > 290 && mid < 344;
        R2.segs.push({ pts, mid, r, m: P2(...dest(B[0], B[1], mid, r)), from: P2(...dest(B[0], B[1], mid - 6 + rnd(i + ri * 9) * 12, r + 190)),
                       kill: way ? 1.5 + (2 - ri) * 1.05 + rnd(i * 3 + ri) * .75 : null });
      }
    });
    R2.arc = []; for (let b = 262; b <= 368; b += 2) R2.arc.push(P2(...dest(B[0], B[1], b, 480)));
    R2.arcLabel = P2(...dest(B[0], B[1], L.full ? 276 : 352, 480));
    R2.relais = [330, 225, 120].map(d => P2(...dest(B[0], B[1], 316, d)));
    R2.stub = P2(...dest(B[0], B[1], 316, 450));
    R2.salve = o.salve.map(([brg, d, g], i) => ({ o: P2(...dest(B[0], B[1], brg, d)), d, g: !!g, dep: TA - d / V2, i }));
    R2.def = P2(...dest(B[0], B[1], o.defLabel[0], o.defLabel[1]));
  }
  function draw2(t, a){
    if (a <= 0) return;
    const o = L.s2, B = R2.b;
    ctx.save(); ctx.globalAlpha = a;
    ctx.drawImage(lay2, 0, 0, L.VW, L.VH);
    // distance de lancement citée par le WSJ : 300 miles
    const aS = clamp((t - 5.4) / .8);
    if (aS > 0){
      ctx.save(); ctx.globalAlpha *= aS * .9; dash(2, 4); ctx.strokeStyle = C.gris; ctx.lineWidth = 1 * u;
      ctx.beginPath(); R2.arc.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); dash();
      label(T.km480, R2.arcLabel[0], R2.arcLabel[1] + (L.full ? 0 : 12 * u), { color: C.gris, size: 11.5 });
      ctx.restore();
    }

    // défenses russes (schéma) : les segments placés sur la route du pont s'éteignent un à un
    const aD = clamp((t - .7) / .7);
    ctx.save(); ctx.globalAlpha *= aD; ctx.lineCap = 'butt';
    R2.segs.forEach(sg => {
      const dead = sg.kill != null && t >= sg.kill, d = dead ? t - sg.kill : 0;
      ctx.beginPath(); sg.pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      if (dead){ dash(1.5, 4); ctx.strokeStyle = rgba('#141414', .22); ctx.lineWidth = 1.1 * u; }
      else { dash(5, 3.5); ctx.strokeStyle = C.encre; ctx.lineWidth = 1.7 * u; }
      ctx.stroke(); dash();
      if (sg.kill != null){
        const f = (t - sg.kill + .85) / .85;                    // munition en approche
        if (f > 0 && f < 1){ const x = lerp(sg.from[0], sg.m[0], f), y = lerp(sg.from[1], sg.m[1], f);
          delta(x, y, 5.5, C.bleu, C.bleu, Math.atan2(sg.m[1] - sg.from[1], sg.m[0] - sg.from[0]), clamp(f * 4)); }
        if (dead && d < .9){ ctx.strokeStyle = rgba(C.bleu, .8 * (1 - d / .9)); ctx.lineWidth = 1.6 * u; ctx.beginPath(); ctx.arc(sg.m[0], sg.m[1], (4 + 20 * ease(d / .9)) * u, 0, 7); ctx.stroke(); }
        if (dead){ const k = 3.2 * u; ctx.strokeStyle = rgba('#141414', .45); ctx.lineWidth = 1.2 * u; ctx.beginPath(); ctx.moveTo(sg.m[0] - k, sg.m[1] - k); ctx.lineTo(sg.m[0] + k, sg.m[1] + k); ctx.moveTo(sg.m[0] + k, sg.m[1] - k); ctx.lineTo(sg.m[0] - k, sg.m[1] + k); ctx.stroke(); }
      }
    });
    ctx.restore();
    const aDl = win(t, 1.0, 9.5, .6);
    if (aDl > 0){ ctx.save(); ctx.globalAlpha *= aDl;
      label(T.defenses, R2.def[0], R2.def[1], { w: 600, size: 12.5 }); label(T.schema, R2.def[0], R2.def[1] + 15 * u, { color: C.gris, size: 11 });
      ctx.restore(); }

    // étiquettes de fond, par-dessus les arcs
    sea(T.noire, ...P2(o.noire[0], o.noire[1])); sea(T.azov, ...P2(o.azov[0], o.azov[1]), 12);
    caps(T.ukraine, ...P2(o.ukraine[0], o.ukraine[1])); caps(T.russie, ...P2(o.russie[0], o.russie[1])); if (o.crimee) caps(T.crimee, ...P2(o.crimee[0], o.crimee[1]), { size: 9.5 });
    o.villes.forEach(([k, lon, lat, side]) => city(T[k], ...P2(lon, lat), side, { size: 12.5 }));

    // drones relais et liaison
    const aR = clamp((t - 5.4) / .8);
    const guide = R2.salve.find(d => d.g);
    const posOf = d => { const f = clamp((t - d.dep) / (TA - d.dep)); return [lerp(d.o[0], B[0], f), lerp(d.o[1], B[1], f)]; };
    if (aR > 0){
      ctx.save(); ctx.globalAlpha *= aR;
      const chain = [R2.stub, ...R2.relais];
      const gp = t >= guide.dep && t < TA ? posOf(guide) : null;
      const g = ctx.createLinearGradient(R2.stub[0], R2.stub[1], R2.relais[0][0], R2.relais[0][1]);
      g.addColorStop(0, rgba(C.bleu, 0)); g.addColorStop(1, rgba(C.bleu, .9));
      ctx.lineWidth = 1.5 * u; ctx.strokeStyle = g; ctx.beginPath(); ctx.moveTo(chain[0][0], chain[0][1]); ctx.lineTo(chain[1][0], chain[1][1]); ctx.stroke();
      ctx.strokeStyle = rgba(C.bleu, .9); ctx.beginPath(); ctx.moveTo(chain[1][0], chain[1][1]); ctx.lineTo(chain[2][0], chain[2][1]); ctx.lineTo(chain[3][0], chain[3][1]); ctx.stroke();
      if (gp){ // le relais le plus proche pilote la munition
        let best = R2.relais[0], bd = 1e9; R2.relais.forEach(r => { const d = Math.hypot(r[0] - gp[0], r[1] - gp[1]); if (d < bd){ bd = d; best = r; } });
        dash(3, 3); ctx.beginPath(); ctx.moveTo(best[0], best[1]); ctx.lineTo(gp[0], gp[1]); ctx.stroke(); dash();
      }
      // paquets : commandes vers l'aval
      for (let sgi = 1; sgi < chain.length; sgi++) for (let k = 0; k < 2; k++){
        const f = ((t * .9 + k / 2 + sgi * .3) % 1), x = lerp(chain[sgi - 1][0], chain[sgi][0], f), y = lerp(chain[sgi - 1][1], chain[sgi][1], f);
        ctx.fillStyle = C.encre; ctx.globalAlpha = a * aR * (sgi === 1 ? f : 1); ctx.beginPath(); ctx.arc(x, y, 2.3 * u, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = a * aR;
      const brg = Math.atan2(B[1] - R2.stub[1], B[0] - R2.stub[0]);
      R2.relais.forEach((r, i) => delta(r[0], r[1] + 1.6 * Math.sin(t * 1.3 + i * 2) * u, 7, C.papier, C.bleu, brg));
      const r1 = R2.relais[1]; if (L.full){ label(T.relais, r1[0] + 12 * u, r1[1] + 17 * u, { w: 600, size: 12, align: 'left' }); label(T.relaisSous, r1[0] + 12 * u, r1[1] + 31 * u, { color: C.gris, size: 11.5, align: 'left' }); }
      else { label(T.relais, r1[0] - 14 * u, r1[1] + 8 * u, { w: 600, size: 12, align: 'right' }); label(T.relaisSousCourt, r1[0] - 14 * u, r1[1] + 22 * u, { color: C.gris, size: 11.5, align: 'right' }); }
      ctx.restore();
    }

    // la salve : départs échelonnés, arrivée simultanée
    R2.salve.forEach(d => {
      if (t < d.dep) return;
      const dp = t - d.dep, p = posOf(d), ang = Math.atan2(B[1] - d.o[1], B[0] - d.o[0]);
      if (dp < .8){ ctx.strokeStyle = rgba(C.bleu, .7 * (1 - dp / .8)); ctx.lineWidth = 1.4 * u; ctx.beginPath(); ctx.arc(d.o[0], d.o[1], (3 + 16 * ease(dp / .8)) * u, 0, 7); ctx.stroke(); }
      const g = ctx.createLinearGradient(d.o[0], d.o[1], p[0], p[1]); g.addColorStop(0, rgba(C.bleu, 0)); g.addColorStop(1, rgba(C.bleu, .6));
      dash(1.4, 3.6); ctx.strokeStyle = g; ctx.lineWidth = 1.3 * u; ctx.beginPath(); ctx.moveTo(d.o[0], d.o[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); dash();
      if (t < TA) delta(p[0], p[1], d.g ? 8 : 6.5, C.bleu, C.bleu, ang);
    });

    // le pont
    ctx.lineCap = 'round'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 4.5 * u; ctx.beginPath(); R2.pont.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
    ctx.strokeStyle = C.encre; ctx.lineWidth = 2 * u; ctx.stroke(); ctx.lineCap = 'butt';
    ctx.strokeStyle = C.rouge; ctx.lineWidth = 1.6 * u; ctx.beginPath(); ctx.arc(B[0], B[1], 9 * u, 0, 7); ctx.stroke();
    if (o.pontGauche) label(T.pont, B[0] - 15 * u, B[1] + 3 * u, { font: TITRE, w: 700, size: 14.5, align: 'right' }); else label(T.pont, B[0] + 14 * u, B[1] + 13 * u, { font: TITRE, w: 700, size: 14.5, align: 'left' });
    if (t >= TA) for (let i = 0; i < 4; i++) impact(B[0] + (rnd(i) - .5) * 10 * u, B[1] + (rnd(i + 7) - .5) * 10 * u, t - TA - i * .22, 1.1);
    const aAr = clamp((t - TA + 1.6) / .5);
    if (aAr > 0){ ctx.save(); ctx.globalAlpha *= aAr; chip(T.arrivee, B[0] + (L.full ? 30 : 72) * u, B[1] - 32 * u, C.bleu, C.bleu, C.papier, L.full ? 'center' : 'right'); ctx.restore(); }

    // repères
    const c1 = win(t, .8, 5.2), c2 = clamp((t - 5.6) / .4);
    if (c1 > 0){ ctx.save(); ctx.globalAlpha *= c1; chip(T.prep, BORD * u, 28 * u, C.encre, C.papier, C.encre, 'left'); ctx.restore(); }
    if (c2 > 0){ ctx.save(); ctx.globalAlpha *= c2; chip(T.departs, BORD * u, 28 * u, C.bleu, C.papier, C.bleu, 'left'); ctx.restore(); }
    echelle(T.km100, 100 / L.region.kpu);
    ctx.restore();
  }

  // =====================================================================
  // Étapes 3 et 4 : le pont vu du dessus, nord en haut
  // Repère local en mètres : X le long du pont (Crimée < 0 < Russie), Y perpendiculaire,
  // voie ferrée à Y = 0, route à Y = -50 (côté mer d'Azov). Géométrie : OpenStreetMap.
  // =====================================================================
  const ROT = 59.8 * D2R, CR = Math.cos(ROT), SR = Math.sin(ROT), Y0 = -45;
  const LH = 116.6;                                   // demi-distance entre les piles du chenal
  const RAILW = 6.2, ROADY = -50, ROADW = 11.6;       // demi-largeurs des tabliers
  const PILES = [-656.6, -596.6, -536.6, -476.6, -416.6, -356.6, -296.6, -236.6, -176.6, -LH, LH, 176.6, 236.6, 296.6, 356.6, 416.6, 476.6, 536.6, 596.6, 656.6];
  const ILOTS = [[-113.7, -24.5, 26.4], [112.8, -27.6, 27.2]];
  const DUCS = [[-107.4, 30.6, 6.8], [-111.9, 47.3, 9.5], [-94.7, -88.4, 9.5], [-94.1, -70.9, 6.8], [111.8, -96.5, 9.5], [94.1, 40.2, 9.5], [107.5, -79.3, 6.8], [93.5, 21.6, 6.8]];
  const L2S = (X, Y) => { const p = L.pont; return [p.cx + (X * CR - (Y - Y0) * SR) / p.mpu, p.cy + (X * SR + (Y - Y0) * CR) / p.mpu]; };
  // frappes : instant d'impact (s depuis le début de l'étape), cible, taille, direction d'arrivée (écran), famille
  const HITS = [
    { t: 1.6, X: -84, Y: -61.5, k: .8, d: [-.86, -.5], f: 'v' }, { t: 2.0, X: -58, Y: -38.5, k: .8, d: [-.98, .2], f: 'v' }, { t: 2.4, X: -34, Y: -61, k: .8, d: [-.5, -.87], f: 'v' },
    { t: 7.5, X: -104, Y: -60, k: .85, d: [-.9, -.43], f: 'p' }, { t: 7.9, X: 101, Y: -58, k: .85, d: [-.6, -.8], f: 'p' }, { t: 8.3, X: -98, Y: -40, k: .85, d: [-1, .05], f: 'p' },
    { t: 8.8, X: 106, Y: -42, k: .85, d: [-.75, -.66], f: 'p' }, { t: 9.3, X: -60, Y: -61, k: .85, d: [-.97, -.24], f: 'p' }, { t: 9.8, X: 62, Y: -39, k: .85, d: [-.4, -.92], f: 'p' },
    { t: 10.5, X: -20, Y: -60, k: .85, d: [-.86, -.5], f: 'p' }, { t: 11.2, X: 30, Y: -40, k: .85, d: [-.94, .34], f: 'p' },
    { t: 8.5, X: -108, Y: -6.8, k: 1.1, d: [-.96, .28], f: 'm' }, { t: 9.5, X: 26, Y: 6.5, k: 1.1, d: [-.7, .71], f: 'm' }, { t: 10.2, X: 96, Y: -3, k: 1.1, d: [-1, 0], f: 'm' },
    { t: 10.9, X: -52, Y: 2, k: 1.1, d: [-.82, .57], f: 'm' }, { t: 11.6, X: 54, Y: 0, k: 1.5, d: [-.9, .44], f: 'm', guide: 1 }
  ];
  // frappe du 19 novembre (missiles Neptune) : deux à trois impacts sur une des deux voies, côté Kertch de l'arche (image Vantor, TWZ)
  const N19 = [[-150, 2.85, 2.9], [-177, 2.85, 3.15], [-204, 2.85, 3.4]];
  const TC = 12.1;                                     // début de l'effondrement
  // palettes du pont : jour et nuit
  const PJ = { mer: '#e7f1f0', vague: '#c9dfdc', chenal: '#9fc7c3', bande: '#dfecea', ilot: '#f6f4ef', ilotB: '#cbc6ba', pile: '#d5d1c8', pileB: '#a8a397',
               tablier: '#f8f7f4', ballast: '#e9e5dd', trait: '#141414', rails: '#77777c', route: '#e2e0db', marque: '#ffffff', acier: '#ffffff', acierB: '#141414',
               noye: '#7fa9a5', noyeB: '#346865', debris: '#5b6066', loco: '#2b2f34', wagon: '#7a7f85' };
  const PN = { mer: '#0d2135', vague: '#1c3b54', chenal: '#2a4f67', bande: '#0a1b2c', ilot: '#2f4356', ilotB: '#4a6076', pile: '#3d5165', pileB: '#586e84',
               tablier: '#62768a', ballast: '#54687b', trait: '#07141f', rails: '#94a8bb', route: '#506276', marque: '#8fa3b6', acier: '#dbe6f1', acierB: '#07141f',
               noye: '#3b5f7c', noyeB: '#86a3bb', debris: '#8696a6', loco: '#2b2f34', wagon: '#7a7f85' };
  const PK = Object.keys(PJ);
  let palK = -1, palC = PJ;
  function palette(n){ if (n <= .001) return PJ; if (n >= .999) return PN; if (n !== palK){ palK = n; palC = {}; PK.forEach(k => { palC[k] = mix(PJ[k], PN[k], n); }); } return palC; }

  let vagues = [], lay3n;
  function local(fn){ const p = L.pont; ctx.save(); ctx.translate(p.cx, p.cy); ctx.scale(1 / p.mpu, 1 / p.mpu); ctx.rotate(ROT); ctx.translate(0, -Y0); fn(p.mpu * u); ctx.restore(); }
  function travee(px, x0, x1, P){
    ctx.fillStyle = P.route; ctx.fillRect(x0, ROADY - ROADW, x1 - x0, 2 * ROADW);
    ctx.strokeStyle = P.pileB; ctx.lineWidth = .5 * px; ctx.beginPath(); PILES.forEach(X => { if (X > x0 + 1 && X < x1 - 1){ ctx.moveTo(X, ROADY - ROADW); ctx.lineTo(X, ROADY + ROADW); } }); ctx.stroke();
    ctx.strokeStyle = P.trait; ctx.lineWidth = .9 * px; ctx.beginPath(); [-ROADW, ROADW].forEach(dy => { ctx.moveTo(x0, ROADY + dy); ctx.lineTo(x1, ROADY + dy); }); ctx.stroke();
    ctx.strokeStyle = P.marque; ctx.lineWidth = .7; ctx.beginPath(); [-ROADW + 1.3, ROADW - 1.3].forEach(dy => { ctx.moveTo(x0, ROADY + dy); ctx.lineTo(x1, ROADY + dy); }); ctx.stroke();
    ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(x0, ROADY); ctx.lineTo(x1, ROADY); ctx.stroke();
    ctx.lineWidth = .5; ctx.setLineDash([5, 7]); ctx.beginPath(); [-5.6, 5.6].forEach(dy => { ctx.moveTo(x0, ROADY + dy); ctx.lineTo(x1, ROADY + dy); }); ctx.stroke(); ctx.setLineDash([]);
  }
  function decor(P){                                   // tout ce qui ne bouge pas : eau, chenal, îlots, piles, tabliers d'approche
    ctx.fillStyle = P.mer; ctx.fillRect(0, 0, L.VW, L.VH);
    local(px => {
      // chenal dragué : 185 m de passe entre les piles
      const g = ctx.createLinearGradient(-112, 0, 112, 0);
      [[0, P.mer], [.16, P.bande], [.84, P.bande], [1, P.mer]].forEach(([o, c]) => g.addColorStop(o, c));
      ctx.fillStyle = g; ctx.fillRect(-112, -1500, 224, 3000);
      ctx.strokeStyle = P.chenal; ctx.lineWidth = 1 * px; ctx.setLineDash([7 * px, 5 * px]);
      ctx.beginPath(); [-92.5, 92.5].forEach(X => { ctx.moveTo(X, -1500); ctx.lineTo(X, 1500); }); ctx.stroke(); ctx.setLineDash([]);
      // îlots de protection et ducs-d'Albe
      ctx.strokeStyle = P.ilotB; ctx.lineWidth = .8 * px; ctx.fillStyle = P.ilot;
      ILOTS.concat(DUCS).forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke(); });
      ctx.lineWidth = .5 * px; ILOTS.forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r - 4, 0, 7); ctx.stroke(); });
      // piles
      ctx.fillStyle = P.pile; ctx.strokeStyle = P.pileB; ctx.lineWidth = .7 * px;
      PILES.forEach(X => { const w = Math.abs(X) === LH ? 4.2 : 2.4;
        ctx.beginPath(); ctx.rect(X - w, -RAILW - 2.6, 2 * w, 2 * RAILW + 5.2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.rect(X - w, ROADY - ROADW - 2.6, 2 * w, 2 * ROADW + 5.2); ctx.fill(); ctx.stroke(); });
      // tablier ferroviaire
      ctx.fillStyle = P.tablier; ctx.fillRect(-720, -RAILW, 1440, 2 * RAILW);
      ctx.fillStyle = P.ballast; ctx.fillRect(-720, -RAILW + 1.4, 1440, 2 * RAILW - 2.8);
      ctx.strokeStyle = P.pileB; ctx.lineWidth = .5 * px; ctx.beginPath(); PILES.forEach(X => { ctx.moveTo(X, -RAILW); ctx.lineTo(X, RAILW); }); ctx.stroke();
      ctx.strokeStyle = P.trait; ctx.lineWidth = .9 * px; ctx.beginPath(); [-RAILW, RAILW].forEach(y => { ctx.moveTo(-720, y); ctx.lineTo(720, y); }); ctx.stroke();
      ctx.strokeStyle = P.rails; ctx.lineWidth = Math.max(.9 * px, .7); ctx.beginPath(); [-2.85, 2.85].forEach(y => { ctx.moveTo(-720, y); ctx.lineTo(720, y); }); ctx.stroke();
      // tablier routier, hors travée du chenal
      travee(px, -720, -LH, P); travee(px, LH, 720, P);
    });
  }
  function plan3(){
    vagues = [[], [], []];
    const p = L.pont;
    for (let i = 0; i < L.s3.vagues * 1.5; i++){
      const x = rnd(i) * L.VW, y = rnd(i + 500) * L.VH;
      const Yl = (-(x - p.cx) * SR + (y - p.cy) * CR) * p.mpu + Y0;      // distance au pont, repère local
      if (Yl > -150 && Yl < 62) continue;
      vagues[i % 3].push([x, y, rnd(i + 900)]);
    }
    lay3 = layer(() => decor(PJ)); lay3n = layer(() => decor(PN));
  }
  function eau(t, n){
    if (n < .999) ctx.drawImage(lay3, 0, 0, L.VW, L.VH);
    if (n > .001){ const a = ctx.globalAlpha; ctx.globalAlpha = a * n; ctx.drawImage(lay3n, 0, 0, L.VW, L.VH); ctx.globalAlpha = a; }
    const col = h2(mix(PJ.vague, PN.vague, n));
    ctx.lineCap = 'round'; ctx.lineWidth = 1.1 * u;
    vagues.forEach((grp, g) => {
      ctx.strokeStyle = `rgba(${col},${.5 + .4 * Math.sin(t * .9 + g * 2.1)})`; ctx.beginPath();
      grp.forEach(([x, y, ph]) => { const dx = Math.sin(t * .5 + ph * 9) * 5 * u, w = (5 + ph * 6) * u; ctx.moveTo(x + dx - w, y); ctx.quadraticCurveTo(x + dx, y - 2.6 * u, x + dx + w, y); });
      ctx.stroke();
    });
    ctx.lineCap = 'butt';
  }
  const ribPts = (y, lean, x0 = -LH, x1 = LH, n = 26) => { const a = []; for (let i = 0; i <= n; i++){ const X = lerp(x0, x1, i / n), k = 1 - (X / LH) * (X / LH); a.push([X, y - lean * k, k]); } return a; };
  function arche(px, y0, half, lean, o = {}){
    const { braces = 9, croix = false, col = C.encre, fill = C.acier, alpha = 1, w = 2.6 } = o;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
    const A = ribPts(y0 - half, lean), B = ribPts(y0 + half, lean);
    const yA = X => y0 - half - lean * (1 - (X / LH) * (X / LH)), yB = X => y0 + half - lean * (1 - (X / LH) * (X / LH));
    // contreventement
    const xs = []; for (let i = 0; i <= braces; i++) xs.push(lerp(-LH * .78, LH * .78, i / braces));
    const tr = () => { ctx.beginPath(); xs.forEach(X => { ctx.moveTo(X, yA(X)); ctx.lineTo(X, yB(X)); });
      if (croix) for (let i = 0; i < xs.length - 1; i++){ ctx.moveTo(xs[i], yA(xs[i])); ctx.lineTo(xs[i + 1], yB(xs[i + 1])); ctx.moveTo(xs[i], yB(xs[i])); ctx.lineTo(xs[i + 1], yA(xs[i + 1])); }
      ctx.stroke(); };
    ctx.strokeStyle = col; ctx.lineWidth = 1.5 + 1.1 * px; tr(); ctx.strokeStyle = fill; ctx.lineWidth = 1.5; tr();
    // membrures
    [A, B].forEach(R => {
      const t2 = () => { ctx.beginPath(); R.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); };
      ctx.strokeStyle = col; ctx.lineWidth = w + 1.5 * px; t2(); ctx.strokeStyle = fill; ctx.lineWidth = w; t2();
    });
    ctx.restore();
  }
  function ombreArche(y0, half, lean, hf, st){
    ctx.strokeStyle = `rgba(46,88,92,${st.sa})`; ctx.lineWidth = 3.2; ctx.lineJoin = 'round';
    [-half, half].forEach(dy => { ctx.beginPath(); ribPts(y0 + dy, lean).forEach((p, i) => { const h = (35 + 45 * p[2]) * hf, x = p[0] + st.sx * h, y = p[1] + st.sy * h; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); });
    ctx.lineWidth = 1.4; ctx.beginPath();
    for (let i = 0; i <= 9; i++){ const X = lerp(-LH * .78, LH * .78, i / 9), k = 1 - (X / LH) * (X / LH), h = (35 + 45 * k) * hf; ctx.moveTo(X + st.sx * h, y0 - half - lean * k + st.sy * h); ctx.lineTo(X + st.sx * h, y0 + half - lean * k + st.sy * h); }
    ctx.stroke();
  }
  function cargo(Y, moving, t, st){             // navire dans le chenal, cap vers +Y (mer Noire)
    ctx.save(); ctx.translate(4, Y); ctx.rotate(.035);
    const hw = 8, bow = 58, sn = -56;
    if (moving){ ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.2; for (let i = 0; i < 3; i++){ const o = 14 + i * 16 + ((t * 9) % 16); ctx.globalAlpha = clamp(1 - o / 60) * .8; ctx.beginPath(); ctx.moveTo(-hw - o * .45, bow - 22 - o); ctx.lineTo(0, bow + 4); ctx.lineTo(hw + o * .45, bow - 22 - o); ctx.stroke(); } ctx.globalAlpha = 1; }
    const hull = () => { ctx.beginPath(); ctx.moveTo(0, bow); ctx.quadraticCurveTo(hw, bow - 8, hw, bow - 24); ctx.lineTo(hw, sn + 4); ctx.quadraticCurveTo(hw, sn, hw - 4, sn); ctx.lineTo(-hw + 4, sn); ctx.quadraticCurveTo(-hw, sn, -hw, sn + 4); ctx.lineTo(-hw, bow - 24); ctx.quadraticCurveTo(-hw, bow - 8, 0, bow); ctx.closePath(); };
    if (st.sa > .01){ ctx.save(); ctx.translate(st.sx * 9, st.sy * 9); ctx.fillStyle = `rgba(46,88,92,${st.sa})`; hull(); ctx.fill(); ctx.restore(); }
    hull(); ctx.fillStyle = '#4a5158'; ctx.fill();
    ctx.fillStyle = '#b9453f'; ctx.fillRect(-hw + 1.6, bow - 27, 2 * hw - 3.2, 1.6);
    ctx.fillStyle = '#c9cdd1'; for (let i = 0; i < 4; i++){ ctx.fillRect(-hw + 2.2, bow - 44 - i * 19, 2 * hw - 4.4, 15); }
    ctx.strokeStyle = '#8d9399'; ctx.lineWidth = .5; ctx.beginPath(); for (let i = 0; i < 4; i++){ ctx.moveTo(0, bow - 44 - i * 19); ctx.lineTo(0, bow - 29 - i * 19); } ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(-hw + 2, sn + 4, 2 * hw - 4, 13); ctx.fillStyle = '#4a5158'; ctx.fillRect(-2, sn + 8, 4, 5);
    ctx.restore();
  }
  function etatPont(tau, bilan){
    const st = { lean: 0, c: 0, hf: 1, trafic: 0, nuit: 0, dore: 0, sx: .06, sy: -.5, sa: .17 };
    if (bilan){ st.c = 1.6; st.hf = 0; st.nuit = 1 - easeIO(tau / 1.6); st.sa = .17 * (1 - st.nuit); return st; }
    st.lean = 4 * easeIO((tau - 2.5) / 1.3);
    st.c = Math.max(0, (tau - TC) / 1.7);
    st.hf = 1 - easeIO(clamp(st.c) * 1.15);
    st.trafic = Math.max(clamp(1 - (tau - 1.4) / .5), win(tau, 4.5, 6.0, .5));
    st.nuit = Math.max(1 - easeIO((tau - 3.3) / 1.2), easeIO((tau - 6.0) / 1.3));   // nuit du 15 au 16, journée du 16, nuit du 16 au 17
    const ap = easeIO((tau - 4.8) / 1.2);                 // l'après-midi, les ombres s'allongent
    st.sx = lerp(.06, .22, ap); st.sy = lerp(-.5, -.95, ap); st.sa = lerp(.17, .14, ap) * (1 - st.nuit);
    st.dore = ap * (1 - st.nuit);
    return st;
  }
  function dessinPont(t, tau, st, bilan, P){
    const c = clamp(st.c), ce = easeIO(c), done = st.c >= 1, leanNow = c > 0 ? st.lean + 7 * ce : st.lean;
    local(px => {
      // ombres portées des tabliers sur l'eau (jamais sur les tabliers eux-mêmes)
      if (st.sa > .005){
        const ox = st.sx * 35, oy = st.sy * 35;
        ctx.fillStyle = `rgba(46,88,92,${st.sa})`;
        // bande d'ombre [ya, yb] sur [x0, x1], privée des tabliers qu'elle croiserait
        const bande = (x0, x1, ya, yb, route) => {
          let iv = [[ya, yb]];
          const ote = (d0, d1) => { iv = iv.flatMap(([p, q]) => q <= d0 || p >= d1 ? [[p, q]] : [[p, Math.min(q, d0)], [Math.max(p, d1), q]].filter(([m, n]) => n - m > .05)); };
          ote(-RAILW, RAILW); if (route) ote(ROADY - ROADW, ROADY + ROADW);
          iv.forEach(([p, q]) => ctx.fillRect(x0, p, x1 - x0, q - p));
        };
        [[-720, -LH, true], [-LH, LH, c === 0], [LH, 720, true]].forEach(([x0, x1, route]) => bande(x0 + ox, x1 + ox, -RAILW + oy, RAILW + oy, route));
        bande(-720 + ox, -LH + ox, ROADY - ROADW + oy, ROADY + ROADW + oy, true); bande(LH + ox, 720 + ox, ROADY - ROADW + oy, ROADY + ROADW + oy, true);
        if (st.hf > .02) bande(-LH + ox * st.hf, LH + ox * st.hf, ROADY - ROADW + oy * st.hf, ROADY + ROADW + oy * st.hf, c === 0);
      }
      // épave de la travée routière
      if (c > 0){
        const drop = lerp(0, 3, ce);
        const piece = (x0, x1, pivot, ang) => { ctx.save(); ctx.translate(pivot, ROADY); ctx.rotate(ang * ce); ctx.translate(-pivot, -ROADY);
          ctx.fillStyle = done ? P.noye : mix(P.route, P.noye, ce); ctx.strokeStyle = done ? P.noyeB : P.trait; ctx.lineWidth = .9 * px;
          if (done){ ctx.setLineDash([4 * px, 3 * px]); ctx.globalAlpha *= .42; }
          ctx.beginPath(); ctx.rect(x0, ROADY - ROADW - drop, x1 - x0, 2 * ROADW); ctx.fill(); ctx.stroke(); ctx.restore(); };
        piece(-LH, -14, -LH, -.022); piece(-9, LH, LH, .03);
        arche(px, ROADY - drop, ROADW + .6, leanNow, { braces: 7, col: done ? P.noyeB : P.acierB, fill: done ? mix(P.noye, P.acier, .45) : P.acier, alpha: done ? .34 : 1 });
        if (done){ // débris émergés près des piles
          ctx.fillStyle = P.debris; ctx.strokeStyle = P.trait; ctx.lineWidth = .7 * px;
          [[-106, -58, 8, .3], [-98, -45, 6.5, 1.1], [-92, -62, 5.5, 2.2], [-80, -50, 4, .7], [104, -56, 7, 1.7], [97, -44, 5.5, .4], [90, -61, 4.5, 2.6], [-22, -57, 4, .2], [38, -46, 3.5, 1.3]].forEach(([x, y, r, a]) => { ctx.beginPath(); for (let i = 0; i < 5; i++){ const an = a + i * 1.2566, rr = r * (.55 + .45 * rnd(i + x)); i ? ctx.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr) : ctx.moveTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke(); });
        }
        // écume
        const tf = (tau - TC - .75);
        if (!bilan && tf > 0 && tf < 2.6) for (let i = 0; i < 8; i++){
          const a = tf - i * .08; if (a <= 0 || a > 2.1) continue; const x = lerp(-LH + 10, LH - 10, i / 7), y = ROADY - 8 - 30 * rnd(i + 3), k = a / 2.1;
          ctx.strokeStyle = `rgba(255,255,255,${.95 * (1 - k)})`; ctx.lineWidth = 2.4 * px; ctx.beginPath(); ctx.arc(x, y, 6 + 38 * ease(k), 0, 7); ctx.stroke();
          ctx.fillStyle = `rgba(255,255,255,${.28 * (1 - k)})`; ctx.fill();
        }
      }
      // travée routière du chenal, tant qu'elle tient
      if (c === 0) travee(px, -LH, LH, P);
      else { ctx.strokeStyle = P.trait; ctx.lineWidth = .9 * px; ctx.beginPath(); [-LH, LH].forEach(X => { ctx.moveTo(X, ROADY - ROADW); ctx.lineTo(X, ROADY + ROADW); }); ctx.stroke(); }
      // véhicules
      if (st.trafic > 0){
        ctx.save(); ctx.globalAlpha *= st.trafic;
        for (let i = 0; i < 26; i++){
          const dir = i % 2 ? 1 : -1, lane = ROADY + dir * (3 + (i % 4 < 2 ? 0 : 5.4)), v = 19 + 9 * rnd(i + 40), len = rnd(i + 80) > .8 ? 12 : 4.6;
          const X = ((rnd(i) * 1240 + dir * v * t) % 1240 + 1240) % 1240 - 620;
          ctx.fillStyle = len > 5 ? '#6f747a' : (rnd(i + 5) > .5 ? '#3b3f44' : '#9a9ea3'); ctx.fillRect(X - len / 2, lane - 1.15, len, 2.3);
        }
        ctx.restore();
      }
      // train (bilan) : quelques trains franchissent encore le pont
      if (bilan){
        const tx = lerp(560, -262, ease((tau - 4.6) / 6.2));
        for (let i = 0; i < 9; i++){ ctx.fillStyle = i ? P.wagon : P.loco; ctx.fillRect(tx + i * 16.2, -2.85 - 1.6, 14.4, 3.2); }
      }
      // ombres des arches (sur l'eau et sur le tablier voisin)
      if (st.sa > .005){ ombreArche(0, RAILW + 1.2, 0, 1, st); if (st.hf > .02) ombreArche(ROADY, ROADW + .6, leanNow, st.hf, st); }
      // arches
      arche(px, 0, RAILW + 1.2, 0, { braces: 12, croix: true, col: P.acierB, fill: P.acier });
      if (c === 0) arche(px, ROADY, ROADW + .6, st.lean, { braces: 7, col: P.acierB, fill: P.acier });
      // navire arrêté devant l'épave (bilan)
      if (bilan){ const k = easeIO((tau - 5.2) / 4.2); cargo(lerp(-470, -214, k), k < .97, t, st); }
    });
  }
  function munition(h, tau){
    const dur = 1.15, f = (tau - h.t + dur) / dur; if (f <= 0 || f >= 1) return;
    const [tx, ty] = L2S(h.X, h.Y), D = 620 * (L.full ? 1 : .7), sx = tx + h.d[0] * D, sy = ty + h.d[1] * D, k = Math.pow(f, 1.25);
    const x = lerp(sx, tx, k), y = lerp(sy, ty, k), ang = Math.atan2(ty - sy, tx - sx), k0 = Math.max(0, k - .3);
    const col = h2(tc(C.bleu)), g = ctx.createLinearGradient(lerp(sx, tx, k0), lerp(sy, ty, k0), x, y);
    g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(1, `rgba(${col},.8)`);
    dash(1.4, 3.4); ctx.strokeStyle = g; ctx.lineWidth = 1.4 * u; ctx.beginPath(); ctx.moveTo(lerp(sx, tx, k0), lerp(sy, ty, k0)); ctx.lineTo(x, y); ctx.stroke(); dash();
    if (NU > .3) lueur(x, y, (h.guide ? 26 : 18) * u, '150,190,255', .5 * NU);
    delta(x, y, h.guide ? 10 : h.f === 'm' ? 8.5 : 7, tc(C.bleu), tc(C.bleu), ang);
  }
  function bloc(x, y, titre, chiffre, texte, align = 'left', coul = C.rouge, court = null){   // encadré chiffré
    let yy = y, wmax = 0;
    wmax = Math.max(wmax, label(titre, x, yy, { align, font: TITRE, w: 700, size: 14.5 })); yy += 18 * u;
    if (chiffre){ wmax = Math.max(wmax, label(chiffre, x, yy, { align, color: coul, w: 600, size: 14 })); yy += 16 * u; }
    const tx = L.full ? texte : court;       // sur téléphone, seulement le texte court s'il existe
    if (tx){ wmax = Math.max(wmax, label(tx, x, yy, { align, color: '#3b3b40', size: 12.5 })); yy += 15 * u; }
    return { h: yy - y - 15 * u, w: wmax, mid: (y + yy - 15 * u) / 2, top: y - 10 * u, bot: yy - 7 * u };
  }
  const pos3 = (txt, fl, al) => al === 'right' ? txt + ' ' + fl : fl + ' ' + txt;
  function draw3(t, a){
    if (a <= 0) return;
    const bilan = t >= S4, tau = bilan ? t - S4 : t - S3, o = L.s3, st = etatPont(tau, bilan), P = palette(st.nuit);
    ctx.save(); ctx.globalAlpha = a;
    eau(t, st.nuit);
    dessinPont(t, tau, st, bilan, P);
    if (st.dore > .01){ ctx.fillStyle = `rgba(255,170,84,${.07 * st.dore})`; ctx.fillRect(0, 0, L.VW, L.VH); }
    NU = st.nuit; voileN = st.nuit * a;

    if (!bilan){
      // traces, braises, fumées, munitions, éclairs
      HITS.forEach((h, i) => {
        const age = tau - h.t; if (age < 0) return;
        const [x, y] = L2S(h.X, h.Y), gone = h.Y < -30 && st.c > .35;
        if (!gone){
          ctx.fillStyle = NU > .5 ? 'rgba(4,10,16,.7)' : 'rgba(20,20,20,.6)'; ctx.beginPath(); ctx.arc(x, y, 2.6 * h.k * u, 0, 7); ctx.fill();
          for (let j = 0; j < 3; j++){ const an = rnd(i * 3 + j) * 6.28; ctx.beginPath(); ctx.arc(x + Math.cos(an) * 3.4 * h.k * u, y + Math.sin(an) * 3.4 * h.k * u, 1.3 * h.k * u, 0, 7); ctx.fill(); }
          if (NU > .3 && age > .2){          // l'incendie reste visible dans la nuit
            const fl = (.62 + .38 * Math.sin(t * 17 + i * 7.3)) * clamp((age - .2) / .4) * NU;
            lueur(x, y, 20 * h.k * u, '255,140,56', .34 * fl);
            ctx.fillStyle = `rgba(255,196,120,${.95 * fl})`; ctx.beginPath(); ctx.arc(x, y, 1.7 * h.k * u, 0, 7); ctx.fill();
          }
        }
        if (age < 3.6) for (let j = 0; j < 3; j++){ const f = (age + j * .5) / 3.6; if (f > 1) continue;
          ctx.fillStyle = NU > .5 ? `rgba(150,166,182,${.13 * (1 - f)})` : `rgba(70,72,78,${.16 * (1 - f)})`; ctx.beginPath(); ctx.arc(x + (16 + j * 5) * f * 3 * u, y - 9 * f * 3 * u, (4 + 13 * f) * h.k * u, 0, 7); ctx.fill(); }
        if (NU > .3 && h.k > 1.3 && age < .3){ ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,214,160,${.13 * (1 - age / .3)})`; ctx.fillRect(0, 0, L.VW, L.VH); ctx.restore(); }
      });
      HITS.forEach(h => munition(h, tau));
      HITS.forEach(h => { const [x, y] = L2S(h.X, h.Y); impact(x, y, tau - h.t, h.k); });
    }

    // repères fixes
    const cote = (pos, txt) => label(txt, pos[0], pos[1], { size: 11.5, color: C.gris, align: pos[2], italic: true });
    const sousChip = L.full ? 0 : Math.max(0, 50 * u - o.crimee[1]);     // sur petit écran, la pastille pousse les repères vers le bas
    cote([o.crimee[0], o.crimee[1] + sousChip, o.crimee[2]], pos3(T.versCrimee, '↖', o.crimee[2])); cote(o.russieL, pos3(T.versRussie, '↘', o.russieL[2]));
    { const p = L2S(0, o.chenalY); ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(ROT - Math.PI / 2); label(T.chenalNav, 0, 0, { size: 11.5, color: C.merTexte, italic: true, halo: false, clampX: false, dbg: false }); ctx.restore(); }
    // étiquette alignée à gauche, renvoyée vers une cible du pont (repère local)
    const renvoi = (pos, cible, m) => { const q = L2S(cible[0], cible[1]);
      if (q[0] >= pos[0] && q[0] <= pos[0] + m.w){ filet([[q[0], q[1] < m.top ? m.top - 3 * u : m.bot + 3 * u], [q[0], q[1]]]); return; }
      const sx = q[0] < pos[0] ? pos[0] - 6 * u : pos[0] + m.w + 6 * u; filet([[sx, m.mid], [q[0], m.mid], [q[0], q[1]]]); };
    // annotation centrée, filet vertical puis horizontal
    const an = (al, cible, txt, sous, pos, col = C.encre) => { if (al <= 0) return; ctx.save(); ctx.globalAlpha *= al; const q = L2S(cible[0], cible[1]);
      const y0 = q[1] > pos[1] ? pos[1] + (sous ? 25 : 10) * u : pos[1] - 10 * u;
      filet(Math.abs(y0 - q[1]) < 3 * u ? [[pos[0], y0], [q[0], y0]] : [[pos[0], y0], [pos[0], q[1]], [q[0], q[1]]]);
      label(txt, pos[0], pos[1], { w: 600, size: 13, color: col }); if (sous) label(sous, pos[0], pos[1] + 15 * u, { size: 11.5, color: C.gris }); ctx.restore(); };

    if (!bilan){
      { const w = label(T.ferro, o.ferro[0], o.ferro[1], { w: 600, size: 12.5, align: 'left' }); renvoi(o.ferro, [o.ferro[2], RAILW], { w, mid: o.ferro[1], top: o.ferro[1] - 9 * u, bot: o.ferro[1] + 9 * u }); }
      { const ry = o.routier[1] + sousChip * 1.4, w = label(T.routier, o.routier[0], ry, { w: 600, size: 12.5, align: 'left' }); renvoi([o.routier[0], ry], [o.routier[2], ROADY - ROADW], { w, mid: ry, top: ry - 9 * u, bot: ry + 9 * u }); }
      // repère de date
      const cp = o.chip, d1 = win(tau, .3, 3.6), d2 = win(tau, 3.9, 6.1), d3 = clamp((tau - 6.4) / .4);
      const dc = (al, txt, col, fill, ink) => { if (al <= 0) return; ctx.save(); ctx.globalAlpha *= al; chip(txt, cp[0], cp[1], col, fill, ink, cp[2]); ctx.restore(); };
      dc(d1, T.j16m, C.encre, C.encre, C.papier); dc(d2, T.j16a, C.encre, C.papier, C.encre); dc(d3, T.nuit, C.encre, C.encre, C.papier);
      an(win(tau, 1.3, 2.9), [-58, -38.5], T.vague1, null, o.pal, C.bleu);
      an(win(tau, 3.0, 4.5), [0, ROADY - ROADW - 6], T.destab, null, o.pal);
      an(win(tau, 4.7, 6.0), [60, ROADY - ROADW], T.reprise, null, o.pal);
      an(win(tau, 7.3, 11.9), [62, ROADY + ROADW - 1], T.pal, L.full ? T.palSous : T.palSousCourt, o.pal, C.bleu);
      an(win(tau, 8.3, 12.3), [-52, RAILW + 2], L.full ? T.missiles : T.missilesCourt, L.full ? T.missilesSous : T.missilesSousCourt, o.mis, C.bleu);
      an(clamp((tau - TC - 1.9) / .5), [10, ROADY - ROADW - 30], T.effondre, null, o.pal, C.rouge);
      an(clamp((tau - TC - 2.6) / .5), [-40, RAILW + 2], L.full ? T.debout : T.deboutCourt, null, o.mis);
    }
    // contour de la section effondrée
    const aG = bilan ? 1 : clamp((tau - TC - 1.7) / .6);
    if (aG > 0){
      ctx.save(); ctx.globalAlpha *= aG;
      local(px => { ctx.strokeStyle = tc(C.rouge); ctx.lineWidth = 1.4 * px; ctx.setLineDash([5 * px, 3.5 * px]); ctx.fillStyle = rgba(C.rouge, .07 + .08 * NU); ctx.beginPath(); ctx.rect(-LH, ROADY - ROADW, 2 * LH, 2 * ROADW); ctx.fill(); ctx.stroke(); });
      ctx.restore();
    }
    if (bilan){
      const b = L.s4, cp = o.chip;
      chip(T.bilanDate, cp[0], cp[1], C.encre, C.papier, C.encre, cp[2]);
      // frappe du 19 novembre sur la voie ferrée
      N19.forEach(([X, Y, t0], i) => { const age = tau - t0; if (age < 0) return; const [x, y] = L2S(X, Y);
        ctx.fillStyle = 'rgba(20,20,20,.68)'; ctx.beginPath(); ctx.arc(x, y, 2.8 * u, 0, 7); ctx.fill();
        for (let j = 0; j < 3; j++){ const an2 = rnd(i * 5 + j + 60) * 6.28; ctx.beginPath(); ctx.arc(x + Math.cos(an2) * 3.6 * u, y + Math.sin(an2) * 3.6 * u, 1.3 * u, 0, 7); ctx.fill(); }
        impact(x, y, age, 1); });
      const a1 = clamp((tau - 1.2) / .5), a2 = clamp((tau - 3.9) / .5), a3 = clamp((tau - 7.4) / .5);
      const enc = (al, pos, cible, titre, chiffre, texte, court) => { if (al <= 0) return; ctx.save(); ctx.globalAlpha *= al;
        const m = bloc(pos[0], pos[1], titre, chiffre, texte, 'left', C.rouge, court); renvoi(pos, cible, m); ctx.restore(); };
      enc(a1, b.route, b.routeC, T.bRoute, T.bRouteChiffre, T.bRouteTexte);
      enc(a2, b.rail, b.railC, T.bRail, null, T.bRailTexte, T.bRailCourt);
      enc(a3, b.chenal, b.chenalC, T.bChenal, null, T.bChenalTexte);
    }
    echelle(T.m100, 100 / L.pont.mpu);
    NU = 0;
    ctx.restore();
  }

  // ---------- Rendu ----------
  const stepAt = t => { for (let i = 0; i < 4; i++) if (t < TL.steps[i][1]) return i; return 3; };
  function render(t){
    ctx.setTransform(dpr * s, 0, 0, dpr * s, 0, 0);
    NU = 0; voileN = 0; ETQ.length = 0;
    ctx.globalAlpha = 1; ctx.fillStyle = C.papier; ctx.fillRect(0, 0, L.VW, L.VH);
    draw1(t, clamp(t / .5) * clamp((S2 - t) / .55));
    draw2(t - S2, clamp((t - S2 + .05) / .6) * clamp((S3 - t) / .55));
    draw3(t, clamp((t - S3 + .05) / .6));
    ctx.globalAlpha = 1; voile();
  }

  // ---------- Lecture, étapes, intégration ----------
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fige = new URLSearchParams(location.search).get('t');
  const btn = document.getElementById('lecture');
  const stepBtns = [...document.querySelectorAll('.etapes button')];
  const fills = stepBtns.map(b => b.querySelector('.jauge i'));
  const caps_ = [...document.querySelectorAll('.legende')];
  let t = fige != null ? +fige : reduce ? TL.still[3] : 0, playing = false, lance = fige != null || reduce, last = 0, shown = -1, dirty = true, visible = true;

  function etat(){
    const e = playing ? 'lecture' : (t >= TL.end - .06 ? 'fin' : 'pause');
    btn.dataset.etat = e; btn.setAttribute('aria-label', e === 'lecture' ? TX.pause : e === 'fin' ? TX.rejouer : TX.lire);
  }
  function setPlaying(p){ playing = p; etat(); }
  function syncUI(){
    const i = stepAt(t);
    fills.forEach((f, k) => { const [a, b] = TL.steps[k]; f.style.width = (clamp((t - a) / (b - a)) * 100).toFixed(1) + '%'; });
    if (i !== shown){
      shown = i;
      stepBtns.forEach((b, k) => { b.classList.toggle('actif', k === i); if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
      caps_.forEach((c, k) => { c.classList.toggle('actif', k === i); c.setAttribute('aria-hidden', String(k !== i)); });
    }
  }
  btn.addEventListener('click', () => { lance = true; if (!playing && t >= TL.end - .06) t = 0; setPlaying(!playing); dirty = true; });
  stepBtns.forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.i; lance = true;
    if (reduce){ t = TL.still[i]; setPlaying(false); } else { t = TL.steps[i][0] + .001; setPlaying(true); }
    dirty = true;
  }));

  let gen = 0;
  function resize(){
    const w = sceneEl.clientWidth; if (!w) return;
    const next = w < 640 ? NARROW : WIDE;
    L = next; s = w / L.VW; u = 1 / s; dpr = Math.min(2.5, window.devicePixelRatio || 1);
    cv.style.height = (L.VH * s).toFixed(1) + 'px';
    cv.width = Math.round(w * dpr); cv.height = Math.round(L.VH * s * dpr);
    gen++; plan1(); plan2(); plan3();
    dirty = true;
  }
  new ResizeObserver(resize).observe(sceneEl); resize();
  if ('IntersectionObserver' in window) new IntersectionObserver(es => {
    visible = es[0].isIntersecting;
    if (es[0].intersectionRatio >= .35 && !lance){ lance = true; setPlaying(true); }   // démarre une seule fois, à l'entrée à l'écran
  }, { threshold: [0, .35] }).observe(sceneEl);
  else if (!lance){ lance = true; setPlaying(true); }
  document.addEventListener('visibilitychange', () => { last = 0; });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { dirty = true; });
  etat();

  function frame(now){
    const dt = last ? Math.min(.05, (now - last) / 1000) : 0; last = now;
    if (playing && visible && L){ t += dt; if (t >= TL.end){ t = TL.end - .001; setPlaying(false); } dirty = true; }
    if (dirty && L){ render(t); syncUI(); dirty = false; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
