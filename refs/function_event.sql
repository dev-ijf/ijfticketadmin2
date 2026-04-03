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
        AND oia.ticket_id IS NULL  -- Hanya proses yang belum punya ticket
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


CREATE OR REPLACE FUNCTION public.debug_attendee_custom_answers(p_attendee_id bigint)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    attendee_data RECORD;
    custom_field_key TEXT;
    custom_field_answer TEXT;
    custom_field_id_mapped BIGINT;
    event_id_for_mapping BIGINT;
BEGIN
    RAISE NOTICE '[DEBUG] Debugging attendee_id: %', p_attendee_id;

    -- Get attendee data
    SELECT
        oia.attendee_name,
        oia.custom_answers,
        tt.event_id,
        oia.ticket_id
    INTO attendee_data
    FROM order_item_attendees oia
    JOIN order_items oi ON oia.order_item_id = oi.id
    JOIN ticket_types tt ON oi.ticket_type_id = tt.id
    WHERE oia.id = p_attendee_id;

    IF NOT FOUND THEN
        RAISE NOTICE '[DEBUG] Attendee % not found', p_attendee_id;
        RETURN;
    END IF;

    event_id_for_mapping := attendee_data.event_id;

    RAISE NOTICE '[DEBUG] Attendee: %, Event ID: %, Ticket ID: %, Custom Answers: %',
        attendee_data.attendee_name, event_id_for_mapping, attendee_data.ticket_id, attendee_data.custom_answers;

    -- Debug custom answers
    IF attendee_data.custom_answers IS NOT NULL THEN
        FOR custom_field_key, custom_field_answer IN
            SELECT * FROM jsonb_each_text(attendee_data.custom_answers)
        LOOP
            SELECT id INTO custom_field_id_mapped
            FROM event_custom_fields
            WHERE event_id = event_id_for_mapping
            AND field_name = custom_field_key;

            RAISE NOTICE '[DEBUG] Field: % = % -> custom_field_id: %',
                custom_field_key, custom_field_answer, COALESCE(custom_field_id_mapped::text, 'NOT FOUND');
        END LOOP;
    ELSE
        RAISE NOTICE '[DEBUG] No custom_answers found';
    END IF;
END;
$function$


CREATE OR REPLACE FUNCTION public.debug_custom_field_mapping(p_event_id bigint)
 RETURNS TABLE(custom_field_id bigint, field_name text, field_label text, field_type text, option_count bigint)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RAISE NOTICE '[DEBUG] Checking custom field mapping for event_id: %', p_event_id;

    RETURN QUERY
    SELECT
        ecf.id,
        ecf.field_name,
        ecf.field_label,
        ecf.field_type::text,
        COALESCE(COUNT(ecfo.id), 0) as option_count
    FROM event_custom_fields ecf
    LEFT JOIN event_custom_field_options ecfo ON ecf.id = ecfo.custom_field_id
    WHERE ecf.event_id = p_event_id
    GROUP BY ecf.id, ecf.field_name, ecf.field_label, ecf.field_type
    ORDER BY ecf.sort_order;
END;
$function$


CREATE OR REPLACE FUNCTION public.fallback_check_and_fix_missing_custom_fields()
 RETURNS TABLE(order_id bigint, order_reference text, processed_attendees integer, custom_field_answers_inserted integer, errors_count integer, status text)
 LANGUAGE plpgsql
AS $function$
DECLARE
    order_record RECORD;
    fallback_result RECORD;
