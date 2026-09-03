"use client";

import { use } from "react";
import { useResource } from "@/hooks/use-resource";
import type { InvoiceView } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { InvoiceForm } from "../../invoice-form";

export default function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: invoice } = useResource<InvoiceView>(`/api/invoices/${id}`);

  if (!invoice) {
    return <div className="px-8 py-8 text-[13px] text-muted">Loading invoice…</div>;
  }

  return (
    <div className="px-8 py-8">
      <PageHeader title="Edit invoice" description={invoice.id} />
      <InvoiceForm initial={invoice} />
    </div>
  );
}
