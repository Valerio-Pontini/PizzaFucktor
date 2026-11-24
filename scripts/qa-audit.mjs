import fs from 'node:fs/promises';
import WebSocket from 'ws';

const outputDir = new URL('../artifacts/visual-audit/qa-final/', import.meta.url);
await fs.mkdir(outputDir, { recursive: true });

const list = await (await fetch('http://127.0.0.1:9223/json/list')).json();
const sourceTab = list.find((tab) => tab.type === 'page' && tab.url.includes('127.0.0.1:3000'));
if (!sourceTab) throw new Error('Nessuna tab di app trovata nel browser di test');

const ws = new WebSocket('ws://127.0.0.1:9223/devtools/browser/' + (await (await fetch('http://127.0.0.1:9223/json/version')).json()).webSocketDebuggerUrl.split('/').pop());
let seq = 0;
const pending = new Map();
ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});
await new Promise((resolve, reject) => {
  ws.once('open', resolve);
  ws.once('error', reject);
});
const call = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const id = ++seq;
  pending.set(id, (msg) => msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result));
  ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
});

const created = await call('Target.createTarget', { url: 'http://127.0.0.1:3001/?audit=qa-final#app/home' });
const attached = await call('Target.attachToTarget', { targetId: created.targetId, flatten: true });
const sessionId = attached.sessionId;

const cdp = (method, params = {}) => call(method, params, sessionId);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const evalPage = async (expression) => (await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.value;
const writeScreenshot = async (name) => {
  const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  await fs.writeFile(new URL(name, outputDir), Buffer.from(shot.data, 'base64'));
};

await cdp('Page.enable');
await cdp('Runtime.enable');
await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

const report = [];
const inspect = async (label, hash, screenshot = label) => {
  await evalPage(`location.hash=${JSON.stringify(hash)}`);
  await wait(2200);
  const state = await evalPage(`(() => {
    const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
    const named = (el) => (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || el.getAttribute('placeholder') || el.labels?.[0]?.innerText || '').trim();
    const controls = [...document.querySelectorAll('button,a,input,select,textarea')].filter(visible);
    const unnamed = controls.filter((el) => !named(el)).map((el) => el.outerHTML.slice(0, 160));
    const missingImages = [...document.images].filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.src);
    return { hash: location.hash, title: document.title, bodyClass: document.body.className, scene: [...document.querySelectorAll('[class*="scene"], [class*="Scene"]')].filter(visible).slice(0, 12).map((el) => el.className), overflow: document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight * 1.05, viewport: [innerWidth, innerHeight], scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight], missingImages, unnamedControls: unnamed.slice(0, 12), text: document.body.innerText.slice(0, 420) };
  })()`);
  report.push({ label, ...state });
  await writeScreenshot(`${screenshot}.png`);
};

await inspect('home-desktop', '#app/home');
await inspect('appointments-desktop', '#app/appointments');
await inspect('votes-desktop', '#app/votes');
await inspect('history-desktop', '#app/history');
await inspect('team-desktop', '#app/team');

await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await inspect('home-reduced-motion', '#app/home');
const reducedMotion = await evalPage(`(() => { const nodes = [...document.querySelectorAll('*')].filter((el) => getComputedStyle(el).animationName !== 'none'); return { animatedNodes: nodes.length, durations: [...new Set(nodes.map((el) => getComputedStyle(el).animationDuration))] }; })()`);

await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await cdp('Emulation.setEmulatedMedia', { features: [] });
for (const [label, hash] of [['home-mobile', '#app/home'], ['appointments-mobile', '#app/appointments'], ['votes-mobile', '#app/votes'], ['history-mobile', '#app/history'], ['team-mobile', '#app/team']]) await inspect(label, hash);

const focus = await evalPage(`(() => { const button = [...document.querySelectorAll('button,a,input')].find((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }); if (!button) return { ok: false }; button.focus(); return { ok: document.activeElement === button, tag: button.tagName, label: button.getAttribute('aria-label') || button.textContent.trim().slice(0, 80) }; })()`);
await fs.writeFile(new URL('report.json', outputDir), JSON.stringify({ sourceTab, report, reducedMotion, focus }, null, 2));
console.log(JSON.stringify({ sourceTab: sourceTab.url, reducedMotion, focus, report: report.map(({ label, hash, viewport, overflow, scroll, missingImages, unnamedControls }) => ({ label, hash, viewport, overflow, scroll, missingImages: missingImages.length, unnamedControls: unnamedControls.length })) }, null, 2));

await call('Target.closeTarget', { targetId: created.targetId });
ws.close();
