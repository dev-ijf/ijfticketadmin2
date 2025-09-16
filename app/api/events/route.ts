import { NextResponse } from "next/server";
import { sql } from "@/lib/database";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    if (id) {
      // Fetch single event
      const eventData = await sql`
        SELECT * FROM events WHERE id = ${id}
      `;
      return NextResponse.json(eventData[0]);
    } else {
      // Fetch all events
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
    }
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...eventData } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 },
      );
    }

    await sql`
      UPDATE events
      SET
        name = ${eventData.name},
        slug = ${eventData.slug},
        start_date = ${eventData.start_date || null},
        end_date = ${eventData.end_date || null},
        location = ${eventData.location},
        description = ${eventData.description},
        image_url = ${eventData.image_url},
        updated_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({ message: "Event updated successfully" });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const eventData = await request.json();
    const result = await sql`
      INSERT INTO events (name, slug, start_date, end_date, location, description, image_url, created_at, updated_at)
      VALUES (${eventData.name}, ${eventData.slug}, ${eventData.start_date || null}, ${eventData.end_date || null}, ${eventData.location}, ${eventData.description}, ${eventData.image_url}, NOW(), NOW())
      RETURNING id
    `;
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 },
      );
    }

    // Hapus dulu semua yang berhubungan dengan event ini
    await sql`DELETE FROM tickets WHERE ticket_type_id IN (SELECT id FROM ticket_types WHERE event_id = ${id})`;
    await sql`DELETE FROM ticket_types WHERE event_id = ${id}`;
    await sql`DELETE FROM orders WHERE event_id = ${id}`;
    await sql`DELETE FROM events WHERE id = ${id}`;

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 },
    );
  }
}
