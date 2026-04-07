# Design: Strip Frontend for Hackathon Skeleton

**Date**: 2026-04-07
**Author**: kurumi
**Status**: Approved

## Context

Flexnroll — хакатонный проект с NestJS бэкендом. Нужно удалить весь фронтенд и подготовить проект как скелет для будущей пересборки на стеке: React 18, TypeScript, Vite, Tailwind, Zustand, framer-motion, NestJS, Prisma, PostgreSQL (Supabase).

## Goal

Оставить только NestJS бэкенд (`apps/api`) + shared-types. Удалить всё лишнее. Обновить конфиги под целевой стек.

## Architecture After

```
Flexnroll/
├── apps/
│   └── api/              # NestJS backend (keep)
├── packages/
│   └── shared-types/     # Shared TS types (keep)
├── docs/                 # Documentation
├── package.json          # Root workspace
├── pnpm-workspace.yaml   # Workspace config (updated)
├── turbo.json            # Turbo config (updated)
├── tsconfig.base.json    # Base TS config (updated)
└── .env.example          # Env template
```

## What Gets Deleted

| Path | Reason |
|------|--------|
| `apps/web/` | Next.js frontend — will be rebuilt as Vite + React 18 |
| `apps/bx24/` | Empty, only package.json |
| `packages/ui/` | UI components tied to old frontend |

## What Stays

| Path | Reason |
|------|--------|
| `apps/api/` | NestJS backend with 17 endpoints, Swagger, mock data |
| `packages/shared-types/` | Types shared between frontend and backend |
| Root configs | Updated to match new stack |

## Config Changes

### pnpm-workspace.yaml
```yaml
packages:
  - apps/*
  - packages/*
```
(Убрать `apps/bx24` implicitly — папка удалена)

### package.json (root)
Scripts: `dev`, `build`, `typecheck` через turbo — остаются.
Удалить зависимости, которые были только для старого фронтенда (если есть).

### turbo.json
Оставить задачи `build`, `dev`, `typecheck`. Убрать frontend-specific кэш конфиги если есть.

### tsconfig.base.json
Оставить базовый TS конфиг совместимый с NestJS + будущим Vite фронтом.

## Self-Review

- ✅ No placeholders or TODOs
- ✅ No contradictions
- ✅ Focused scope: delete frontend, update configs
- ✅ Clear requirements
