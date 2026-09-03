import type { InvoiceStatus, PaymentStatus, TicketStatus } from "@/lib/types";

const styles: Record<string, string> = {
  active: "bg-paid-bg text-paid",
  paid: "bg-paid-bg text-paid",
  refunded: "bg-refunded-bg text-refunded",
  failed: "bg-failed-bg text-failed",
  open: "bg-open-bg text-open",
  pending: "bg-pending-bg text-pending",
  resolved: "bg-page text-muted",
  past_due: "bg-failed-bg text-failed",
  canceled: "bg-page text-muted",
};

export function StatusBadge({
  value,
}: {
  value: InvoiceStatus | PaymentStatus | TicketStatus | "active" | "past_due" | "canceled";
}) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
        styles[value] ?? "bg-page text-muted"
      }`}
    >
      {value.replace("_", " ")}
    </span>
  );
}

export function StatusDot({
  value,
}: {
  value: "active" | "failed" | "paid" | "open" | "pending";
}) {
  const color =
    value === "failed"
      ? "bg-failed"
      : value === "pending"
        ? "bg-pending"
        : value === "open"
          ? "bg-open"
          : "bg-paid";
  return <span className={`size-1.5 rounded-full ${color}`} />;
}
