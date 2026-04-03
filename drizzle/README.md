# Migrasi & seed (Drizzle sebagai alat saja)

Aplikasi Next.js tetap memakai Neon + SQL template di `lib/database.ts`. Folder ini hanya untuk **CLI**: `npm run migrate` dan `npm run seed`.

## Urutan untuk database baru

1. Siapkan `.env` / `.env.local` dengan salah satu variabel: `DATABASE_URL`, `POSTGRES_URL`, atau `NEON_DATABASE_URL`.
2. `npm run migrate` — menjalankan file SQL di `drizzle/migrations/` lewat migrator Drizzle (tabel `drizzle.__drizzle_migrations`).
3. `npm run seed` — mengisi data awal (payment channels, instruksi bayar, template notifikasi, settings). Idempoten (`ON CONFLICT DO NOTHING`).

## Sumber kebenaran SQL (fork / lembaga lain)

- [`refs/event_kreativa.sql`](../refs/event_kreativa.sql) — DDL + indeks + FK  
- [`refs/function_event.sql`](../refs/function_event.sql) — fungsi & view  
- [`refs/triggers.sql`](../refs/triggers.sql) — trigger (setelah fungsi ada)  
- [`refs/seed.sql`](../refs/seed.sql) — dump referensi (biasanya **bukan** untuk dijalankan utuh di produksi; berisi data riil)

Setelah mengubah file di `refs/`, regenerasi migrasi Drizzle:

```bash
npm run migrations:build
```

Lalu commit `drizzle/migrations/` dan `meta/_journal.json`.

## Variabel opsional seed

| Variabel | Efek |
|----------|------|
| `SEED_SAMPLE_DATA=1` | Menambah event contoh `sample-event-2025`, tiket, customer, order (idempoten sejauh mungkin). |
| `SEED_IMPORT_REF_SQL=1` | Menjalankan seluruh `refs/seed.sql` (berisiko duplikat / data sensitif; hanya jika Anda tahu isinya). |

## drizzle-kit

`drizzle/schema/index.ts` hanya **stub** agar `drizzle-kit` tidak membutuhkan skema ORM penuh. **Jangan** `drizzle-kit push` ke produksi kecuali Anda sengaja ingin tabel stub. Output generate default mengarah ke `drizzle/migrations-kit-output` agar tidak menimpa migrasi SQL yang di-commit.

## Catatan PostgreSQL

`refs/triggers.sql` memakai `EXECUTE FUNCTION` (PostgreSQL 14+). Untuk versi lebih lama, ganti ke `EXECUTE PROCEDURE` jika diperlukan.
