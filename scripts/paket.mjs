// Сборка пакета для порталов: dist → paket/tuff-<дата>.zip с относительными путями.
// Проверяет потолки: до 10 МБ до первого интерактива (05, чек-лист) и относительные пути в index.html.
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

execSync('npm run build', { stdio: 'inherit' });
const html = readFileSync('dist/index.html', 'utf8');
if (/(src|href)="\//.test(html)) throw new Error('в index.html абсолютные пути: порталы их ломают');
let total = 0;
function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else total += statSync(p).size;
  }
}
walk('dist');
const mb = total / 1024 / 1024;
console.log(`dist: ${mb.toFixed(2)} МБ`);
if (mb > 10) throw new Error('сборка тяжелее 10 МБ');
if (!existsSync('paket')) mkdirSync('paket');
const data = new Date().toISOString().slice(0, 10);
const out = `paket/tuff-${data}.zip`;
execSync(
  `powershell -NoProfile -Command "Compress-Archive -Path dist/* -DestinationPath ${out} -Force"`,
  { stdio: 'inherit' },
);
console.log(`пакет: ${out}, ${(statSync(out).size / 1024).toFixed(0)} КБ`);
