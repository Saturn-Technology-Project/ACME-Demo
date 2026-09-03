"use client";

import Link from "next/link";
import { useResource } from "@/hooks/use-resource";
import { useIdParam } from "@/hooks/use-id-param";
import { money } from "@/lib/format";
import { paths } from "@/lib/paths";
import type { InvoiceView } from "@/lib/types";
import { IdPage } from "@/components/id-page";
import { Kv, PageHeader, Panel } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { SecondaryLink } from "@/components/ui/form";

function InvoiceDetail() {
  const id = useIdParam();
  const { data: invoice } = useResource<InvoiceView>(
    id ? `/api/invoices/${id}` : ""
  );

  if (!id || !invoice) {
    return <div className="px-8 py-8 text-[13px] text-muted">Loading invoice…</div>;
  }

  return (
    <div className="px-8 py-8">
      <Link href="/billing" className="text-[12px] text-muted hover:text-ink">
        ← Billing
      </Link>
      <div className="mt-3 flex items-end justify-between gap-6">
        <PageHeader
          title={invoice.id}
          description="Invoice"
          actions={
            <SecondaryLink href={paths.invoiceEdit(invoice.id)}>Edit</SecondaryLink>
          }
        />
        <div
          className={`mb-6 font-mono text-[22px] font-medium tracking-[0.14em] ${
            invoice.status === "failed"
              ? "text-failed"
              : invoice.status === "refunded"
                ? "text-paid"
                : "text-muted"
          }`}
        >
          {invoice.status.toUpperCase()}
        </div>
      </div>
      <Panel>
        <div className="px-5">
          <Kv label="Customer">
            <Link
              href={paths.customer(invoice.customerId)}
              className="text-accent hover:underline"
            >
              {invoice.customerName}
            </Link>
          </Kv>
          <Kv label="Amount">{money(invoice.amount)}</Kv>
          <Kv label="Status">
            <span
              className={
                invoice.status === "failed"
                  ? "font-semibold tracking-wide text-failed"
                  : invoice.status === "refunded"
                    ? "font-semibold tracking-wide text-paid"
                    : undefined
              }
            >
              <StatusBadge value={invoice.status} />
            </span>
          </Kv>
          <Kv label="Payment">{invoice.paymentId}</Kv>
          <Kv label="Reason">{invoice.reason ?? "—"}</Kv>
        </div>
      </Panel>
    </div>
  );
}

export default function InvoiceDetailPage() {
  return (
    <IdPage>
      <InvoiceDetail />
    </IdPage>
  );
}
