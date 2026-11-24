import fs from 'node:fs/promises';
import WebSocket from 'ws';

const outputDir = new URL('../artifacts/visual-audit/polish-final/', import.meta.url);
await fs.mkdir(outputDir, { recursive: true });
const tabs = await (await fetch('http://127.0.0.1:9223/json/list')).json();
const sourceTab = tabs.find((tab) => tab.type === 'page' && tab.url.includes('127.0.0.1:3000'));
if (!sourceTab) throw new Error('Nessuna tab autenticata di app trovata nel browser di test');
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
const created = await call('Target.createTarget', { url: 'http://127.0.0.1:3001/?audit=polish-final#app/home' });
const attached = await call('Target.attachToTarget', { targetId: created.targetId, flatten: true });
const sessionId = attached.sessionId;
const cdp = (method, params = {}) => call(method, params, sessionId);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const evaluate = async (expression) => (await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.value;
const screenshot = async (name) => {
  const result = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  await fs.writeFile(new URL(`${name}.png`, outputDir), Buffer.from(result.data, 'base64'));
};
const inspect = async (label, hash, waitMs = 2200) => {
  await evaluate(`location.hash=${JSON.stringify(hash)}`);
  await wait(waitMs);
  for (let attempt = 0; attempt < 12; attempt++) {
    const stillLoading = await evaluate(`document.body.innerText.includes('Sto aprendo il tuo posto al tavolo')`);
    if (!stillLoading) break;
    await wait(350);
  }
  const state = await evaluate(`(() => {
    const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden'; };
    const controls = [...document.querySelectorAll('button,a,input,select,textarea')].filter(visible);
    const unnamed = controls.filter((el) => !(el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || el.getAttribute('placeholder') || el.labels?.[0]?.textContent || '').trim()).map((el) => el.outerHTML.slice(0, 180));
    return { hash: location.hash, viewport: [innerWidth, innerHeight], scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight], horizontalOverflow: document.documentElement.scrollWidth > innerWidth, missingImages: [...document.images].filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.src), unnamedControls: unnamed, textLength: document.body.innerText.length };
  })()`);
  await screenshot(label);
  return { label, ...state };
};

await cdp('Page.enable');
await cdp('Runtime.enable');
const report = [];
for (const viewport of [{ name: 'tablet-landscape', width: 1024, height: 768, mobile: false }, { name: 'tablet-portrait', width: 768, height: 1024, mobile: true }, { name: 'mobile-large', width: 430, height: 932, mobile: true }]) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile });
  for (const scene of ['home', 'appointments', 'votes', 'team']) report.push(await inspect(`${viewport.name}-${scene}`, `#app/${scene}`));
}

await cdp('Emulation.setDeviceMetricsOverride', { width: 1024, height: 768, deviceScaleFactor: 1, mobile: false });
await evaluate(`location.hash='#app/team'`);
await wait(1600);
const longText = await evaluate(`(() => {
  const input = document.querySelector('.team-board-scene__name input');
  if (!input) return { present: false };
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, 'La Compagnia dei MangiaPizze del Borgo');
  input.dispatchEvent(new Event('input', { bubbles: true }));
  return { present: true, value: input.value, clientWidth: input.clientWidth, scrollWidth: input.scrollWidth, textOverflow: getComputedStyle(input).textOverflow };
})()`);
await wait(450);
await screenshot('tablet-landscape-team-long-name');
const longTextAfter = await evaluate(`(() => { const input = document.querySelector('.team-board-scene__name input'); return input ? { value: input.value, scrollWidth: input.scrollWidth, clientWidth: input.clientWidth, horizontalOverflow: document.documentElement.scrollWidth > innerWidth } : null; })()`);

const resources = await evaluate(`(() => {
  const items = performance.getEntriesByType('resource').filter((entry) => /\\.(?:png|jpe?g|webp|svg)(?:\\?|$)/i.test(entry.name));
  const bytes = items.reduce((total, entry) => total + (entry.transferSize || entry.encodedBodySize || 0), 0);
  return { imageRequests: items.length, imageBytes: bytes, largest: items.map((entry) => ({ name: entry.name.split('/').pop(), bytes: entry.transferSize || entry.encodedBodySize || 0 })).sort((a, b) => b.bytes - a.bytes).slice(0, 8) };
})()`);
await fs.writeFile(new URL('report.json', outputDir), JSON.stringify({ sourceTab, report, longText, longTextAfter, resources }, null, 2));
console.log(JSON.stringify({ report: report.map(({ label, viewport, scroll, horizontalOverflow, missingImages, unnamedControls }) => ({ label, viewport, scroll, horizontalOverflow, missingImages: missingImages.length, unnamedControls: unnamedControls.length })), longText, longTextAfter, resources }, null, 2));
await call('Target.closeTarget', { targetId: created.targetId });
ws.close();
