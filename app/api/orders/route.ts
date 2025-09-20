import { type NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/database";

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    const result = await sql`
      UPDATE orders
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, status, updated_at
    `;

    console.log("Update result:", result);

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
