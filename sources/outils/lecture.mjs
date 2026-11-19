// Lecture réelle : démarrage à l'entrée à l'écran, arrêt figé à la fin, clic sur une étape, mouvement réduit, cadence sur profil téléphone.
import puppeteer from 'puppeteer-core';
import path from 'path';
const file = 'file://' + path.resolve(process.argv[2]);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-gpu'] });
const errs = [];
async function page(w, h, dsf){ const p = await b.newPage(); p.on('pageerror', e => errs.push(String(e))); await p.setViewport({ width: w, height: h, deviceScaleFactor: dsf }); return p; }
const st = p => p.evaluate(() => ({ etat: document.getElementById('lecture').dataset.etat, actif: [...document.querySelectorAll('.etapes button')].findIndex(b => b.classList.contains('actif')), jauges: [...document.querySelectorAll('.jauge i')].map(i => i.style.width) }));
// 1. téléphone, CPU ralenti x6 : cadence
let p = await page(390, 844, 3);
const cdp = await p.createCDPSession(); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
await p.goto(file, { waitUntil: 'load' }); await new Promise(r => setTimeout(r, 800));
console.log('départ auto :', JSON.stringify(await st(p)));
for (const i of [0, 1, 2, 3]){
  await p.click(`.etapes button[data-i="${i}"]`); await new Promise(r => setTimeout(r, 2500));
  const fps = await p.evaluate(() => new Promise(res => { let n = 0; const t0 = performance.now(); (function f(){ n++; performance.now() - t0 < 3000 ? requestAnimationFrame(f) : res(Math.round(n / 3)); })(); }));
  console.log('étape', i + 1, ':', fps, 'images/s (CPU x6, dpr 3)', JSON.stringify((await st(p)).actif));
}
// 2. fin de lecture : fige sur le dernier état
await p.click('.etapes button[data-i="3"]'); await new Promise(r => setTimeout(r, 12500));
console.log('fin :', JSON.stringify(await st(p)));
await p.click('#lecture'); await new Promise(r => setTimeout(r, 600)); console.log('rejouer :', JSON.stringify(await st(p)));
// redimensionnements rapides
for (const w of [520, 600, 380, 900, 390]){ await p.setViewport({ width: w, height: 844, deviceScaleFactor: 2 }); await new Promise(r => setTimeout(r, 60)); }
await new Promise(r => setTimeout(r, 400)); console.log('après redimensionnements :', JSON.stringify((await st(p)).etat), await p.evaluate(() => document.getElementById('c').width));
await p.close();
// 3. mouvement réduit
p = await page(1000, 800, 1); await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await p.goto(file, { waitUntil: 'load' }); await new Promise(r => setTimeout(r, 700)); console.log('mouvement réduit :', JSON.stringify(await st(p)));
await p.close();
console.log('erreurs :', [...new Set(errs)]);
await b.close();