BEGIN
    FOR order_record IN
        SELECT DISTINCT o.id, o.order_reference
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN order_item_attendees oia ON oi.id = oia.order_item_id
        WHERE o.status = 'paid'
        AND oia.ticket_id IS NOT NULL
        AND oia.custom_answers IS NOT NULL AND oia.custom_answers != '{}'::jsonb
        AND NOT EXISTS (
            SELECT 1 FROM ticket_custom_field_answers tcfa
            WHERE tcfa.ticket_id = oia.ticket_id
        )
    LOOP
        BEGIN
            SELECT * INTO fallback_result
            FROM public.fallback_process_order_custom_fields(order_record.id);

            RETURN QUERY SELECT
                order_record.id,
                order_record.order_reference,
                fallback_result.processed_attendees,
                fallback_result.custom_field_answers_inserted,
                fallback_result.errors_count,
                CASE
                    WHEN fallback_result.errors_count = 0 AND fallback_result.custom_field_answers_inserted > 0 THEN 'SUCCESS'
                    WHEN fallback_result.errors_count > 0 THEN 'PARTIAL_SUCCESS'
                    ELSE 'NO_ACTION_NEEDED'
                END::text;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING '[FALLBACK-MAIN] Error processing order %: %', order_record.id, SQLERRM;
                RETURN QUERY SELECT order_record.id, order_record.order_reference, 0, 0, 1, 'ERROR'::text;
        END;
    END LOOP;
END;
$function$


CREATE OR REPLACE FUNCTION public.fallback_insert_custom_field_answers()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    result_record RECORD;
BEGIN
    RAISE NOTICE '[FALLBACK-QUICK] Running fallback for missing custom field answers...';
    FOR result_record IN SELECT * FROM public.fallback_check_and_fix_missing_custom_fields()
    LOOP
        RAISE NOTICE '[FALLBACK-QUICK] Order %: Processed % attendees, Inserted % answers, % errors. Status: %',
            result_record.order_reference,
            result_record.processed_attendees,
            result_record.custom_field_answers_inserted,
            result_record.errors_count,
            result_record.status;
    END LOOP;
    RAISE NOTICE '[FALLBACK-QUICK] Completed.';
END;
$function$


CREATE OR REPLACE FUNCTION public.fallback_process_order_custom_fields(p_order_id bigint)
 RETURNS TABLE(processed_attendees integer, custom_field_answers_inserted integer, errors_count integer)
 LANGUAGE plpgsql
AS $function$
DECLARE
    attendee_record RECORD;
    custom_field_key TEXT;
    custom_field_answer TEXT;
    custom_field_id_mapped BIGINT; -- ID custom field
    event_id_for_mapping BIGINT;   -- event_id untuk mapping
    processed_count INTEGER := 0;
    inserted_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE '[FALLBACK] Processing custom fields for order_id: %', p_order_id;

    FOR attendee_record IN
        SELECT DISTINCT
            oia.id as attendee_id,
            oia.attendee_name,
            oia.custom_answers,
            oia.ticket_id,
            o.event_id -- event_id dari order
        FROM order_items oi
        JOIN order_item_attendees oia ON oi.id = oia.order_item_id
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.order_id = p_order_id
          AND o.status = 'paid'
          AND oia.ticket_id IS NOT NULL
          AND oia.custom_answers IS NOT NULL
          AND oia.custom_answers <> '{}'::jsonb
          AND NOT EXISTS (
                SELECT 1
                FROM ticket_custom_field_answers tcfa
                WHERE tcfa.ticket_id = oia.ticket_id
          )
    LOOP
        processed_count := processed_count + 1;
        event_id_for_mapping := attendee_record.event_id;

        RAISE NOTICE '[FALLBACK] Processing attendee % (ticket_id: %), custom_answers: %',
            attendee_record.attendee_name,
            attendee_record.ticket_id,
            attendee_record.custom_answers;

        FOR custom_field_key, custom_field_answer IN
            SELECT * FROM jsonb_each_text(attendee_record.custom_answers)
        LOOP
            RAISE NOTICE '[FALLBACK] Processing field key: "%" = "%"',
                custom_field_key, custom_field_answer;

            -- Mapping: kalau key angka → treat sebagai ID, selain itu → field_name
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
                BEGIN
                    INSERT INTO ticket_custom_field_answers (
                        ticket_id,
                        custom_field_id,
                        answer_value
                    )
                    VALUES (
                        attendee_record.ticket_id,
                        custom_field_id_mapped,
                        custom_field_answer
                    );

                    inserted_count := inserted_count + 1;
                    RAISE NOTICE '[FALLBACK] SUCCESS: Inserted custom field "%" (ID: %) for ticket %',
                        custom_field_key, custom_field_id_mapped, attendee_record.ticket_id;
                EXCEPTION
                    WHEN unique_violation THEN
                        RAISE NOTICE '[FALLBACK] SKIP: Custom field answer already exists for ticket % field "%"',
                            attendee_record.ticket_id, custom_field_key;
                    WHEN OTHERS THEN
                        error_count := error_count + 1;
                        RAISE WARNING '[FALLBACK] ERROR inserting custom field "%" for ticket %: SQLSTATE %, SQLERRM %',
                            custom_field_key, attendee_record.ticket_id, SQLSTATE, SQLERRM;
                END;
            ELSE
                error_count := error_count + 1;
                RAISE WARNING '[FALLBACK] MAPPING FAILED: Custom field with key "%" not found for event_id %.',
                    custom_field_key, event_id_for_mapping;
            END IF;
        END LOOP;
    END LOOP;

    RAISE NOTICE '[FALLBACK] Completed order %. Processed: %, Inserted: %, Errors: %',
        p_order_id, processed_count, inserted_count, error_count;
        
    RETURN QUERY SELECT processed_count, inserted_count, error_count;
