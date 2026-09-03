import "dotenv/config";
import { migrate, run, setCounter, transaction } from "./db.js";

function at(minutesAgo: number) {
  return new Date(Date.now() - minutesAgo * 60_000).toISOString();
}

export function seed() {
  transaction(() => {
    run("DELETE FROM activity");
    run("DELETE FROM emails");
    run("DELETE FROM tickets");
    run("DELETE FROM payments");
    run("DELETE FROM invoices");
    run("DELETE FROM subscriptions");
    run("DELETE FROM customers");

    setCounter("customer_seq", 6);
    setCounter("subscription_seq", 6);
    setCounter("invoice_seq", 10231);
    setCounter("payment_seq", 92831);
    setCounter("ticket_seq", 1003);
    setCounter("email_seq", 1001);
    setCounter("activity_seq", 1006);

    const customers = [
      ["cus_001", "Acme Corporation"],
      ["cus_002", "Globex Corporation"],
      ["cus_003", "Wayne Enterprises"],
      ["cus_004", "Initech"],
      ["cus_005", "Stark Industries"],
      ["cus_006", "Umbrella Corporation"],
    ] as const;

    for (const [id, name] of customers) {
      run("INSERT INTO customers (id, name) VALUES (?, ?)", [id, name]);
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
      run(
        "INSERT INTO subscriptions (id, customer_id, plan, status, mrr) VALUES (?, ?, ?, ?, ?)",
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
      run(
        "INSERT INTO invoices (id, customer_id, amount, status, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [id, customerId, amount, status, reason, createdAt]
      );
      run(
        "INSERT INTO payments (id, invoice_id, customer_id, amount, status, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          paymentId,
          id,
          customerId,
          amount,
          status === "failed" ? "failed" : "paid",
          reason,
          createdAt,
        ]
      );
    }

    const tickets = [
      ["T-1001", "cus_001", "Payment failed", "open", "nina.voss", at(4)],
      ["T-1000", "cus_001", "Invoice discrepancy", "open", "billing.ops", at(90)],
      ["T-1002", "cus_002", "Login issue", "pending", "globex.admin", at(8)],
      ["T-1003", "cus_003", "Invoice request", "resolved", "wayne.ap", at(120)],
    ] as const;

    for (const [id, customerId, subject, status, createdBy, createdAt] of tickets) {
      run(
        "INSERT INTO tickets (id, customer_id, subject, status, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [id, customerId, subject, status, createdBy, createdAt]
      );
    }

    run(
      "INSERT INTO emails (id, customer_id, recipient, subject, body, sent_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
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
      run("INSERT INTO activity (id, at, event, customer_id) VALUES (?, ?, ?, ?)", [
        id,
        atTime,
        event,
        customerId,
      ]);
    }
  });
}

const isCli = process.argv[1]?.endsWith("seed.ts");
if (isCli) {
  try {
    migrate();
    seed();
    console.log("Seeded ACME demo data");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
