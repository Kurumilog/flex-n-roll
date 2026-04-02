"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Moon, Sun } from "@phosphor-icons/react";

import { useTheme } from "@/components/providers/ThemeProvider";

const transition = {
  duration: 0.82,
  ease: [0.16, 1, 0.3, 1] as const,
};

export default function Header() {
  const reduceMotion = useReducedMotion() ?? false;
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.header
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={transition}
      className="surface-shell p-2"
    >
      <div className="surface-panel flex flex-col gap-4 px-5 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-[148px] items-center">
            <Image
              src="/flex-n-roll-logo.svg"
              alt="Flex-n-Roll"
              width={148}
              height={50}
              priority
              className="h-auto w-full object-contain"
            />
          </div>
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              FLEX-N-ROLL
            </p>
            <p className="text-lg font-semibold tracking-[-0.05em] text-[var(--accent-deep)] sm:text-xl">
              AI Control Center
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          <div className="surface-inset-dark flex items-center gap-3 px-4 py-3">
            <motion.span
              animate={
                reduceMotion
                  ? undefined
                  : {
                      scale: [1, 1.08, 1],
                      opacity: [0.78, 1, 0.78],
                    }
              }
              transition={{
                duration: 2.4,
                repeat: Number.POSITIVE_INFINITY,
                ease: [0.32, 0.72, 0, 1],
              }}
              className="status-dot-dark h-2.5 w-2.5 rounded-full"
            />
            <div>
              <p className="text-sm font-medium text-white">
                System Online
              </p>
              <p className="text-xs text-white/68">Listening to webhooks</p>
            </div>
          </div>

          <div className="surface-inset-dark px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-white/62">
              Processed Today
            </p>
            <p className="metric-value mt-1 text-2xl font-semibold text-white">
              12
            </p>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="group surface-inset-dark flex items-center gap-3 px-4 py-3 text-left transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 active:translate-y-px"
            aria-label="Toggle theme"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px">
              {theme === "dark" ? (
                <Sun className="h-5 w-5" weight="regular" />
              ) : (
                <Moon className="h-5 w-5" weight="regular" />
              )}
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/62">
                Theme
              </p>
              <p className="text-sm font-medium text-white">
                {theme === "dark" ? "Dark" : "Light"}
              </p>
            </div>
          </button>
        </div>
      </div>
    </motion.header>
  );
}
