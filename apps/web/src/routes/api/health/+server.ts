import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "@xat/db";
import { sql } from "drizzle-orm";

export const GET: RequestHandler = async () => {
  const checks: Record<string, { status: string; latency?: number }> = {};

  // Database check
  const dbStart = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    checks.database = { status: "ok", latency: Date.now() - dbStart };
  } catch {
    checks.database = { status: "error", latency: Date.now() - dbStart };
  }

  const allOk = Object.values(checks).every((c) => c.status === "ok");

  return json(
    {
      status: allOk ? "ok" : "degraded",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
    },
    { status: allOk ? 200 : 503 },
  );
};
