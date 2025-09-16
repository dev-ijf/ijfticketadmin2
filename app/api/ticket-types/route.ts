import { NextResponse } from "next/server";
import { getSql } from "@/lib/database";

export async function GET(request: Request) {
  const sql = getSql();
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json(
      { error: "Event ID is required" },
      { status: 400 },
    );
  }

  try {
    const eventData = await sql`SELECT name FROM events WHERE id = ${eventId}`;
    const ticketsData =
      await sql`SELECT * FROM ticket_types WHERE event_id = ${eventId} ORDER BY created_at DESC`;

    return NextResponse.json({
      eventName: eventData[0]?.name || "",
      ticketTypes: ticketsData,
    });
  } catch (error) {
    console.error("Error fetching ticket types:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket types" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const sql = getSql();
  try {
    const body = await request.json();
    const { event_id, name, price, quantity_total } = body;

    const result = await sql`
      INSERT INTO ticket_types (event_id, name, price, quantity_total, created_at, updated_at)
      VALUES (${event_id}, ${name}, ${price}, ${quantity_total}, NOW(), NOW())
      RETURNING id
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating ticket type:", error);
    return NextResponse.json(
      { error: "Failed to create ticket type" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const sql = getSql();
  try {
    const body = await request.json();
    const { id, name, price, quantity_total } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Ticket Type ID is required" },
        { status: 400 },
      );
    }

    await sql`
      UPDATE ticket_types
      SET
        name = ${name},
        price = ${price},
        quantity_total = ${quantity_total},
        updated_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({ message: "Ticket type updated successfully" });
  } catch (error) {
    console.error("Error updating ticket type:", error);
    return NextResponse.json(
      { error: "Failed to update ticket type" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const sql = getSql();
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Ticket Type ID is required" },
        { status: 400 },
      );
    }

    await sql`DELETE FROM ticket_types WHERE id = ${id}`;

    return NextResponse.json({ message: "Ticket type deleted successfully" });
  } catch (error) {
    console.error("Error deleting ticket type:", error);
    return NextResponse.json(
      { error: "Failed to delete ticket type" },
      { status: 500 },
    );
  }
}
