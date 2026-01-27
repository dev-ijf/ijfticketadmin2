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

// Functions
export async function createFunctions() {
  const functions = [
    // generate_random_string
    sql`
      CREATE OR REPLACE FUNCTION public.generate_random_string(length integer)
      RETURNS text
      LANGUAGE plpgsql
      AS $function$
      DECLARE
          chars text[] := '{0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z}';
          result text := '';
          i integer := 0;
      BEGIN
          IF length < 1 THEN
              RAISE EXCEPTION 'Given length cannot be less than 1';
          END IF;

          FOR i IN 1..length LOOP
              result := result || chars[1+random()*(array_length(chars, 1)-1)];
          END LOOP;

          RETURN result;
      END;
      $function$
    `,
    // generate_slug
    sql`
      CREATE OR REPLACE FUNCTION public.generate_slug(input_text text)
      RETURNS text
      LANGUAGE plpgsql
      AS $function$
      BEGIN
        RETURN lower(
          regexp_replace(
            regexp_replace(
              regexp_replace(input_text, '[^a-zA-Z0-9\s]', '', 'g'),
              '\s+', '-', 'g'
            ),
            '^-+|-+$', '', 'g'
          )
        );
      END;
      $function$
    `,
    // auto_generate_slug
    sql`
      CREATE OR REPLACE FUNCTION public.auto_generate_slug()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $function$
      DECLARE
        base_slug TEXT;
        final_slug TEXT;
        counter INTEGER := 0;
      BEGIN
        -- Generate base slug from name
        base_slug := generate_slug(NEW.name);
        final_slug := base_slug;
        
        -- Check if slug already exists and append number if needed
        WHILE EXISTS (SELECT 1 FROM events WHERE slug = final_slug AND id != COALESCE(NEW.id, 0)) LOOP
          counter := counter + 1;
          final_slug := base_slug || '-' || counter;
        END LOOP;
        
        NEW.slug := final_slug;
        RETURN NEW;
      END;
      $function$
    `,
    // calculate_effective_ticket_count
    sql`
      CREATE OR REPLACE FUNCTION public.calculate_effective_ticket_count()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $function$
      BEGIN
        -- Calculate the effective number of tickets based on ticket type
        NEW.effective_ticket_count = NEW.quantity * 
          (SELECT tickets_per_purchase FROM ticket_types WHERE id = NEW.ticket_type_id);
        
        RETURN NEW;
      END;
      $function$
    `,
    // handle_updated_at
    sql`
      CREATE OR REPLACE FUNCTION public.handle_updated_at()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $function$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $function$
    `,
    // handle_order_items_updated_at
    sql`
      CREATE OR REPLACE FUNCTION public.handle_order_items_updated_at()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $function$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $function$
    `,
    // update_updated_at_column
    sql`
      CREATE OR REPLACE FUNCTION public.update_updated_at_column()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $function$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $function$
    `,
    // increment_ticket_type_sold
    sql`
      CREATE OR REPLACE FUNCTION public.increment_ticket_type_sold(ticket_type_id bigint, increment_by integer)
      RETURNS void
      LANGUAGE plpgsql
      AS $function$
      begin
        update ticket_types
        set quantity_sold = quantity_sold + increment_by
        where id = ticket_type_id;
      end;
      $function$
    `,
    // update_ticket_type_quantity_sold_aggregate
    sql`
      CREATE OR REPLACE FUNCTION public.update_ticket_type_quantity_sold_aggregate()
      RETURNS void
      LANGUAGE plpgsql
      AS $function$
      begin
        update ticket_types t
        set quantity_sold = coalesce(agg.sold, 0)
        from (
          select
            oi.ticket_type_id,
            sum(oi.effective_ticket_count) as sold
          from order_items oi
          join orders o on oi.order_id = o.id
          where o.status = 'paid'
          group by oi.ticket_type_id
        ) agg
        where t.id = agg.ticket_type_id;
      end;
      $function$
    `,
    // process_single_attendee
    sql`
      CREATE OR REPLACE FUNCTION public.process_single_attendee(p_attendee_id bigint, p_order_id bigint)
      RETURNS void
      LANGUAGE plpgsql
      AS $function$
      DECLARE
          attendee_data RECORD;
          new_ticket_id BIGINT;
          custom_field_key TEXT;
          custom_field_answer TEXT;
          custom_field_id_mapped BIGINT;
          event_id_for_mapping BIGINT;
          mapping_count INTEGER := 0;
          processed_count INTEGER := 0;
          final_ticket_code TEXT;
      BEGIN
          RAISE NOTICE '[TRIGGER] Starting process_single_attendee for attendee_id: %, order_id: %',
              p_attendee_id, p_order_id;

          -- Ambil data attendee, termasuk barcode_id
          SELECT
              oia.attendee_name,
              oia.attendee_email,
              oia.attendee_phone_number,
              oia.custom_answers,
              oia.barcode_id,
              oi.ticket_type_id,
              tt.event_id
          INTO attendee_data
          FROM order_item_attendees oia
          JOIN order_items oi ON oia.order_item_id = oi.id
          JOIN ticket_types tt ON oi.ticket_type_id = tt.id
          WHERE oia.id = p_attendee_id;

          IF NOT FOUND THEN
              RAISE WARNING '[TRIGGER] Attendee ID % not found', p_attendee_id;
              RETURN;
          END IF;

          event_id_for_mapping := attendee_data.event_id;
          RAISE NOTICE '[TRIGGER] Found attendee: %, event_id: %, custom_answers: %',
              attendee_data.attendee_name, event_id_for_mapping, attendee_data.custom_answers;

          -- Ticket code: pakai barcode_id kalau ada, kalau tidak generate random
          IF attendee_data.barcode_id IS NOT NULL AND attendee_data.barcode_id <> '' THEN
              final_ticket_code := attendee_data.barcode_id;
              RAISE NOTICE '[TRIGGER] Using provided barcode_id as ticket_code: %', final_ticket_code;
          ELSE
              final_ticket_code := generate_random_string(8);
              RAISE NOTICE '[TRIGGER] Generating random ticket_code: %', final_ticket_code;
          END IF;

          -- Buat tiket dari data attendee menggunakan final_ticket_code
          INSERT INTO tickets (
              order_id,
              ticket_type_id,
              ticket_code,
              attendee_name,
              attendee_email,
              attendee_phone_number,
              created_at,
              updated_at
          )
          VALUES (
              p_order_id,
              attendee_data.ticket_type_id,
              final_ticket_code,
              attendee_data.attendee_name,
              attendee_data.attendee_email,
              attendee_data.attendee_phone_number,
              NOW(),
              NOW()
          )
          RETURNING id INTO new_ticket_id;

          -- Update referensi ticket_id di tabel attendee
          UPDATE order_item_attendees
          SET ticket_id = new_ticket_id
          WHERE id = p_attendee_id;

          RAISE NOTICE '[TRIGGER] Created ticket ID % for attendee %', new_ticket_id, p_attendee_id;

          -- Pindahkan jawaban custom fields dari JSONB ke tabel final
          IF attendee_data.custom_answers IS NOT NULL
             AND jsonb_typeof(attendee_data.custom_answers) = 'object' THEN
              RAISE NOTICE '[TRIGGER] Processing custom_answers: %', attendee_data.custom_answers;

              SELECT COUNT(*) INTO mapping_count
              FROM jsonb_each_text(attendee_data.custom_answers);

              RAISE NOTICE '[TRIGGER] Found % custom answer keys to process', mapping_count;

              FOR custom_field_key, custom_field_answer IN
                  SELECT * FROM jsonb_each_text(attendee_data.custom_answers)
              LOOP
                  processed_count := processed_count + 1;
                  RAISE NOTICE '[TRIGGER] Processing field %/% - key: %, value: %',
                      processed_count, mapping_count, custom_field_key, custom_field_answer;

                  -- Mapping: kalau key hanya angka -> treat sebagai ID, kalau tidak -> field_name
                  IF custom_field_key ~ '^[0-9]+$' THEN
                      SELECT id INTO custom_field_id_mapped
                      FROM event_custom_fields
                      WHERE id = custom_field_key::bigint
                      LIMIT 1;
                  ELSE
                      SELECT id INTO custom_field_id_mapped
                      FROM event_custom_fields
                      WHERE event_id = event_id_for_mapping
                        AND field_name = custom_field_key
                      LIMIT 1;
                  END IF;

                  IF custom_field_id_mapped IS NOT NULL THEN
                      RAISE NOTICE '[TRIGGER] Mapping found: % -> custom_field_id: %',
                          custom_field_key, custom_field_id_mapped;

                      BEGIN
                          INSERT INTO ticket_custom_field_answers (
                              ticket_id,
                              custom_field_id,
                              answer_value,
                              created_at
                          )
                          VALUES (
                              new_ticket_id,
                              custom_field_id_mapped,
                              custom_field_answer,
                              NOW()
                          );

                          RAISE NOTICE '[TRIGGER] SUCCESS: Inserted custom field answer - ticket_id: %, custom_field_id: %, value: %',
                              new_ticket_id, custom_field_id_mapped, custom_field_answer;
                      EXCEPTION
                          WHEN OTHERS THEN
                              RAISE WARNING '[TRIGGER] ERROR inserting custom field answer: %, SQLSTATE: %, SQLERRM: %',
                                  custom_field_key, SQLSTATE, SQLERRM;
                      END;
                  ELSE
                      RAISE WARNING '[TRIGGER] Custom field mapping NOT FOUND for key: % in event_id: %',
                          custom_field_key, event_id_for_mapping;
                  END IF;
              END LOOP;

              RAISE NOTICE '[TRIGGER] Completed processing % custom field answers', processed_count;
          ELSE
              IF attendee_data.custom_answers IS NULL THEN
                  RAISE NOTICE '[TRIGGER] No custom_answers data (NULL) for attendee %', p_attendee_id;
              ELSE
                  RAISE WARNING '[TRIGGER] custom_answers is not a valid JSON object: %',
                      attendee_data.custom_answers;
              END IF;
          END IF;

          UPDATE ticket_types
          SET quantity_sold = COALESCE(quantity_sold, 0) + 1
          WHERE id = attendee_data.ticket_type_id;

          RAISE NOTICE '[TRIGGER] Updated quantity_sold for ticket_type_id %',
              attendee_data.ticket_type_id;
          RAISE NOTICE '[TRIGGER] Completed process_single_attendee for attendee_id: %',
              p_attendee_id;
      END;
      $function$
    `,
    // create_tickets_for_paid_order
    sql`
      CREATE OR REPLACE FUNCTION public.create_tickets_for_paid_order(p_order_id bigint)
      RETURNS void
      LANGUAGE plpgsql
      AS $function$
      DECLARE
          attendee_record RECORD;
          order_status TEXT;
          attendee_count INTEGER := 0;
          processed_count INTEGER := 0;
      BEGIN
          RAISE NOTICE '[MAIN] Starting create_tickets_for_paid_order for order_id: %', p_order_id;

          -- Verifikasi order sudah lunas
          SELECT status INTO order_status FROM orders WHERE id = p_order_id;

          IF order_status IS NULL THEN
              RAISE EXCEPTION '[MAIN] Order ID % tidak ditemukan.', p_order_id;
          END IF;

          IF order_status != 'paid' THEN
              RAISE EXCEPTION '[MAIN] Order ID % belum lunas (status: %).', p_order_id, order_status;
          END IF;

          RAISE NOTICE '[MAIN] Processing paid order ID % with status: %', p_order_id, order_status;

          -- Hitung attendees yang perlu diproses
          SELECT COUNT(*) INTO attendee_count
          FROM order_items oi
          JOIN order_item_attendees oia ON oi.id = oia.order_item_id
          WHERE oi.order_id = p_order_id
          AND oia.ticket_id IS NULL;

          RAISE NOTICE '[MAIN] Found % attendees to process', attendee_count;

          -- Loop melalui data attendee yang terkait dengan order tersebut
          FOR attendee_record IN
              SELECT oia.id AS attendee_id
              FROM order_items oi
              JOIN order_item_attendees oia ON oi.id = oia.order_item_id
              WHERE oi.order_id = p_order_id
              AND oia.ticket_id IS NULL
          LOOP
              processed_count := processed_count + 1;
              RAISE NOTICE '[MAIN] Processing attendee %/% - attendee_id: %',
                  processed_count, attendee_count, attendee_record.attendee_id;

              -- Panggil fungsi helper untuk setiap attendee
              BEGIN
                  PERFORM public.process_single_attendee(attendee_record.attendee_id, p_order_id);
                  RAISE NOTICE '[MAIN] Successfully processed attendee_id: %', attendee_record.attendee_id;
              EXCEPTION
                  WHEN OTHERS THEN
                      RAISE WARNING '[MAIN] Failed to process attendee_id %: %',
                          attendee_record.attendee_id, SQLERRM;
              END;
          END LOOP;

          RAISE NOTICE '[MAIN] Completed processing paid order ID %. Processed %/% attendees',
              p_order_id, processed_count, attendee_count;
      END;
      $function$
    `,
    // create_tickets_on_paid_order (trigger function)
    sql`
      CREATE OR REPLACE FUNCTION public.create_tickets_on_paid_order()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $function$
      BEGIN
          -- Hanya berjalan jika status order berubah menjadi 'paid'
          IF NEW.status = 'paid' AND (TG_OP = 'INSERT' OR (OLD.status IS NOT NULL AND NEW.status IS DISTINCT FROM OLD.status)) THEN
              RAISE NOTICE '[AUTO-TRIGGER] Order ID % status changed to paid', NEW.id;

              -- Panggil function untuk create tickets (SKIP NOTIFIKASI)
              BEGIN
                  PERFORM public.create_tickets_for_paid_order(NEW.id);
                  RAISE NOTICE '[AUTO-TRIGGER] Successfully created tickets for order %', NEW.id;
              EXCEPTION
                  WHEN OTHERS THEN
                      RAISE WARNING '[AUTO-TRIGGER] Failed to create tickets for order %: %', NEW.id, SQLERRM;
              END;
          END IF;

          RETURN NEW;
      END;
      $function$
    `,
    // get_pivoted_ticket_data_by_event
    sql`
      CREATE OR REPLACE FUNCTION public.get_pivoted_ticket_data_by_event(p_event_id bigint)
      RETURNS TABLE(
        id bigint,
        ticket_code text,
        attendee_name text,
        attendee_email text,
        is_checked_in boolean,
        checked_in_at timestamp with time zone,
        created_at timestamp with time zone,
        order_reference text,
        ticket_type_name text,
        event_name text,
        custom_data jsonb
      )
      LANGUAGE plpgsql
      AS $function$
      BEGIN
          RETURN QUERY
          SELECT
              t.id,
              t.ticket_code,
              t.attendee_name,
              t.attendee_email,
              t.is_checked_in,
              t.checked_in_at,
              t.created_at,
              o.order_reference,
              tt.name as ticket_type_name,
              e.name as event_name,
              (
                  /*
                    Ambil semua event_custom_fields untuk event tsb, lalu:
                    1. Utamakan nilai dari ticket_custom_field_answers (skema baru)
                    2. Jika kosong, fallback ke order_item_attendees.custom_answers (data lama),
                       baik yang key-nya berupa ID field ("4") maupun field_name ("asal_sekolah").
                    3. Nilai disimpan "apa adanya" (tidak dimodifikasi), sehingga sama dengan JSON sumber.
                  */
                  SELECT COALESCE(
                      jsonb_object_agg(
                          ecf.field_name,
                          COALESCE(
                              -- 1. Skema baru: nilai di ticket_custom_field_answers
                              tcfa.answer_value,
                              -- 2. Fallback: JSON lama pakai key = id atau field_name
                              oia.custom_answers ->> ecf.id::text,
                              oia.custom_answers ->> ecf.field_name,
                              -- 3. Fallback terakhir: mapping berdasarkan urutan (index) field
                              (
                                  SELECT legacy_val
                                  FROM (
                                      SELECT
                                          value AS legacy_val,
                                          row_number() OVER (ORDER BY key) AS rn
                                      FROM jsonb_each_text(oia.custom_answers)
                                  ) legacy
                                  WHERE legacy.rn = (
                                      SELECT field_pos.rn
                                      FROM (
                                          SELECT
                                              ecf2.id AS id,
                                              row_number() OVER (
                                                  ORDER BY ecf2.sort_order, ecf2.id
                                              ) AS rn
                                          FROM event_custom_fields ecf2
                                          WHERE ecf2.event_id = p_event_id
                                      ) field_pos
                                      WHERE field_pos.id = ecf.id
                                  )
                                  LIMIT 1
                              ),
                              ''
                          )
                      ),
                      '{}'::jsonb
                  )
                  FROM event_custom_fields ecf
                  LEFT JOIN ticket_custom_field_answers tcfa ON (
                      tcfa.custom_field_id = ecf.id
                      AND tcfa.ticket_id = t.id
                  )
                  WHERE ecf.event_id = p_event_id
              ) AS custom_data
          FROM tickets t
          JOIN orders o ON t.order_id = o.id
          JOIN events e ON o.event_id = e.id
          JOIN ticket_types tt ON t.ticket_type_id = tt.id
          LEFT JOIN order_item_attendees oia ON oia.ticket_id = t.id
          WHERE o.event_id = p_event_id
          ORDER BY t.created_at DESC;
      END;
      $function$
    `,
  ];

  for (const func of functions) {
    await db.execute(func);
  }
}

