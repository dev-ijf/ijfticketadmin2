import { NextResponse } from "next/server";
import { getSql } from "@/lib/database";

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const sql = getSql();
    console.log("Fetching tickets from database...");

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
    `;

    console.log(`Fetched ${tickets.length} tickets`);
    const response = NextResponse.json(tickets);

    // Add no-cache headers to prevent caching
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

    // Check if this is a bulk update (has ids array) or single update (has ticketId)
    if (body.ids && Array.isArray(body.ids)) {
      // Bulk update for multiple tickets
      const { ids, isCheckedIn } = body;
      console.log(
        `Bulk update: ${ids.length} tickets, isCheckedIn: ${isCheckedIn}`,
      );

      if (ids.length === 0) {
        return NextResponse.json(
          { error: "No tickets to update" },
          { status: 400 },
        );
      }

      const now = new Date().toISOString();
      const checkedInValue = Boolean(isCheckedIn);
      const checkedInAt = checkedInValue ? now : null;

      console.log(
        `Update values: is_checked_in=${checkedInValue}, checked_in_at=${checkedInAt}`,
      );

      const result = await sql`
        UPDATE tickets
        SET
          is_checked_in = ${checkedInValue},
          checked_in_at = ${checkedInAt},
          updated_at = ${now}
        WHERE id = ANY(${ids})
        RETURNING id, is_checked_in, checked_in_at
      `;

      console.log(`Bulk update result:`, result);
      const response = NextResponse.json({
        success: true,
        updated: result.length,
        result,
      });

      // Add no-cache headers
      response.headers.set(
        "Cache-Control",
        "no-cache, no-store, must-revalidate, max-age=0",
      );
      response.headers.set("Pragma", "no-cache");
      response.headers.set("Expires", "0");

      return response;
    } else if (body.ticketId) {
      // Single ticket update
      const { ticketId, isCheckedIn } = body;
      console.log(
        `Single update: ticketId ${ticketId}, isCheckedIn: ${isCheckedIn}`,
      );

      // Ensure proper types
      const ticketIdNum = parseInt(ticketId);
      const checkedInValue = Boolean(isCheckedIn);
      const now = new Date().toISOString();
      const checkedInAt = checkedInValue ? now : null;

      console.log(
        `Update values: ticketId=${ticketIdNum}, is_checked_in=${checkedInValue}, checked_in_at=${checkedInAt}`,
      );

      // First check if ticket exists
      const existingTicket = await sql`
        SELECT id, is_checked_in FROM tickets WHERE id = ${ticketIdNum}
      `;

      if (existingTicket.length === 0) {
        console.error(`Ticket with ID ${ticketIdNum} not found`);
        return NextResponse.json(
          { error: "Ticket not found" },
          { status: 404 },
        );
      }

      console.log(`Current ticket state:`, existingTicket[0]);

      const result = await sql`
        UPDATE tickets
        SET
          is_checked_in = ${checkedInValue},
          checked_in_at = ${checkedInAt},
          updated_at = ${now}
        WHERE id = ${ticketIdNum}
        RETURNING id, is_checked_in, checked_in_at, updated_at
      `;

      console.log(`Single update result:`, result);

      if (result.length === 0) {
        console.error(`Update failed for ticket ${ticketIdNum}`);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
      }

      const response = NextResponse.json({
        success: true,
        ticketId: ticketIdNum,
        updatedTicket: result[0],
      });

      // Add no-cache headers
      response.headers.set(
        "Cache-Control",
        "no-cache, no-store, must-revalidate, max-age=0",
      );
      response.headers.set("Pragma", "no-cache");
      response.headers.set("Expires", "0");

      return response;
    } else {
      console.error("Invalid request body - missing ticketId or ids");
      return NextResponse.json(
        { error: "Invalid request - missing ticketId or ids" },
        { status: 400 },
      );
    }
  } catch (error: any) {
    console.error("Error updating ticket(s):", error);
    return NextResponse.json(
      {
        error: "Failed to update ticket(s)",
        details: error?.message || "Unknown error",
        stack: error?.stack,
      },
      { status: 500 },
    );
  }
}
