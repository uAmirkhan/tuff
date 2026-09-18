# Страница игры на порталах

Рабочее название TUFF. Итоговое название, цвет и силуэт героя решает Khan; тексты ниже
переписываются под него заменой одного слова. Референсная игра в текстах, названии и тегах не
упоминается никогда (07-yuridicheskiy-protokol, раздел 4).

## Материалы в этой папке

| Файл | Куда | Требование портала |
|---|---|---|
| `ikonka-512.png` | Яндекс Игры: иконка | 512×512 PNG |
| `oblozhka-800x470.png` | Яндекс Игры: обложка | 800×470 |
| `oblozhka-1280x720.png` | CrazyGames: cover 16:9 | 1280×720 |
| `oblozhka-800x800.png` | CrazyGames: cover 1:1 | 800×800 |
| `kadry/1-1.png … zh-1.png` | скриншоты | 1280×720, без отладки и сенсорных кнопок |

Кадры снимаются заново после любой правки вида: `node scripts/kadr-portal.mjs out.png "uroven=1-3&chisto=1" "KeyD:1500"` при поднятом `npm run dev`; герой для иконки: `node scripts/kadr-portal.mjs portal/kadry/geroy-1024.png "komnata=1&chisto=1" "KeyD:400" 1024 1024`. Обложки и иконка режутся из кадров скриптом `python scripts/oblozhki.py [титул]`, титул поверх обложки: Arial Bold, цвет 0xffb347 с тёмной обводкой. До решения по названию это заглушки.

## Яндекс Игры

**Название (RU):** TUFF
**Название (EN):** TUFF

**Короткое описание (RU, до 80 знаков):**
Капля магмы ползёт по потолкам, течёт в щели и пробивает каменные плиты.

**Короткое описание (EN):**
A drop of magma that crawls on ceilings, flows through cracks and smashes stone.

**Описание (RU):**
Ты капля живой магмы. У тебя нет ног, нет прыжка в привычном смысле, зато есть тело, которое липнет, течёт и твердеет.

Вязкость: прилипай к стенам и потолку и ползи по ним. Расплав: растекайся и просачивайся в щели, в которые не пролезть. Корка: твердей, чтобы продавить хрупкую плиту или раздавить врага. Выброс: сожмись и выстрели собой вверх.

Семь уровней первого яруса, Криоблока: залы баков, промывочные, иней-камеры, тросовые мосты, погоня с водой и Криостат в конце. Ищи угольки и сердца, бей рекорды по времени, поднимайся по стволу за лучшим временем.

Управление: клавиатура, геймпад или пальцы на экране.

**Description (EN):**
You are a drop of living magma. No legs, no ordinary jump, but a body that sticks, flows and hardens.

Stick: cling to walls and ceilings and crawl along them. Melt: spread out and seep through cracks too narrow for anything else. Harden: turn to crust to break brittle slabs or crush an enemy. Burst: squeeze and launch yourself upward.

Seven levels of the first world, the Core: mine shafts, chain bridges, lava rivers, brittle vaults and a triple cauldron at the end. Collect embers and hearts, chase high scores, and dive into the Vent for the longest fall.

Controls: keyboard, gamepad or touch.

**Категория:** Аркады, Платформеры
**Теги:** физика, платформер, головоломка, слизь
**Возраст:** 0+
**Ориентация:** горизонтальная
**Языки:** русский, английский
**Реклама:** межстраничная на экране конца уровня не чаще раза в 3 минуты, награда за просмотр только по кнопке (08-vypusk-i-dengi)

## CrazyGames

**Title:** TUFF
**Tagline (до 60 знаков):** Crawl, melt, harden, burst: a physics platformer about magma.
**Description:** английский текст выше.
**Category:** Casual → Platformer; tags physics, platformer, puzzle, slime
**Ads:** те же правила, SDK v3 уже в `src/platform/ploshchadka.ts`.

## Что нужно от Khan для подачи

1. Кабинет разработчика Яндекс Игр: черновик игры, загрузка `paket/tuff-<дата>.zip`, материалы из этой папки, тексты выше. Решение по названию до подачи, переименовать в текстах и `index.html`.
2. CrazyGames: аккаунт разработчика, реквизиты выплат, Basic Launch с той же сборкой.
3. Проверка чистой комнаты перед показом: `npm run cleanroom` чист (07, раздел 5).
