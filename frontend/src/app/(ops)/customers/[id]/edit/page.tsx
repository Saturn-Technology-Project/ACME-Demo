"use client";

import { use } from "react";
import { useResource } from "@/hooks/use-resource";
import type { CustomerView } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { CustomerForm } from "../../customer-form";

export default function EditCustomerPage({
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
      <PageHeader title="Edit customer" description={customer.id} />
      <CustomerForm initial={customer} />
    </div>
  );
}
