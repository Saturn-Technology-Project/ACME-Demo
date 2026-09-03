"use client";

import { Suspense, type ReactNode } from "react";

export function IdPage({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="px-8 py-8 text-[13px] text-muted">Loading…</div>
      }
    >
      {children}
    </Suspense>
  );
}
