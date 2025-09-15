import { NextResponse } from "next/server";
import { sql } from "@/lib/database";

export async function GET() {
  try {
    const eventsData = await sql`
      SELECT e.*,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', tt.id,
                   'name', tt.name,
                   'price', tt.price,
                   'quantity_total', tt.quantity_total,
                   'quantity_sold', tt.quantity_sold
                 )
               ) FILTER (WHERE tt.id IS NOT NULL),
               '[]'::json
             ) as ticket_types
      FROM events e
      LEFT JOIN ticket_types tt ON e.id = tt.event_id
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `;

    return NextResponse.json(eventsData as any);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}
