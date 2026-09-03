"use client";

import { PageHeader } from "@/components/ui/page-header";
import { TicketForm } from "../ticket-form";

export default function NewTicketPage() {
  return (
    <div className="px-8 py-8">
      <PageHeader title="New ticket" description="Open a support ticket" />
      <TicketForm />
    </div>
  );
}
