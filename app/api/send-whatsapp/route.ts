import { type NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, templateId = 4 } = body;

    const STARSENDER_URL = process.env.STARSENDER_URL;
    const STARSENDER_TOKEN = process.env.STARSENDER_TOKEN;
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

    if (!STARSENDER_URL || !STARSENDER_TOKEN) {
      return NextResponse.json(
        { error: "WhatsApp configuration not set" },
        { status: 500 },
      );
    }

    // Get order details
    const orderResult = await sql`
      SELECT
        o.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone_number,
        e.name as event_name,
        e.location as event_location
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN events e ON o.event_id = e.id
      WHERE o.id = ${orderId}
    `;

    if (!orderResult.length) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = (orderResult as any)[0];

    // Get template
    const templateResult = await sql`
      SELECT * FROM notification_templates
      WHERE id = ${templateId} AND channel = 'whatsapp'
    `;

    if (!templateResult.length) {
      return NextResponse.json(
        { error: "WhatsApp template not found" },
        { status: 404 },
      );
    }

    const template = (templateResult as any)[0];

    // Prepare message body
    let messageBody = template.body;
    const ticketLink = `${BASE_URL || "https://event.kreativaglobal.id"}/payment/${order.order_reference}`;

    const variables = {
      "{{customer.name}}": order.customer_name || "-",
      "{{event.name}}": order.event_name || "-",
      "{{order.order_reference}}": order.order_reference,
      "{{ticket_link}}": ticketLink,
    };

    Object.entries(variables).forEach(([key, value]) => {
      messageBody = messageBody.replaceAll(key, String(value));
    });

    // Send WhatsApp message
    const phone = order.phone_number;
    if (!phone) {
      return NextResponse.json(
        { error: "Customer phone number not found" },
        { status: 400 },
      );
    }

    const response = await fetch(STARSENDER_URL, {
      method: "POST",
      headers: {
        Authorization: STARSENDER_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messageType: "text",
        to: phone,
        body: messageBody,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WhatsApp API error: ${errorText}`);
    }

    // Log the notification
    await sql`
      INSERT INTO notification_logs (
        order_reference, channel, trigger_on, recipient_phone, body, created_at
      ) VALUES (
        ${order.order_reference}, 'whatsapp', 'paid_notification', ${phone}, ${messageBody}, NOW()
      )
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("WhatsApp send error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send WhatsApp message" },
      { status: 500 },
    );
  }
}
