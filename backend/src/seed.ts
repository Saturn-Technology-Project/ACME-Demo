import "dotenv/config";
import { migrate, pool } from "./db.js";

function at(minutesAgo: number) {
  return new Date(Date.now() - minutesAgo * 60_000).toISOString();
}

export async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "TRUNCATE activity, emails, tickets, payments, invoices, subscriptions, customers CASCADE"
    );
    await client.query("ALTER SEQUENCE customer_seq RESTART WITH 7");
    await client.query("ALTER SEQUENCE subscription_seq RESTART WITH 7");
    await client.query("ALTER SEQUENCE invoice_seq RESTART WITH 10232");
    await client.query("ALTER SEQUENCE payment_seq RESTART WITH 92832");
    await client.query("ALTER SEQUENCE ticket_seq RESTART WITH 1004");
    await client.query("ALTER SEQUENCE email_seq RESTART WITH 1002");
    await client.query("ALTER SEQUENCE activity_seq RESTART WITH 1007");

    const customers = [
      ["cus_001", "Acme Corporation"],
      ["cus_002", "Globex Corporation"],
      ["cus_003", "Wayne Enterprises"],
      ["cus_004", "Initech"],
      ["cus_005", "Stark Industries"],
      ["cus_006", "Umbrella Corporation"],
    ] as const;

    for (const [id, name] of customers) {
      await client.query("INSERT INTO customers (id, name) VALUES ($1, $2)", [
        id,
        name,
      ]);
    }

    const subscriptions = [
      ["sub_001", "cus_001", "Enterprise", "active", 8400],
      ["sub_002", "cus_002", "Business", "active", 2400],
      ["sub_003", "cus_003", "Business", "active", 1200],
      ["sub_004", "cus_004", "Starter", "active", 480],
      ["sub_005", "cus_005", "Enterprise", "active", 6200],
      ["sub_006", "cus_006", "Business", "active", 1800],
    ] as const;

    for (const [id, customerId, plan, status, mrr] of subscriptions) {
      await client.query(
        "INSERT INTO subscriptions (id, customer_id, plan, status, mrr) VALUES ($1, $2, $3, $4, $5)",
        [id, customerId, plan, status, mrr]
      );
    }

    const invoices = [
      ["INV-10231", "cus_001", 840, "failed", "Duplicate charge", at(2), "TX-92831"],
      ["INV-10230", "cus_002", 2400, "paid", null, at(18), "TX-92830"],
      ["INV-10229", "cus_003", 1200, "paid", null, at(26), "TX-92829"],
      ["INV-10228", "cus_005", 6200, "paid", null, at(40), "TX-92828"],
      ["INV-10227", "cus_006", 1800, "paid", null, at(52), "TX-92827"],
    ] as const;

    for (const [id, customerId, amount, status, reason, createdAt, paymentId] of invoices) {
      await client.query(
        "INSERT INTO invoices (id, customer_id, amount, status, reason, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
        [id, customerId, amount, status, reason, createdAt]
      );
      await client.query(
        "INSERT INTO payments (id, invoice_id, customer_id, amount, status, reason, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [paymentId, id, customerId, amount, status === "failed" ? "failed" : "paid", reason, createdAt]
      );
    }

    const tickets = [
      ["T-1001", "cus_001", "Payment failed", "open", "nina.voss", at(4)],
      ["T-1000", "cus_001", "Invoice discrepancy", "open", "billing.ops", at(90)],
      ["T-1002", "cus_002", "Login issue", "pending", "globex.admin", at(8)],
      ["T-1003", "cus_003", "Invoice request", "resolved", "wayne.ap", at(120)],
    ] as const;

    for (const [id, customerId, subject, status, createdBy, createdAt] of tickets) {
      await client.query(
        "INSERT INTO tickets (id, customer_id, subject, status, created_by, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
        [id, customerId, subject, status, createdBy, createdAt]
      );
    }

    await client.query(
      "INSERT INTO emails (id, customer_id, recipient, subject, body, sent_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [
        "eml_1001",
        "cus_001",
        "billing@acme.com",
        "Payment issue",
        "Your recent payment could not be processed. Please update your payment method or contact billing support.",
        "billing.ops",
        at(3),
      ]
    );

    const activity = [
      ["act_1006", at(2), "Payment failed", "cus_001"],
      ["act_1005", at(8), "New support ticket", "cus_002"],
      ["act_1004", at(12), "Refund processed", "cus_003"],
      ["act_1003", at(18), "Invoice paid", "cus_002"],
      ["act_1002", at(26), "Invoice paid", "cus_003"],
      ["act_1001", at(40), "Invoice paid", "cus_005"],
    ] as const;

    for (const [id, atTime, event, customerId] of activity) {
      await client.query(
        "INSERT INTO activity (id, at, event, customer_id) VALUES ($1, $2, $3, $4)",
        [id, atTime, event, customerId]
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

const isCli = process.argv[1]?.endsWith("seed.ts");
if (isCli) {
  migrate()
    .then(seed)
    .then(async () => {
      console.log("Seeded ACME demo data");
      await pool.end();
    })
    .catch(async (error) => {
      console.error(error);
      await pool.end();
      process.exit(1);
    });
}
