import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/database";

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const ticketId = parseInt(id);

    if (!ticketId || isNaN(ticketId)) {
      return NextResponse.json(
        { error: "Invalid ticket ID" },
        { status: 400 }
      );
    }

    const sql = getSql();

    // Get ticket details
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

    // Get custom fields for the event
    const customFields = await sql`
      SELECT
        ecf.id,
        ecf.field_name,
        ecf.field_label,
        ecf.field_type,
        ecf.is_required,
        ecf.sort_order,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ecfo.id,
              'option_value', ecfo.option_value,
              'option_label', ecfo.option_label,
              'sort_order', ecfo.sort_order
            )
          ) FILTER (WHERE ecfo.id IS NOT NULL),
          '[]'::json
        ) AS options
      FROM event_custom_fields ecf
      LEFT JOIN event_custom_field_options ecfo ON ecf.id = ecfo.custom_field_id
      WHERE ecf.event_id = ${ticket.event_id}
      GROUP BY ecf.id, ecf.field_name, ecf.field_label, ecf.field_type, ecf.is_required, ecf.sort_order
      ORDER BY ecf.sort_order ASC
    `;

    // Get existing custom field answers
    const customAnswers = await sql`
      SELECT
        tcfa.custom_field_id,
        tcfa.answer_value,
        ecf.field_name
      FROM ticket_custom_field_answers tcfa
      JOIN event_custom_fields ecf ON tcfa.custom_field_id = ecf.id
      WHERE tcfa.ticket_id = ${ticketId}
    `;

    // Ambil juga data legacy dari order_item_attendees.custom_answers (jika ada)
    const attendeeRows = await sql`
      SELECT custom_answers
      FROM order_item_attendees
      WHERE ticket_id = ${ticketId}
      LIMIT 1
    `;

    const legacyAnswers: Record<string, any> =
      attendeeRows.length > 0 && attendeeRows[0].custom_answers
        ? attendeeRows[0].custom_answers
        : {};

    // Create answers map: utamakan skema baru (ticket_custom_field_answers),
    // kalau kosong fallback ke JSON lama custom_answers (by id ataupun field_name).
    const answersMap: Record<string, string> = {};

    customAnswers.forEach((answer: any) => {
      answersMap[answer.field_name] = answer.answer_value;
    });

    customFields.forEach((field: any) => {
      const existing = answersMap[field.field_name];
      if (!existing) {
        const byId = legacyAnswers[String(field.id)];
        const byName = legacyAnswers[field.field_name];
        if (byId !== undefined && byId !== null && byId !== "") {
          answersMap[field.field_name] = String(byId);
        } else if (byName !== undefined && byName !== null && byName !== "") {
          answersMap[field.field_name] = String(byName);
        }
      }
    });

    // Format response
    const responseData = {
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
        id: field.id,
        field_name: field.field_name,
        field_label: field.field_label,
        field_type: field.field_type,
        is_required: field.is_required,
        sort_order: field.sort_order,
        options: field.options,
        current_value: answersMap[field.field_name] || ""
      }))
    };

    console.log(`Fetched ${customFields.length} custom fields for ticket ${ticketId}`);
    console.log("Custom fields:", customFields.map((f: any) => f.field_name));

    const response = NextResponse.json(responseData);
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate, max-age=0",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;

  } catch (error: any) {
    console.error("Error fetching ticket details:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch ticket details",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
