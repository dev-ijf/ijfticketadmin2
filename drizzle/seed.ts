import path from "node:path";
import { readFileSync } from "node:fs";
import pg from "pg";
import * as dotenv from "dotenv";
import { paymentChannelsSeed } from "./seeds/payment-channels";
import { paymentInstructionsSeed } from "./seeds/payment-instructions";
import { notificationTemplatesSeed } from "./seeds/notification-templates";
import {
  DEFAULT_SETTINGS,
  SETTING_KEYS,
} from "../types/settings";

dotenv.config({ path: ".env.local" });
dotenv.config();

function getDatabaseUrl(): string {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    "";
  if (!url) throw new Error("DATABASE_URL is not set");
  return url;
}

async function seedCore(client: pg.Client) {
  for (const row of paymentChannelsSeed) {
    await client.query(
      `INSERT INTO payment_channels (
        id, pg_code, pg_name, image_url, is_active, is_redirect, vendor, category, sort_order, image_qris
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (pg_code) DO NOTHING`,
      [
        row.id,
        row.pgCode,
        row.pgName,
        row.imageUrl,
        row.isActive,
        row.isRedirect,
        row.vendor,
        row.category,
        row.sortOrder,
        row.imageQris === "" ? null : row.imageQris,
      ],
    );
  }
  console.log("payment_channels: OK");

  for (const row of paymentInstructionsSeed) {
    await client.query(
      `INSERT INTO payment_instructions (
        id, payment_channel_id, title, description, step_order
      ) VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (id) DO NOTHING`,
      [
        row.id,
        row.paymentChannelId,
        row.title,
        row.description,
        row.stepOrder,
      ],
    );
  }
  console.log("payment_instructions: OK");

  for (const row of notificationTemplatesSeed) {
    await client.query(
      `INSERT INTO notification_templates (
        id, name, channel, trigger_on, subject, body, is_active
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (name) DO NOTHING`,
      [
        row.id,
        row.name,
        row.channel,
        row.triggerOn,
        row.subject,
        row.body,
        row.isActive,
      ],
    );
  }
  console.log("notification_templates: OK");

  const settingsRows: Array<{
    key: string;
    value: string;
    type: string;
    category: string;
    description: string;
  }> = [
    {
      key: SETTING_KEYS.APP_LOGO,
      value: DEFAULT_SETTINGS[SETTING_KEYS.APP_LOGO] ?? "",
      type: "file",
      category: "branding",
      description: "Main application logo",
    },
    {
      key: SETTING_KEYS.APP_FAVICON,
      value: DEFAULT_SETTINGS[SETTING_KEYS.APP_FAVICON] ?? "",
      type: "file",
      category: "branding",
      description: "Application favicon",
    },
    {
      key: SETTING_KEYS.SIDEBAR_PRIMARY_COLOR,
      value: DEFAULT_SETTINGS[SETTING_KEYS.SIDEBAR_PRIMARY_COLOR] ?? "#9333ea",
      type: "color",
      category: "appearance",
      description: "Primary sidebar color",
    },
    {
      key: SETTING_KEYS.SIDEBAR_SECONDARY_COLOR,
      value: DEFAULT_SETTINGS[SETTING_KEYS.SIDEBAR_SECONDARY_COLOR] ?? "#7c3aed",
      type: "color",
      category: "appearance",
      description: "Secondary sidebar color",
    },
    {
      key: SETTING_KEYS.APP_NAME,
      value: DEFAULT_SETTINGS[SETTING_KEYS.APP_NAME] ?? "Admin Panel",
      type: "string",
      category: "general",
      description: "Application name",
    },
    {
      key: SETTING_KEYS.APP_DESCRIPTION,
      value: DEFAULT_SETTINGS[SETTING_KEYS.APP_DESCRIPTION] ?? "",
      type: "string",
      category: "general",
      description: "Application description",
    },
  ];

  for (const s of settingsRows) {
    await client.query(
      `INSERT INTO settings (key, value, type, category, description)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (key) DO NOTHING`,
      [s.key, s.value, s.type, s.category, s.description],
    );
  }
  console.log("settings: OK");
}

async function syncSequences(client: pg.Client) {
  const pairs = [
    ["payment_channels_id_seq", "payment_channels"],
    ["payment_instructions_id_seq", "payment_instructions"],
    ["notification_templates_id_seq", "notification_templates"],
    ["settings_id_seq", "settings"],
    ["events_id_seq", "events"],
    ["ticket_types_id_seq", "ticket_types"],
    ["customers_id_seq", "customers"],
    ["orders_id_seq", "orders"],
    ["order_items_id_seq", "order_items"],
    ["order_item_attendees_id_seq", "order_item_attendees"],
    ["tickets_id_seq", "tickets"],
  ] as const;
  for (const [seq, table] of pairs) {
    await client.query(
      `SELECT setval('${seq}', COALESCE((SELECT MAX(id) FROM ${table}), 1), true)`,
    );
  }
}

