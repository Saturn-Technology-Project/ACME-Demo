"use client";

import Link from "next/link";
import { useResource } from "@/hooks/use-resource";
import { useIdParam } from "@/hooks/use-id-param";
import { relativeTime } from "@/lib/format";
import { paths } from "@/lib/paths";
import type { TicketView } from "@/lib/types";
import { IdPage } from "@/components/id-page";
import { Kv, PageHeader, Panel } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { SecondaryLink } from "@/components/ui/form";

function TicketDetail() {
  const id = useIdParam();
  const { data: ticket } = useResource<TicketView>(
    id ? `/api/tickets/${id}` : ""
  );

  if (!id || !ticket) {
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
          actions={
            <SecondaryLink href={paths.ticketEdit(ticket.id)}>Edit</SecondaryLink>
          }
        />
      </div>
      <Panel>
        <div className="px-5">
          <Kv label="Customer">
            <Link
              href={paths.customer(ticket.customerId)}
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

export default function TicketDetailPage() {
  return (
    <IdPage>
      <TicketDetail />
    </IdPage>
  );
}
