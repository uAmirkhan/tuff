// Проверка уровня до загрузки: правила из 04-struktura-i-urovni.md, раздел 3, и 06, раздел 5.
import type { Uroven } from './format';

export function proveritUroven(u: Uroven): string[] {
  const oshibki: string[] = [];
  if (u.versiya !== 1) oshibki.push('неизвестная версия формата');
  const vyhody = u.obekty.filter((o) => o.tip === 'vyhod');
  if (vyhody.length !== 1) oshibki.push(`выходов ${vyhody.length}, нужен один`);
  const serdca = u.obekty.filter((o) => o.tip === 'serdce');
  const bosOrPogonya = u.vremyaZvezdy !== undefined;
  if (!bosOrPogonya && serdca.length !== 3)
    oshibki.push(`сердце-камней ${serdca.length}, нужно три`);
  const ids = new Map<string, number>();
  for (const o of u.obekty) {
    if (o.id) ids.set(o.id, (ids.get(o.id) ?? 0) + 1);
  }
  for (const [id, n] of ids) if (n > 1) oshibki.push(`повторяется id ${id}`);
  const uzly = u.obekty.filter((o) => o.tip === 'uzel').length;
  if (uzly > 1) oshibki.push(`узлов теплотрассы ${uzly}, не больше одного на уровень`);
  for (const o of u.obekty) {
    if ((o.tip === 'plita' || o.tip === 'rychag') && (!o.cel || !ids.has(o.cel)))
      oshibki.push(`${o.tip} ${o.id ?? '?'} без цели или цель не найдена`);
    if (
      (o.tip === 'lava' ||
        o.tip === 'ship' ||
        o.tip === 'voda' ||
        o.tip === 'iney' ||
        o.tip === 'zaslonka' ||
        o.tip === 'porshen' ||
        o.tip === 'konveyer' ||
        o.tip === 'kriostat') &&
      (!o.w || !o.h)
    )
      oshibki.push(`${o.tip} ${o.id ?? '?'} без размеров`);
    if (o.tip === 'potok' && (!o.w || !o.h)) oshibki.push(`поток ${o.id ?? '?'} без размеров`);
    if (o.tip === 'potok' && !o.silaX && !o.silaY) oshibki.push(`поток ${o.id ?? '?'} без силы`);
    if ((o.tip === 'okno' || o.tip === 'panorama') && (!o.w || !o.h))
      oshibki.push(`${o.tip} ${o.id ?? '?'} без размеров`);
    if (o.tip === 'panel' && !(o.nomer && o.nomer >= 1 && o.nomer <= 15))
      oshibki.push(`панель ${o.id ?? '?'} без номера 1..15`);
    if (o.tip === 'shema' && !['vyazkost', 'rasplav', 'korka', 'vybros'].includes(o.vid ?? ''))
      oshibki.push(`схема ${o.id ?? '?'} без вида способности`);
    if (o.tip === 'okno' && !['stvol', 'budushchee', 'steklo'].includes(o.vid ?? ''))
      oshibki.push(`окно ${o.id ?? '?'} без вида (stvol, budushchee, steklo)`);
    if (o.tip === 'koromyslo' && (!o.w || !o.h))
      oshibki.push(`коромысло ${o.id ?? '?'} без размеров`);
    if (
      (o.tip === 'lava' || o.tip === 'voda' || o.tip === 'potok') &&
      o.period !== undefined &&
      o.period <= 0
    )
      oshibki.push(`${o.tip} ${o.id ?? '?'}: период должен быть больше нуля`);
    if ((o.tip === 'yashchik' || o.tip === 'mayatnik') && (!o.w || !o.h))
      oshibki.push(`${o.tip} ${o.id ?? '?'} без размеров`);
    if (o.tip === 'mayatnik' && !(o.dlina && o.dlina > 0))
      oshibki.push(`маятник ${o.id ?? '?'} без длины цепи`);
    if (o.tip === 'porshen' && (!o.period || o.period <= 0))
      oshibki.push(`поршень ${o.id ?? '?'} без периода`);
    if (o.tip === 'porshen' && (o.pauza ?? 0) * 2 >= (o.period ?? 0))
      oshibki.push(`поршень ${o.id ?? '?'}: паузы длиннее периода`);
    if (o.tip === 'cep' && o.zvenyev !== undefined && o.zvenyev < 2)
      oshibki.push(`цепь ${o.id ?? '?'} короче двух звеньев`);
    if (
      o.x < u.granicy.minX ||
      o.x > u.granicy.maxX ||
      o.y < u.granicy.minY ||
      o.y > u.granicy.maxY
    )
      oshibki.push(`${o.tip} ${o.id ?? '?'} за границами уровня`);
  }
  // чекпоинт перед каждым испытанием: ближайший горн левее или ниже начала испытания не дальше 12 единиц
  const gorny = u.obekty.filter((o) => o.tip === 'gorn');
  if (u.rezhim === 'zherlo' && gorny.length) oshibki.push('в Жерле не бывает горнов');
  for (const isp of u.rezhim === 'zherlo' ? [] : u.obekty.filter((o) => o.tip === 'ispytanie')) {
    const est = gorny.some((g) => Math.hypot(g.x - isp.x, g.y - isp.y) <= 12);
    if (!est) oshibki.push(`испытание ${isp.id ?? '?'} без горна в пределах 12 единиц`);
  }
  for (const p of u.poligony) {
    if (p.tochki.length < 3) oshibki.push('многоугольник меньше трёх вершин');
    if (p.material === 'hrupkiy' && !(p.hrupkost && p.hrupkost > 0))
      oshibki.push('хрупкий многоугольник без порога');
  }
  const [sx, sy] = u.start;
  if (sx < u.granicy.minX || sx > u.granicy.maxX || sy < u.granicy.minY || sy > u.granicy.maxY)
    oshibki.push('старт за границами');
  return oshibki;
}

