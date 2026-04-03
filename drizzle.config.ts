import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

export default defineConfig({
  schema: "./drizzle/schema/index.ts",
  // Jangan timpa migrasi SQL yang di-commit; generate ke folder terpisah jika perlu.
  out: "./drizzle/migrations-kit-output",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.NEON_DATABASE_URL ||
      "",
  },
  verbose: true,
  strict: true,
});
