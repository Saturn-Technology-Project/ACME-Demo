"use client";

import { useResource } from "@/hooks/use-resource";
import { useIdParam } from "@/hooks/use-id-param";
import type { TicketView } from "@/lib/types";
import { IdPage } from "@/components/id-page";
import { PageHeader } from "@/components/ui/page-header";
import { TicketForm } from "../ticket-form";

function EditTicket() {
  const id = useIdParam();
  const { data: ticket } = useResource<TicketView>(
    id ? `/api/tickets/${id}` : ""
  );

  if (!id || !ticket) {
    return <div className="px-8 py-8 text-[13px] text-muted">Loading ticket…</div>;
  }

  return (
    <div className="px-8 py-8">
      <PageHeader title="Edit ticket" description={ticket.id} />
      <TicketForm initial={ticket} />
    </div>
  );
}

export default function EditTicketPage() {
  return (
    <IdPage>
      <EditTicket />
    </IdPage>
  );
}
