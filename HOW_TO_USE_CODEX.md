# HOW TO USE CODEX IN FLEX-N-ROLL

## 1. Как активировать skills

Если ты только что установил skills, перезапусти Codex, чтобы он подхватил новые инструкции.

Явный вызов:
- Добавь имя skill прямо в промт: `$design-taste-frontend`, `$high-end-visual-design`, `$full-output-enforcement`
- Если хочешь использовать проектные названия из брифа, ориентируйся на соответствие:
  - `$frontend-design-skill` → `$design-taste-frontend`
  - `$taste-skill` → `$high-end-visual-design`
  - `$output-enforcer` → `$full-output-enforcement`
  - `$codebase-rules` → отдельный skill не установился, поэтому Codex должен читать `AGENTS.md` и следовать правилам проекта вручную

Автоматическая активация:
- Skill включается автоматически, если задача явно совпадает с его назначением
- Для критичных задач лучше вызывать skill явно в конце промта, чтобы поведение было предсказуемым
- Для этого проекта полезно явно вызывать design-skills на UI-задачах и output-skill на больших генерациях файлов

## 2. Шаблоны промтов для этого проекта

Новый компонент:

```text
Создай компонент [название] в [путь].
Данные берёт из хука use[Название] (TanStack Query).
Используй shadcn/ui [список компонентов].
Типы из packages/shared-types.
Добавь skeleton для isLoading и empty state.
$frontend-design-skill $taste-skill
```

Новый MSW handler:

```text
Добавь MSW handler для [METHOD] /api/[endpoint].
Тип ответа: [TypeName] из shared-types.
Добавь реалистичные mock данные на русском (минимум 8 записей).
Добавь delay(300) для имитации сети.
Синхронизируй URL с openapi.yaml.
$codebase-rules
```

Новый хук:

```text
Создай хук use[Название] в src/hooks/.
Использует TanStack Query, ключ из query-keys.ts.
Вызывает GET /api/[endpoint] через lib/api/client.ts.
Возвращает { data, isLoading, error }.
$codebase-rules $output-enforcer
```

Страница аналитики:

```text
Создай страницу analytics в app/analytics/page.tsx.
Показывает: время обработки сделки, задействованные отделы, эффективность.
Используй Recharts для графиков.
Данные из useAnalytics хука (моки).
$frontend-design-skill $taste-skill $output-enforcer
```

Отладка/рефакторинг:

```text
[Описание проблемы]. Контекст проекта в AGENTS.md.
Не меняй структуру хуков и API слоя.
$codebase-rules
```

Примечание по текущей среде:
- Вместо `$frontend-design-skill` используй `$design-taste-frontend`
- Вместо `$taste-skill` используй `$high-end-visual-design`
- Вместо `$output-enforcer` используй `$full-output-enforcement`
- Если `$codebase-rules` недоступен, просто укажи: `Следуй правилам из AGENTS.md`

## 3. Чего НЕ просить Codex делать

- Не просить писать backend код, пока `apps/api` не подготовлен к реальной разработке
- Не просить менять файлы в `src/mocks` напрямую из компонентов
- Не просить использовать `useState` для серверных данных

## 4. Команды разработки

```bash
pnpm install          # установка зависимостей
pnpm --filter web dev # запуск только фронта
pnpm dev              # весь монорепо
```

## 5. Проверочный список перед коммитом

- [ ] TypeScript errors: `pnpm --filter web tsc --noEmit`
- [ ] MSW handlers для всех новых API вызовов
- [ ] Skeleton + empty state у каждого компонента с данными
- [ ] Новые типы добавлены в packages/shared-types
- [ ] URL новых эндпоинтов записан в openapi.yaml
