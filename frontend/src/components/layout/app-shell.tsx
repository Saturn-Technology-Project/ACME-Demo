import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen min-w-[1024px] bg-page">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-line bg-card px-6">
          <div className="text-[13px] text-muted">Production</div>
          <div className="flex items-center gap-2 text-[12px] text-muted">
            <span className="size-1.5 rounded-full bg-paid" />
            All systems operational
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
