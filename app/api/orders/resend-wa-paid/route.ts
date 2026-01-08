import { type NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/database";

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

const STARSENDER_URL =
  process.env.STARSENDER_URL || "https://api.starsender.online/api/send";
const STARSENDER_TOKEN =
  process.env.STARSENDER_TOKEN || "94d86acf-0dcd-4c91-b104-6594a7a609dc";

function formatEventDate(start: string | null, end: string | null) {
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

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();
    
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    const sql = getSql();

    // Get order details with customer and event info
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
      WHERE o.id = ${orderId}
    `;

    if (orderResult.length === 0) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 },
      );
    }

    const order = (orderResult as any)[0];

    // Check if order status is paid
    if (order.status !== "paid") {
      return NextResponse.json(
        { error: "Only paid orders can resend WhatsApp paid notification" },
        { status: 400 },
      );
    }

    // Get WhatsApp template (template id 4 for paid notification)
    const templateResult = await sql`
      SELECT * FROM notification_templates WHERE id = 4 LIMIT 1
    `;

    if (templateResult.length === 0) {
      return NextResponse.json(
        { error: "WhatsApp template not found (id: 4)" },
        { status: 404 },
      );
    }

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
    if (!phone) {
      return NextResponse.json(
        { error: "Customer phone number not found" },
        { status: 400 },
      );
    }

    if (!STARSENDER_URL || !STARSENDER_TOKEN) {
      return NextResponse.json(
        { error: "STARSENDER_URL or STARSENDER_TOKEN not configured" },
        { status: 500 },
      );
    }

    const waRequestPayload = {
      messageType: "text",
      to: phone,
      body: waBody,
    };

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
      return NextResponse.json(
        {
          error: "Failed to send WhatsApp message",
          details: waResponsePayload || "Unknown error",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "WhatsApp paid notification sent successfully",
    });
  } catch (error: any) {
    console.error("Error resending WhatsApp paid notification:", error);
    return NextResponse.json(
      {
        error: "Failed to resend WhatsApp paid notification",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
