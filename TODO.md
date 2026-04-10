# FlexRouter AI — Remaining TODO List

**Дата:** 2026-04-10 08:35
**Ветка:** `feature/nestjs-backend`
**Тесты:** 344 passing, 6 failing (pre-existing: tracking DI, analytics mock, bitrix start param)
**Лиды в LeadCache:** 215

---

## 🔴 Критичные (для демо)

| # | Задача | Детали | Зависит от |
|---|--------|--------|------------|
| 1 | **Подключить Open Lines в Bitrix24** | Telegram и/или WhatsApp канал в Contact Center. Без этого нет входящих сообщений → нет маршрутизации. | Друг (Bitrix24) |
| 2 | **E2E тест маршрутизации** | Написать в Telegram → Bitrix24 webhook → n8n → NestJS → Ollama → im.message.add + tasks.task.add. Проверить что менеджер получает уведомление. | #1 |

## 🟡 Важные (для функциональности)

| # | Задача | Детали | Зависит от |
|---|--------|--------|------------|
| 4 | **Настроить SMTP для Mailing** | `SMTP_PASS` в `.env.local` сейчас placeholder. Включить Gmail app password или другой SMTP. Без этого mailing не работает. | — |
| 5 | **Восстановить workEnd** | Все сотрудники имеют `workEnd: "23:59"` для тестирования. Вернуть реальные часы (18:00) после демо. | — |
| 6 | **Загрузить dialog embeddings** | Прогнать `dialogs.json` (30 диалогов) через `nomic-embed-text` и сохранить в БД для векторного поиска. | Ollama |
| 7 | **Протестировать Mailing end-to-end** | После подключения SMTP: `/api/mailing/candidates` → `/api/mailing/send`. Проверить что письма отправляются. | #4 |

## 🟢 Опциональные (улучшения)

| # | Задача | Детали | Зависит от |
|---|--------|--------|------------|
| 8 | **Реализовать N8nService** | NestJS сервис для вызова n8n webhooks из кода. Пока не критично — n8n сам вызывает NestJS. | — |
| 9 | **Bitrix24 event handlers** | Зарегистрировать `event.bind` для `ONOPENLINEMESSAGEADD` → n8n webhook. Для автоматического триггера маршрутизации. | #1 |
| 10 | **WhatsApp канал** | Если Telegram уже подключён — добавить WhatsApp как второй канал Open Lines. | #1 |
| 11 | **Rate limiting** | Добавить `@nestjs/throttler` для защиты API от DDoS. | — |
| 12 | **API Versioning** | URL или header-based версионирование API. | — |

---

## ✅ Что уже сделано

- [x] NestJS backend (8 модулей, 344 теста)
- [x] React Dashboard (iframe для Bitrix24)
- [x] n8n воркфлоу (5 активных + 1 деактивирован)
- [x] Sync лидов из Bitrix24 (215 лидов в LeadCache)
- [x] AI Routing через Ollama (qwen2.5:14b, ~2.5-19s)
- [x] Bitrix24 интеграция (CRM, tasks, messages)
- [x] Nginx proxy через VPS
- [x] **n8n OAuth2 credential** — `7NqOd5ODFj6VHx2O` с auto-refresh через refresh_token
- [x] **6 Bitrix24 нод** привязаны к credential (static token удалён из URL)
- [x] **Transfer Inactive деактивирован** — до подключения Open Lines (убрал 404 спам)
- [x] **Тесты проведены** — routing, employees, kpi, analytics, sync, n8n proxy
- [x] Tailscale сеть настроена
