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

## 2. Стек проекта (актуально на 2026-04-10)

**Backend**: NestJS 10 + Prisma + PostgreSQL (Supabase) — порт 3001
**Dashboard**: React + Vite + TailwindCSS (iframe для Bitrix24)
**n8n**: 6 воркфлоу (Routing, KPI, Sync, Mailing, Transfer, AI Analysis)
**LLM**: Ollama qwen2.5:14b (MacBook M4 через Tailscale)
**Bitrix24**: Webhook + OAuth приложение (Client ID: `YOUR_CLIENT_ID`)
**Тесты**: 344 unit tests, 27 test suites
**DB**: 215 лидов в LeadCache, 23 сотрудника

## 3. Команды разработки

```bash
pnpm install              # установка зависимостей
cd apps/api && pnpm build # сборка API
npx dotenv-cli -e .env.local -- node dist/main.js  # запуск API
pnpm --filter api test    # 344 теста
npx tsc --noEmit -p apps/api/tsconfig.json  # проверка типов
```

## 4. Проверочный список перед коммитом

- [ ] TypeScript errors: `npx tsc --noEmit -p apps/api/tsconfig.json`
- [ ] API запускается и health отвечает: `curl http://localhost:3001/api/health`
- [ ] Тесты проходят: `pnpm --filter api test`
- [ ] URL новых эндпоинтов записан в README.md
