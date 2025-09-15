import { NextResponse } from "next/server"
import { getSql } from "@/lib/database"

export async function GET() {
  try {
    const sql = getSql()

    const tickets = await sql`
      SELECT 
        t.*,
        c.name as customer_name,
        c.email as customer_email,
        e.name as event_name,
        tt.name as ticket_type_name,
        o.status as order_status
      FROM tickets t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN events e ON t.event_id = e.id
      LEFT JOIN ticket_types tt ON t.ticket_type_id = tt.id
      LEFT JOIN orders o ON t.order_id = o.id
      ORDER BY t.created_at DESC
    `

    return NextResponse.json(tickets)
  } catch (error) {
    console.error("Error fetching tickets:", error)
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
  }
}
