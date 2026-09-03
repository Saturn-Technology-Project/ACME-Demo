"use client";

import Link from "next/link";
import { useResource } from "@/hooks/use-resource";
import { relativeTime } from "@/lib/format";
import type { EmailMessage } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { PrimaryLink } from "@/components/ui/form";
import { paths } from "@/lib/paths";

export default function EmailsPage() {
  const { data } = useResource<EmailMessage[]>("/api/emails");
  const emails = data ?? [];

  return (
    <div className="px-8 py-8">
      <PageHeader
        title="Emails"
        description={emails.length === 1 ? "1 message" : `${emails.length} messages`}
        actions={<PrimaryLink href="/emails/new">New email</PrimaryLink>}
      />
      <div className="divide-y divide-line border border-line bg-card">
        {emails.map((email) => (
          <Link
            key={email.id}
            href={paths.email(email.id)}
            className="block px-5 py-4 hover:bg-page/80"
          >
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <div className="text-[13px] text-muted">To: {email.to}</div>
                <div className="mt-1 text-[14px] font-medium text-ink">{email.subject}</div>
                <div className="mt-1 truncate text-[13px] text-muted">{email.body}</div>
                <div className="mt-2 text-[12px] text-muted">Sent by: {email.sentBy}</div>
              </div>
              <div className="shrink-0 text-[12px] text-muted">
                {relativeTime(email.createdAt)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
