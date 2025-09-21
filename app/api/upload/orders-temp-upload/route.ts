import { type NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/database";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { rows } = await req.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "Rows kosong atau format salah" },
        { status: 400 },
      );
    }
    const upload_session_id = randomUUID();

    const sql = getSql();

    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      await sql`
        INSERT INTO orders_temp (
          upload_session_id, row_number, customer_name, customer_email, customer_phone_number,
          event_id, ticket_type_id, quantity, final_amount, order_date, payment_channel_id,
          barcode_id, custom_answers, import_status, error_message, created_at, updated_at
        )
        VALUES (
          ${upload_session_id}, ${idx + 1}, ${row.customer_name || null}, ${row.customer_email || null},
          ${row.customer_phone_number || null}, ${row.event_id ? Number(row.event_id) : null},
          ${row.ticket_type_id ? Number(row.ticket_type_id) : null}, ${row.quantity ? Number(row.quantity) : 1},
          ${row.final_amount ? Number(row.final_amount) : null}, ${row.order_date || null},
          ${row.payment_channel_id ? Number(row.payment_channel_id) : null}, ${row.barcode_id || null},
          ${row.custom_answers ? JSON.stringify(row.custom_answers) : null}, 'pending', null, NOW(), NOW()
        )
      `;
    }

    return NextResponse.json({ upload_session_id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
