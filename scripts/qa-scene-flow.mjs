import fs from 'node:fs/promises';
import WebSocket from 'ws';

const outputDir = new URL('../artifacts/visual-audit/qa-final/', import.meta.url);
const list = await (await fetch('http://127.0.0.1:9223/json/list')).json();
const sourceTab = list.find((tab) => tab.type === 'page' && tab.url.includes('127.0.0.1:3000'));
if (!sourceTab) throw new Error('Nessuna tab di app trovata nel browser di test');
const version = await (await fetch('http://127.0.0.1:9223/json/version')).json();
const ws = new WebSocket(version.webSocketDebuggerUrl);
let seq = 0;
const pending = new Map();
ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
});
await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
const call = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const id = ++seq;
  pending.set(id, (msg) => msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result));
  ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
});
const created = await call('Target.createTarget', { url: 'http://127.0.0.1:3001/?audit=qa-final-flow#app/home' });
const attached = await call('Target.attachToTarget', { targetId: created.targetId, flatten: true });
const sessionId = attached.sessionId;
const cdp = (method, params = {}) => call(method, params, sessionId);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const evalPage = async (expression) => (await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.value;
const shot = async (name) => {
  const data = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  await fs.writeFile(new URL(name, outputDir), Buffer.from(data.data, 'base64'));
};
const state = async () => evalPage(`(() => ({ hash: location.hash, text: document.body.innerText.slice(0, 250), scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight], viewport: [innerWidth, innerHeight], missingImages: [...document.images].filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.src) }))()`);
const settle = async (name, ms = 1500) => { await wait(ms); await shot(name); return state(); };

await cdp('Page.enable');
await cdp('Runtime.enable');
await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await wait(2200);
const mapButtons = await evalPage(`([...document.querySelectorAll('.home-pizzeria-map__pizzeria-button:not([disabled])')].map((el) => ({ label: el.getAttribute('aria-label'), team: el.dataset.team })))`);
await evalPage(`document.querySelector('.home-pizzeria-map__pizzeria-button:not([disabled])')?.click()`);
const entranceDesktop = await settle('restaurant-entrance-desktop');
await evalPage(`document.querySelector('.pizzeria-entrance__door-hit-area')?.click()`);
const detailDesktop = await settle('restaurant-detail-desktop', 3000);

await evalPage(`document.querySelector('.pizzeria-detail-view > .back-link')?.click()`);
await wait(900);
await evalPage(`document.querySelector('.pizzeria-entrance > .back-link')?.click()`);
await wait(900);
await evalPage(`document.querySelector('.home-pizzeria-map__pizzeria-button[data-team="basilico"]')?.click()`);
const populatedEntranceDesktop = await settle('restaurant-entrance-populated-desktop', 1200);
await evalPage(`document.querySelector('.pizzeria-entrance__door-hit-area')?.click()`);
const populatedDetailDesktop = await settle('restaurant-detail-populated-desktop', 3000);

await evalPage(`location.hash='#app/votes'`);
await wait(1600);
const candidates = await evalPage(`([...document.querySelectorAll('.candidate-vote:not([disabled])')].map((el) => ({ text: el.innerText, label: el.getAttribute('aria-label') })))`);
await evalPage(`document.querySelector('.candidate-vote:not([disabled])')?.click()`);
const voteDesktop = await settle('judgment-desktop');

await evalPage(`location.hash='#app/team'`);
await wait(1200);
await evalPage(`document.querySelector('.team-board-scene__pizzeria')?.click()`);
const pizzeriaEditDesktop = await settle('pizzeria-edit-desktop');

await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await evalPage(`location.hash='#app/home'`);
const homeMobile = await settle('home-flow-mobile', 1800);
await evalPage(`document.querySelector('.home-pizzeria-map__pizzeria-button:not([disabled])')?.click()`);
const entranceMobile = await settle('restaurant-entrance-mobile', 1200);

const report = { sourceTab: sourceTab.url, mapButtons, candidates, entranceDesktop, detailDesktop, populatedEntranceDesktop, populatedDetailDesktop, voteDesktop, pizzeriaEditDesktop, homeMobile, entranceMobile };
await fs.writeFile(new URL('scene-flow-report.json', outputDir), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await call('Target.closeTarget', { targetId: created.targetId });
ws.close();
