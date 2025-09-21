import { NextResponse } from "next/server";
import { getSql } from "@/lib/database";

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const sql = getSql();
    let tickets;

    console.log(`Fetching tickets. Event ID parameter: ${eventId}`);

    if (eventId && eventId !== "all") {
      // --- LOGIKA BARU: Panggil fungsi pivot jika eventId spesifik ---
      console.log(
        `Executing get_pivoted_ticket_data_by_event for event_id: ${eventId}`,
      );
      tickets = await sql`
        SELECT * FROM get_pivoted_ticket_data_by_event(${eventId})
      `;
      console.log(
        `Fetched ${tickets.length} pivoted tickets for event ${eventId}`,
      );
    } else {
      // --- LOGIKA LAMA: Ambil data standar jika "Semua Event" ---
      console.log("Fetching all standard tickets...");
      tickets = await sql`
        SELECT
          t.id,
          t.ticket_code,
          t.attendee_name,
          t.attendee_email,
          t.is_checked_in,
          t.checked_in_at,
          t.created_at,
          tt.name as ticket_type_name,
          o.order_reference,
          o.event_id,
          e.name as event_name
        FROM tickets t
        LEFT JOIN ticket_types tt ON t.ticket_type_id = tt.id
        LEFT JOIN orders o ON t.order_id = o.id
        LEFT JOIN events e ON o.event_id = e.id
        ORDER BY t.created_at DESC
      `;
      console.log(`Fetched ${tickets.length} standard tickets`);
    }

    const response = NextResponse.json(tickets);
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate, max-age=0",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error: any) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch tickets",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    console.log("PUT request body:", body);

    const sql = getSql();

    if (body.ids && Array.isArray(body.ids)) {
      const { ids, isCheckedIn } = body;
      const now = new Date().toISOString();
      const checkedInValue = Boolean(isCheckedIn);
      const checkedInAt = checkedInValue ? now : null;

      const result = await sql`
        UPDATE tickets
        SET
          is_checked_in = ${checkedInValue},
          checked_in_at = ${checkedInAt},
          updated_at = ${now}
        WHERE id = ANY(${ids})
        RETURNING id, is_checked_in, checked_in_at
      `;

      const response = NextResponse.json({
        success: true,
        updated: result.length,
        result,
      });
      response.headers.set(
        "Cache-Control",
        "no-cache, no-store, must-revalidate, max-age=0",
      );
      response.headers.set("Pragma", "no-cache");
      response.headers.set("Expires", "0");
      return response;
    } else if (body.ticketId) {
      const { ticketId, isCheckedIn } = body;
      const ticketIdNum = parseInt(ticketId);
      const checkedInValue = Boolean(isCheckedIn);
      const now = new Date().toISOString();
      const checkedInAt = checkedInValue ? now : null;

      const result = await sql`
        UPDATE tickets
        SET
          is_checked_in = ${checkedInValue},
          checked_in_at = ${checkedInAt},
          updated_at = ${now}
        WHERE id = ${ticketIdNum}
        RETURNING id, is_checked_in, checked_in_at, updated_at
      `;

      if (result.length === 0) {
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
      }

      const response = NextResponse.json({
        success: true,
        ticketId: ticketIdNum,
        updatedTicket: result[0],
      });
      response.headers.set(
        "Cache-Control",
        "no-cache, no-store, must-revalidate, max-age=0",
      );
      response.headers.set("Pragma", "no-cache");
      response.headers.set("Expires", "0");
      return response;
    } else {
      return NextResponse.json(
        { error: "Invalid request - missing ticketId or ids" },
        { status: 400 },
      );
    }
  } catch (error: any) {
    console.error("Error updating ticket(s):", error);
    return NextResponse.json(
      { error: "Failed to update ticket(s)", details: error?.message },
      { status: 500 },
    );
  }
}
