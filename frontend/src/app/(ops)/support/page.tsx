"use client";

import Link from "next/link";
import { useResource } from "@/hooks/use-resource";
import type { TicketView } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { PrimaryLink } from "@/components/ui/form";
import { paths } from "@/lib/paths";

export default function SupportPage() {
  const { data } = useResource<TicketView[]>("/api/tickets");
  const tickets = data ?? [];

  return (
    <div className="px-8 py-8">
      <PageHeader
        title="Support"
        actions={<PrimaryLink href="/support/new">New ticket</PrimaryLink>}
      />
      <div className="overflow-hidden border border-line bg-card">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-line bg-page text-[12px] text-muted">
            <tr>
              <th className="px-5 py-2.5 font-medium">Ticket</th>
              <th className="px-5 py-2.5 font-medium">Customer</th>
              <th className="px-5 py-2.5 font-medium">Subject</th>
              <th className="px-5 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-page/80">
                <td className="px-5 py-3.5 font-mono">
                  <Link href={paths.ticket(ticket.id)} className="text-accent hover:underline">
                    {ticket.id}
                  </Link>
                </td>
                <td className="px-5 py-3.5">{ticket.customerName}</td>
                <td className="px-5 py-3.5">{ticket.subject}</td>
                <td className="px-5 py-3.5">
                  <StatusBadge value={ticket.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
