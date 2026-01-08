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

async function sendWhatsAppPaidNotification(orderId: number) {
  try {
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
      console.error(`Order ${orderId} not found for WhatsApp notification`);
      return;
    }

    const order = (orderResult as any)[0];

    // Get WhatsApp template (template id 4 for paid notification)
    const templateResult = await sql`
      SELECT * FROM notification_templates WHERE id = 4 LIMIT 1
    `;

    if (templateResult.length === 0) {
      console.error("WhatsApp template not found (id: 4)");
      return;
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
      console.error(`No phone number for order ${orderId}`);
      return;
    }

    if (!STARSENDER_URL || !STARSENDER_TOKEN) {
      console.error("STARSENDER_URL or STARSENDER_TOKEN not configured");
      return;
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
      console.error("WhatsApp send failed:", waResponsePayload);
    } else {
      console.log(`WhatsApp paid notification sent successfully for order ${orderId}`);
    }
  } catch (error) {
    console.error(`Error sending WhatsApp paid notification for order ${orderId}:`, error);
  }
}

export async function GET() {
  try {
    const sql = getSql();

    // Get orders with related data
    const orders = await sql`
      SELECT
        o.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone_number as customer_phone,
        e.name as event_name,
        e.slug as event_slug,
        pc.pg_name as payment_channel_name,
        pc.vendor as payment_channel_type,
        pc.category as payment_channel_category
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN events e ON o.event_id = e.id
      LEFT JOIN payment_channels pc ON o.payment_channel_id = pc.id
      ORDER BY o.created_at DESC
    `;

    // Get events for filter dropdown
    const events = await sql`SELECT id, name FROM events ORDER BY name`;

    // Get payment channels for filter dropdown
    const paymentChannels =
      await sql`SELECT id, pg_name as name, vendor as type, category FROM payment_channels WHERE is_active = true ORDER BY sort_order, pg_name`;

    const response = NextResponse.json({
      orders,
      events,
      paymentChannels,
    });

    // Add no-cache headers to prevent caching
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate, max-age=0",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch orders",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, status } = await request.json();
    console.log(`Updating order ${id} to status: ${status}`);

    const sql = getSql();

    // Get old status to check if we need to send notification
    const oldOrderResult = await sql`
      SELECT status FROM orders WHERE id = ${id}
    `;
    const oldStatus = oldOrderResult.length > 0 ? oldOrderResult[0].status : null;

    const result = await sql`
      UPDATE orders
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, status, updated_at
    `;

    console.log("Update result:", result);

    // Send WhatsApp paid notification if status changed to "paid"
    // Do this async without blocking the response
    if (status === "paid" && oldStatus !== "paid") {
      // Fire and forget - don't await to avoid blocking response
      sendWhatsAppPaidNotification(id).catch((error) => {
        console.error(`Failed to send WhatsApp notification for order ${id}:`, error);
      });
    }

    const response = NextResponse.json({
      success: true,
      updated: result[0] || null,
    });

    // Add no-cache headers
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate, max-age=0",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error: any) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      {
        error: "Failed to update order",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    const sql = getSql();

    // Get order reference for logging
    const orderResult = await sql`
      SELECT order_reference FROM orders WHERE id = ${id}
    `;
    const orderReference = orderResult.length > 0 ? orderResult[0].order_reference : null;

    // Delete notification logs related to this order
    if (orderReference) {
      await sql`
        DELETE FROM notification_logs WHERE order_reference = ${orderReference}
      `;
    }

    // Delete order (this will cascade delete order_items and tickets due to foreign key constraints)
    await sql`DELETE FROM orders WHERE id = ${id}`;

    console.log(`Order ${id} and all related data deleted successfully`);

    return NextResponse.json({
      success: true,
      message: "Order and all related data deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      {
        error: "Failed to delete order",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
