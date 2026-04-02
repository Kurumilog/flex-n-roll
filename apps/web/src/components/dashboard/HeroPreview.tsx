"use client";

import { motion, useReducedMotion } from "framer-motion";

const pipelineSteps = ["Webhook", "AI", "Classify", "Bitrix24"] as const;

export default function HeroPreview() {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <div className="surface-shell-dark p-2">
      <div className="surface-panel-dark relative overflow-hidden px-5 py-5 sm:px-6 sm:py-6">
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,_rgba(38,66,139,0.24),_transparent_72%)]" />
        <div className="relative">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/62">
                Live Pipeline
              </p>
              <p className="mt-2 text-xl font-semibold tracking-[-0.05em] text-white">
                Current routing session
              </p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-sm text-white/72">
              14:02 batch
            </div>
          </div>

          <div className="mt-6">
            <div className="relative h-px bg-white/10">
              <motion.div
                animate={
                  reduceMotion
                    ? undefined
                    : { x: ["0%", "245%"], opacity: [0.25, 1, 0.25] }
                }
                transition={{
                  duration: 2.8,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: [0.32, 0.72, 0, 1],
                }}
                className="absolute -top-px left-0 h-[3px] w-12 rounded-full bg-[var(--accent)]"
              />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {pipelineSteps.map((step) => (
                <div key={step} className="surface-inset-dark px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--success)]" />
                    <p className="text-sm font-medium text-white">{step}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 surface-inset-dark px-4 py-4">
              <p className="text-sm font-medium text-white">
                Technical request is ready for handoff
              </p>
              <p className="mt-3 text-sm leading-7 text-white/78">
                Заявка с высокой срочностью и уверенностью 96% уже подготовлена к передаче в Bitrix24.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
