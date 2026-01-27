import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/database";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = parseInt(params.id);

    if (!ticketId || isNaN(ticketId)) {
      return NextResponse.json(
        { error: "Invalid ticket ID" },
        { status: 400 }
      );
    }

    const sql = getSql();

    // Get ticket details with ticket type name
    const ticketDetails = await sql`
      SELECT
        t.id,
        t.ticket_code,
        t.attendee_name,
        t.attendee_email,
        t.attendee_phone_number,
        t.is_checked_in,
        t.checked_in_at,
        tt.name as ticket_type_name,
        tt.id as ticket_type_id,
        tt.event_id,
        e.name as event_name
      FROM tickets t
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
      LEFT JOIN events e ON tt.event_id = e.id
      WHERE t.id = ${ticketId}
      LIMIT 1
    `;

    if (!ticketDetails || ticketDetails.length === 0) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    const ticket = ticketDetails[0];

    // Get custom field answers for this ticket + mapping ke option label (jika ada)
    const customFields = await sql`
      SELECT
        tcfa.id,
        tcfa.answer_value,
        eco.option_label,
        ecf.id as custom_field_id,
        ecf.field_name,
        ecf.field_label,
        ecf.field_type,
        ecf.sort_order
      FROM ticket_custom_field_answers tcfa
      JOIN event_custom_fields ecf ON tcfa.custom_field_id = ecf.id
      LEFT JOIN event_custom_field_options eco
        ON eco.custom_field_id = ecf.id
       AND eco.option_value = tcfa.answer_value
      WHERE tcfa.ticket_id = ${ticketId}
      ORDER BY ecf.sort_order ASC
    `;

    // Format response
    const response = {
      id: ticket.id,
      ticket_code: ticket.ticket_code,
      attendee_name: ticket.attendee_name,
      attendee_email: ticket.attendee_email,
      attendee_phone_number: ticket.attendee_phone_number,
      is_checked_in: ticket.is_checked_in,
      checked_in_at: ticket.checked_in_at,
      ticket_type_name: ticket.ticket_type_name,
      ticket_type_id: ticket.ticket_type_id,
      event_id: ticket.event_id,
      event_name: ticket.event_name,
      custom_fields: customFields.map((field: any) => ({
        custom_field_id: field.custom_field_id,
        field_name: field.field_name,
        field_label: field.field_label,
        field_type: field.field_type,
        // nilai mentah yang tersimpan di DB
        answer_value: field.answer_value,
        // label dari tabel options (kalau ada)
        answer_label: field.option_label,
        // display_value = kombinasi label + value (lebih enak dibaca di UI)
        display_value:
          field.option_label && field.option_label !== field.answer_value
            ? `${field.option_label} (${field.answer_value})`
            : field.answer_value,
        sort_order: field.sort_order
      }))
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error("Error fetching ticket details:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket details" },
      { status: 500 }
    );
  }
}
