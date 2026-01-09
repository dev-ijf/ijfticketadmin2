import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/database";

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const ticketId = parseInt(id);
    const body = await request.json();
    const { attendee_name, attendee_email, attendee_phone_number, custom_fields } = body;

    if (!ticketId || isNaN(ticketId)) {
      return NextResponse.json(
        { error: "Invalid ticket ID" },
        { status: 400 }
      );
    }

    if (!attendee_name) {
      return NextResponse.json(
        { error: "Attendee name is required" },
        { status: 400 }
      );
    }

    const sql = getSql();

    // Get ticket to find event_id
    const ticketResult = await sql`
      SELECT t.id, tt.event_id
      FROM tickets t
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
      WHERE t.id = ${ticketId}
      LIMIT 1
    `;

    if (!ticketResult || ticketResult.length === 0) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    const eventId = ticketResult[0].event_id;

    // Update ticket basic info
    await sql`
      UPDATE tickets 
      SET 
        attendee_name = ${attendee_name},
        attendee_email = ${attendee_email || null},
        attendee_phone_number = ${attendee_phone_number || null},
        updated_at = now()
      WHERE id = ${ticketId}
    `;

    // Update custom field answers
    if (custom_fields && Object.keys(custom_fields).length > 0) {
      for (const [fieldName, fieldValue] of Object.entries(custom_fields)) {
        // Get custom field ID from event_custom_fields
        const customFieldResult = await sql`
          SELECT ecf.id 
          FROM event_custom_fields ecf
          WHERE ecf.field_name = ${fieldName} AND ecf.event_id = ${eventId}
          LIMIT 1
        `;

        if (customFieldResult.length > 0) {
          const customFieldId = customFieldResult[0].id;

          // Check if answer already exists
          const existingAnswer = await sql`
            SELECT id FROM ticket_custom_field_answers 
            WHERE ticket_id = ${ticketId} AND custom_field_id = ${customFieldId}
            LIMIT 1
          `;

          if (existingAnswer.length > 0) {
            // Update existing answer
            await sql`
              UPDATE ticket_custom_field_answers 
              SET answer_value = ${fieldValue as string}
              WHERE ticket_id = ${ticketId} AND custom_field_id = ${customFieldId}
            `;
          } else {
            // Insert new answer
            await sql`
              INSERT INTO ticket_custom_field_answers (ticket_id, custom_field_id, answer_value)
              VALUES (${ticketId}, ${customFieldId}, ${fieldValue as string})
            `;
          }
        }
      }
    }

    const response = NextResponse.json({ 
      success: true, 
      message: "Ticket updated successfully" 
    });
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate, max-age=0",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;

  } catch (error: any) {
    console.error("Error updating ticket:", error);
    return NextResponse.json(
      {
        error: "Failed to update ticket",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
