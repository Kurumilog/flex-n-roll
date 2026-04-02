"use client";

import {
  ArrowUpRight,
  ChatCircleDots,
  EnvelopeSimple,
  GlobeHemisphereWest,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import type { FeedItem } from "./dashboard-data";

const sectionTransition = {
  duration: 0.82,
  ease: [0.16, 1, 0.3, 1] as const,
};

const sourceIcons: Record<FeedItem["source"], any> = {
  email: EnvelopeSimple,
  facebook: ChatCircleDots,
  webform: GlobeHemisphereWest,
};

const sourceLabels: Record<FeedItem["source"], string> = {
  email: "Email",
  facebook: "Facebook",
  webform: "Web Form",
};

function intentClass(intent: FeedItem["intent"]) {
  if (intent === "Commercial") {
    return "bg-[rgba(38,66,139,0.12)] text-[var(--accent)]";
  }

  if (intent === "Support") {
    return "bg-[rgba(183,131,44,0.14)] text-[var(--warning)]";
  }

  return "bg-[rgba(23,39,79,0.12)] text-[var(--accent-deep)]";
}

function urgencyClass(urgency: FeedItem["urgency"]) {
  if (urgency === "High") {
    return "bg-[rgba(198,93,73,0.14)] text-[var(--danger)]";
  }

  if (urgency === "Medium") {
    return "bg-[rgba(183,131,44,0.15)] text-[var(--warning)]";
  }

  return "bg-[rgba(44,139,103,0.14)] text-[var(--success)]";
}

export default function ApplicationCard({
  item,
  delay,
}: {
  item: FeedItem;
  delay: number;
}) {
  const SourceIcon = sourceIcons[item.source];

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...sectionTransition, delay }}
      className="surface-inset px-4 py-4 sm:px-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--accent)]">
            <SourceIcon className="h-5 w-5" weight="regular" />
          </span>
          <div>
            <p className="text-sm font-medium text-[var(--accent-deep)]">
              {sourceLabels[item.source]}
            </p>
            <p className="text-sm text-[var(--muted)]">{item.time}</p>
          </div>
        </div>
        <span className="surface-inset px-3 py-1.5 text-xs font-medium tracking-[0.08em] text-[var(--muted)]">
          {item.dealId}
        </span>
      </div>

      <p className="mt-4 text-[15px] leading-7 text-[var(--text)]">{item.rawText}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span
          className={`rounded-full px-3 py-1.5 text-xs font-semibold tracking-[0.08em] ${intentClass(item.intent)}`}
        >
          {item.intent}
        </span>
        <span
          className={`rounded-full px-3 py-1.5 text-xs font-semibold tracking-[0.08em] ${urgencyClass(item.urgency)}`}
        >
          {item.urgency}
        </span>
        <span className="rounded-full bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-semibold tracking-[0.08em] text-[var(--muted)]">
          {item.complexity}
        </span>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-[var(--muted)]">AI Confidence</span>
          <span className="metric-value font-semibold text-[var(--accent-deep)]">
            {item.confidence}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-soft)]">
          <div
            className="h-full rounded-full bg-[var(--accent)]"
            style={{ width: `${item.confidence}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-[var(--muted)]">
          Assigned to{" "}
          <span className="font-medium text-[var(--accent-deep)]">
            {item.assignedTo}
          </span>
        </p>
        <a
          href={item.dealUrl}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-2 surface-inset px-4 py-2.5 text-sm font-medium text-[var(--accent-deep)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 active:translate-y-px"
        >
          View in Bitrix24
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-soft)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px">
            <ArrowUpRight className="h-4 w-4" weight="regular" />
          </span>
        </a>
      </div>
    </motion.article>
  );
}
