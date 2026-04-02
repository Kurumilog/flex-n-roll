"use client";

import {
  ChartBarHorizontal,
  ShieldCheck,
  Sparkle,
  TrendUp,
} from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";

import { metrics } from "./dashboard-data";

const transition = {
  duration: 0.82,
  ease: [0.16, 1, 0.3, 1] as const,
};

const icons = [TrendUp, Sparkle, ChartBarHorizontal, ShieldCheck] as const;

export default function KPICards() {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ ...transition, delay: 0.2 }}
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-12"
    >
      {metrics.map((metric, index) => {
        const Icon = icons[index];
        const isDark = metric.tone === "dark";

        return (
          <div key={metric.label} className={`${metric.layout} surface-shell p-2`}>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ ...transition, delay: 0.24 + index * 0.05 }}
              className={`flex h-full flex-col justify-between gap-5 px-5 py-5 sm:px-6 ${
                isDark ? "surface-panel-dark" : "surface-panel"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                      isDark ? "text-white/68" : "text-[var(--muted)]"
                    }`}
                  >
                    {metric.label}
                  </p>
                  <p
                    className={`metric-value mt-4 text-4xl font-semibold sm:text-5xl ${
                      isDark ? "text-white" : "text-[var(--accent-deep)]"
                    }`}
                  >
                    {metric.value}
                  </p>
                </div>
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${
                    isDark
                      ? "bg-[rgba(38,66,139,0.18)] text-white"
                      : "bg-[var(--surface-soft)] text-[var(--accent-deep)]"
                  }`}
                >
                  <Icon className="h-5 w-5" weight="regular" />
                </span>
              </div>
              <div className={isDark ? "divider-line-dark" : "divider-line"} />
              <div className="space-y-2">
                <p
                  className={`text-sm leading-7 ${
                    isDark ? "text-white/88" : "text-[var(--text)]"
                  }`}
                >
                  {metric.detail}
                </p>
                <p className={`text-sm ${isDark ? "text-white/64" : "text-[var(--muted)]"}`}>
                  {metric.note}
                </p>
              </div>
            </motion.div>
          </div>
        );
      })}
    </motion.section>
  );
}
