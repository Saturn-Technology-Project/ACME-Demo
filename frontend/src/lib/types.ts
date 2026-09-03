export type Plan = "Starter" | "Business" | "Enterprise";
export type SubscriptionStatus = "active" | "past_due" | "canceled";
export type PaymentStatus = "paid" | "failed" | "refunded" | "pending";
export type InvoiceStatus = "paid" | "failed" | "refunded" | "open";
export type TicketStatus = "open" | "pending" | "resolved";

export type Customer = {
  id: string;
  name: string;
  plan: Plan;
  mrr: number;
  subscriptionStatus: SubscriptionStatus;
};

export type Invoice = {
  id: string;
  customerId: string;
  amount: number;
  status: InvoiceStatus;
  paymentId: string;
  reason: string | null;
  createdAt: string;
};

export type Payment = {
  id: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  status: PaymentStatus;
  reason: string | null;
  createdAt: string;
};

export type Ticket = {
  id: string;
  customerId: string;
  subject: string;
  status: TicketStatus;
  createdBy: string;
  createdAt: string;
};

export type EmailMessage = {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentBy: string;
  createdAt: string;
};

export type ActivityEvent = {
  id: string;
  at: string;
  event: string;
  customerId: string | null;
};

export type CustomerView = Customer & {
  paymentStatus: PaymentStatus | null;
  lastPaymentAmount: number | null;
  lastPaymentId: string | null;
  lastInvoiceId: string | null;
  openTickets: number;
};

export type InvoiceView = Invoice & {
  customerName: string;
};

export type TicketView = Ticket & {
  customerName: string;
};

export type ActivityView = ActivityEvent & {
  customerName: string | null;
};
