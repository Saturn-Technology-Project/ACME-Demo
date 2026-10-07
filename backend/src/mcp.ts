export type ApiResult = { status: number; data: unknown };

export type ApiCall = (
  method: string,
  path: string,
  body?: unknown,
  query?: Record<string, string>,
) => Promise<ApiResult>;

type Tool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

const plan = { type: "string", enum: ["Starter", "Business", "Enterprise"] };
const subscriptionStatus = { type: "string", enum: ["active", "past_due", "canceled"] };
const invoiceStatus = { type: "string", enum: ["paid", "failed", "refunded", "open"] };
const ticketStatus = { type: "string", enum: ["open", "pending", "resolved"] };

function objectSchema(
  properties: Record<string, unknown>,
  required: string[] = [],
): Record<string, unknown> {
  return { type: "object", properties, required, additionalProperties: false };
}

function idSchema(description: string): Record<string, unknown> {
  return objectSchema({ id: { type: "string", description } }, ["id"]);
}

export const tools: Tool[] = [
  {
    name: "activity.list",
    description: "List recent ACME activity, newest first.",
    inputSchema: objectSchema({}),
  },
  {
    name: "billing.create_invoice",
    description: "Create an invoice and its payment for a customer.",
    inputSchema: objectSchema(
      {
        customerId: { type: "string" },
        amount: { type: "integer", minimum: 0 },
        status: invoiceStatus,
        reason: { type: "string" },
      },
      ["customerId", "amount"],
    ),
  },
  {
    name: "billing.get_invoice",
    description: "Get one invoice by id.",
    inputSchema: idSchema("Invoice id, such as INV-1001."),
  },
  {
    name: "billing.get_payment",
    description: "Get one payment by id.",
    inputSchema: idSchema("Payment id, such as TX-1001."),
  },
  {
    name: "billing.list_invoices",
    description: "List invoices, newest first.",
    inputSchema: objectSchema({}),
  },
  {
    name: "billing.refund",
    description: "Refund a payment and mark its invoice refunded.",
    inputSchema: idSchema("Payment id to refund."),
  },
  {
    name: "billing.update_invoice",
    description: "Update an invoice amount, status, or reason.",
    inputSchema: objectSchema(
      {
        id: { type: "string" },
        amount: { type: "integer", minimum: 0 },
        status: invoiceStatus,
        reason: { type: "string" },
      },
      ["id"],
    ),
  },
  {
    name: "crm.create_customer",
    description: "Create a customer and a subscription.",
    inputSchema: objectSchema(
      {
        name: { type: "string" },
        plan,
        subscriptionStatus,
        mrr: { type: "integer", minimum: 0 },
      },
      ["name"],
    ),
  },
  {
    name: "crm.get_customer",
    description: "Get one customer by id.",
    inputSchema: idSchema("Customer id, such as cus_001."),
  },
  {
    name: "crm.list_customers",
    description: "List customers. Optionally filter by a name fragment.",
    inputSchema: objectSchema({ q: { type: "string", description: "Case-insensitive name fragment." } }),
  },
  {
    name: "crm.update_customer",
    description: "Update a customer's name, plan, subscription status, or MRR.",
    inputSchema: objectSchema(
      {
        id: { type: "string" },
        name: { type: "string" },
        plan,
        subscriptionStatus,
        mrr: { type: "integer", minimum: 0 },
      },
      ["id"],
    ),
  },
  {
    name: "email.get",
    description: "Get one email by id.",
    inputSchema: idSchema("Email id."),
  },
  {
    name: "email.list",
    description: "List emails, newest first.",
    inputSchema: objectSchema({}),
  },
  {
    name: "email.send",
    description: "Send an email. Optionally attach it to a customer.",
    inputSchema: objectSchema(
      {
        to: { type: "string" },
        subject: { type: "string" },
        body: { type: "string" },
        customerId: { type: "string" },
        sentBy: { type: "string" },
      },
      ["to", "subject", "body"],
    ),
  },
  {
    name: "email.update",
    description: "Update an email recipient, subject, or body.",
    inputSchema: objectSchema(
      {
        id: { type: "string" },
        to: { type: "string" },
        subject: { type: "string" },
        body: { type: "string" },
      },
      ["id"],
    ),
  },
  {
    name: "support.create_ticket",
    description: "Open a support ticket for a customer.",
    inputSchema: objectSchema(
      {
        customerId: { type: "string" },
        subject: { type: "string" },
        status: ticketStatus,
        createdBy: { type: "string" },
      },
      ["customerId", "subject"],
    ),
  },
  {
    name: "support.get_ticket",
    description: "Get one support ticket by id.",
    inputSchema: idSchema("Ticket id, such as T-1001."),
  },
  {
    name: "support.list_tickets",
    description: "List support tickets, newest first.",
    inputSchema: objectSchema({}),
  },
  {
    name: "support.update_ticket",
    description: "Update a ticket subject or status.",
    inputSchema: objectSchema(
      {
        id: { type: "string" },
        subject: { type: "string" },
        status: ticketStatus,
      },
      ["id"],
    ),
  },
];