/** Data contoh; idempoten lewat ON CONFLICT pada slug event. */
async function seedSample(client: pg.Client) {
  const ev = await client.query(
    `INSERT INTO events (name, slug, description, start_date, end_date, location, image_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (slug) DO NOTHING
     RETURNING id`,
    [
      "Sample Event 2025",
      "sample-event-2025",
      "<p>Ini adalah event sample untuk testing aplikasi.</p>",
      new Date("2025-12-01T10:00:00Z"),
      new Date("2025-12-01T18:00:00Z"),
      "Jakarta Convention Center",
      null,
    ],
  );
  const eventId = ev.rows[0]?.id as number | undefined;
  if (eventId == null) {
    console.log("sample: event sample-event-2025 sudah ada, lewati sample data");
    return;
  }

  const tt = await client.query(
    `INSERT INTO ticket_types (event_id, name, price, quantity_total, quantity_sold, tickets_per_purchase)
     VALUES
       ($1, 'VIP Ticket', 500000, 100, 0, 1),
       ($1, 'Regular Ticket', 250000, 200, 0, 2)
     RETURNING id`,
    [eventId],
  );
  const ticketType1Id = tt.rows[0].id as number;

  const cust = await client.query(
    `INSERT INTO customers (name, email, phone_number)
     VALUES
       ('John Doe', 'john.doe@example.com', '081234567890'),
       ('Jane Smith', 'jane.smith@example.com', '081234567891')
     ON CONFLICT (email) DO NOTHING
     RETURNING id, email`,
  );
  let customer1Id: number;
  let customer2Id: number;
  if (cust.rows.length < 2) {
    const r1 = await client.query(
      `SELECT id FROM customers WHERE email = 'john.doe@example.com'`,
    );
    const r2 = await client.query(
      `SELECT id FROM customers WHERE email = 'jane.smith@example.com'`,
    );
    customer1Id = r1.rows[0].id as number;
    customer2Id = r2.rows[0].id as number;
  } else {
    customer1Id = cust.rows[0].id as number;
    customer2Id = cust.rows[1].id as number;
  }

  const orderRef1 = `TKT${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const o1 = await client.query(
    `INSERT INTO orders (
      order_reference, customer_id, event_id, payment_channel_id,
      gross_amount, discount_amount, final_amount, status, paid_at,
      is_email_checkout, is_wa_checkout, is_email_paid, is_wa_paid
    ) VALUES ($1,$2,$3,17,500000,0,500000,'paid',NOW(),false,false,false,false)
    RETURNING id`,
    [orderRef1, customer1Id, eventId],
  );
  const order1Id = o1.rows[0].id as number;

  const oi1 = await client.query(
    `INSERT INTO order_items (order_id, ticket_type_id, quantity, price_per_ticket, effective_ticket_count)
     VALUES ($1,$2,1,500000,1)
     RETURNING id`,
    [order1Id, ticketType1Id],
  );

  await client.query(
    `INSERT INTO order_item_attendees (order_item_id, attendee_name, attendee_email, attendee_phone_number, custom_answers, ticket_id, barcode_id)
     VALUES ($1,'John Doe','john.doe@example.com','081234567890',NULL,NULL,NULL)`,
    [oi1.rows[0].id],
  );

  const orderRef2 = `TKT${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const o2 = await client.query(
    `INSERT INTO orders (
      order_reference, customer_id, event_id, payment_channel_id,
      gross_amount, discount_amount, final_amount, status,
      virtual_account_number, payment_response_url,
      is_email_checkout, is_wa_checkout, is_email_paid, is_wa_paid
    ) VALUES ($1,$2,$3,3,500000,0,500000,'pending','8830835802102130',$4,true,false,false,false)
    RETURNING id`,
    [
      orderRef2,
      customer2Id,
      eventId,
      "https://web.faspay.co.id/pws/100003/2830000010100000/example",
    ],
  );
  const order2Id = o2.rows[0].id as number;

  const oi2 = await client.query(
    `INSERT INTO order_items (order_id, ticket_type_id, quantity, price_per_ticket, effective_ticket_count)
     VALUES ($1,$2,1,500000,1)
     RETURNING id`,
    [order2Id, ticketType1Id],
  );

  await client.query(
    `INSERT INTO order_item_attendees (order_item_id, attendee_name, attendee_email, attendee_phone_number, custom_answers, ticket_id, barcode_id)
     VALUES ($1,'Jane Smith','jane.smith@example.com','081234567891',NULL,NULL,NULL)`,
    [oi2.rows[0].id],
  );

  await client.query(
    `INSERT INTO tickets (order_id, ticket_type_id, ticket_code, attendee_name, attendee_email, attendee_phone_number, is_checked_in, checked_in_at)
     VALUES ($1,$2,'ABC12345','John Doe','john.doe@example.com','081234567890',false,NULL)
     ON CONFLICT (ticket_code) DO NOTHING`,
    [order1Id, ticketType1Id],
  );

  console.log("sample data: OK");
}

async function runRefSeedSql(client: pg.Client) {
  const p = path.join(process.cwd(), "refs", "seed.sql");
  const sql = readFileSync(p, "utf8");
  await client.query(sql);
  console.log("refs/seed.sql: OK");
}

async function main() {
  const url = getDatabaseUrl();
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  console.log("Seeding…");

  try {
    await client.query("BEGIN");
    await seedCore(client);

    if (process.env.SEED_SAMPLE_DATA === "1") {
      await seedSample(client);
    }

    if (process.env.SEED_IMPORT_REF_SQL === "1") {
      await runRefSeedSql(client);
    }

    await syncSequences(client);
    await client.query("COMMIT");
    console.log("Selesai (idempoten, aman diulang).");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

void main();
