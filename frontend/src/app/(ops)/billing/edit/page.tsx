"use client";

import { useResource } from "@/hooks/use-resource";
import { useIdParam } from "@/hooks/use-id-param";
import type { InvoiceView } from "@/lib/types";
import { IdPage } from "@/components/id-page";
import { PageHeader } from "@/components/ui/page-header";
import { InvoiceForm } from "../invoice-form";

function EditInvoice() {
  const id = useIdParam();
  const { data: invoice } = useResource<InvoiceView>(
    id ? `/api/invoices/${id}` : ""
  );

  if (!id || !invoice) {
    return <div className="px-8 py-8 text-[13px] text-muted">Loading invoice…</div>;
  }

  return (
    <div className="px-8 py-8">
      <PageHeader title="Edit invoice" description={invoice.id} />
      <InvoiceForm initial={invoice} />
    </div>
  );
}

export default function EditInvoicePage() {
  return (
    <IdPage>
      <EditInvoice />
    </IdPage>
  );
}
