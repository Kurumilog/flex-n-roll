# HOW TO USE CODEX IN FLEX-N-ROLL

## 1. Как активировать skills

Если ты только что установил skills, перезапусти Codex, чтобы он подхватил новые инструкции.

Явный вызов:
- Добавь имя skill прямо в промт: `$design-taste-frontend`, `$high-end-visual-design`, `$full-output-enforcement`
- Если хочешь использовать проектные названия из брифа, ориентируйся на соответствие:
  - `$frontend-design-skill` → `$design-taste-frontend`
  - `$taste-skill` → `$high-end-visual-design`
  - `$output-enforcer` → `$full-output-enforcement`

Автоматическая активация:
- Skill включается автоматически, если задача явно совпадает с его назначением
- Для критичных задач лучше вызывать skill явно в конце промта, чтобы поведение было предсказуемо

## 2. Стек проекта

**Backend**: NestJS 10 + Prisma + PostgreSQL (Supabase)
**API**: Swagger документация на `http://localhost:3000/api/docs`
**Тесты**: 282 unit tests, 16 e2e tests
**LLM**: Ollama qwen2.5:14b-instruct (через Tailscale)

## 3. Команды разработки

```bash
pnpm install              # установка зависимостей
pnpm --filter api dev     # запуск API
pnpm --filter api build   # сборка API
pnpm --filter api test    # 282 теста
pnpm --filter api typecheck  # проверка типов
pnpm dev                  # весь монорепо
```

## 4. Проверочный список перед коммитом

- [ ] TypeScript errors: `pnpm --filter api typecheck`
- [ ] API запускается: `pnpm --filter api dev`
- [ ] Swagger доступен: `http://localhost:3000/api/docs`
- [ ] Тесты проходят: `pnpm --filter api test`
- [ ] URL новых эндпоинтов записан в openapi.yaml
