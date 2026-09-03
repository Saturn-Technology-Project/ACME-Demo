"use client";

import { PageHeader } from "@/components/ui/page-header";
import { CustomerForm } from "../customer-form";

export default function NewCustomerPage() {
  return (
    <div className="px-8 py-8">
      <PageHeader title="New customer" description="Add a customer and subscription" />
      <CustomerForm />
    </div>
  );
}