END;
$function$


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


CREATE OR REPLACE FUNCTION public.get_pivoted_ticket_data_by_event(p_event_id bigint)
 RETURNS TABLE(id bigint, ticket_code text, attendee_name text, attendee_email text, is_checked_in boolean, checked_in_at timestamp with time zone, created_at timestamp with time zone, order_reference text, ticket_type_name text, event_name text, custom_data jsonb)
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
    tt.name AS ticket_type_name,
    e.name AS event_name,
    (
      /*
        Bangun JSON custom_data per tiket:
        1. Prioritas: nilai di ticket_custom_field_answers (skema baru)
        2. Fallback: order_item_attendees.custom_answers dengan key:
           - id field (ecf.id::text)
           - atau field_name
        3. Fallback ekstra: mapping berdasarkan urutan index field vs urutan key di JSON
           supaya data lama {"4": "...", "5": "..."} tetap terisi ke field baru.
      */
      SELECT COALESCE(
        jsonb_object_agg(
          ecf.field_name,
          COALESCE(
            -- 1. skema baru
            tcfa.answer_value,
            -- 2. fallback by id / field_name
            oia.custom_answers ->> ecf.id::text,
            oia.custom_answers ->> ecf.field_name,
            -- 3. fallback by index (urutan)
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
      LEFT JOIN ticket_custom_field_answers tcfa ON
        tcfa.custom_field_id = ecf.id
        AND tcfa.ticket_id = t.id
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


CREATE OR REPLACE FUNCTION public.handle_order_items_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$


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
    final_ticket_code TEXT; -- Variabel untuk ticket_code final
BEGIN
    RAISE NOTICE '[TRIGGER] Starting process_single_attendee for attendee_id: %, order_id: %',
        p_attendee_id, p_order_id;

    -- Ambil data attendee, termasuk barcode_id
    SELECT
        oia.attendee_name,
        oia.attendee_email,
        oia.attendee_phone_number,
        oia.custom_answers,
        oia.barcode_id, -- Mengambil barcode_id
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

                RAISE NOTICE '[TRIGGER] Available custom fields for event %:', event_id_for_mapping;
                FOR custom_field_id_mapped IN
                    SELECT id FROM event_custom_fields WHERE event_id = event_id_for_mapping
                LOOP
                    RAISE NOTICE '[TRIGGER] - custom_field_id: % available', custom_field_id_mapped;
                END LOOP;
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

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$



CREATE OR REPLACE VIEW ticket_type_stock AS
 SELECT id,
    event_id,
    name,
    price,
    tickets_per_purchase,
    quantity_total,
    quantity_sold,
    quantity_total - quantity_sold AS remaining_quantity,
    floor(((quantity_total - quantity_sold) / tickets_per_purchase)::double precision) AS remaining_ticket_sets
   FROM ticket_types tt;