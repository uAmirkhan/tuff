# TUFF — духовный наследник Gish

2D физический платформер. Герой это текучая слизь: растекается, сплющивается, тянется, протискивается в проёмы. Четыре удерживаемые способности меняют материал тела. Документы предпродакшна: `../wiki/saas/projects/gish-naslednik/` (индекс `_index.md`). Состояние проекта: `BRIEF.md`, задачи: `bd ready`.

## Чистая комната (обязательно)

Этот код пишется независимо от Gish. Правила:

- **Запрещено** открывать, искать, скачивать и цитировать по памяти исходники Gish, freegish, EXL/Gish, isage/Gish-vita и любые их форки. Запрещён и отчёт `issledovanie/01-dekonstrukciya-gish.md`.
- Разрешены только документы `01-koncepciya.md`...`09-plan-proizvodstva.md` из папки предпродакшна и открытые учебные материалы по мягким телам (Верле, XPBD, shape matching).
- Числа физики подбираются настройкой по критериям из `02-gdd-mehaniki.md` и `06-tehnicheskiy-dizayn.md`, а не берутся откуда-то.
- Перед слиянием кода решателя запускается `npm run cleanroom`: поиск идентификаторов оригинала. Красное не сливается.
- Названия механик: Вязкость, Расплав, Корка, Выброс. В коде: `vyazkost`, `rasplav`, `korka`, `vybros`. Не Stick, Slide, Heavy, Jump.

## Правило проверки перед сдачей

Прежде чем сказать «готово», опиши, чем это проверишь, и запусти проверку. Физика проверяется прогонами без экрана (`npm test`), ощущение и производительность только на реальном телефоне, управление только настоящими нажатиями людей.

```
npm run check      # формат, типы, тесты
npm run cleanroom  # проверка чистой комнаты
npm run dev        # локально, открыть на телефоне по адресу в сети
```

## Архитектура

`src/physics` не знает об игре. `src/game` не знает о рендере. Симуляция запускается без экрана. Порядок операций такта зафиксирован в `06-tehnicheskiy-dizayn.md`, раздел 3.5: новая подсистема встаёт в этот список до слияния.

Данные частиц и связей в типизированных массивах, без выделения памяти в такте. В симуляции нет `Math.sin`, `Math.cos`, `Math.pow`, `Math.random`.

## Числа

Все параметры тела и способностей в `src/game/config/`. Число в коде вне конфига это баг.

## Память разработки

Beads для задач, `BRIEF.md` для состояния, чекпоинт в конце сессии с `bd export`. Правки ощущения физики записываются в BRIEF с датой и причиной: «стало вязче, потому что...».


<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:1105d646 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/core-concepts/sync-concepts.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->
