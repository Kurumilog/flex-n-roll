"use client";

import { Pulse } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";

import { feedItems } from "./dashboard-data";
import ApplicationCard from "./ApplicationCard";

const transition = {
  duration: 0.82,
  ease: [0.16, 1, 0.3, 1] as const,
};

export default function LiveFeed() {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <motion.section
      id="live-feed"
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ ...transition, delay: 0.28 }}
      className="surface-shell p-2"
    >
      <div className="surface-panel h-full px-5 py-6 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">
              <Pulse className="h-4 w-4" weight="regular" />
              Live Feed
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.06em] text-[var(--accent-deep)] sm:text-3xl">
              Входящие заявки уже выглядят как готовые рабочие кейсы.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-[var(--muted)]">
            Email, Facebook и веб-форма сходятся в одну ленту с уже
            извлеченными полями, уровнем уверенности и ссылкой на сделку.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {feedItems.map((item, index) => (
            <ApplicationCard key={item.id} item={item} delay={0.32 + index * 0.08} />
          ))}
        </div>
      </div>
    </motion.section>
  );
}
