/**
 * Menyinkronkan refs/*.sql → drizzle/migrations/*.sql + meta/_journal.json
 * Jalankan dari root proyek: node drizzle/generate-migrations-from-refs.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const refs = path.join(root, "refs");
const outDir = path.join(root, "drizzle", "migrations");

let schema = fs.readFileSync(path.join(refs, "event_kreativa.sql"), "utf8");
schema = schema.replace(/;\r?\n/g, ";\n--> statement-breakpoint\n");
fs.mkdirSync(path.join(outDir, "meta"), { recursive: true });
fs.writeFileSync(path.join(outDir, "0000_schema.sql"), schema.trimEnd() + "\n");

let funcs = fs.readFileSync(path.join(refs, "function_event.sql"), "utf8").trim();
const funcParts = funcs.split(/\n\n(?=CREATE OR REPLACE)/);
const funcSql = funcParts.map((p) => p.trim()).join("\n\n--> statement-breakpoint\n\n");
fs.writeFileSync(path.join(outDir, "0001_functions.sql"), funcSql + "\n");

let trig = fs.readFileSync(path.join(refs, "triggers.sql"), "utf8");
trig = trig.replace(/;\r?\n/g, ";\n--> statement-breakpoint\n");
fs.writeFileSync(path.join(outDir, "0002_triggers.sql"), trig.trimEnd() + "\n");

const journal = {
  version: "7",
  dialect: "postgresql",
  entries: [
    { idx: 0, version: "7", when: 1743600000000, tag: "0000_schema", breakpoints: true },
    { idx: 1, version: "7", when: 1743600001000, tag: "0001_functions", breakpoints: true },
    { idx: 2, version: "7", when: 1743600002000, tag: "0002_triggers", breakpoints: true },
  ],
};
fs.writeFileSync(
  path.join(outDir, "meta", "_journal.json"),
  JSON.stringify(journal, null, 2) + "\n",
);
console.log("OK:", outDir);
