import { Router } from "express";
import { all, get, iso, nextId, now, run, transaction } from "./db.js";
import { seed } from "./seed.js";

export const router = Router();

const customerSelect = `
  SELECT
    c.id,
    c.name,
    s.plan,
    s.mrr,
    s.status AS subscription_status,
    (
      SELECT p.status FROM payments p
      WHERE p.customer_id = c.id
      ORDER BY p.created_at DESC LIMIT 1
    ) AS payment_status,
    (
      SELECT p.amount FROM payments p
      WHERE p.customer_id = c.id
      ORDER BY p.created_at DESC LIMIT 1
    ) AS last_payment_amount,
    (
      SELECT p.id FROM payments p
      WHERE p.customer_id = c.id
      ORDER BY p.created_at DESC LIMIT 1
    ) AS last_payment_id,
    (
      SELECT p.invoice_id FROM payments p
      WHERE p.customer_id = c.id
      ORDER BY p.created_at DESC LIMIT 1
    ) AS last_invoice_id,
    (
      SELECT COUNT(*) FROM tickets t
      WHERE t.customer_id = c.id AND t.status = 'open'
    ) AS open_tickets
  FROM customers c
  JOIN subscriptions s ON s.customer_id = c.id
`;

function asId(value: unknown) {
  return String(value);
}

function toCustomer(row: Record<string, unknown>) {
  return {
    id: asId(row.id),
    name: String(row.name),
    plan: row.plan,
    mrr: Number(row.mrr),
    subscriptionStatus: row.subscription_status,
    paymentStatus: row.payment_status ?? null,
    lastPaymentAmount:
      row.last_payment_amount == null ? null : Number(row.last_payment_amount),
    lastPaymentId: row.last_payment_id ?? null,
    lastInvoiceId: row.last_invoice_id ?? null,
    openTickets: Number(row.open_tickets),
  };
}

function toInvoice(row: Record<string, unknown>) {
  return {
    id: asId(row.id),
    customerId: asId(row.customer_id),
    customerName: row.customer_name,
    amount: Number(row.amount),
    status: row.status,
    paymentId: row.payment_id,
    reason: row.reason,
    createdAt: iso(row.created_at as Date | string),
  };
}

function toPayment(row: Record<string, unknown>) {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    customerId: row.customer_id,
    amount: Number(row.amount),
    status: row.status,
    reason: row.reason,
    createdAt: iso(row.created_at as Date | string),
  };
}

function toTicket(row: Record<string, unknown>) {
  return {
    id: asId(row.id),
    customerId: asId(row.customer_id),
    customerName: row.customer_name,
    subject: String(row.subject),
    status: row.status,
    createdBy: row.created_by,
    createdAt: iso(row.created_at as Date | string),
  };
}

function toEmail(row: Record<string, unknown>) {
  return {
    id: row.id,
    to: row.recipient,
    subject: row.subject,
    body: row.body,
    sentBy: row.sent_by,
    createdAt: iso(row.created_at as Date | string),
  };
}

function toActivity(row: Record<string, unknown>) {
  return {
    id: row.id,
    at: iso(row.at as Date | string),
    event: row.event,
    customerId: row.customer_id,
    customerName: row.customer_name ?? null,
  };
}

const PLANS = ["Starter", "Business", "Enterprise"] as const;
const SUBSCRIPTION_STATUSES = ["active", "past_due", "canceled"] as const;
const INVOICE_STATUSES = ["paid", "failed", "refunded", "open"] as const;
const PAYMENT_STATUSES = ["paid", "failed", "refunded", "pending"] as const;
const TICKET_STATUSES = ["open", "pending", "resolved"] as const;

type Plan = (typeof PLANS)[number];
type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];
type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
type TicketStatus = (typeof TICKET_STATUSES)[number];

const invoiceSelect = `
  SELECT i.*, c.name AS customer_name,
    (
      SELECT p.id FROM payments p
      WHERE p.invoice_id = i.id
      ORDER BY p.created_at DESC LIMIT 1
    ) AS payment_id
  FROM invoices i
  JOIN customers c ON c.id = i.customer_id
`;

const ticketSelect = `
  SELECT t.*, c.name AS customer_name
  FROM tickets t
  JOIN customers c ON c.id = t.customer_id
`;

function asTrimmed(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asInt(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) {
    return Number(value.trim());
  }
  return undefined;
}

function asOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[]
): T | undefined {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

function paymentStatusForInvoice(status: InvoiceStatus): PaymentStatus {
  if (status === "open") return "pending";
  return status;
}

function findCustomer(id: string) {
  const row = get<Record<string, unknown>>(`${customerSelect} WHERE c.id = ?`, [
    id,
  ]);
  return row ? toCustomer(row) : null;
}

function findInvoice(id: string) {
  const row = get<Record<string, unknown>>(`${invoiceSelect} WHERE i.id = ?`, [
    id,
  ]);
  return row ? toInvoice(row) : null;
}

function findTicket(id: string) {
  const row = get<Record<string, unknown>>(`${ticketSelect} WHERE t.id = ?`, [
    id,
  ]);
  return row ? toTicket(row) : null;
}

function customerExists(id: string) {
  return get<{ name: string }>("SELECT name FROM customers WHERE id = ?", [id]);
}

function pushActivity(event: string, customerId: string | null) {
  const id = nextId("activity_seq", "act_");
  run("INSERT INTO activity (id, at, event, customer_id) VALUES (?, ?, ?, ?)", [
    id,
    now(),
    event,
    customerId,
  ]);
}

router.get("/customers", (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const rows = all<Record<string, unknown>>(
    `${customerSelect}
     WHERE (? = '' OR instr(lower(c.name), lower(?)) > 0)
     ORDER BY c.id`,
    [q, q]
  );
  res.json(rows.map(toCustomer));
});

router.get("/customers/:id", (req, res) => {
  const customer = findCustomer(req.params.id);
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  res.json(customer);
});

router.post("/customers", (req, res) => {
  const name = asTrimmed(req.body?.name);
  const plan = asOneOf(req.body?.plan, PLANS) ?? "Business";
  const subscriptionStatus =
    asOneOf(req.body?.subscriptionStatus, SUBSCRIPTION_STATUSES) ?? "active";
  const mrr = asInt(req.body?.mrr) ?? 0;

  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  if (req.body?.plan != null && !asOneOf(req.body.plan, PLANS)) {
    res.status(400).json({ error: `plan must be one of: ${PLANS.join(", ")}` });
    return;
  }
  if (
    req.body?.subscriptionStatus != null &&
    !asOneOf(req.body.subscriptionStatus, SUBSCRIPTION_STATUSES)
  ) {
    res.status(400).json({
      error: `subscriptionStatus must be one of: ${SUBSCRIPTION_STATUSES.join(", ")}`,
    });
    return;
  }
  if (req.body?.mrr != null && asInt(req.body.mrr) == null) {
    res.status(400).json({ error: "mrr must be an integer" });
    return;
  }
  if (mrr < 0) {
    res.status(400).json({ error: "mrr must be >= 0" });
    return;
  }

  const id = transaction(() => {
    const customerId = nextId("customer_seq", "cus_", 3);
    const subscriptionId = nextId("subscription_seq", "sub_", 3);
    run("INSERT INTO customers (id, name) VALUES (?, ?)", [customerId, name]);
    run(
      "INSERT INTO subscriptions (id, customer_id, plan, status, mrr) VALUES (?, ?, ?, ?, ?)",
      [subscriptionId, customerId, plan, subscriptionStatus, mrr]
    );
    return customerId;
  });
  pushActivity("Customer created", id);
  res.status(201).json(findCustomer(id));
});

router.patch("/customers/:id", (req, res) => {
  const existing = findCustomer(req.params.id);
  if (!existing) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const name = req.body?.name === undefined ? existing.name : asTrimmed(req.body.name);
  const plan =
    req.body?.plan === undefined
      ? (existing.plan as Plan)
      : asOneOf(req.body.plan, PLANS);
  const subscriptionStatus =
    req.body?.subscriptionStatus === undefined
      ? (existing.subscriptionStatus as SubscriptionStatus)
      : asOneOf(req.body.subscriptionStatus, SUBSCRIPTION_STATUSES);
  const mrr =
    req.body?.mrr === undefined ? existing.mrr : asInt(req.body.mrr);

  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  if (!plan) {
    res.status(400).json({ error: `plan must be one of: ${PLANS.join(", ")}` });
    return;
  }
  if (!subscriptionStatus) {
    res.status(400).json({
      error: `subscriptionStatus must be one of: ${SUBSCRIPTION_STATUSES.join(", ")}`,
    });
    return;
  }
  if (mrr == null) {
    res.status(400).json({ error: "mrr must be an integer" });
    return;
  }
  if (mrr < 0) {
    res.status(400).json({ error: "mrr must be >= 0" });
    return;
  }

  run("UPDATE customers SET name = ? WHERE id = ?", [name, existing.id]);
  run(
    "UPDATE subscriptions SET plan = ?, status = ?, mrr = ? WHERE customer_id = ?",
    [plan, subscriptionStatus, mrr, existing.id]
  );
  pushActivity("Customer updated", existing.id);
  res.json(findCustomer(existing.id));
});

router.get("/invoices", (_req, res) => {
  const rows = all<Record<string, unknown>>(
    `${invoiceSelect} ORDER BY i.created_at DESC`
  );
  res.json(rows.map(toInvoice));
});

router.get("/invoices/:id", (req, res) => {
  const invoice = findInvoice(req.params.id);
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  res.json(invoice);
});

router.post("/invoices", (req, res) => {
  const customerId = asTrimmed(req.body?.customerId);
  const amount = asInt(req.body?.amount);
  const status = asOneOf(req.body?.status, INVOICE_STATUSES) ?? "open";
  const reason = asTrimmed(req.body?.reason) ?? null;

  if (!customerId || amount == null) {
    res.status(400).json({ error: "customerId and amount are required" });
    return;
  }
  if (amount < 0) {
    res.status(400).json({ error: "amount must be >= 0" });
    return;
  }
  if (req.body?.status != null && !asOneOf(req.body.status, INVOICE_STATUSES)) {
    res.status(400).json({
      error: `status must be one of: ${INVOICE_STATUSES.join(", ")}`,
    });
    return;
  }
  if (!customerExists(customerId)) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const id = transaction(() => {
    const invoiceId = nextId("invoice_seq", "INV-");
    const paymentId = nextId("payment_seq", "TX-");
    const createdAt = now();
    run(
      `
      INSERT INTO invoices (id, customer_id, amount, status, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [invoiceId, customerId, amount, status, reason, createdAt]
    );
    run(
      `
      INSERT INTO payments (id, invoice_id, customer_id, amount, status, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        paymentId,
        invoiceId,
        customerId,
        amount,
        paymentStatusForInvoice(status),
        reason,
        createdAt,
      ]
    );
    return invoiceId;
  });
  pushActivity("Invoice created", customerId);
  res.status(201).json(findInvoice(id));
});

router.patch("/invoices/:id", (req, res) => {
  const existing = findInvoice(req.params.id);
  if (!existing) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  const amount =
    req.body?.amount === undefined ? existing.amount : asInt(req.body.amount);
  const status =
    req.body?.status === undefined
      ? (existing.status as InvoiceStatus)
      : asOneOf(req.body.status, INVOICE_STATUSES);
  const reason =
    req.body?.reason === undefined
      ? existing.reason
      : asTrimmed(req.body.reason) ?? null;

  if (amount == null) {
    res.status(400).json({ error: "amount must be an integer" });
    return;
  }
  if (amount < 0) {
    res.status(400).json({ error: "amount must be >= 0" });
    return;
  }
  if (!status) {
    res.status(400).json({
      error: `status must be one of: ${INVOICE_STATUSES.join(", ")}`,
    });
    return;
  }

  run("UPDATE invoices SET amount = ?, status = ?, reason = ? WHERE id = ?", [
    amount,
    status,
    reason,
    existing.id,
  ]);
  run(
    `
    UPDATE payments
    SET amount = ?, status = ?, reason = ?
    WHERE invoice_id = ?
    `,
    [amount, paymentStatusForInvoice(status), reason, existing.id]
  );
  pushActivity("Invoice updated", existing.customerId);
  res.json(findInvoice(existing.id));
});

router.get("/payments/:id", (req, res) => {
  const row = get<Record<string, unknown>>("SELECT * FROM payments WHERE id = ?", [
    req.params.id,
  ]);
  if (!row) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }
  res.json(toPayment(row));
});

