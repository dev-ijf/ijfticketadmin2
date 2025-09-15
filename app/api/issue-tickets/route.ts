import { type NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/database";

const STARSENDER_URL =
  process.env.STARSENDER_URL || "https://api.starsender.online/api/send";
const STARSENDER_TOKEN =
  process.env.STARSENDER_TOKEN || "94d86acf-0dcd-4c91-b104-6594a7a609dc";

export async function POST(req: NextRequest) {
  const { order_id } = await req.json();
  if (!order_id)
    return NextResponse.json({ error: "order_id required" }, { status: 400 });

  try {
    await sql`UPDATE orders SET status = 'paid', updated_at = NOW() WHERE id = ${order_id}`;

    const orderResult = await sql`
      SELECT
        o.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone_number as customer_phone,
        e.name as event_name,
        e.location as event_location,
        e.start_date,
        e.end_date
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN events e ON o.event_id = e.id
      WHERE o.id = ${order_id}
    `;

    if (orderResult.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = (orderResult as any)[0];

    const items = await sql`
      SELECT * FROM order_items WHERE order_id = ${order_id}
    `;

    if (items.length === 0) {
      return NextResponse.json(
        { error: "No order_items found" },
        { status: 400 },
      );
    }

    // Generate tickets
    const tickets = items.flatMap((item) => {
      const qty = Number(item.quantity) || 0;
      const eff = Number(item.effective_ticket_count) || 0;
      if (qty < 1 || eff < 1) return [];
      return Array.from({ length: qty * eff }).map(() => ({
        order_id: order.id,
        ticket_type_id: item.ticket_type_id,
        attendee_name: order.customer_name || "-",
        attendee_email: order.customer_email || null,
      }));
    });

    if (tickets.length === 0) {
      return NextResponse.json(
        { error: "No valid tickets to create" },
        { status: 400 },
      );
    }

    for (const ticket of tickets) {
      await sql`
        INSERT INTO tickets (order_id, ticket_type_id, attendee_name, attendee_email, created_at, updated_at)
        VALUES (${ticket.order_id}, ${ticket.ticket_type_id}, ${ticket.attendee_name}, ${ticket.attendee_email}, NOW(), NOW())
      `;
    }

    // Send WhatsApp notification
    const templateResult = await sql`
      SELECT * FROM notification_templates WHERE id = 4 LIMIT 1
    `;

    if (templateResult.length > 0) {
      const template = (templateResult as any)[0];
      let waBody = template.body || template.content || "";

      const CHILD_URL =
        process.env.CHILD_URL || "https://event.kreativaglobal.id";
      const ticket_link = `${CHILD_URL}/payment/${order.order_reference}`;
      const event_date = formatEventDate(order.start_date, order.end_date);

      const vars = {
        "{{customer.name}}": order.customer_name || "-",
        "{{customer_name}}": order.customer_name || "-",
        "{{event.name}}": order.event_name || "-",
        "{{event_name}}": order.event_name || "-",
        "{{event_location}}": order.event_location || "-",
        "{{event_date}}": event_date,
        "{{order.order_reference}}": order.order_reference,
        "{{ticket_link}}": ticket_link,
      };

      Object.entries(vars).forEach(([k, v]) => {
        waBody = waBody.replaceAll(k, String(v));
      });

      const phone = order.customer_phone || "";
      if (phone && STARSENDER_URL && STARSENDER_TOKEN) {
        const waRequestPayload = {
          messageType: "text",
          to: phone,
          body: waBody,
        };

        try {
          const waRes = await fetch(STARSENDER_URL, {
            method: "POST",
            headers: {
              Authorization: STARSENDER_TOKEN,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(waRequestPayload),
          });

          const waResponsePayload = await waRes.json().catch(() => null);

          // Log notification
          await sql`
            INSERT INTO notification_logs (
              order_reference, channel, trigger_on, recipient_email, recipient_phone,
              request_payload, response_payload, body, created_at, updated_at
            )
            VALUES (
              ${order.order_reference}, 'whatsapp', 'paid', null, ${phone},
              ${JSON.stringify(waRequestPayload)}, ${JSON.stringify(waResponsePayload)}, ${waBody}, NOW(), NOW()
            )
          `;

          if (!waRes.ok) {
            console.error("WhatsApp send failed:", waResponsePayload);
          }
        } catch (error) {
          console.error("WhatsApp send error:", error);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in issue-tickets:", error);
    return NextResponse.json(
      { error: "Internal server error", detail: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { order_id } = await req.json();
  if (!order_id)
    return NextResponse.json({ error: "order_id required" }, { status: 400 });

  try {
    await sql`UPDATE orders SET status = 'pending', updated_at = NOW() WHERE id = ${order_id}`;

    await sql`DELETE FROM tickets WHERE order_id = ${order_id}`;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in delete tickets:", error);
    return NextResponse.json(
      { error: "Internal server error", detail: error.message },
      { status: 500 },
    );
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
