import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.NEON_DATABASE_URL ||
  "";

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const sqlClient = neon(databaseUrl);
// @ts-ignore - NeonQueryFunction is compatible with drizzle
const db = drizzle(sqlClient);

// Create sequences first (before tables)
export async function createSequences() {
  const sequences = [
    sql`CREATE SEQUENCE IF NOT EXISTS orders_id_seq`,
    sql`CREATE SEQUENCE IF NOT EXISTS events_id_seq`,
    sql`CREATE SEQUENCE IF NOT EXISTS payment_channels_id_seq`,
    sql`CREATE SEQUENCE IF NOT EXISTS notification_templates_id_seq`,
    sql`CREATE SEQUENCE IF NOT EXISTS ticket_types_id_seq`,
    sql`CREATE SEQUENCE IF NOT EXISTS orders_temp_id_seq`,
    sql`CREATE SEQUENCE IF NOT EXISTS discounts_id_seq`,
    sql`CREATE SEQUENCE IF NOT EXISTS customers_id_seq`,
    sql`CREATE SEQUENCE IF NOT EXISTS payment_instructions_id_seq`,
    sql`CREATE SEQUENCE IF NOT EXISTS payment_logs_id_seq`,
    sql`CREATE SEQUENCE IF NOT EXISTS notification_logs_id_seq`,
    sql`CREATE SEQUENCE IF NOT EXISTS order_items_id_seq`,
    sql`CREATE SEQUENCE IF NOT EXISTS order_item_attendees_id_seq`,
    sql`CREATE SEQUENCE IF NOT EXISTS settings_id_seq`,
    sql`CREATE SEQUENCE IF NOT EXISTS tickets_id_seq`,
    sql`CREATE SEQUENCE IF NOT EXISTS users_id_seq`,
    sql`CREATE SEQUENCE IF NOT EXISTS event_custom_field_options_id_seq`,
    sql`CREATE SEQUENCE IF NOT EXISTS ticket_custom_field_answers_id_seq`,
    sql`CREATE SEQUENCE IF NOT EXISTS event_custom_fields_id_seq`,
  ];

  for (const seq of sequences) {
    await db.execute(seq);
  }
}
