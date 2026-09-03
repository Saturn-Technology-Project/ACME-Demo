"use client";

import Link from "next/link";
import { useResource } from "@/hooks/use-resource";
import { money, relativeTime } from "@/lib/format";
import type { ActivityView } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";

const kpis = [
  { label: "Customers", value: "2,481" },
  { label: "Active Subs", value: "2,173" },
  { label: "MRR", value: money(428320) },
  { label: "Open Tickets", value: "38" },
];

export default function OverviewPage() {
  const { data } = useResource<ActivityView[]>("/api/activity");
  const recent = (data ?? []).slice(0, 8);

  return (
    <div className="px-8 py-8">
      <PageHeader title="Overview" description="ACME production operations" />

      <div className="grid grid-cols-4 border border-line bg-card">
        {kpis.map((kpi, index) => (
          <div
            key={kpi.label}
            className={`px-6 py-5 ${index > 0 ? "border-l border-line" : ""}`}
          >
            <div className="text-[12px] text-muted">{kpi.label}</div>
            <div className="mt-2 font-mono text-[26px] tracking-tight text-ink">
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-[13px] font-medium text-muted">Recent Activity</h2>
        <div className="divide-y divide-line border border-line bg-card">
          {recent.map((event) => (
            <Link
              key={event.id}
              href="/activity"
              className="flex items-start justify-between gap-6 px-5 py-3.5 hover:bg-page/80"
            >
              <div>
                <div className="text-[13px] font-medium text-ink">{event.event}</div>
                <div className="mt-0.5 text-[13px] text-muted">
                  {event.customerName ?? "ACME"}
                </div>
              </div>
              <div className="shrink-0 text-[12px] text-muted">
                {relativeTime(event.at)}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
