import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Get database URL
const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.NEON_DATABASE_URL ||
  "";

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

// Create Neon client
const sqlClient = neon(databaseUrl);
// @ts-ignore - NeonQueryFunction is compatible with drizzle
export const db = drizzle(sqlClient, { schema });

// Export all schema
export * from "./schema";
