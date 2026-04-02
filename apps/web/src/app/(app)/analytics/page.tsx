"use client";

import { ClockCounterClockwise, Pulse, TrendUp } from "@phosphor-icons/react";
import type { ReactNode } from "react";

export default function AnalyticsPage() {
  return (
    <main className="space-y-4">
      <section className="surface-shell p-2">
        <div className="surface-panel px-6 py-7 sm:px-8">
          <p className="eyebrow">
            <Pulse className="h-4 w-4" weight="regular" />
            Deal Analytics
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-[var(--accent-deep)]">
            Витрина аналитики по завершённым сделкам
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted)]">
            Раздел уже подключён к структуре навигации и готов к расширению:
            тайминг этапов, вклад отделов и коэффициент эффективности на каждой сделке.
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <AnalyticsCard
          icon={<ClockCounterClockwise className="h-5 w-5" weight="regular" />}
          title="Cycle Time"
          value="42 min"
          note="От первого сообщения до финального ответа производства."
        />
        <AnalyticsCard
          icon={<TrendUp className="h-5 w-5" weight="regular" />}
          title="Routing Efficiency"
          value="86%"
          note="Доля кейсов, прошедших без ручного переопределения менеджера."
        />
        <AnalyticsCard
          icon={<Pulse className="h-5 w-5" weight="regular" />}
          title="SLA Hit Rate"
          value="100%"
          note="Текущий демонстрационный уровень соблюдения SLA в потоке."
        />
      </section>
    </main>
  );
}

function AnalyticsCard({
  icon,
  title,
  value,
  note,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  note: string;
}) {
  return (
    <article className="surface-shell p-2">
      <div className="surface-panel h-full px-5 py-5 sm:px-6">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--accent)]">
          {icon}
        </div>
        <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{title}</p>
        <p className="metric-value mt-2 text-3xl font-semibold text-[var(--accent-deep)]">{value}</p>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{note}</p>
      </div>
    </article>
  );
}
