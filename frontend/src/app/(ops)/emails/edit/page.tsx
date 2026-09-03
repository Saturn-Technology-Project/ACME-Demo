"use client";

import { useResource } from "@/hooks/use-resource";
import { useIdParam } from "@/hooks/use-id-param";
import type { EmailMessage } from "@/lib/types";
import { IdPage } from "@/components/id-page";
import { PageHeader } from "@/components/ui/page-header";
import { EmailForm } from "../email-form";

function EditEmail() {
  const id = useIdParam();
  const { data: email } = useResource<EmailMessage>(
    id ? `/api/emails/${id}` : ""
  );

  if (!id || !email) {
    return <div className="px-8 py-8 text-[13px] text-muted">Loading email…</div>;
  }

  return (
    <div className="px-8 py-8">
      <PageHeader title="Edit email" description={email.id} />
      <EmailForm initial={email} />
    </div>
  );
}

export default function EditEmailPage() {
  return (
    <IdPage>
      <EditEmail />
    </IdPage>
  );
}
