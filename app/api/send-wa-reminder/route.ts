import { type NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/database";

const STARSENDER_URL =
  process.env.STARSENDER_URL || "https://api.starsender.online/api/send";
const STARSENDER_TOKEN =
  process.env.STARSENDER_TOKEN || "94d86acf-0dcd-4c91-b104-6594a7a609dc";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com";
const CHILD_URL = process.env.CHILD_URL || "https://event.kreativaglobal.id";

function toWIB(date: string) {
  return new Date(new Date(date).getTime() + 7 * 60 * 60 * 1000);
}

function formatEventDateIndo(start: string, end?: string) {
  if (!start) return "-";
  const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const bulan = [
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
  function parse(str: string) {
    let [tgl, jam] = str.replace("T", " ").split(" ");
    if (jam && jam.includes("+")) jam = jam.split("+")[0];
    const [tahun, bulanIdx, tanggal] = tgl.split("-");
    const dateObj = new Date(`${tgl}T${jam || "00:00:00"}`);
    return `${hari[dateObj.getDay()]}, ${tanggal} ${bulan[Number.parseInt(bulanIdx, 10) - 1]} ${tahun} Pukul ${jam}`;
  }
  if (end) return `${parse(start)} - ${parse(end)}`;
  return parse(start);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const template_id = body.template_id || 6;
    const trigger_on = body.trigger_on || "reminder";
    const customer_name = body.name || "-";
    const event_name = body.event_name || body["event.name"] || "-";
    const event_location = body.event_location || "-";

    let eventStart = null;
    let eventEnd = null;
    if (body.order_id) {
      const orderData = await sql`
        SELECT o.id, o.event_id, e.start_date, e.end_date
        FROM orders o
        LEFT JOIN events e ON o.event_id = e.id
        WHERE o.id = ${body.order_id}
        LIMIT 1
      `;
      if (orderData.length > 0) {
        eventStart = (orderData as any)[0].start_date;
        eventEnd = (orderData as any)[0].end_date;
      }
    }

    const event_date = formatEventDateIndo(eventStart, eventEnd);
    const order_reference = body.order_reference || "-";
    const ticket_link = `${CHILD_URL}/payment/${order_reference}`;
    const phone = body.phone_number || body.recipient_phone || "";
    if (!phone)
      return NextResponse.json(
        { error: "No customer phone number" },
        { status: 400 },
      );

    const templateResult = await sql`
      SELECT * FROM notification_templates WHERE id = ${template_id} LIMIT 1
    `;
    if (templateResult.length === 0) {
      return NextResponse.json(
        { error: "WA template not found" },
        { status: 500 },
      );
    }
    const template = (templateResult as any)[0];

    // Prepare message body
    let waBody = template.body || template.content || "";
    const vars = {
      "{{customer.name}}": customer_name,
      "{{customer_name}}": customer_name,
      "{{event.name}}": event_name,
      "{{event_name}}": event_name,
      "{{event_location}}": event_location,
      "{{event_date}}": event_date,
      "{{order.order_reference}}": order_reference,
      "{{ticket_link}}": ticket_link,
    };
    Object.entries(vars).forEach(([k, v]) => {
      waBody = waBody.replaceAll(k, String(v));
    });

    // Send WhatsApp directly
    const waRequestPayload = {
      messageType: "text",
      to: phone,
      body: waBody,
    };
    let waResponsePayload = null;
    let waError = null;
    let waStatus: "sent" | "failed" = "sent";

    try {
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

    await sql`
      INSERT INTO notification_logs (
        order_reference, channel, trigger_on, recipient_email, recipient_phone,
        request_payload, response_payload, body, created_at, updated_at
      )
      VALUES (
        ${order_reference}, 'whatsapp', ${trigger_on}, null, ${phone},
        ${JSON.stringify(waRequestPayload)}, ${JSON.stringify(waResponsePayload)}, ${waBody}, NOW(), NOW()
      )
    `;

    if (waStatus === "failed") {
      return NextResponse.json(
        { error: "Gagal kirim WhatsApp", detail: waError },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
