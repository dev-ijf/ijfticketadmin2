import { NextResponse } from "next/server"
import { getSql } from "@/lib/database"

export async function GET() {
  try {
    const sql = getSql()

    const tickets = await sql`
      SELECT 
        t.*,
        tt.name as ticket_type_name,
        o.order_reference,
        o.event_id,
        e.name as event_name
      FROM tickets t
      LEFT JOIN ticket_types tt ON t.ticket_type_id = tt.id
      LEFT JOIN orders o ON t.order_id = o.id
      LEFT JOIN events e ON o.event_id = e.id
      ORDER BY t.created_at DESC
    `

    return NextResponse.json(tickets)
  } catch (error) {
    console.error("Error fetching tickets:", error)
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { ticketId, isCheckedIn } = await request.json()
    const sql = getSql()

    const updateData = {
      is_checked_in: isCheckedIn,
      checked_in_at: isCheckedIn ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }

    await sql`
      UPDATE tickets 
      SET 
        is_checked_in = ${updateData.is_checked_in},
        checked_in_at = ${updateData.checked_in_at},
        updated_at = ${updateData.updated_at}
      WHERE id = ${ticketId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating ticket:", error)
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 })
  }
}
