import { NextResponse } from "next/server"
import { getSql } from "@/lib/database"

export async function GET() {
  try {
    const sql = getSql()

    const ticketTypes = await sql`
      SELECT id, name, event_id
      FROM ticket_types
      ORDER BY name
    `

    return NextResponse.json(ticketTypes)
  } catch (error) {
    console.error("Error fetching ticket types:", error)
    return NextResponse.json({ error: "Failed to fetch ticket types" }, { status: 500 })
  }
}
