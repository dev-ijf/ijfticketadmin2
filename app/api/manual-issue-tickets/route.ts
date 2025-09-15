import { type NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/database";

const STARSENDER_URL = process.env.STARSENDER_URL;
const STARSENDER_TOKEN = process.env.STARSENDER_TOKEN;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      eventId,
      ticketTypeId,
      paymentChannelId,
      proofTransfer,
    } = body;
    if (
      !name ||
      !email ||
      !phone ||
      !eventId ||
      !ticketTypeId ||
      !paymentChannelId ||
      !proofTransfer
    ) {
      return NextResponse.json(
        { error: "Semua field wajib diisi" },
        { status: 400 },
      );
    }

    let customerId: number | null = null;
    const existingCustomer = await sql`
      SELECT id FROM customers WHERE email = ${email} LIMIT 1
    `;

    if (existingCustomer.length > 0) {
      customerId = (existingCustomer as any)[0].id;
    } else {
      const newCustomer = await sql`
        INSERT INTO customers (name, email, phone_number, created_at, updated_at)
        VALUES (${name}, ${email}, ${phone}, NOW(), NOW())
        RETURNING id
      `;
      customerId = (newCustomer as any)[0].id;
    }

    const ticketTypeResult = await sql`
      SELECT id, name, price, tickets_per_purchase
      FROM ticket_types
      WHERE id = ${ticketTypeId}
      LIMIT 1
    `;

    if (ticketTypeResult.length === 0) {
      return NextResponse.json(
        { error: "Jenis tiket tidak ditemukan" },
        { status: 400 },
      );
    }

    const ticketType = ticketTypeResult[0];

    const orderReference = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const grossAmount = ticketType.price;

    const orderResult = await sql`
      INSERT INTO orders (
        order_reference, customer_id, event_id, gross_amount, discount_amount,
        final_amount, payment_channel_id, status, proof_transfer, created_at, updated_at
      )
      VALUES (
        ${orderReference}, ${customerId}, ${Number(eventId)}, ${grossAmount}, 0,
        ${grossAmount}, ${Number(paymentChannelId)}, 'paid', ${proofTransfer}, NOW(), NOW()
      )
      RETURNING id, order_reference, event_id, customer_id
    `;

    const orderId = (orderResult as any)[0].id;

    const ticketsPerPurchase = ticketType.tickets_per_purchase || 1;
    for (let i = 0; i < ticketsPerPurchase; i++) {
      await sql`
        INSERT INTO tickets (attendee_name, attendee_email, ticket_type_id, order_id, created_at, updated_at)
        VALUES (${name}, ${email}, ${Number(ticketTypeId)}, ${orderId}, NOW(), NOW())
      `;
    }

    const templateResult = await sql`
      SELECT * FROM notification_templates WHERE id = 4 LIMIT 1
    `;

    if (templateResult.length > 0) {
      const template = (templateResult as any)[0];
      let waBody = template.body;
      const CHILD_URL =
        process.env.CHILD_URL || "https://event.kreativaglobal.id";
      const ticket_link = `${CHILD_URL}/payment/${orderReference}`;
      const vars = {
        "{{customer.name}}": name,
        "{{event.name}}": "",
        "{{order.order_reference}}": orderReference,
        "{{ticket_link}}": ticket_link,
      };
      Object.entries(vars).forEach(([k, v]) => {
        waBody = waBody.replaceAll(k, String(v));
      });

      const waRequestPayload = {
        messageType: "text",
        to: phone,
        body: waBody,
      };
      let waResponsePayload = null;
      let waError = null;

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
        }
      } catch (err: any) {
        waError = err.message;
      }

      await sql`
        INSERT INTO notification_logs (
          order_reference, channel, trigger_on, recipient_email, recipient_phone,
          request_payload, response_payload, created_at, updated_at
        )
        VALUES (
          ${orderReference}, 'whatsapp', 'paid', null, ${phone},
          ${JSON.stringify(waRequestPayload)}, ${JSON.stringify(waResponsePayload)}, NOW(), NOW()
        )
      `;

      if (waError)
        return NextResponse.json(
          { error: "Gagal kirim WhatsApp: " + waError },
          { status: 500 },
        );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 },
    );
  }
}
