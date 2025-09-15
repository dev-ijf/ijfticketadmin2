import { type NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/database";

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
    const rows = await sql`
      SELECT * FROM orders_temp
      WHERE upload_session_id = ${upload_session_id}
      AND import_status = 'pending'
      ORDER BY row_number ASC
    `;

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const row of rows || []) {
      try {
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

        // 3. Ambil tickets_per_purchase dari ticket_types
        const ticketTypeResult = await sql`
          SELECT tickets_per_purchase FROM ticket_types WHERE id = ${row.ticket_type_id} LIMIT 1
        `;

        const ticketsPerPurchase =
          (ticketTypeResult as any)[0]?.tickets_per_purchase || 1;
        const totalTickets = (row.quantity || 1) * ticketsPerPurchase;

        // 4. Insert tickets (sebanyak totalTickets)
        for (let i = 0; i < totalTickets; i++) {
          await sql`
            INSERT INTO tickets (
              attendee_name, attendee_email, ticket_type_id, order_id,
              ${row.barcode_id ? "ticket_code," : ""} created_at, updated_at
            )
            VALUES (
              ${row.customer_name}, ${row.customer_email}, ${row.ticket_type_id}, ${orderId},
              ${row.barcode_id ? `${row.barcode_id},` : ""} NOW(), NOW()
            )
          `;
        }

        // 5. Ambil data order lengkap (join customers, events)
        const orderFull = await sql`
          SELECT o.*, c.name as customer_name, c.phone_number as customer_phone,
                 e.name as event_name, e.location as event_location, e.start_date, e.end_date
          FROM orders o
          LEFT JOIN customers c ON o.customer_id = c.id
          LEFT JOIN events e ON o.event_id = e.id
          WHERE o.id = ${orderId}
          LIMIT 1
        `;

        // 6. WhatsApp paid & log
        let waError: string | null = null;
        let waRequestPayload = null;
        let waResponsePayload = null;
        let waStatus: "sent" | "failed" = "sent";
        let waBody = "";
        const templateId = 4;

        // Fetch template
        const template = await sql`
          SELECT * FROM notification_templates WHERE id = ${templateId} LIMIT 1
        `;

        if (template.length > 0) {
          waBody = template[0].body;
          // Ganti ticket_link pakai CHILD_URL
          const ticket_link = `${CHILD_URL}/payment/${(orderFull as any)[0].order_reference}`;
          const vars = {
            "{{customer.name}}": (orderFull as any)[0].customer_name || "-",
            "{{event.name}}": (orderFull as any)[0].event_name || "-",
            "{{event_name}}": (orderFull as any)[0].event_name || "-",
            "{{event_location}}": (orderFull as any)[0].event_location || "-",
            "{{event_start_date}}": formatEventDate(
              (orderFull as any)[0].start_date,
              (orderFull as any)[0].end_date,
            ),
            "{{order.order_reference}}": (orderFull as any)[0].order_reference,
            "{{ticket_link}}": ticket_link,
          };
          Object.entries(vars).forEach(([k, v]) => {
            waBody = waBody.replaceAll(k, String(v));
          });

          const phone = (orderFull as any)[0].customer_phone || "";
          waRequestPayload = {
            messageType: "text",
            to: phone,
            body: waBody,
          };

          try {
            if (!STARSENDER_URL || !STARSENDER_TOKEN)
              throw new Error("Konfigurasi WhatsApp (env) belum di-set.");
            if (!phone) throw new Error("Nomor HP customer tidak ada.");

            const waRes = await fetch(STARSENDER_URL, {
              method: "POST",
              headers: {
                Authorization: STARSENDER_TOKEN,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(waRequestPayload),
            });
            waResponsePayload = await waRes.json().catch(() => null);
            if (!waRes.ok) {
              waError = waResponsePayload || (await waRes.text());
              waStatus = "failed";
            }
          } catch (err: any) {
            waError = err.message;
            waStatus = "failed";
          }

          // Log ke notification_logs
          await sql`
            INSERT INTO notification_logs (
              order_reference, channel, trigger_on, recipient_phone,
              body, request_payload, response_payload, created_at, updated_at
            )
            VALUES (
              ${(orderFull as any)[0].order_reference}, 'whatsapp', 'paid', null, ${phone},
              ${waBody}, ${JSON.stringify(waRequestPayload)}, ${JSON.stringify(waResponsePayload)}, NOW(), NOW()
            )
          `;

          if (waStatus === "failed")
            throw new Error("Gagal kirim WhatsApp: " + (waError || ""));
        }

        // 7. Update status sukses
        await sql`
          UPDATE orders_temp
          SET import_status = 'success', error_message = null
          WHERE id = ${row.id}
        `;
        success++;

        console.log(
          "[v0] WhatsApp messaging enabled - bulk import processed successfully with notification",
        );
      } catch (err: any) {
        failed++;
        errors.push(`Row ${row.row_number}: ${err.message}`);
        await sql`
          UPDATE orders_temp
          SET import_status = 'error', error_message = ${err.message}
          WHERE id = ${row.id}
        `;
      }
    }

    return NextResponse.json({ success, failed, errors });
  } catch (err: any) {
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
