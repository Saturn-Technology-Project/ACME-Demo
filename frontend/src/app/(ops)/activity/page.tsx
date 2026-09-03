"use client";

import { useResource } from "@/hooks/use-resource";
import { clock } from "@/lib/format";
import type { ActivityView } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";

export default function ActivityPage() {
  const { data } = useResource<ActivityView[]>("/api/activity");
  const events = data ?? [];

  return (
    <div className="px-8 py-8">
      <PageHeader title="Activity" description="ACME system events" />
      <div className="divide-y divide-line border border-line bg-card">
        {events.map((event) => (
          <div
            key={event.id}
            className="grid grid-cols-[88px_minmax(0,1fr)_220px] items-baseline gap-4 px-5 py-3 text-[13px]"
          >
            <div className="font-mono text-[12px] text-muted">{clock(event.at)}</div>
            <div className="font-medium text-ink">{event.event}</div>
            <div className="text-muted">{event.customerName ?? "—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
