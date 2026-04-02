"use client";

import Link from "next/link";

import { ArrowUpRight } from "@phosphor-icons/react";

import Header from "./Header";
import HeroPreview from "./HeroPreview";
import KPICards from "./KPICards";
import LiveFeed from "./LiveFeed";
import SystemHealth from "./SystemHealth";
import { capabilities } from "./dashboard-data";

export default function InitialOverview() {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Header />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(350px,0.92fr)]">
          <section className="surface-shell-dark p-2">
            <div className="surface-panel-dark flex h-full flex-col justify-between px-6 py-7 sm:px-8 sm:py-9">
              <div>
                <span className="eyebrow eyebrow-dark">
                  <span className="h-4 w-4 rounded-full bg-[var(--success)]" />
                  Incoming Demand Orchestration
                </span>
                <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-[-0.08em] text-white text-balance sm:text-5xl lg:text-6xl">
                  From client message to routed deal, without manual sorting.
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-white/74 sm:text-lg">
                  Первая страница показывает, как команда видит поток заявок,
                  статус AI-классификации и готовность отправки в Bitrix24. Без
                  лишней декоративности, но с достаточной глубиной, чтобы жюри
                  сразу увидело полезность продукта.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#live-feed"
                  className="group inline-flex items-center gap-3 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white shadow-[0_18px_36px_-22px_rgba(38,66,139,0.55)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 active:translate-y-px"
                >
                  Live Feed
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/14 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px">
                    <ArrowUpRight className="h-4 w-4" weight="regular" />
                  </span>
                </a>
                <a
                  href="#system-health"
                  className="group inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/8 px-5 py-3 text-sm font-medium text-white transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 active:translate-y-px"
                >
                  System Health
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/12 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px">
                    <ArrowUpRight className="h-4 w-4" weight="regular" />
                  </span>
                </a>
              </div>

              <div className="mt-10 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
                <div>
                  <p className="metric-value text-2xl font-semibold text-white">
                    14s
                  </p>
                  <p className="mt-1 text-sm text-white/64">
                    median routing time
                  </p>
                </div>
                <div>
                  <p className="metric-value text-2xl font-semibold text-white">
                    3
                  </p>
                  <p className="mt-1 text-sm text-white/64">
                    channels under one intake layer
                  </p>
                </div>
                <div>
                  <p className="metric-value text-2xl font-semibold text-white">
                    1
                  </p>
                  <p className="mt-1 text-sm text-white/64">
                    Bitrix24 handoff path for the demo
                  </p>
                </div>
              </div>
            </div>
          </section>

          <HeroPreview />
        </div>

        <KPICards />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]">
          <LiveFeed />
          <SystemHealth />
        </div>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
          {capabilities.map((capability) => (
            <div
              key={capability.label}
              className={capability.tone === "dark" ? "surface-shell-dark p-2" : "surface-shell p-2"}
            >
              <div
                className={`flex h-full flex-col justify-between px-6 py-6 sm:px-7 ${
                  capability.tone === "dark" ? "surface-panel-dark" : "surface-panel"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <span
                      className={`eyebrow ${
                        capability.tone === "dark" ? "eyebrow-dark" : ""
                      }`}
                    >
                      {capability.label}
                    </span>
                    <Link
                      href={capability.href}
                      className={`group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 active:translate-y-px ${
                        capability.tone === "dark"
                          ? "border border-white/10 bg-white/8 text-white"
                          : "surface-inset text-[var(--accent-deep)]"
                      }`}
                    >
                      Open
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px ${
                          capability.tone === "dark" ? "bg-white/12" : "bg-[var(--surface-soft)]"
                        }`}
                      >
                        <ArrowUpRight className="h-4 w-4" weight="regular" />
                      </span>
                    </Link>
                  </div>
                  <h3
                    className={`mt-5 max-w-xl text-2xl font-semibold tracking-[-0.06em] ${
                      capability.tone === "dark" ? "text-white" : "text-[var(--accent-deep)]"
                    }`}
                  >
                    {capability.title}
                  </h3>
                  <p
                    className={`mt-4 max-w-2xl text-base leading-8 ${
                      capability.tone === "dark" ? "text-white/72" : "text-[var(--muted)]"
                    }`}
                  >
                    {capability.summary}
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  {capability.points.map((point) => (
                    <div
                      key={point}
                      className={`flex items-center gap-3 rounded-full px-4 py-3 text-sm ${
                        capability.tone === "dark"
                          ? "border border-white/10 bg-white/6 text-white/88"
                          : "surface-inset text-[var(--text)]"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          capability.tone === "dark" ? "bg-[var(--accent)]" : "bg-[var(--accent)]"
                        }`}
                      />
                      {point}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
