import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const dbPath =
  process.env.SQLITE_PATH ?? join(process.cwd(), "data", "acme.sqlite");

mkdirSync(dirname(dbPath), { recursive: true });

export const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

export function all<T>(sql: string, params: unknown[] = []): T[] {
  return db.prepare(sql).all(...params) as T[];
}

export function get<T>(sql: string, params: unknown[] = []): T | undefined {
  return db.prepare(sql).get(...params) as T | undefined;
}

export function run(sql: string, params: unknown[] = []) {
  return db.prepare(sql).run(...params);
}

export function transaction<T>(fn: () => T): T {
  db.exec("BEGIN");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function migrate() {
  const sql = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "schema.sql"),
    "utf8"
  );
  db.exec(sql);
}

export function now() {
  return new Date().toISOString();
}

export function iso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

export function close() {
  db.close();
}

export function nextId(name: string, prefix: string, pad = 0): string {
  run("INSERT OR IGNORE INTO id_counters (name, value) VALUES (?, 0)", [name]);
  const row = get<{ value: number }>(
    "UPDATE id_counters SET value = value + 1 WHERE name = ? RETURNING value",
    [name]
  );
  const value = String(row?.value ?? 1);
  return `${prefix}${pad > 0 ? value.padStart(pad, "0") : value}`;
}

export function setCounter(name: string, value: number) {
  run(
    `
    INSERT INTO id_counters (name, value) VALUES (?, ?)
    ON CONFLICT(name) DO UPDATE SET value = excluded.value
    `,
    [name, value]
  );
}
