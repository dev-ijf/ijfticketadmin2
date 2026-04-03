import { pgTable, serial, text } from "drizzle-orm/pg-core";

/**
 * Stub semata untuk drizzle-kit (opsional). Aplikasi tidak memakai ORM Drizzle.
 * Skema nyata berasal dari refs/*.sql → drizzle/migrations (jalankan npm run migrate).
 * Jangan menjalankan drizzle-kit push ke DB produksi kecuali Anda sengaja ingin tabel ini.
 */
export const drizzleSchemaStub = pgTable("drizzle_schema_stub", {
  id: serial("id").primaryKey(),
  note: text("note"),
});
