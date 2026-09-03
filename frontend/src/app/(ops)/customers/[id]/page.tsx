"use client";

import { use } from "react";
import Link from "next/link";
import { useResource } from "@/hooks/use-resource";
import { money } from "@/lib/format";
import type { CustomerView } from "@/lib/types";
import { Kv, PageHeader, Panel } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { SecondaryLink } from "@/components/ui/form";

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: customer } = useResource<CustomerView>(`/api/customers/${id}`);

  if (!customer) {
    return <div className="px-8 py-8 text-[13px] text-muted">Loading customer…</div>;
  }

  return (
    <div className="px-8 py-8">
      <Link href="/customers" className="text-[12px] text-muted hover:text-ink">
        ← Customers
      </Link>
      <div className="mt-3">
        <PageHeader
          title={customer.name}
          description="Customer"
          actions={<SecondaryLink href={`/customers/${customer.id}/edit`}>Edit</SecondaryLink>}
        />
      </div>
      <Panel>
        <div className="px-5">
          <Kv label="Customer">{customer.id}</Kv>
          <Kv label="Plan">{customer.plan}</Kv>
          <Kv label="Subscription">
            <StatusBadge value={customer.subscriptionStatus} />
          </Kv>
          <Kv label="MRR">{money(customer.mrr)}</Kv>
          <Kv label="Payment">
            {customer.paymentStatus ? (
              <StatusBadge value={customer.paymentStatus} />
            ) : (
              "—"
            )}
          </Kv>
          <Kv label="Last payment">
            {customer.lastPaymentAmount != null ? money(customer.lastPaymentAmount) : "—"}
          </Kv>
          <Kv label="Open tickets">{customer.openTickets}</Kv>
        </div>
      </Panel>
      {customer.lastInvoiceId ? (
        <p className="mt-4 text-[13px] text-muted">
          Latest invoice{" "}
          <Link
            href={`/billing/${customer.lastInvoiceId}`}
            className="text-accent hover:underline"
          >
            {customer.lastInvoiceId}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