// Views
export async function createViews() {
  const views = [
    sql`
      CREATE OR REPLACE VIEW public.ticket_type_stock AS
      SELECT 
        tt.id,
        tt.event_id,
        tt.name,
        tt.quantity_total,
        tt.quantity_sold,
        (tt.quantity_total - COALESCE(tt.quantity_sold, 0)) AS stock_available
      FROM ticket_types tt;
    `,
  ];

  for (const view of views) {
    await db.execute(view);
  }
}

// Triggers
export async function createTriggers() {
  const triggers = [
    // Auto generate slug for events
    sql`
      DROP TRIGGER IF EXISTS auto_generate_slug_trigger ON events;
      CREATE TRIGGER auto_generate_slug_trigger
      BEFORE INSERT OR UPDATE OF name ON events
      FOR EACH ROW
      EXECUTE FUNCTION public.auto_generate_slug();
    `,
    // Calculate effective ticket count
    sql`
      DROP TRIGGER IF EXISTS calculate_effective_ticket_count_trigger ON order_items;
      CREATE TRIGGER calculate_effective_ticket_count_trigger
      BEFORE INSERT OR UPDATE OF quantity, ticket_type_id ON order_items
      FOR EACH ROW
      EXECUTE FUNCTION public.calculate_effective_ticket_count();
    `,
    // Auto create tickets on paid order
    sql`
      DROP TRIGGER IF EXISTS create_tickets_on_paid_order_trigger ON orders;
      CREATE TRIGGER create_tickets_on_paid_order_trigger
      AFTER INSERT OR UPDATE OF status ON orders
      FOR EACH ROW
      EXECUTE FUNCTION public.create_tickets_on_paid_order();
    `,
    // Update updated_at for events
    sql`
      DROP TRIGGER IF EXISTS update_events_updated_at ON events;
      CREATE TRIGGER update_events_updated_at
      BEFORE UPDATE ON events
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
    `,
    // Update updated_at for customers
    sql`
      DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
      CREATE TRIGGER update_customers_updated_at
      BEFORE UPDATE ON customers
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
    `,
    // Update updated_at for payment_channels
    sql`
      DROP TRIGGER IF EXISTS update_payment_channels_updated_at ON payment_channels;
      CREATE TRIGGER update_payment_channels_updated_at
      BEFORE UPDATE ON payment_channels
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
    `,
    // Update updated_at for payment_instructions
    sql`
      DROP TRIGGER IF EXISTS update_payment_instructions_updated_at ON payment_instructions;
      CREATE TRIGGER update_payment_instructions_updated_at
      BEFORE UPDATE ON payment_instructions
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
    `,
    // Update updated_at for notification_templates
    sql`
      DROP TRIGGER IF EXISTS update_notification_templates_updated_at ON notification_templates;
      CREATE TRIGGER update_notification_templates_updated_at
      BEFORE UPDATE ON notification_templates
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
    `,
    // Update updated_at for discounts
    sql`
      DROP TRIGGER IF EXISTS update_discounts_updated_at ON discounts;
      CREATE TRIGGER update_discounts_updated_at
      BEFORE UPDATE ON discounts
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
    `,
    // Update updated_at for ticket_types
    sql`
      DROP TRIGGER IF EXISTS update_ticket_types_updated_at ON ticket_types;
      CREATE TRIGGER update_ticket_types_updated_at
      BEFORE UPDATE ON ticket_types
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
    `,
    // Update updated_at for orders
    sql`
      DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
      CREATE TRIGGER update_orders_updated_at
      BEFORE UPDATE ON orders
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
    `,
    // Update updated_at for tickets
    sql`
      DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
      CREATE TRIGGER update_tickets_updated_at
      BEFORE UPDATE ON tickets
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
    `,
    // Update updated_at for event_custom_fields
    sql`
      DROP TRIGGER IF EXISTS update_event_custom_fields_updated_at ON event_custom_fields;
      CREATE TRIGGER update_event_custom_fields_updated_at
      BEFORE UPDATE ON event_custom_fields
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
    `,
    // Update updated_at for payment_logs
    sql`
      DROP TRIGGER IF EXISTS update_payment_logs_updated_at ON payment_logs;
      CREATE TRIGGER update_payment_logs_updated_at
      BEFORE UPDATE ON payment_logs
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
    `,
    // Update updated_at for notification_logs
    sql`
      DROP TRIGGER IF EXISTS update_notification_logs_updated_at ON notification_logs;
      CREATE TRIGGER update_notification_logs_updated_at
      BEFORE UPDATE ON notification_logs
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
    `,
    // Update updated_at for orders_temp
    sql`
      DROP TRIGGER IF EXISTS update_orders_temp_updated_at ON orders_temp;
      CREATE TRIGGER update_orders_temp_updated_at
      BEFORE UPDATE ON orders_temp
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_order_items_updated_at();
    `,
  ];

  for (const trigger of triggers) {
    await db.execute(trigger);
  }
}
