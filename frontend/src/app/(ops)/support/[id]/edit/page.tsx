"use client";

import { use } from "react";
import { useResource } from "@/hooks/use-resource";
import type { TicketView } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { TicketForm } from "../../ticket-form";

export default function EditTicketPage({
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
      <PageHeader title="Edit ticket" description={ticket.id} />
      <TicketForm initial={ticket} />
    </div>
  );
}
