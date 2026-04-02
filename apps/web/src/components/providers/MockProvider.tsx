"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

export function MockProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!USE_MOCKS) {
      return;
    }

    let cancelled = false;

    const start = async () => {
      try {
        const { worker } = await import("@/mocks/browser");
        await worker.start({
          onUnhandledRequest: "bypass",
        });
      } catch (error) {
        console.error("MSW failed to start", error);
      }
    };

    void start();

    return () => {
      cancelled = true;
    };
  }, []);

  return <>{children}</>;
}
