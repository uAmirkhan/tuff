// Выгрузка всех уровней в karty/<id>.json для редактора Tiled. npm run karty
import { mkdirSync, writeFileSync } from 'node:fs';
import { UROVNI } from '../src/level/spisok';
import { vTiled } from '../src/level/tiled';

mkdirSync('karty', { recursive: true });
for (const u of UROVNI) {
  const put = `karty/${u.id}.json`;
  writeFileSync(put, JSON.stringify(vTiled(u), null, 2));
  console.log(put);
}