// Проверка яруса целиком: требования из 13-plany-urovney.md, раздел 0 («Проверяемые требования
// к каждому ярусу»), которые считаются по всем уровням тира сразу, а не по одному. Жерло-уровни
// (бонусы) в подсчёт не входят: у них своя экономика. «Крылья» (30% площади вне пути) сюда не
// входят — это отдельный скрипт по геометрии, не сущностный чек.
export function proveritYarus(urovni: Uroven[]): string[] {
  const oshibki: string[] = [];
  const yarusnye = urovni.filter((u) => u.rezhim !== 'zherlo');
  const uzly = yarusnye.reduce((n, u) => n + u.obekty.filter((o) => o.tip === 'uzel').length, 0);
  if (uzly !== 1) oshibki.push(`узлов теплотрассы на ярусе ${uzly}, нужен один`);
  const nomera = yarusnye.flatMap((u) =>
    u.obekty.filter((o) => o.tip === 'panel').map((o) => o.nomer),
  );
  if (nomera.length !== 3) oshibki.push(`панелей на ярусе ${nomera.length}, нужно три`);
  if (new Set(nomera).size !== nomera.length) oshibki.push('номера панелей повторяются на ярусе');
  const soStvolom = yarusnye.filter((u) =>
    u.obekty.some((o) => o.tip === 'okno' && o.vid === 'stvol'),
  ).length;
  if (soStvolom < 2) oshibki.push(`уровней с окном в ствол ${soStvolom}, нужно не меньше двух`);
  const budushchee = yarusnye.reduce(
    (n, u) => n + u.obekty.filter((o) => o.tip === 'okno' && o.vid === 'budushchee').length,
    0,
  );
  if (budushchee < 3) oshibki.push(`окон в будущее на ярусе ${budushchee}, нужно не меньше трёх`);
  const vstrechi = yarusnye.reduce(
    (n, u) => n + u.obekty.filter((o) => o.tip === 'bak' && o.vid === 'polnyy').length,
    0,
  );
  if (vstrechi < 1) oshibki.push('на ярусе нет немой встречи (бак vid polnyy)');
  const kadry = yarusnye.reduce(
    (n, u) => n + u.obekty.filter((o) => o.tip === 'panorama').length,
    0,
  );
  if (kadry < 1) oshibki.push('на ярусе нет кадра масштаба (сущность panorama)');
  // по уровню: обычный уровень — три сердце-камня и один гэг; погоня — один камень; босс — ноль
  // камней; погоня и босс отличаются сущностью kotyol/kriostat. Жерло сюда не попадает (yarusnye)
  for (const u of yarusnye) {
    const serdca = u.obekty.filter((o) => o.tip === 'serdce').length;
    const gag = u.obekty.filter((o) => o.tip === 'gag').length;
    const boss = u.obekty.some((o) => o.tip === 'kotyol' || o.tip === 'kriostat');
    if (u.vremyaZvezdy === undefined) {
      if (serdca !== 3) oshibki.push(`${u.id}: сердце-камней ${serdca}, нужно три`);
      if (gag !== 1) oshibki.push(`${u.id}: гэгов ${gag}, нужен один`);
    } else if (boss) {
      if (serdca !== 0) oshibki.push(`${u.id}: на боссе сердце-камней ${serdca}, нужно ноль`);
    } else if (serdca !== 1) {
      oshibki.push(`${u.id}: на погоне сердце-камней ${serdca}, нужен один`);
    }
  }
  return oshibki;
}
