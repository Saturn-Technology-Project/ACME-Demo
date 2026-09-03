"use client";

import { use } from "react";
import Link from "next/link";
import { useResource } from "@/hooks/use-resource";
import { relativeTime } from "@/lib/format";
import type { TicketView } from "@/lib/types";
import { Kv, PageHeader, Panel } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { SecondaryLink } from "@/components/ui/form";

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: ticket } = useResource<TicketView>(`/api/tickets/${id}`);

  if (!ticket) {
    return <div className="px-8 py-8 text-[13px] text-muted">Loading ticket…</div>;
  }

  return (
    <div className="px-8 py-8">
      <Link href="/support" className="text-[12px] text-muted hover:text-ink">
        ← Support
      </Link>
      <div className="mt-3">
        <PageHeader
          title={ticket.id}
          description={ticket.subject}
          actions={<SecondaryLink href={`/support/${ticket.id}/edit`}>Edit</SecondaryLink>}
        />
      </div>
      <Panel>
        <div className="px-5">
          <Kv label="Customer">
            <Link
              href={`/customers/${ticket.customerId}`}
              className="text-accent hover:underline"
            >
              {ticket.customerName}
            </Link>
          </Kv>
          <Kv label="Status">
            <StatusBadge value={ticket.status} />
          </Kv>
          <Kv label="Created by">{ticket.createdBy}</Kv>
          <Kv label="Opened">{relativeTime(ticket.createdAt)}</Kv>
        </div>
      </Panel>
    </div>
  );
}
