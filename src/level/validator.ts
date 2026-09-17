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
        o.tip === 'zaslonka' ||
        o.tip === 'porshen' ||
        o.tip === 'konveyer') &&
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
    if (o.tip === 'okno' && !['stvol', 'budushchee'].includes(o.vid ?? ''))
      oshibki.push(`окно ${o.id ?? '?'} без вида (stvol, budushchee)`);
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
