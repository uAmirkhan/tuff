// Проверка чистой комнаты: в коде не должно быть идентификаторов и следов исходников оригинала.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const banned = // Слова из протокола чистой комнаты, закодированы, чтобы публичный репозиторий не называл референс
Buffer.from('dGFyYm95LGJvbmRzaW11bGF0aW9uLG9iamVjdGN5Y2xlLGNyZWF0ZXRhcmJveSxwaHlzaWNzdGVtcCxQSFlTSUNTQ1lDTEUsZnJlZWdpc2gsY3J5cHRpY3NlYSxjcnlwdGljIHNlYSxjaHJvbmljIGxvZ2ljLGdpc2g=', 'base64').toString().split(',');
const roots = ['src', 'tests'];
let bad = 0;
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      walk(p);
      continue;
    }
    if (!/\.(ts|js|mjs|json)$/.test(name)) continue;
    const text = readFileSync(p, 'utf8').toLowerCase();
    for (const word of banned) {
      if (text.includes(word.toLowerCase())) {
        console.log(`${p}: найдено «${word}»`);
        bad++;
      }
    }
  }
}
for (const r of roots) {
  try {
    walk(r);
  } catch {}
}
if (bad) {
  console.log(`Чистая комната нарушена: ${bad}`);
  process.exit(1);
}
console.log('Чистая комната: чисто');
