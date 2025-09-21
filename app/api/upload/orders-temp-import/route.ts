import { type NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/database";

const STARSENDER_URL = process.env.STARSENDER_URL;
const STARSENDER_TOKEN = process.env.STARSENDER_TOKEN;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const CHILD_URL = process.env.CHILD_URL || "https://event.kreativaglobal.id";

function generateOrderReference() {
  // 16 digit angka random
  const randomDigits = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 10),
  ).join("");
  return `TKT${randomDigits}`;
}

export async function POST(req: NextRequest) {
  try {
    const { upload_session_id } = await req.json();
    if (!upload_session_id) {
      return NextResponse.json(
        { error: "upload_session_id wajib diisi" },
        { status: 400 },
      );
    }

    // Ambil semua baris pending
    const sql = getSql();
    const rows = await sql`
      SELECT * FROM orders_temp
      WHERE upload_session_id = ${upload_session_id}
      AND import_status = 'pending'
      ORDER BY row_number ASC
    `;

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    console.log(
      `Processing ${rows?.length || 0} rows for upload_session_id: ${upload_session_id}`,
    );

    for (const row of rows || []) {
      try {
        console.log(`Processing row ${row.row_number}:`, {
          customer_name: row.customer_name,
          customer_email: row.customer_email,
          event_id: row.event_id,
          ticket_type_id: row.ticket_type_id,
          custom_answers: row.custom_answers,
        });
        // 1. Upsert customer
        let customerId: number | null = null;
        if (row.customer_email || row.customer_phone_number) {
          // Cari customer by email ATAU phone_number
          let existingCustomer = null;
          if (row.customer_email) {
            const emailResult = await sql`
              SELECT id FROM customers WHERE email = ${row.customer_email} LIMIT 1
            `;
            if (emailResult.length > 0)
              existingCustomer = (emailResult as any)[0];
          }
          if (!existingCustomer && row.customer_phone_number) {
            const phoneResult = await sql`
              SELECT id FROM customers WHERE phone_number = ${row.customer_phone_number} LIMIT 1
            `;
            if (phoneResult.length > 0)
              existingCustomer = (phoneResult as any)[0];
          }

          if (existingCustomer) {
            customerId = existingCustomer.id;
          } else {
            // Insert customer baru
            const newCustomer = await sql`
              INSERT INTO customers (name, email, phone_number, created_at, updated_at)
              VALUES (${row.customer_name}, ${row.customer_email}, ${row.customer_phone_number}, NOW(), NOW())
              RETURNING id
            `;
            customerId = (newCustomer as any)[0].id;
          }
        } else {
          throw new Error("customer_email atau phone_number wajib diisi");
        }

        // 2. Insert order
        const orderInsert = {
          order_reference: generateOrderReference(),
          customer_id: customerId,
          event_id: row.event_id,
          payment_channel_id: row.payment_channel_id,
          order_date: row.order_date || null,
          final_amount: row.final_amount,
          gross_amount: row.final_amount,
          discount_amount: 0,
          status: "paid",
        };

        const orderData = await sql`
          INSERT INTO orders (
            order_reference, customer_id, event_id, payment_channel_id,
            order_date, final_amount, gross_amount, discount_amount, status, created_at, updated_at
          )
          VALUES (
            ${orderInsert.order_reference}, ${orderInsert.customer_id}, ${orderInsert.event_id},
            ${orderInsert.payment_channel_id}, ${orderInsert.order_date}, ${orderInsert.final_amount},
            ${orderInsert.gross_amount}, ${orderInsert.discount_amount}, ${orderInsert.status}, NOW(), NOW()
          )
          RETURNING id, order_reference, event_id, customer_id
        `;

        const orderId = (orderData as any)[0].id;
        console.log(`Created order with ID: ${orderId}`);

        // 3. Get tickets_per_purchase from ticket_types to calculate effective_ticket_count
        const ticketTypeResult = await sql`
          SELECT tickets_per_purchase FROM ticket_types WHERE id = ${row.ticket_type_id} LIMIT 1
        `;
        const ticketsPerPurchase =
          (ticketTypeResult as any)[0]?.tickets_per_purchase || 1;
        const effectiveTicketCount = (row.quantity || 1) * ticketsPerPurchase;

        // 4. Create order_item
        const orderItemResult = await sql`
          INSERT INTO order_items (
            order_id, ticket_type_id, quantity, price_per_ticket, effective_ticket_count, created_at
          )
          VALUES (
            ${orderId}, ${row.ticket_type_id}, ${row.quantity || 1}, ${row.final_amount}, ${effectiveTicketCount}, NOW()
          )
          RETURNING id
        `;

        const orderItemId = (orderItemResult as any)[0].id;
        console.log(
          `Created order_item with ID: ${orderItemId}, effective_ticket_count: ${effectiveTicketCount}`,
        );

        // 5. Create order_item_attendees with custom_answers (one for each quantity)
        // The database trigger will automatically create tickets from attendees
        for (let i = 0; i < (row.quantity || 1); i++) {
          console.log(
            `Creating attendee ${i + 1} of ${row.quantity || 1} with custom_answers:`,
            row.custom_answers,
          );

          const attendeeResult = await sql`
            INSERT INTO order_item_attendees (
              order_item_id, attendee_name, attendee_email, attendee_phone_number,
              custom_answers, created_at, barcode_id
            )
            VALUES (
              ${orderItemId}, ${row.customer_name}, ${row.customer_email}, ${row.customer_phone_number || null},
              ${row.custom_answers ? JSON.stringify(row.custom_answers) : null}, NOW(), ${row.barcode_id || null}
            )
            RETURNING id
          `;

          console.log(
            `Created attendee with ID: ${(attendeeResult as any)[0]?.id}`,
          );
        }

        // Manually call trigger function to create tickets for paid order
        console.log(`Calling trigger function for order ID: ${orderId}`);
        try {
          await sql`
            SELECT public.create_tickets_for_paid_order(${orderId})
          `;
          console.log(
            `Trigger function completed successfully for order ${orderId}`,
          );
        } catch (triggerError: any) {
          console.error(
            `Trigger function failed for order ${orderId}:`,
            triggerError,
          );
          throw new Error(`Failed to create tickets: ${triggerError.message}`);
        }

        // 6. Ambil data order lengkap (join customers, events)
        const orderFull = await sql`
          SELECT o.*, c.name as customer_name, c.phone_number as customer_phone,
                 e.name as event_name, e.location as event_location, e.start_date, e.end_date
          FROM orders o
          LEFT JOIN customers c ON o.customer_id = c.id
          LEFT JOIN events e ON o.event_id = e.id
          WHERE o.id = ${orderId}
          LIMIT 1
        `;

        // Skip WhatsApp notifications - focus on trigger functionality only
        console.log(
          `Skipping WhatsApp notification for order: ${(orderFull as any)[0].order_reference}`,
        );

        // 7. Update status sukses
        await sql`
          UPDATE orders_temp
          SET import_status = 'success', error_message = null
          WHERE id = ${row.id}
        `;
        success++;
        console.log(`Row ${row.row_number} processed successfully`);

        console.log(
          "[v0] Bulk import processed successfully - tickets generated via trigger",
        );
      } catch (err: any) {
        console.error(`Error processing row ${row.row_number}:`, err);
        failed++;
        errors.push(`Row ${row.row_number}: ${err.message}`);
        await sql`
          UPDATE orders_temp
          SET import_status = 'error', error_message = ${err.message}
          WHERE id = ${row.id}
        `;
      }
    }

    console.log(`Import completed. Success: ${success}, Failed: ${failed}`);
    if (errors.length > 0) {
      console.error("Import errors:", errors);
    }

    // FALLBACK: Check and fix missing custom field answers after all processing
    if (success > 0) {
      console.log("Running fallback check for missing custom field answers...");
      try {
        await sql`
          SELECT public.fallback_insert_custom_field_answers()
        `;
        console.log("Fallback custom field insert completed successfully");
      } catch (fallbackError: any) {
        console.error("Fallback custom field insert failed:", fallbackError);
        // Don't fail the whole import for fallback errors
      }
    }

    return NextResponse.json({ success, failed, errors });
  } catch (err: any) {
    console.error("Import process error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function formatEventDate(start: string, end: string) {
  if (!start || !end) return "-";
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const s = new Date(start);
  const e = new Date(end);
  const sDay = days[s.getDay()];
  const sDate = s.getDate();
  const sMonth = months[s.getMonth()];
  const sYear = s.getFullYear();
  const sTime = s.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const eDay = days[e.getDay()];
  const eDate = e.getDate();
  const eMonth = months[e.getMonth()];
  const eYear = e.getFullYear();
  const eTime = e.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return `${sDay}, ${sDate} ${sMonth} ${sYear} jam ${sTime} - ${eDay}, ${eDate} ${eMonth} ${eYear} jam ${eTime}`;
}
