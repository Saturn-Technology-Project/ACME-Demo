"use client";

import Link from "next/link";
import { useResource } from "@/hooks/use-resource";
import { money } from "@/lib/format";
import type { InvoiceView } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { PrimaryLink } from "@/components/ui/form";

export default function BillingPage() {
  const { data } = useResource<InvoiceView[]>("/api/invoices");
  const invoices = data ?? [];

  return (
    <div className="px-8 py-8">
      <PageHeader
        title="Billing"
        description="Invoices"
        actions={<PrimaryLink href="/billing/new">New invoice</PrimaryLink>}
      />
      <div className="overflow-hidden border border-line bg-card">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-line bg-page text-[12px] text-muted">
            <tr>
              <th className="px-5 py-2.5 font-medium">Invoice</th>
              <th className="px-5 py-2.5 font-medium">Customer</th>
              <th className="px-5 py-2.5 font-medium">Amount</th>
              <th className="px-5 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-page/80">
                <td className="px-5 py-3.5 font-mono">
                  <Link href={`/billing/${invoice.id}`} className="text-accent hover:underline">
                    {invoice.id}
                  </Link>
                </td>
                <td className="px-5 py-3.5">{invoice.customerName}</td>
                <td className="px-5 py-3.5 font-mono">{money(invoice.amount)}</td>
                <td className="px-5 py-3.5">
                  <StatusBadge value={invoice.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
