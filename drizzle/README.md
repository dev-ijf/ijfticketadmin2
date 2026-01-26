# Drizzle ORM Setup

## Setup Database

1. Install dependencies:
```bash
pnpm install
```

2. Generate migration files:
```bash
pnpm run db:generate
```

3. Run migrations (creates tables, sequences, functions, views, triggers):
```bash
pnpm run db:migrate
```

4. Seed database (payment_channels, payment_instructions, notification_templates, and sample data):
```bash
pnpm run db:seed
```

## Scripts

- `pnpm run db:generate` - Generate migration files from schema
- `pnpm run db:migrate` - Run migrations to create database structure
- `pnpm run db:seed` - Seed database with initial data
- `pnpm run db:studio` - Open Drizzle Studio (database GUI)

## Structure

- `drizzle/schema/index.ts` - All table schemas
- `drizzle/migrations/` - Generated migration files
- `drizzle/seeds/` - Seed files for initial data
- `drizzle/functions.ts` - PostgreSQL functions and triggers
- `drizzle/sequences.ts` - Database sequences
- `drizzle/db.ts` - Database connection instance

## Notes

- Migrations include: sequences, tables, indexes, foreign keys, functions, views, and triggers
- Seeds include: payment_channels (18 records), payment_instructions (25 records), notification_templates (5 records), and sample data (events, customers, orders, tickets)
- All functions and triggers from `function_kreativa.sql` are included in migrations
