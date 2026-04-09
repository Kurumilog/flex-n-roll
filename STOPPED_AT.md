# Where I Stopped — 2026-04-10 00:00

## Current Status
- **Branch:** `feature/nestjs-backend`
- **Tests:** 344/344 passing ✅
- **Typecheck:** ✅ Clean
- **NestJS server:** ✅ RUNNING on port 3001
- **Integration:** n8n → NestJS → Ollama ✅ (полный поток работает, ~30s)
- **Bitrix24:** Webhook scope расширены (crm, im, task, user). imopenlines недоступен через webhook.

## ✅ RESOLVED Issues (Session 2026-04-09 evening)

### 1. PrismaService — Prepared Statements Conflict
**Проблема:** `prepared statement "s0" already exists` при Supabase pooling
**Решение:** Убран global singleton — каждый процесс создаёт свой PrismaClient
**Файл:** `apps/api/src/prisma/prisma.service.ts`

### 2. Ollama Model Name Mismatch
**Проблема:** `OLLAMA_ROUTING_MODEL=qwen2.5:14b-instruct` но в Ollama только `qwen2.5:14b`
**Решение:** Исправлено на `qwen2.5:14b`, timeout увеличен до 60s
**Файл:** `apps/api/.env.local`

### 3. Nginx Proxy для n8n → NestJS
**Проблема:** n8n (MacBook M4) не мог достучаться до NestJS (100.80.124.27:3001) через Tailscale
**Решение:** Nginx proxy на VPS: `/nestjs-api/` → `http://100.80.124.27:3001/api/`
**Файл:** `/etc/nginx/sites-available/n8n.kurumi.software` (на VPS 159.65.122.92)

### 4. n8n Workflow — Bitrix24 Scope Limitation
**Проблема:** `imopenlines.session.transfer` недоступен через webhook (нет scope `imopenlines`)
**Решение:** Заменён на `im.message.add` (Notify Manager) — отправка уведомления менеджеру в чат
**Файл:** n8n workflow `FlexRouter — Routing` (iHnbF3T4HFjEgzY4)

### 5. UFW Firewall Rule
**Проблема:** Порт 3001 заблокирован для Tailscale трафика
**Решение:** `sudo ufw allow in on tailscale0 to any port 3001 proto tcp`

### 6. Nginx Duplicate Configs
**Проблема:** 3 конфликтующих конфига для n8n.kurumi.software
**Решение:** Удалены дубликаты (`n8n`, `api.kurumi.software`), оставлен один `n8n.kurumi.software`

### 7. Employee Work Hours Filter
**Проблема:** `workEnd: "18:00"` — все сотрудники отфильтрованы после 18:00
**Решение:** Временно обновлено до `23:59` для тестирования (через PATCH /employees/:id/workhours)

## Files Changed (this session)
- `apps/api/src/prisma/prisma.service.ts` — убран global singleton
- `apps/api/src/modules/employees/employees.service.ts` — добавлен updateWorkHours()
- `apps/api/src/modules/employees/employees.controller.ts` — PATCH /:id/workhours endpoint
- `apps/api/src/modules/employees/dto/update-workhours.dto.ts` — **НОВЫЙ**
- `apps/api/src/modules/routing/routing.service.ts` — добавлено детальное логирование Ollama
- `apps/api/src/modules/ollama/ollama.service.ts` — добавлено логирование вызова
- `apps/api/.env.local` — OLLAMA_ROUTING_MODEL, OLLAMA_TIMEOUT_MS=60000, DATABASE_URL port 5432
- `docs/n8n-api-reference.md` — обновлён
- `docs/bitrix24-setup-instruction.md` — **НОВЫЙ** — инструкция по настройке Bitrix24
- `docs/flexrouter-full-flow.md` — обновлён
- `scripts/update-n8n-bitrix.js` — **НОВЫЙ**
- `scripts/fix-n8n-connections.js` — **НОВЫЙ**
- `scripts/recreate-n8n-routing.js` — **НОВЫЙ**
- `scripts/temp-extend-workhours.ts` — **НОВЫЙ**
- `scripts/test-ollama.ts` — **НОВЫЙ**

## What's Next (Integration)
1. **Подключить Open Lines** в Bitrix24 (Telegram/WhatsApp канал) — нужно для реального E2E теста
2. **Протестировать полный поток** — Bitrix24 сообщение → n8n → NestJS → Ollama → Notify Manager + Create Task
3. **Восстановить workEnd** — вернуть актуальные рабочие часы после hackathon демо
4. **SMTP** — отключён (опционален), включить когда будет нужен для mailing

## How to Start Server
```bash
cd /home/kurumi/code/hackathon/Flexnroll/apps/api
pnpm dev
```
Server runs on **http://localhost:3001**

## Verified Endpoints
```bash
# Health ✅
curl http://localhost:3001/api/health
→ {"status":"ok","service":"flex-n-roll-api"}

# Employees (23 available) ✅
curl http://localhost:3001/api/employees/available
→ {"success":true,"data":{"employees":[23 items],"personalManagerId":null}}

# Routing (Ollama LLM working!) ✅
curl -X POST http://localhost:3001/api/routing/route \
  -H "x-api-key: dev-secret-key-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{"messageText":"Нужна этикетка 58х40мм","channel":"telegram"}'
→ {"success":true,"data":{"managerId":33,"managerName":"Александр","topic":"technical_specs","urgency":"medium","reason":"..."}}

# NestJS via VPS proxy ✅
curl https://n8n.kurumi.software/nestjs-api/health
→ {"status":"ok"}
```
