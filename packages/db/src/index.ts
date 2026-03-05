import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

const connectionString =
  process.env.DATABASE_URL || "postgresql://xat:xat@localhost:5432/xat";

const client = postgres(connectionString);

export const db = drizzle(client, { schema });

export type Database = typeof db;

export * from "./schema/index";
