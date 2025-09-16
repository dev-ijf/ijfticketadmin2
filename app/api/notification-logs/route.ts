import { type NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/database";

export async function GET() {
  const sql = getSql();
  try {
    const logs = await sql`
      SELECT
        nl.id,
        nl.order_reference,
        nl.recipient_phone,
        nl.created_at,
        nl.request_payload,
        nl.response_payload,
        nl.channel,
        nl.trigger_on,
        c.name as customer_name
      FROM notification_logs nl
      LEFT JOIN orders o ON nl.order_reference = o.order_reference
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY nl.created_at DESC
    `;
    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching notification logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification logs" },
      { status: 500 },
    );
  }
}
