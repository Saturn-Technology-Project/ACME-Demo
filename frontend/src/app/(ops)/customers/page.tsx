"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useResource } from "@/hooks/use-resource";
import { money } from "@/lib/format";
import type { CustomerView } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { StatusDot } from "@/components/ui/status-badge";
import { PrimaryLink } from "@/components/ui/form";

export default function CustomersPage() {
  const { data } = useResource<CustomerView[]>("/api/customers");
  const [query, setQuery] = useState("");
  const customers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter((customer) =>
      q ? customer.name.toLowerCase().includes(q) : true
    );
  }, [data, query]);

  return (
    <div className="px-8 py-8">
      <PageHeader
        title="Customers"
        actions={<PrimaryLink href="/customers/new">New customer</PrimaryLink>}
      />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search customers..."
        className="mb-4 h-9 w-full max-w-md rounded border border-line bg-card px-3 text-[13px] outline-none placeholder:text-muted focus:border-accent"
      />
      <div className="divide-y divide-line border border-line bg-card">
        {customers.map((customer) => (
          <Link
            key={customer.id}
            href={`/customers/${customer.id}`}
            className="flex items-center justify-between gap-6 px-5 py-4 hover:bg-page/80"
          >
            <div>
              <div className="text-[14px] font-medium text-ink">{customer.name}</div>
              <div className="mt-1 text-[13px] text-muted">{customer.plan}</div>
            </div>
            <div className="flex items-center gap-8 text-[13px]">
              <span className="font-mono text-ink">{money(customer.mrr)} MRR</span>
              <span className="flex items-center gap-2 text-muted">
                <StatusDot value="active" />
                Active
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
