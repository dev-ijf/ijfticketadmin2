-- -------------------------------------------------------------
-- TablePlus 6.8.6(662)
--
-- https://tableplus.com/
--
-- Database: neondb
-- Generation Time: 2026-04-03 16:04:01.3540
-- -------------------------------------------------------------


DROP TABLE IF EXISTS "public"."orders";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS orders_id_seq;

-- Table Definition
CREATE TABLE "public"."orders" (
    "id" int8 NOT NULL DEFAULT nextval('orders_id_seq'::regclass),
    "order_reference" text NOT NULL,
    "virtual_account_number" text,
    "payment_response_url" text,
    "customer_id" int8 NOT NULL,
    "event_id" int8 NOT NULL,
    "payment_channel_id" int8,
    "discount_id" int8,
    "order_date" timestamptz DEFAULT now(),
    "gross_amount" numeric(12,2) NOT NULL,
    "discount_amount" numeric(12,2) DEFAULT 0,
    "final_amount" numeric(12,2) NOT NULL,
    "status" text NOT NULL CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'cancelled'::text, 'expired'::text])),
    "paid_at" timestamptz,
    "is_email_checkout" bool NOT NULL DEFAULT false,
    "is_wa_checkout" bool NOT NULL DEFAULT false,
    "is_email_paid" bool NOT NULL DEFAULT false,
    "is_wa_paid" bool NOT NULL DEFAULT false,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "unique_code" int4,
    "proof_transfer" text,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."events";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS events_id_seq;

