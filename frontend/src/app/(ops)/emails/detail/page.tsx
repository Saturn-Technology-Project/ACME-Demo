"use client";

import Link from "next/link";
import { useResource } from "@/hooks/use-resource";
import { useIdParam } from "@/hooks/use-id-param";
import { relativeTime } from "@/lib/format";
import { paths } from "@/lib/paths";
import type { EmailMessage } from "@/lib/types";
import { IdPage } from "@/components/id-page";
import { Kv, PageHeader, Panel } from "@/components/ui/page-header";
import { SecondaryLink } from "@/components/ui/form";

function EmailDetail() {
  const id = useIdParam();
  const { data: email } = useResource<EmailMessage>(
    id ? `/api/emails/${id}` : ""
  );

  if (!id || !email) {
    return <div className="px-8 py-8 text-[13px] text-muted">Loading email…</div>;
  }

  return (
    <div className="px-8 py-8">
      <Link href="/emails" className="text-[12px] text-muted hover:text-ink">
        ← Emails
      </Link>
      <div className="mt-3">
        <PageHeader
          title={email.subject}
          actions={<SecondaryLink href={paths.emailEdit(email.id)}>Edit</SecondaryLink>}
        />
      </div>
      <Panel>
        <div className="px-5">
          <Kv label="To">{email.to}</Kv>
          <Kv label="Sent by">{email.sentBy}</Kv>
          <Kv label="Sent">{relativeTime(email.createdAt)}</Kv>
        </div>
        <div className="border-t border-line px-5 py-5 text-[13px] leading-6 text-ink">
          {email.body}
        </div>
      </Panel>
    </div>
  );
}

export default function EmailDetailPage() {
  return (
    <IdPage>
      <EmailDetail />
    </IdPage>
  );
}
