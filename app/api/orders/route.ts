import { type NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/database"

export async function GET() {
  try {
    const sql = getSql()

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
    `

    // Get events for filter dropdown
    const events = await sql`SELECT id, name FROM events ORDER BY name`

    // Get payment channels for filter dropdown
    const paymentChannels =
      await sql`SELECT id, pg_name as name, vendor as type, category FROM payment_channels WHERE is_active = true ORDER BY sort_order, pg_name`

    return NextResponse.json({
      orders,
      events,
      paymentChannels,
    })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, status } = await request.json()
    const sql = getSql()

    await sql`
      UPDATE orders 
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}
