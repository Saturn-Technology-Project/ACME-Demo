import "dotenv/config";
import cors from "cors";
import express from "express";
import { migrate, pool, waitForDb } from "./db.js";
import { router } from "./routes.js";
import { saturnRouter } from "./saturn.js";
import { seed } from "./seed.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});
app.use(router);
app.use(saturnRouter);

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
);

async function main() {
  await waitForDb();
  await migrate();
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM customers");
  if (rows[0].count === 0) {
    await seed();
    console.log("Seeded ACME demo data");
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`ACME backend http://localhost:${port}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
