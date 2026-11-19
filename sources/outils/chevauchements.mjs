// Contrôle des étiquettes : chevauchements entre elles et proximité des bords, à plusieurs largeurs et instants.
// node chevauchements.mjs <fichier.html> [largeurs] [pas en s]
import puppeteer from 'puppeteer-core';
import path from 'path';
const file = 'file://' + path.resolve(process.argv[2]);
const widths = (process.argv[3] || '340,390,430,600,700,860,1000,1040').split(',').map(Number), pas = +(process.argv[4] || .7);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-gpu'] });
const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
for (const w of widths){
  await p.setViewport({ width: w, height: 1400, deviceScaleFactor: 1 });
  const vus = new Map();
  for (let t = .6; t < 50; t += pas){
    await p.goto(file + '?t=' + t.toFixed(2), { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await new Promise(r => setTimeout(r, 60));
    const { etq, cw, ch } = await p.evaluate(() => { const c = document.getElementById('c'); return { etq: window.__etq, cw: c.clientWidth, ch: c.clientHeight }; });
    const M = 12;
    etq.forEach((a, i) => {
      if (a[0][0] !== '[' && (a[1] < M || a[2] < M - 4 || a[3] > cw - M || a[4] > ch - M + 4)){ const k = 'BORD  ' + a[0]; if (!vus.has(k)) vus.set(k, t.toFixed(1)); }
      etq.slice(i + 1).forEach(c => {
        if ((a[5] && a[5] === c[5]) || a[0] === c[0]) return;
        const ox = Math.min(a[3], c[3]) - Math.max(a[1], c[1]), oy = Math.min(a[4], c[4]) - Math.max(a[2], c[2]);
        if (ox > 2 && oy > 2){ const k = 'CHEV  ' + [a[0], c[0]].sort().join('  ×  '); if (!vus.has(k)) vus.set(k, t.toFixed(1) + ` (${Math.round(ox)}×${Math.round(oy)} px)`); }
      });
    });
  }
  console.log(`\n== ${w} px : ${vus.size} alerte(s)`); [...vus].forEach(([k, v]) => console.log('  ' + k + '   @' + v));
}
if (errs.length) console.log('ERREURS', [...new Set(errs)]);
await b.close();