router.post("/payments/:id/refund", (req, res) => {
  const payment = transaction(() => {
    const row = get<Record<string, unknown>>(
      "SELECT * FROM payments WHERE id = ?",
      [req.params.id]
    );
    if (!row) return null;
    if (row.status !== "refunded") {
      run("UPDATE payments SET status = 'refunded' WHERE id = ?", [row.id]);
      run("UPDATE invoices SET status = 'refunded' WHERE id = ?", [
        row.invoice_id,
      ]);
      const requestedId = nextId("activity_seq", "act_");
      const completedId = nextId("activity_seq", "act_");
      const at = now();
      run(
        "INSERT INTO activity (id, at, event, customer_id) VALUES (?, ?, ?, ?)",
        [requestedId, at, "Refund requested", row.customer_id]
      );
      run(
        "INSERT INTO activity (id, at, event, customer_id) VALUES (?, ?, ?, ?)",
        [completedId, at, "Refund completed", row.customer_id]
      );
      row.status = "refunded";
    }
    return row;
  });
  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }
  res.json(toPayment(payment));
});

router.get("/tickets", (_req, res) => {
  const rows = all<Record<string, unknown>>(
    `${ticketSelect} ORDER BY t.created_at DESC`
  );
  res.json(rows.map(toTicket));
});

router.get("/tickets/:id", (req, res) => {
  const ticket = findTicket(req.params.id);
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }
  res.json(ticket);
});

