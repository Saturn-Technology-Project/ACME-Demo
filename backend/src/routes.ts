import { Router } from "express";
import { iso, pool } from "./db.js";
import { seed } from "./seed.js";

export const router = Router();

const customerSelect = `
  SELECT
    c.id,
    c.name,
    s.plan,
    s.mrr,
    s.status AS subscription_status,
    p.status AS payment_status,
    p.amount AS last_payment_amount,
    p.id AS last_payment_id,
    p.invoice_id AS last_invoice_id,
    (
      SELECT COUNT(*)::int
      FROM tickets t
      WHERE t.customer_id = c.id AND t.status = 'open'
    ) AS open_tickets
  FROM customers c
  JOIN subscriptions s ON s.customer_id = c.id
  LEFT JOIN LATERAL (
    SELECT id, invoice_id, amount, status
    FROM payments
    WHERE customer_id = c.id
    ORDER BY created_at DESC
    LIMIT 1
  ) p ON true
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
  SELECT i.*, c.name AS customer_name, p.id AS payment_id
  FROM invoices i
  JOIN customers c ON c.id = i.customer_id
  LEFT JOIN LATERAL (
    SELECT id FROM payments WHERE invoice_id = i.id ORDER BY created_at DESC LIMIT 1
  ) p ON true
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

async function nextId(sequence: string, prefix: string, pad = 0) {
  const { rows } = await pool.query<{ nextval: string }>(
    `SELECT nextval($1)::text AS nextval`,
    [sequence]
  );
  const value = pad > 0 ? rows[0].nextval.padStart(pad, "0") : rows[0].nextval;
  return `${prefix}${value}`;
}

async function findCustomer(id: string) {
  const { rows } = await pool.query(`${customerSelect} WHERE c.id = $1`, [id]);
  return rows[0] ? toCustomer(rows[0]) : null;
}

async function findInvoice(id: string) {
  const { rows } = await pool.query(`${invoiceSelect} WHERE i.id = $1`, [id]);
  return rows[0] ? toInvoice(rows[0]) : null;
}

async function findTicket(id: string) {
  const { rows } = await pool.query(`${ticketSelect} WHERE t.id = $1`, [id]);
  return rows[0] ? toTicket(rows[0]) : null;
}

async function customerExists(id: string) {
  const { rows } = await pool.query("SELECT name FROM customers WHERE id = $1", [
    id,
  ]);
  return rows[0] as { name: string } | undefined;
}

async function pushActivity(event: string, customerId: string | null) {
  const id = await nextId("activity_seq", "act_");
  await pool.query(
    "INSERT INTO activity (id, at, event, customer_id) VALUES ($1, now(), $2, $3)",
    [id, event, customerId]
  );
}

router.get("/customers", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const { rows } = await pool.query(
    `${customerSelect}
     WHERE ($1 = '' OR c.name ILIKE '%' || $1 || '%')
     ORDER BY c.id`,
    [q]
  );
  res.json(rows.map(toCustomer));
});

router.get("/customers/:id", async (req, res) => {
  const customer = await findCustomer(req.params.id);
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  res.json(customer);
});

router.post("/customers", async (req, res) => {
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

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const id = await nextId("customer_seq", "cus_", 3);
    const subscriptionId = await nextId("subscription_seq", "sub_", 3);
    await client.query("INSERT INTO customers (id, name) VALUES ($1, $2)", [
      id,
      name,
    ]);
    await client.query(
      "INSERT INTO subscriptions (id, customer_id, plan, status, mrr) VALUES ($1, $2, $3, $4, $5)",
      [subscriptionId, id, plan, subscriptionStatus, mrr]
    );
    await client.query("COMMIT");
    await pushActivity("Customer created", id);
    res.status(201).json(await findCustomer(id));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

router.patch("/customers/:id", async (req, res) => {
  const existing = await findCustomer(req.params.id);
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

  await pool.query("UPDATE customers SET name = $2 WHERE id = $1", [
    existing.id,
    name,
  ]);
  await pool.query(
    "UPDATE subscriptions SET plan = $2, status = $3, mrr = $4 WHERE customer_id = $1",
    [existing.id, plan, subscriptionStatus, mrr]
  );
  await pushActivity("Customer updated", existing.id);
  res.json(await findCustomer(existing.id));
});

router.get("/invoices", async (_req, res) => {
  const { rows } = await pool.query(`${invoiceSelect} ORDER BY i.created_at DESC`);
  res.json(rows.map(toInvoice));
});

router.get("/invoices/:id", async (req, res) => {
  const invoice = await findInvoice(req.params.id);
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  res.json(invoice);
});

router.post("/invoices", async (req, res) => {
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
  if (!(await customerExists(customerId))) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const id = await nextId("invoice_seq", "INV-");
    const paymentId = await nextId("payment_seq", "TX-");
    await client.query(
      `
      INSERT INTO invoices (id, customer_id, amount, status, reason, created_at)
      VALUES ($1, $2, $3, $4, $5, now())
      `,
      [id, customerId, amount, status, reason]
    );
    await client.query(
      `
      INSERT INTO payments (id, invoice_id, customer_id, amount, status, reason, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, now())
      `,
      [paymentId, id, customerId, amount, paymentStatusForInvoice(status), reason]
    );
    await client.query("COMMIT");
    await pushActivity("Invoice created", customerId);
    res.status(201).json(await findInvoice(id));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

router.patch("/invoices/:id", async (req, res) => {
  const existing = await findInvoice(req.params.id);
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

  await pool.query(
    "UPDATE invoices SET amount = $2, status = $3, reason = $4 WHERE id = $1",
    [existing.id, amount, status, reason]
  );
  await pool.query(
    `
    UPDATE payments
    SET amount = $2, status = $3, reason = $4
    WHERE invoice_id = $1
    `,
    [existing.id, amount, paymentStatusForInvoice(status), reason]
  );
  await pushActivity("Invoice updated", existing.customerId);
  res.json(await findInvoice(existing.id));
});

router.get("/payments/:id", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM payments WHERE id = $1", [
    req.params.id,
  ]);
  if (!rows[0]) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }
  res.json(toPayment(rows[0]));
});

router.post("/payments/:id/refund", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query("SELECT * FROM payments WHERE id = $1 FOR UPDATE", [
      req.params.id,
    ]);
    const payment = rows[0];
    if (!payment) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Payment not found" });
      return;
    }
    if (payment.status !== "refunded") {
      await client.query("UPDATE payments SET status = 'refunded' WHERE id = $1", [
        payment.id,
      ]);
      await client.query("UPDATE invoices SET status = 'refunded' WHERE id = $1", [
        payment.invoice_id,
      ]);
      const requestedId = (
        await client.query<{ nextval: string }>(
          "SELECT nextval('activity_seq')::text AS nextval"
        )
      ).rows[0].nextval;
      const completedId = (
        await client.query<{ nextval: string }>(
          "SELECT nextval('activity_seq')::text AS nextval"
        )
      ).rows[0].nextval;
      await client.query(
        "INSERT INTO activity (id, at, event, customer_id) VALUES ($1, now(), $2, $3)",
        [`act_${requestedId}`, "Refund requested", payment.customer_id]
      );
      await client.query(
        "INSERT INTO activity (id, at, event, customer_id) VALUES ($1, now(), $2, $3)",
        [`act_${completedId}`, "Refund completed", payment.customer_id]
      );
      payment.status = "refunded";
    }
    await client.query("COMMIT");
    res.json(toPayment(payment));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

router.get("/tickets", async (_req, res) => {
  const { rows } = await pool.query(`${ticketSelect} ORDER BY t.created_at DESC`);
  res.json(rows.map(toTicket));
});

router.get("/tickets/:id", async (req, res) => {
  const ticket = await findTicket(req.params.id);
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }
  res.json(ticket);
});

router.post("/tickets", async (req, res) => {
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
  if (!(await customerExists(customerId))) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const id = await nextId("ticket_seq", "T-");
  await pool.query(
    `
    INSERT INTO tickets (id, customer_id, subject, status, created_by, created_at)
    VALUES ($1, $2, $3, $4, $5, now())
    `,
    [id, customerId, subject, status, createdBy]
  );
  await pushActivity("Ticket created", customerId);
  res.status(201).json(await findTicket(id));
});

router.patch("/tickets/:id", async (req, res) => {
  const existing = await findTicket(req.params.id);
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

  await pool.query("UPDATE tickets SET subject = $2, status = $3 WHERE id = $1", [
    existing.id,
    subject,
    status,
  ]);
  await pushActivity("Ticket updated", existing.customerId);
  res.json(await findTicket(existing.id));
});

router.get("/emails", async (_req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM emails ORDER BY created_at DESC"
  );
  res.json(rows.map(toEmail));
});

router.get("/emails/:id", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM emails WHERE id = $1", [
    req.params.id,
  ]);
  if (!rows[0]) {
    res.status(404).json({ error: "Email not found" });
    return;
  }
  res.json(toEmail(rows[0]));
});

router.post("/emails", async (req, res) => {
  const to = asTrimmed(req.body?.to);
  const subject = asTrimmed(req.body?.subject);
  const body = asTrimmed(req.body?.body);
  const sentBy = asTrimmed(req.body?.sentBy) ?? "Customer Operations Agent";
  const customerId = asTrimmed(req.body?.customerId) ?? null;

  if (!to || !subject || !body) {
    res.status(400).json({ error: "to, subject, and body are required" });
    return;
  }
  if (customerId && !(await customerExists(customerId))) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const id = await nextId("email_seq", "eml_");
  const { rows } = await pool.query(
    `
    INSERT INTO emails (id, customer_id, recipient, subject, body, sent_by, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, now())
    RETURNING *
    `,
    [id, customerId, to, subject, body, sentBy]
  );
  await pushActivity("Email sent", customerId);
  res.status(201).json(toEmail(rows[0]));
});

router.patch("/emails/:id", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM emails WHERE id = $1", [
    req.params.id,
  ]);
  if (!rows[0]) {
    res.status(404).json({ error: "Email not found" });
    return;
  }

  const existing = rows[0];
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

  const updated = await pool.query(
    `
    UPDATE emails
    SET recipient = $2, subject = $3, body = $4
    WHERE id = $1
    RETURNING *
    `,
    [existing.id, to, subject, body]
  );
  res.json(toEmail(updated.rows[0]));
});

router.get("/activity", async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT a.*, c.name AS customer_name
    FROM activity a
    LEFT JOIN customers c ON c.id = a.customer_id
    ORDER BY a.at DESC
  `);
  res.json(rows.map(toActivity));
});

router.post("/demo/reset", async (_req, res) => {
  await seed();
  res.json({ ok: true });
});
