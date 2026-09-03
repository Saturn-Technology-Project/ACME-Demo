"use client";

import { PageHeader } from "@/components/ui/page-header";
import { InvoiceForm } from "../invoice-form";

export default function NewInvoicePage() {
  return (
    <div className="px-8 py-8">
      <PageHeader title="New invoice" description="Create a billing invoice" />
      <InvoiceForm />
    </div>
  );
}
