import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    const result = await sql`SELECT NOW() as current_time, version() as db_version`

    const stats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM events) as total_events,
        (SELECT COUNT(*) FROM customers) as total_customers,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM tickets) as total_tickets
    `

    return NextResponse.json({
      success: true,
      connection: "Neon database connected successfully",
      timestamp: (result as any)[0]?.current_time,
      database_version: (result as any)[0]?.db_version,
      statistics: (stats as any)[0],
    })
  } catch (error: any) {
    console.error("Database connection test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Database connection failed",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