router.post("/tickets", (req, res) => {
  const customerId = asTrimmed(req.body?.customerId);
  const subject = asTrimmed(req.body?.subject);
  const createdBy =
    asTrimmed(req.body?.createdBy) ?? "Customer Operations Agent";
  const status = asOneOf(req.body?.status, TICKET_STATUSES) ?? "open";

  if (!customerId || !subject) {
    res.status(400).json({ error: "customerId and subject are required" });
    return;
  }
  if (req.body?.status != null && !asOneOf(req.body.status, TICKET_STATUSES)) {
    res.status(400).json({
      error: `status must be one of: ${TICKET_STATUSES.join(", ")}`,
    });
    return;
  }
  if (!customerExists(customerId)) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const id = nextId("ticket_seq", "T-");
  run(
    `
    INSERT INTO tickets (id, customer_id, subject, status, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [id, customerId, subject, status, createdBy, now()]
  );
  pushActivity("Ticket created", customerId);
  res.status(201).json(findTicket(id));
});

router.patch("/tickets/:id", (req, res) => {
  const existing = findTicket(req.params.id);
  if (!existing) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const subject =
    req.body?.subject === undefined
      ? existing.subject
      : asTrimmed(req.body.subject);
  const status =
    req.body?.status === undefined
      ? (existing.status as TicketStatus)
      : asOneOf(req.body.status, TICKET_STATUSES);

  if (!subject) {
    res.status(400).json({ error: "subject is required" });
    return;
  }
  if (!status) {
    res.status(400).json({
      error: `status must be one of: ${TICKET_STATUSES.join(", ")}`,
    });
    return;
  }

  run("UPDATE tickets SET subject = ?, status = ? WHERE id = ?", [
    subject,
    status,
    existing.id,
  ]);
  pushActivity("Ticket updated", existing.customerId);
  res.json(findTicket(existing.id));
});

router.get("/emails", (_req, res) => {
  const rows = all<Record<string, unknown>>(
    "SELECT * FROM emails ORDER BY created_at DESC"
  );
  res.json(rows.map(toEmail));
});

router.get("/emails/:id", (req, res) => {
  const row = get<Record<string, unknown>>("SELECT * FROM emails WHERE id = ?", [
    req.params.id,
  ]);
  if (!row) {
    res.status(404).json({ error: "Email not found" });
    return;
  }
  res.json(toEmail(row));
});

router.post("/emails", (req, res) => {
  const to = asTrimmed(req.body?.to);
  const subject = asTrimmed(req.body?.subject);
  const body = asTrimmed(req.body?.body);
  const sentBy = asTrimmed(req.body?.sentBy) ?? "Customer Operations Agent";
  const customerId = asTrimmed(req.body?.customerId) ?? null;

  if (!to || !subject || !body) {
    res.status(400).json({ error: "to, subject, and body are required" });
    return;
  }
  if (customerId && !customerExists(customerId)) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const id = nextId("email_seq", "eml_");
  run(
    `
    INSERT INTO emails (id, customer_id, recipient, subject, body, sent_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [id, customerId, to, subject, body, sentBy, now()]
  );
  const row = get<Record<string, unknown>>("SELECT * FROM emails WHERE id = ?", [
    id,
  ]);
  pushActivity("Email sent", customerId);
  res.status(201).json(toEmail(row!));
});

router.patch("/emails/:id", (req, res) => {
  const existing = get<Record<string, unknown>>(
    "SELECT * FROM emails WHERE id = ?",
    [req.params.id]
  );
  if (!existing) {
    res.status(404).json({ error: "Email not found" });
    return;
  }

  const to =
    req.body?.to === undefined ? existing.recipient : asTrimmed(req.body.to);
  const subject =
    req.body?.subject === undefined
      ? existing.subject
      : asTrimmed(req.body.subject);
  const body =
    req.body?.body === undefined ? existing.body : asTrimmed(req.body.body);

  if (!to || !subject || !body) {
    res.status(400).json({ error: "to, subject, and body are required" });
    return;
  }

  run("UPDATE emails SET recipient = ?, subject = ?, body = ? WHERE id = ?", [
    to,
    subject,
    body,
    existing.id,
  ]);
  const row = get<Record<string, unknown>>("SELECT * FROM emails WHERE id = ?", [
    existing.id,
  ]);
  res.json(toEmail(row!));
});

router.get("/activity", (_req, res) => {
  const rows = all<Record<string, unknown>>(`
    SELECT a.*, c.name AS customer_name
    FROM activity a
    LEFT JOIN customers c ON c.id = a.customer_id
    ORDER BY a.at DESC
  `);
  res.json(rows.map(toActivity));
});

router.post("/demo/reset", (_req, res) => {
  seed();
  res.json({ ok: true });
});
