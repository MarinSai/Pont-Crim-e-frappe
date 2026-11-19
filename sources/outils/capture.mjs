// Captures de contrôle : node capture.mjs <fichier.html> <largeur> <t1,t2,...> <dossier> [embarque]
import puppeteer from 'puppeteer-core';
import path from 'path';
const [file, w, ts, out, emb] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-gpu'] });
const p = await b.newPage();
const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.setViewport({ width: +w, height: 900, deviceScaleFactor: +w < 600 ? 2 : 1 });
for (const t of ts.split(',')){
  await p.goto('file://' + path.resolve(file) + '?t=' + t, { waitUntil: 'load' });
  if (emb) await p.evaluate(() => document.documentElement.classList.add('embarque'));
  await p.evaluate(() => document.fonts.ready); await new Promise(r => setTimeout(r, 350));
  const el = await p.$(process.env.SEL || '#scene');
  await el.screenshot({ path: `${out}/w${w}_t${String(t).padStart(5, '0')}.png` });
}
if (errs.length) console.log('ERREURS', [...new Set(errs)].slice(0, 6));
await b.close();
