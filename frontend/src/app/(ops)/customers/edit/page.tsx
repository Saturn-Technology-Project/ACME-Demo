"use client";

import { useResource } from "@/hooks/use-resource";
import { useIdParam } from "@/hooks/use-id-param";
import type { CustomerView } from "@/lib/types";
import { IdPage } from "@/components/id-page";
import { PageHeader } from "@/components/ui/page-header";
import { CustomerForm } from "../customer-form";

function EditCustomer() {
  const id = useIdParam();
  const { data: customer } = useResource<CustomerView>(
    id ? `/api/customers/${id}` : ""
  );

  if (!id || !customer) {
    return <div className="px-8 py-8 text-[13px] text-muted">Loading customer…</div>;
  }

  return (
    <div className="px-8 py-8">
      <PageHeader title="Edit customer" description={customer.id} />
      <CustomerForm initial={customer} />
    </div>
  );
}

export default function EditCustomerPage() {
  return (
    <IdPage>
      <EditCustomer />
    </IdPage>
  );
}
