import { Router } from "express";
import { get, now, run } from "./db.js";

export const saturnRouter = Router();

function env(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

function defaults() {
  return {
    runtimeId: env("SATURN_RUNTIME_ID", "runtime-001"),
    agentId: env("SATURN_AGENT_ID", "agent_customer_ops"),
    cloudWs: env("SATURN_CLOUD_WS", ""),
    dashboardUrl: env("SATURN_DASHBOARD_URL", "https://app.saturn.ai"),
  };
}

export function dashboardEnrollUrl(
  dashboardUrl: string,
  runtimeId: string,
  agentId: string
): string {
  try {
    const url = new URL(dashboardUrl);
    if (url.pathname === "/" || url.pathname === "") {
      url.pathname = "/agents/enroll";
    }
    url.searchParams.set("runtime_id", runtimeId);
    url.searchParams.set("agent_id", agentId);
    return url.toString();
  } catch {
    const base = dashboardUrl.replace(/\/$/, "");
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}runtime_id=${encodeURIComponent(runtimeId)}&agent_id=${encodeURIComponent(agentId)}`;
  }
}

function tokenTail(token: string): string {
  const tail = token.slice(-4);
  return `••••${tail}`;
}

function asTrimmed(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

type EnrollmentRow = {
  runtime_id: string;
  agent_id: string;
  token: string;
  cloud_ws: string;
  runtime_connected: number;
  enrolled_at: string;
  updated_at: string;
};

function toPublic(row: EnrollmentRow) {
  const base = defaults();
  return {
    enrolled: true,
    runtimeId: row.runtime_id,
    agentId: row.agent_id,
    tokenTail: tokenTail(row.token),
    cloudWsConfigured: Boolean(row.cloud_ws),
    runtimeConnected: Boolean(row.runtime_connected),
    dashboardUrl: base.dashboardUrl,
    enrollUrl: dashboardEnrollUrl(base.dashboardUrl, row.runtime_id, row.agent_id),
    enrolledAt: row.enrolled_at,
    updatedAt: row.updated_at,
  };
}

function emptyPublic() {
  const base = defaults();
  return {
    enrolled: false,
    runtimeId: base.runtimeId,
    agentId: base.agentId,
    tokenTail: null,
    cloudWsConfigured: Boolean(base.cloudWs),
    runtimeConnected: false,
    dashboardUrl: base.dashboardUrl,
    enrollUrl: dashboardEnrollUrl(base.dashboardUrl, base.runtimeId, base.agentId),
    enrolledAt: null,
    updatedAt: null,
  };
}

function findEnrollment(runtimeId: string) {
  return get<EnrollmentRow>(
    "SELECT * FROM saturn_enrollments WHERE runtime_id = ?",
    [runtimeId]
  );
}

function upsertEnrollment(input: {
  runtimeId: string;
  agentId: string;
  token: string;
  cloudWs: string;
}) {
  const at = now();
  run(
    `
    INSERT INTO saturn_enrollments (
      runtime_id, agent_id, token, cloud_ws, runtime_connected, enrolled_at, updated_at
    )
    VALUES (?, ?, ?, ?, 0, ?, ?)
    ON CONFLICT(runtime_id) DO UPDATE SET
      agent_id = excluded.agent_id,
      token = excluded.token,
      cloud_ws = excluded.cloud_ws,
      runtime_connected = 0,
      updated_at = excluded.updated_at
    `,
    [input.runtimeId, input.agentId, input.token, input.cloudWs, at, at]
  );
  return findEnrollment(input.runtimeId)!;
}

saturnRouter.get("/saturn/enrollment", (req, res) => {
  const runtimeId = asTrimmed(req.query.runtime_id) ?? defaults().runtimeId;
  const row = findEnrollment(runtimeId);
  res.json(row ? toPublic(row) : emptyPublic());
});

saturnRouter.put("/saturn/enrollment", (req, res) => {
  const base = defaults();
  const token = asTrimmed(req.body?.token);
  if (!token) {
    res.status(400).json({ error: "token is required" });
    return;
  }
  const row = upsertEnrollment({
    runtimeId: asTrimmed(req.body?.runtimeId) ?? base.runtimeId,
    agentId: asTrimmed(req.body?.agentId) ?? base.agentId,
    token,
    cloudWs: asTrimmed(req.body?.cloudWs) ?? base.cloudWs,
  });
  res.json(toPublic(row));
});

saturnRouter.delete("/saturn/enrollment", (req, res) => {
  const runtimeId =
    asTrimmed(req.body?.runtimeId) ??
    asTrimmed(req.query.runtime_id) ??
    defaults().runtimeId;
  run("DELETE FROM saturn_enrollments WHERE runtime_id = ?", [runtimeId]);
  res.json(emptyPublic());
});

saturnRouter.get("/internal/saturn/credentials", (req, res) => {
  const runtimeId = asTrimmed(req.query.runtime_id) ?? defaults().runtimeId;
  const row = findEnrollment(runtimeId);
  if (!row) {
    res.status(404).json({ error: "Not enrolled" });
    return;
  }
  res.json({
    runtimeId: row.runtime_id,
    agentId: row.agent_id,
    token: row.token,
    cloudWs: row.cloud_ws,
  });
});

saturnRouter.put("/internal/saturn/credentials", (req, res) => {
  const base = defaults();
  const token = asTrimmed(req.body?.token);
  if (!token) {
    res.status(400).json({ error: "token is required" });
    return;
  }
  const row = upsertEnrollment({
    runtimeId: asTrimmed(req.body?.runtimeId) ?? base.runtimeId,
    agentId: asTrimmed(req.body?.agentId) ?? base.agentId,
    token,
    cloudWs: asTrimmed(req.body?.cloudWs) ?? base.cloudWs,
  });
  res.json({
    runtimeId: row.runtime_id,
    agentId: row.agent_id,
    token: row.token,
    cloudWs: row.cloud_ws,
  });
});

saturnRouter.post("/internal/saturn/heartbeat", (req, res) => {
  const runtimeId = asTrimmed(req.body?.runtimeId) ?? defaults().runtimeId;
  const connected = Boolean(req.body?.connected);
  const result = run(
    `
    UPDATE saturn_enrollments
    SET runtime_connected = ?, updated_at = ?
    WHERE runtime_id = ?
    `,
    [connected ? 1 : 0, now(), runtimeId]
  );
  res.json({ ok: true, updated: result.changes > 0 });
});
