"use client";

import { motion, useReducedMotion } from "framer-motion";

import { pipelineSteps } from "./dashboard-data";

function statusClass(status: (typeof pipelineSteps)[number]["status"]) {
  if (status === "done") {
    return "bg-[var(--accent)]";
  }

  if (status === "active") {
    return "bg-[var(--success)]";
  }

  return "bg-[rgba(95,122,153,0.28)]";
}

export default function PipelineFlow() {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <div className="surface-inset-dark px-4 py-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-white">Pipeline Flow</p>
        <span className="rounded-full bg-[rgba(44,139,103,0.18)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--success)]">
          healthy
        </span>
      </div>
      <div className="mt-4 space-y-4">
        {pipelineSteps.map((step) => (
          <div key={step.label} className="flex gap-3">
            <div className="flex flex-col items-center pt-1">
              <span className={`h-2.5 w-2.5 rounded-full ${statusClass(step.status)}`} />
              <span className="mt-2 h-full w-px bg-white/10 last:hidden" />
            </div>
            <div className="pb-4">
              <p className="text-sm font-medium text-white">{step.label}</p>
              <p className="mt-1 text-sm leading-6 text-white/70">{step.detail}</p>
              {!reduceMotion ? (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-2 h-1.5 w-20 rounded-full bg-white/12"
                />
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
