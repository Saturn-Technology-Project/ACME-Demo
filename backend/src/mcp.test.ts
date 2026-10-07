import assert from "node:assert/strict";
import test from "node:test";
import { handleMcp, tools, type ApiCall } from "./mcp.js";

const names = [
  "activity.list",
  "billing.create_invoice",
  "billing.get_invoice",
  "billing.get_payment",
  "billing.list_invoices",
  "billing.refund",
  "billing.update_invoice",
  "crm.create_customer",
  "crm.get_customer",
  "crm.list_customers",
  "crm.update_customer",
  "email.get",
  "email.list",
  "email.send",
  "email.update",
  "support.create_ticket",
  "support.get_ticket",
  "support.list_tickets",
  "support.update_ticket",
];

test("tools/list exposes the ACME tools", async () => {
  const response = await handleMcp({ jsonrpc: "2.0", id: 1, method: "tools/list" }, unused);
  const result = response.result as { tools: { name: string }[] };
  assert.deepEqual(result.tools.map((tool) => tool.name), names);
  assert.equal(tools.length, names.length);
});

test("crm.list_customers calls the customers API", async () => {
  const seen: { method: string; path: string; query?: Record<string, string> }[] = [];
  const call: ApiCall = async (method, path, _body, query) => {
    seen.push({ method, path, query });
    return { status: 200, data: [{ id: "cus_001", name: "Northwind" }] };
  };
  const response = await handleMcp(
    {
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: { name: "crm.list_customers", arguments: { q: "north" } },
    },
    call,
  );
  assert.equal(response.id, 7);
  assert.deepEqual(seen, [{ method: "GET", path: "/customers", query: { q: "north" } }]);
  const result = response.result as { isError: boolean; content: { text: string }[] };
  assert.equal(result.isError, false);
  assert.match(result.content[0].text, /Northwind/);
});

test("a missing customer comes back as a tool error", async () => {
  const call: ApiCall = async () => ({ status: 404, data: { error: "Customer not found" } });
  const response = await handleMcp(
    {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: "crm.get_customer", arguments: { id: "cus_missing" } },
    },
    call,
  );
  const result = response.result as { isError: boolean };
  assert.equal(result.isError, true);
  assert.equal(response.error, undefined);
});

async function unused(): Promise<{ status: number; data: unknown }> {
  throw new Error("API should not be called");
}
