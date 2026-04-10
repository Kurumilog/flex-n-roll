# Руководство по запуску проекта (FlexRouter AI)

Это полная инструкция по запуску всей системы из 3-х узлов (Nodes) для демонстрации работы жюри.

## 0. Архитектура и требования

Проект состоит из трех связанных частей:
1. **Node 1 (Workflow & AI):** MacBook M4 с `n8n` и `Ollama` (модель `qwen2.5:14b`).
2. **Node 2 (Reverse Proxy & Dashboard):** VPS-сервер (VPS: `159.65.122.92`, домен: `dashboard.kurumi.software`). Раздает статику React-дашборда и проксирует API-запросы по защищенному туннелю Tailscale.
3. **Node 3 (Core API & DB):** Основной NestJS-сервер (порт 3001), который работает локально у разработчика и ходит в базу `Supabase` (PostgreSQL).

🚨 **Обязательное условие:** Все три машины должны находиться в одной Mesh-сети (у нас используется **Tailscale**).

---

## Шаг 1: Запуск базы данных и Core API (Node 3)

Всё ядро маршрутизации и бизнес-логики находится в папке `apps/api`.
Оно должно быть запущено, иначе ни n8n, ни дашборд не смогут работать.

1. Перейдите в директорию API:
   ```bash
   cd apps/api
   ```
2. Убедитесь, что зависимости установлены:
   ```bash
   pnpm install
   ```
3. Соберите проект:
   ```bash
   pnpm build
   ```
4. Убедитесь, что у вас есть файл `.env.local` с правильным доступом к Supabase (порт 5432) и включенным пулом.
5. Запустите NestJS сервер:
   ```bash
   npx dotenv-cli -e .env.local -- node dist/main.js
   ```
6. Дождитесь надписи `[NestApplication] Nest application successfully started`. Сервер слушает порт `3001`.

---

## Шаг 2: Поднятие AI-модели и Workflow (Node 1)

На машине-оркестраторе (MacBook M4):

1. **Запуск Ollama:**
   Убедитесь, что Ollama запущена и модель загружена:
   ```bash
   ollama run qwen2.5:14b
   ```
   *(Или убедитесь, что сервис Ollama активен и доступен по `http://100.94.92.23:11434`)*

2. **Запуск n8n:**
   ```bash
   n8n start
   ```
   Перейдите в веб-интерфейс n8n (обычно `http://localhost:5678`).
   Убедитесь, что **6 воркфлоу активированы** (toggle в правом верхнем углу):
   - FlexRouter — Routing
   - FlexRouter — KPI Recalculate
   - FlexRouter — Leads Sync
   - FlexRouter — Mailing
   - FlexRouter — Transfer Inactive
   - My workflow (AI Lead Analysis)

---

## Шаг 3: Проверка VPS и Nginx (Node 2)

VPS уже настроен на проксирование трафика.

1. Проверьте статус Nginx на VPS:
   ```bash
   ssh root@159.65.122.92 "systemctl status nginx"
   ```
2. Проверьте доступность API через VPS:
   ```bash
   curl https://n8n.kurumi.software/nestjs-api/health
   ```

---

## Шаг 4: Демонстрация работы (Для Жюри)

### 4.1 Дашборд в Bitrix24
Откройте портал Bitrix24. Слева в меню выберите `FlexRouter Dashboard`.
Должен отобразиться UI с живыми графиками (KPI за 30 дней, воронки конверсии, активные задачи).

### 4.2 Тестирование маршрутизации (Routing)
```bash
curl -X POST http://localhost:3001/api/routing/route \
  -H "x-api-key: dev-secret-key-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{"messageText":"Нужна этикетка для молочной продукции, тираж 50000","channel":"telegram"}'
```
**Что произойдёт под капотом:**
- NestJS проверит личного менеджера (нет)
- Ollama классифицирует: тема, срочность, подходящий менеджер
- Результат: менеджер выбран по KPI и специализации

### 4.3 Проверка данных из Bitrix24
```bash
curl http://localhost:3001/api/analytics/funnel \
  -H "x-api-key: dev-secret-key-change-in-production"
```
Показывает воронку: 197 NEW, 11 CONVERTED и т.д.

### 4.4 Проверка синхронизации
```bash
curl -X POST http://localhost:3001/api/sync/leads \
  -H "x-api-key: dev-secret-key-change-in-production"
```
Синхронизирует лиды из Bitrix24 в LeadCache.

---

## 🔧 Возможные проблемы и их решение

- **n8n не может достучаться до API:**
  Убедитесь, что Tailscale запущен на обеих машинах. Пинг от MacBook к серверу (`ping 100.80.124.27`) должен проходить.

- **Ollama отвечает слишком долго / Timeout:**
  Моделям `qwen2.5:14b` нужно время на разогрев. Отправьте тестовый запрос перед началом презентации, чтобы модель закэшировалась в памяти.

- **imopenlines методы не работают:**
  `imopenlines.*` недоступны через webhook. Используется `im.message.add` вместо `imopenlines.session.transfer`. Для полной поддержки нужно OAuth приложение.

- **Sync возвращает 0 лидов:**
  Убедитесь, что NestJS работает на порту 3001. n8n воркфлоу должны быть обновлены на порт 3001.