export async function handleMcp(message: unknown, call: ApiCall): Promise<Record<string, unknown>> {
  const rpc = message && typeof message === "object" ? (message as Record<string, unknown>) : {};
  const id = rpc.id ?? null;
  const method = typeof rpc.method === "string" ? rpc.method : "";
  const params =
    rpc.params && typeof rpc.params === "object" ? (rpc.params as Record<string, unknown>) : {};

  if (method === "tools/list") {
    return { jsonrpc: "2.0", id, result: { tools } };
  }
  if (method !== "tools/call") {
    return { jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } };
  }

  const name = typeof params.name === "string" ? params.name : "";
  const args = argumentsOf(params.arguments);
  const tool = tools.find((item) => item.name === name);
  if (!tool) {
    return { jsonrpc: "2.0", id, result: toolResult(`Unknown tool: ${name}`, true) };
  }

  try {
    const result = await dispatch(name, args, call);
    return {
      jsonrpc: "2.0",
      id,
      result: toolResult(result.data, result.status >= 400),
    };
  } catch (error) {
    const text = error instanceof Error ? error.message : "Tool failed";
    return { jsonrpc: "2.0", id, result: toolResult(text, true) };
  }
}

export async function callDemoApi(
  origin: string,
  method: string,
  path: string,
  body?: unknown,
  query?: Record<string, string>,
): Promise<ApiResult> {
  const url = new URL(`/api${path}`, origin);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value) url.searchParams.set(key, value);
  }
  const response = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  return { status: response.status, data };
}

function argumentsOf(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function toolResult(data: unknown, isError: boolean) {
  const text = typeof data === "string" ? data : JSON.stringify(data);
  return { content: [{ type: "text", text }], isError };
}

function requiredId(args: Record<string, unknown>): string {
  const id = typeof args.id === "string" ? args.id.trim() : "";
  if (!id) throw new Error("id is required");
  return id;
}

function pick(args: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const key of keys) {
    if (args[key] !== undefined) body[key] = args[key];
  }
  return body;
}

async function dispatch(name: string, args: Record<string, unknown>, call: ApiCall): Promise<ApiResult> {
  switch (name) {
    case "activity.list":
      return call("GET", "/activity");
    case "billing.list_invoices":
      return call("GET", "/invoices");
    case "billing.get_invoice":
      return call("GET", `/invoices/${encodeURIComponent(requiredId(args))}`);
    case "billing.get_payment":
      return call("GET", `/payments/${encodeURIComponent(requiredId(args))}`);
    case "billing.refund":
      return call("POST", `/payments/${encodeURIComponent(requiredId(args))}/refund`);
    case "billing.create_invoice":
      return call("POST", "/invoices", pick(args, ["customerId", "amount", "status", "reason"]));
    case "billing.update_invoice":
      return call("PATCH", `/invoices/${encodeURIComponent(requiredId(args))}`, pick(args, ["amount", "status", "reason"]));
    case "crm.list_customers":
      return call("GET", "/customers", undefined, {
        q: typeof args.q === "string" ? args.q.trim() : "",
      });
    case "crm.get_customer":
      return call("GET", `/customers/${encodeURIComponent(requiredId(args))}`);
    case "crm.create_customer":
      return call("POST", "/customers", pick(args, ["name", "plan", "subscriptionStatus", "mrr"]));
    case "crm.update_customer":
      return call(
        "PATCH",
        `/customers/${encodeURIComponent(requiredId(args))}`,
        pick(args, ["name", "plan", "subscriptionStatus", "mrr"]),
      );
    case "email.list":
      return call("GET", "/emails");
    case "email.get":
      return call("GET", `/emails/${encodeURIComponent(requiredId(args))}`);
    case "email.send":
      return call("POST", "/emails", pick(args, ["to", "subject", "body", "customerId", "sentBy"]));
    case "email.update":
      return call("PATCH", `/emails/${encodeURIComponent(requiredId(args))}`, pick(args, ["to", "subject", "body"]));
    case "support.list_tickets":
      return call("GET", "/tickets");
    case "support.get_ticket":
      return call("GET", `/tickets/${encodeURIComponent(requiredId(args))}`);
    case "support.create_ticket":
      return call("POST", "/tickets", pick(args, ["customerId", "subject", "status", "createdBy"]));
    case "support.update_ticket":
      return call("PATCH", `/tickets/${encodeURIComponent(requiredId(args))}`, pick(args, ["subject", "status"]));
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
