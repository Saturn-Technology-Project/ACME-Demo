"use client";

import { PageHeader } from "@/components/ui/page-header";
import { EmailForm } from "../email-form";

export default function NewEmailPage() {
  return (
    <div className="px-8 py-8">
      <PageHeader title="New email" description="Send an operations email" />
      <EmailForm />
    </div>
  );
}
