"use client";

import { ChartBarHorizontal, ClockCountdown } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

import { categoryLoad } from "./dashboard-data";
import PipelineFlow from "./PipelineFlow";

const transition = {
  duration: 0.82,
  ease: [0.16, 1, 0.3, 1] as const,
};

export default function SystemHealth() {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <motion.aside
      id="system-health"
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ ...transition, delay: 0.34 }}
      className="surface-shell-dark p-2"
    >
      <div className="surface-panel-dark flex h-full flex-col gap-6 px-5 py-6 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow eyebrow-dark">
              <ChartBarHorizontal className="h-4 w-4" weight="regular" />
              System Health
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.06em] text-white">
              Routing health at a glance.
            </h2>
          </div>
          <div className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-white/72">
            median 14s
          </div>
        </div>

        <PipelineFlow />

        <div className="surface-inset-dark px-4 py-4">
          <div className="flex items-center gap-3">
            <ChartBarHorizontal className="h-5 w-5 text-white" weight="regular" />
            <p className="text-sm font-medium text-white">Category Load</p>
          </div>
          <div className="mt-4 space-y-4">
            {categoryLoad.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-white/80">{item.label}</span>
                  <span className="metric-value text-white">{item.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: item.width }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-inset-dark border-[rgba(198,93,73,0.24)] px-4 py-4">
          <div className="flex items-center gap-3">
            <ClockCountdown className="h-5 w-5 text-[var(--danger)]" weight="regular" />
            <div>
              <p className="text-sm font-medium text-white">SLA Escalation Log</p>
              <p className="mt-1 text-sm leading-6 text-white/70">
                Deal #451: manager did not reply in 4h, escalation raised to production supervisor.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/analytics"
          className="inline-flex w-fit items-center gap-2 surface-inset px-4 py-2.5 text-sm font-medium text-[var(--accent-deep)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 active:translate-y-px"
        >
          Open analytics
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-soft)]">
            <ChartBarHorizontal className="h-4 w-4" weight="regular" />
          </span>
        </Link>
      </div>
    </motion.aside>
  );
}
