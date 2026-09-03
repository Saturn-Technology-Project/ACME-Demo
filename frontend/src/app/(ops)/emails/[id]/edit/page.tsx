"use client";

import { use } from "react";
import { useResource } from "@/hooks/use-resource";
import type { EmailMessage } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { EmailForm } from "../../email-form";

export default function EditEmailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: email } = useResource<EmailMessage>(`/api/emails/${id}`);

  if (!email) {
    return <div className="px-8 py-8 text-[13px] text-muted">Loading email…</div>;
  }

  return (
    <div className="px-8 py-8">
      <PageHeader title="Edit email" description={email.id} />
      <EmailForm initial={email} />
    </div>
  );
}
