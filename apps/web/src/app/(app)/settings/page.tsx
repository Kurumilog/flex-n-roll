"use client";

import { BellRinging, SlidersHorizontal, Sparkle } from "@phosphor-icons/react";

export default function SettingsPage() {
  return (
    <main className="space-y-4">
      <section className="surface-shell p-2">
        <div className="surface-panel px-6 py-7 sm:px-8">
          <p className="eyebrow">
            <SlidersHorizontal className="h-4 w-4" weight="regular" />
            Settings
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-[var(--accent-deep)]">
            Параметры маршрутизации и реактивации клиентов
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted)]">
            Этот экран становится управляющим центром для правил эскалаций, пост-фоллоуапов
            и контекстных касаний по интересам клиента.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="surface-shell p-2">
          <div className="surface-panel h-full px-5 py-5 sm:px-6">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--accent)]">
              <BellRinging className="h-5 w-5" weight="regular" />
            </div>
            <p className="mt-4 text-xl font-semibold tracking-[-0.04em] text-[var(--accent-deep)]">
              SLA Escalation
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              Rule set подключается к backend-очередям на следующем этапе.
              Сейчас сохранена визуальная и структурная точка входа.
            </p>
          </div>
        </article>

        <article className="surface-shell p-2">
          <div className="surface-panel h-full px-5 py-5 sm:px-6">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--accent)]">
              <Sparkle className="h-5 w-5" weight="regular" />
            </div>
            <p className="mt-4 text-xl font-semibold tracking-[-0.04em] text-[var(--accent-deep)]">
              Personalized Re-engagement
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              Параметры персонализированных касаний будут читать историю клиента и
              запускать AI-сгенерированные предложения при паузе в коммуникации.
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}
