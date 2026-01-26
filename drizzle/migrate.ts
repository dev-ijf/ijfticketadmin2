import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import * as dotenv from "dotenv";
import { createSequences } from "./sequences";
import { createFunctions, createViews, createTriggers } from "./functions";

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

const sql = neon(databaseUrl);
const db = drizzle(sql);

async function main() {
  console.log("🔄 Running migrations...");
  try {
    // Create sequences first
    console.log("📦 Creating sequences...");
    await createSequences();
    
    // Run Drizzle migrations
    console.log("📦 Running Drizzle migrations...");
    await migrate(db, { migrationsFolder: "./drizzle/migrations" });
    
    // Create functions, views, and triggers
    console.log("📦 Creating functions, views, and triggers...");
    await createFunctions();
    await createViews();
    await createTriggers();
    
    console.log("✅ Migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

main();
