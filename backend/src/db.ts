import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://acme:acme@localhost:5432/acme";

export const pool = new pg.Pool({ connectionString });

export async function waitForDb(attempts = 30) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      await pool.query("SELECT 1");
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error("PostgreSQL is not ready");
}

export async function migrate() {
  const sql = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "schema.sql"),
    "utf8"
  );
  await pool.query(sql);
}

export function iso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}
