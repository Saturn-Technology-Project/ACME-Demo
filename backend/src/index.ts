import "dotenv/config";
import { existsSync } from "node:fs";
import { join } from "node:path";
import cors from "cors";
import express from "express";
import { get, migrate } from "./db.js";
import { callDemoApi, handleMcp } from "./mcp.js";
import { router } from "./routes.js";
import { saturnRouter } from "./saturn.js";
import { seed } from "./seed.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const apiOrigin = `http://127.0.0.1:${port}`;
const publicDir = process.env.PUBLIC_DIR ?? join(process.cwd(), "public");

app.use(cors());
app.use(express.json());
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});
app.post("/mcp", async (req, res, next) => {
  try {
    res.json(await handleMcp(req.body, (method, path, body, query) => callDemoApi(apiOrigin, method, path, body, query)));
  } catch (error) {
    next(error);
  }
});
app.use("/api", router);
app.use("/api", saturnRouter);
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (res.headersSent) {
      next(error);
      return;
    }
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
);

if (existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }
    const index = join(publicDir, req.path.replace(/\/$/, ""), "index.html");
    if (existsSync(index)) {
      res.sendFile(index);
      return;
    }
    const fallback = join(publicDir, "index.html");
    if (existsSync(fallback)) {
      res.sendFile(fallback);
      return;
    }
    next();
  });
}

function main() {
  migrate();
  const row = get<{ count: number }>("SELECT COUNT(*) AS count FROM customers");
  if (!row || row.count === 0) {
    seed();
    console.log("Seeded ACME demo data");
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(
      `ACME demo http://localhost:${port}${existsSync(publicDir) ? " (ui + api)" : " (api)"}`
    );
  });
}

main();