-- Table Definition
CREATE TABLE "public"."events" (
    "id" int8 NOT NULL DEFAULT nextval('events_id_seq'::regclass),
    "name" text NOT NULL,
    "start_date" timestamptz,
    "end_date" timestamptz,
    "location" text,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "slug" text NOT NULL,
    "image_url" text,
    "description" text,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."payment_channels";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS payment_channels_id_seq;

-- Table Definition
CREATE TABLE "public"."payment_channels" (
    "pg_code" text NOT NULL,
    "pg_name" text NOT NULL,
    "image_url" text,
    "is_active" bool NOT NULL DEFAULT true,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "is_redirect" bool NOT NULL DEFAULT false,
    "vendor" varchar,
    "category" varchar,
    "id" int8 NOT NULL DEFAULT nextval('payment_channels_id_seq'::regclass),
    "sort_order" int4 NOT NULL DEFAULT 99,
    "image_qris" text,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."notification_templates";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS notification_templates_id_seq;

-- Table Definition
CREATE TABLE "public"."notification_templates" (
    "id" int8 NOT NULL DEFAULT nextval('notification_templates_id_seq'::regclass),
    "name" text NOT NULL,
    "channel" text NOT NULL CHECK (channel = ANY (ARRAY['email'::text, 'whatsapp'::text])),
    "trigger_on" text NOT NULL CHECK (trigger_on = ANY (ARRAY['checkout'::text, 'paid'::text, 'reminder'::text])),
    "subject" text,
    "body" text NOT NULL,
    "is_active" bool NOT NULL DEFAULT true,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

-- Column Comment
COMMENT ON COLUMN "public"."notification_templates"."name" IS 'Nama unik untuk identifikasi template di sisi admin.';
COMMENT ON COLUMN "public"."notification_templates"."body" IS 'Isi template. Gunakan placeholders seperti {{customer_name}}, {{order_reference}}, dll.';

DROP TABLE IF EXISTS "public"."discount_ticket_types";
-- Table Definition
CREATE TABLE "public"."discount_ticket_types" (
    "discount_id" int8 NOT NULL,
    "ticket_type_id" int8 NOT NULL,
    "created_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("discount_id","ticket_type_id")
);

DROP TABLE IF EXISTS "public"."ticket_types";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS ticket_types_id_seq;

-- Table Definition
CREATE TABLE "public"."ticket_types" (
    "id" int8 NOT NULL DEFAULT nextval('ticket_types_id_seq'::regclass),
    "event_id" int8 NOT NULL,
    "name" text NOT NULL,
    "price" numeric(12,2) NOT NULL,
    "quantity_total" int4 NOT NULL DEFAULT 0,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "quantity_sold" int4 NOT NULL DEFAULT 0,
    "tickets_per_purchase" int4 NOT NULL DEFAULT 1,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."orders_temp";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS orders_temp_id_seq;

-- Table Definition
CREATE TABLE "public"."orders_temp" (
    "id" int8 NOT NULL DEFAULT nextval('orders_temp_id_seq'::regclass),
    "upload_session_id" uuid NOT NULL,
    "row_number" int4,
    "customer_name" text,
    "customer_email" text,
    "customer_phone_number" text,
    "event_id" int8,
    "ticket_type_id" int8,
    "quantity" int4 DEFAULT 1,
    "final_amount" numeric(12,2),
    "order_date" timestamptz,
    "payment_channel_id" int8,
    "import_status" text DEFAULT 'pending'::text CHECK (import_status = ANY (ARRAY['pending'::text, 'success'::text, 'error'::text])),
    "error_message" text,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "barcode_id" text,
    "custom_answers" jsonb,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."discounts";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS discounts_id_seq;

-- Table Definition
CREATE TABLE "public"."discounts" (
    "id" int8 NOT NULL DEFAULT nextval('discounts_id_seq'::regclass),
    "code" text NOT NULL,
    "description" text,
    "discount_type" text NOT NULL CHECK (discount_type = ANY (ARRAY['percentage'::text, 'fixed_amount'::text])),
    "value" numeric(12,2) NOT NULL,
    "valid_until" timestamptz,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "minimum_amount" numeric(10,2),
    "max_discount_amount" numeric(10,2),
    "usage_limit" int4,
    "usage_count" int4 DEFAULT 0,
    "is_active" bool DEFAULT true,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."customers";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS customers_id_seq;

-- Table Definition
CREATE TABLE "public"."customers" (
    "id" int8 NOT NULL DEFAULT nextval('customers_id_seq'::regclass),
    "name" text NOT NULL,
    "email" text NOT NULL,
    "phone_number" text,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."payment_instructions";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS payment_instructions_id_seq;

-- Table Definition
CREATE TABLE "public"."payment_instructions" (
    "id" int8 NOT NULL DEFAULT nextval('payment_instructions_id_seq'::regclass),
    "title" text NOT NULL,
    "description" text NOT NULL,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "step_order" int8,
    "payment_channel_id" int8,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."payment_logs";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS payment_logs_id_seq;

-- Table Definition
CREATE TABLE "public"."payment_logs" (
    "id" int8 NOT NULL DEFAULT nextval('payment_logs_id_seq'::regclass),
    "order_reference" text,
    "virtual_account_number" text,
    "log_type" text NOT NULL CHECK (log_type = ANY (ARRAY['checkout'::text, 'callback'::text, 'status_check'::text, 'error'::text, 'invalid_signature'::text, 'order_not_found_or_va_mismatch'::text])),
    "request_payload" jsonb,
    "response_payload" jsonb,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "payment_response_url" text,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."notification_logs";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS notification_logs_id_seq;

-- Table Definition
CREATE TABLE "public"."notification_logs" (
    "id" int8 NOT NULL DEFAULT nextval('notification_logs_id_seq'::regclass),
    "order_reference" text,
    "channel" text NOT NULL CHECK (channel = ANY (ARRAY['email'::text, 'whatsapp'::text])),
    "trigger_on" text NOT NULL CHECK (trigger_on = ANY (ARRAY['checkout'::text, 'paid'::text, 'reminder'::text])),
    "recipient_email" text,
    "recipient_phone" text,
    "request_payload" jsonb,
    "response_payload" jsonb,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "body" text,
    PRIMARY KEY ("id")
);

-- Column Comment
COMMENT ON COLUMN "public"."notification_logs"."channel" IS 'Channel yang digunakan: email atau whatsapp.';
COMMENT ON COLUMN "public"."notification_logs"."trigger_on" IS 'Kondisi pengiriman notifikasi: saat checkout atau setelah pembayaran (paid).';
COMMENT ON COLUMN "public"."notification_logs"."recipient_email" IS 'Alamat email tujuan pengiriman.';
COMMENT ON COLUMN "public"."notification_logs"."recipient_phone" IS 'Nomor WhatsApp tujuan pengiriman.';
COMMENT ON COLUMN "public"."notification_logs"."request_payload" IS 'Data JSON yang dikirim ke service provider (misal: Mailgun, Twilio).';
COMMENT ON COLUMN "public"."notification_logs"."response_payload" IS 'Data JSON respon yang diterima dari service provider.';

DROP TABLE IF EXISTS "public"."order_items";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS order_items_id_seq;

-- Table Definition
CREATE TABLE "public"."order_items" (
    "id" int8 NOT NULL DEFAULT nextval('order_items_id_seq'::regclass),
    "order_id" int8 NOT NULL,
    "ticket_type_id" int8 NOT NULL,
    "quantity" int4 NOT NULL CHECK (quantity > 0),
    "price_per_ticket" numeric(12,2) NOT NULL,
    "created_at" timestamptz DEFAULT now(),
    "effective_ticket_count" int4,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."order_item_attendees";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS order_item_attendees_id_seq;

-- Table Definition
CREATE TABLE "public"."order_item_attendees" (
    "id" int8 NOT NULL DEFAULT nextval('order_item_attendees_id_seq'::regclass),
    "order_item_id" int8 NOT NULL,
    "attendee_name" text NOT NULL,
    "attendee_email" text NOT NULL,
    "attendee_phone_number" text NOT NULL,
    "custom_answers" jsonb,
    "ticket_id" int8,
    "created_at" timestamptz DEFAULT now(),
    "barcode_id" text,
    PRIMARY KEY ("id")
);

-- Column Comment
COMMENT ON COLUMN "public"."order_item_attendees"."custom_answers" IS 'Menyimpan jawaban field kustom sementara. Format: {"custom_field_id": "answer", ...}';
COMMENT ON COLUMN "public"."order_item_attendees"."ticket_id" IS 'Relasi ke tiket final yang dibuat setelah pesanan dibayar.';
COMMENT ON COLUMN "public"."order_item_attendees"."barcode_id" IS 'Menyimpan barcode_id dari file upload untuk digunakan sebagai ticket_code.';

DROP TABLE IF EXISTS "public"."settings";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS settings_id_seq;

-- Table Definition
CREATE TABLE "public"."settings" (
    "id" int4 NOT NULL DEFAULT nextval('settings_id_seq'::regclass),
    "key" varchar(255) NOT NULL,
    "value" text,
    "type" varchar(50) NOT NULL DEFAULT 'string'::character varying,
    "category" varchar(100) NOT NULL DEFAULT 'general'::character varying,
    "description" text,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."tickets";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS tickets_id_seq;

-- Table Definition
CREATE TABLE "public"."tickets" (
    "id" int8 NOT NULL DEFAULT nextval('tickets_id_seq'::regclass),
    "order_id" int8 NOT NULL,
    "ticket_type_id" int8 NOT NULL,
    "ticket_code" text NOT NULL DEFAULT generate_random_string(8),
    "attendee_name" text NOT NULL,
    "attendee_email" text,
    "is_checked_in" bool DEFAULT false,
    "checked_in_at" timestamptz,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "attendee_phone_number" text,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."users";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS users_id_seq;

-- Table Definition
CREATE TABLE "public"."users" (
    "id" int4 NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    "name" text,
    "email" text,
    "email_verified" timestamp(3),
    "image" text,
    "role" text NOT NULL DEFAULT 'USER'::text,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."accounts";
-- Table Definition
CREATE TABLE "public"."accounts" (
    "user_id" text NOT NULL,
    "type" text NOT NULL,
    "provider" text NOT NULL,
    "provider_account_id" text NOT NULL,
    "refresh_token" text,
    "access_token" text,
    "expires_at" int4,
    "token_type" text,
    "scope" text,
    "id_token" text,
    "session_state" text,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    PRIMARY KEY ("provider","provider_account_id")
);

DROP TABLE IF EXISTS "public"."sessions";
-- Table Definition
CREATE TABLE "public"."sessions" (
    "session_token" text NOT NULL,
    "user_id" text NOT NULL,
    "expires" timestamp(3) NOT NULL,
    PRIMARY KEY ("session_token")
);

DROP TABLE IF EXISTS "public"."verification_tokens";
-- Table Definition
CREATE TABLE "public"."verification_tokens" (
    "identifier" text NOT NULL,
    "token" text NOT NULL,
    "expires" timestamp(3) NOT NULL,
    PRIMARY KEY ("identifier","token")
);

DROP TABLE IF EXISTS "public"."event_custom_field_options";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS event_custom_field_options_id_seq;

-- Table Definition
CREATE TABLE "public"."event_custom_field_options" (
    "id" int8 NOT NULL DEFAULT nextval('event_custom_field_options_id_seq'::regclass),
    "custom_field_id" int8 NOT NULL,
    "option_value" text NOT NULL,
    "option_label" text NOT NULL,
    "sort_order" int4 DEFAULT 0,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."ticket_custom_field_answers";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS ticket_custom_field_answers_id_seq;

-- Table Definition
CREATE TABLE "public"."ticket_custom_field_answers" (
    "id" int8 NOT NULL DEFAULT nextval('ticket_custom_field_answers_id_seq'::regclass),
    "ticket_id" int8 NOT NULL,
    "custom_field_id" int8 NOT NULL,
    "answer_value" text NOT NULL,
    "created_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."event_custom_fields";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS event_custom_fields_id_seq;

-- Table Definition
CREATE TABLE "public"."event_custom_fields" (
    "id" int8 NOT NULL DEFAULT nextval('event_custom_fields_id_seq'::regclass),
    "event_id" int8 NOT NULL,
    "field_name" text NOT NULL,
    "field_label" text NOT NULL,
    "field_type" varchar NOT NULL,
    "is_required" bool NOT NULL DEFAULT false,
    "sort_order" int4 DEFAULT 0,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

-- Column Comment
COMMENT ON COLUMN "public"."event_custom_fields"."field_name" IS 'Identifier unik untuk field, contoh: "ukuran_jersey", "golongan_darah".';

ALTER TABLE "public"."orders" ADD FOREIGN KEY ("event_id") REFERENCES "public"."events"("id");
ALTER TABLE "public"."orders" ADD FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");
ALTER TABLE "public"."orders" ADD FOREIGN KEY ("discount_id") REFERENCES "public"."discounts"("id");
ALTER TABLE "public"."orders" ADD FOREIGN KEY ("payment_channel_id") REFERENCES "public"."payment_channels"("id");


-- Indices
CREATE UNIQUE INDEX orders_order_reference_key ON public.orders USING btree (order_reference);


-- Indices
CREATE UNIQUE INDEX events_slug_key ON public.events USING btree (slug);
CREATE INDEX idx_events_slug ON public.events USING btree (slug);


-- Indices
CREATE UNIQUE INDEX payment_channels_pg_code_key ON public.payment_channels USING btree (pg_code);


-- Indices
CREATE UNIQUE INDEX notification_templates_name_key ON public.notification_templates USING btree (name);
ALTER TABLE "public"."discount_ticket_types" ADD FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_types"("id") ON DELETE CASCADE;
ALTER TABLE "public"."discount_ticket_types" ADD FOREIGN KEY ("discount_id") REFERENCES "public"."discounts"("id") ON DELETE CASCADE;
ALTER TABLE "public"."ticket_types" ADD FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


-- Comments
COMMENT ON TABLE "public"."orders_temp" IS 'Tabel sementara untuk menampung data impor sebelum diproses ke tabel utama.';


-- Indices
CREATE INDEX idx_orders_temp_session_id ON public.orders_temp USING btree (upload_session_id);


-- Indices
CREATE INDEX idx_discounts_code ON public.discounts USING btree (code);
CREATE INDEX idx_discounts_active ON public.discounts USING btree (is_active);
CREATE INDEX idx_discounts_valid_until ON public.discounts USING btree (valid_until);
CREATE UNIQUE INDEX discounts_code_key ON public.discounts USING btree (code);


-- Indices
CREATE UNIQUE INDEX customers_email_key ON public.customers USING btree (email);
ALTER TABLE "public"."payment_instructions" ADD FOREIGN KEY ("payment_channel_id") REFERENCES "public"."payment_channels"("id");


-- Indices
CREATE INDEX idx_payment_logs_order_reference ON public.payment_logs USING btree (order_reference);
CREATE INDEX idx_payment_logs_va_number ON public.payment_logs USING btree (virtual_account_number);


-- Indices
CREATE INDEX idx_notification_logs_order_reference ON public.notification_logs USING btree (order_reference);
CREATE INDEX idx_notification_logs_recipient_email ON public.notification_logs USING btree (recipient_email);
CREATE INDEX idx_notification_logs_recipient_phone ON public.notification_logs USING btree (recipient_phone);
ALTER TABLE "public"."order_items" ADD FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_types"("id") ON DELETE RESTRICT;
ALTER TABLE "public"."order_items" ADD FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;
ALTER TABLE "public"."order_item_attendees" ADD FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE CASCADE;
ALTER TABLE "public"."order_item_attendees" ADD FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE SET NULL;


-- Comments
COMMENT ON TABLE "public"."order_item_attendees" IS 'Menyimpan data detail per calon attendee untuk setiap item pesanan sebelum pembayaran.';


-- Indices
CREATE UNIQUE INDEX settings_key_key ON public.settings USING btree (key);
CREATE INDEX idx_settings_key ON public.settings USING btree (key);
CREATE INDEX idx_settings_category ON public.settings USING btree (category);
ALTER TABLE "public"."tickets" ADD FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_types"("id");
ALTER TABLE "public"."tickets" ADD FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;


-- Indices
CREATE UNIQUE INDEX tickets_ticket_code_key ON public.tickets USING btree (ticket_code);
ALTER TABLE "public"."event_custom_field_options" ADD FOREIGN KEY ("custom_field_id") REFERENCES "public"."event_custom_fields"("id") ON DELETE CASCADE;


-- Comments
COMMENT ON TABLE "public"."event_custom_field_options" IS 'Menyimpan opsi-opsi untuk field kustom yang bertipe dropdown.';
ALTER TABLE "public"."ticket_custom_field_answers" ADD FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE CASCADE;
ALTER TABLE "public"."ticket_custom_field_answers" ADD FOREIGN KEY ("custom_field_id") REFERENCES "public"."event_custom_fields"("id") ON DELETE CASCADE;


-- Comments
COMMENT ON TABLE "public"."ticket_custom_field_answers" IS 'Menyimpan jawaban dari field kustom untuk setiap tiket.';
ALTER TABLE "public"."event_custom_fields" ADD FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;


-- Comments
COMMENT ON TABLE "public"."event_custom_fields" IS 'Menyimpan definisi field kustom untuk setiap event.';
