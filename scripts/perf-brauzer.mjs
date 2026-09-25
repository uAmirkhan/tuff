// Замер кадра в браузере при ?perf=1: fps и такт из HUD через 6 секунд. node scripts/perf-brauzer.mjs [gpu]
import { chromium } from '../../mars-colony/node_modules/playwright/index.mjs';

const gpu = process.argv[2] === 'gpu';
const browser = await chromium.launch({
  args: gpu
    ? ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-unsafe-webgpu']
    : [],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('[error]', e.message));
await page.goto('http://localhost:5180/?perf=1');
await page.waitForTimeout(2000);
await page.keyboard.down('KeyD');
await page.waitForTimeout(4000);
await page.keyboard.up('KeyD');
const hud = await page.textContent('#hud');
console.log(gpu ? 'gpu' : 'cpu', (hud ?? '').split('\n')[0]);
const renderer = await page.evaluate(() => {
  const c = document.createElement('canvas');
  const gl = c.getContext('webgl');
  const d = gl?.getExtension('WEBGL_debug_renderer_info');
  return d && gl ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'нет webgl';
});
console.log(renderer);
await browser.close();
