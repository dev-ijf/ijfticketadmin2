import { NextResponse } from "next/server";
import { sql } from "@/lib/database";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    if (id) {
      const eventData = await sql`
        SELECT * FROM events WHERE id = ${id}
      `;

      if (eventData.length === 0) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      const customFieldsData = await sql`
        SELECT 
          ecf.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', ecfo.id,
                'option_value', ecfo.option_value,
                'option_label', ecfo.option_label,
                'sort_order', ecfo.sort_order
              ) ORDER BY ecfo.sort_order
            ) FILTER (WHERE ecfo.id IS NOT NULL),
            '[]'::json
          ) as options
        FROM event_custom_fields ecf
        LEFT JOIN event_custom_field_options ecfo ON ecf.id = ecfo.custom_field_id
        WHERE ecf.event_id = ${id}
        GROUP BY ecf.id
        ORDER BY ecf.sort_order
      `;

      const event = eventData[0];
      (event as any).custom_fields = customFieldsData;

      return NextResponse.json(event);
    } else {
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
    const { id, custom_fields, ...eventData } = await request.json();
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

    if (custom_fields && Array.isArray(custom_fields)) {
      await sql`
        DELETE FROM event_custom_field_options 
        WHERE custom_field_id IN (
          SELECT id FROM event_custom_fields WHERE event_id = ${id}
        )
      `;
      await sql`DELETE FROM event_custom_fields WHERE event_id = ${id}`;

      for (const field of custom_fields) {
        if (field.field_name && field.field_label) {
          const fieldResult = await sql`
            INSERT INTO event_custom_fields (
              event_id, field_name, field_label, field_type, is_required, sort_order
            )
            VALUES (
              ${id}, ${field.field_name}, ${field.field_label}, ${field.field_type}, 
              ${field.is_required}, ${field.sort_order}
            )
            RETURNING id
          `;

          const fieldId = fieldResult[0].id;

          if (
            field.options &&
            Array.isArray(field.options) &&
            field.options.length > 0
          ) {
            for (const option of field.options) {
              if (option.option_value && option.option_label) {
                await sql`
                  INSERT INTO event_custom_field_options (
                    custom_field_id, option_value, option_label, sort_order
                  )
                  VALUES (
                    ${fieldId}, ${option.option_value}, ${option.option_label}, ${option.sort_order}
                  )
                `;
              }
            }
          }
        }
      }
    }

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
    const { custom_fields, ...eventData } = await request.json();
    const result = await sql`
      INSERT INTO events (name, slug, start_date, end_date, location, description, image_url, created_at, updated_at)
      VALUES (${eventData.name}, ${eventData.slug}, ${eventData.start_date || null}, ${eventData.end_date || null}, ${eventData.location}, ${eventData.description}, ${eventData.image_url}, NOW(), NOW())
      RETURNING id
    `;

    const eventId = result[0].id;

    if (custom_fields && Array.isArray(custom_fields)) {
      for (const field of custom_fields) {
        if (field.field_name && field.field_label) {
          const fieldResult = await sql`
            INSERT INTO event_custom_fields (
              event_id, field_name, field_label, field_type, is_required, sort_order
            )
            VALUES (
              ${eventId}, ${field.field_name}, ${field.field_label}, ${field.field_type}, 
              ${field.is_required}, ${field.sort_order}
            )
            RETURNING id
          `;

          const fieldId = fieldResult[0].id;

          if (
            field.options &&
            Array.isArray(field.options) &&
            field.options.length > 0
          ) {
            for (const option of field.options) {
              if (option.option_value && option.option_label) {
                await sql`
                  INSERT INTO event_custom_field_options (
                    custom_field_id, option_value, option_label, sort_order
                  )
                  VALUES (
                    ${fieldId}, ${option.option_value}, ${option.option_label}, ${option.sort_order}
                  )
                `;
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ id: eventId }, { status: 201 });
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

    await sql`DELETE FROM ticket_custom_field_answers WHERE ticket_id IN (SELECT id FROM tickets WHERE ticket_type_id IN (SELECT id FROM ticket_types WHERE event_id = ${id}))`;
    await sql`DELETE FROM tickets WHERE ticket_type_id IN (SELECT id FROM ticket_types WHERE event_id = ${id})`;
    await sql`DELETE FROM ticket_types WHERE event_id = ${id}`;
    await sql`DELETE FROM orders WHERE event_id = ${id}`;
    await sql`DELETE FROM event_custom_field_options WHERE custom_field_id IN (SELECT id FROM event_custom_fields WHERE event_id = ${id})`;
    await sql`DELETE FROM event_custom_fields WHERE event_id = ${id}`;
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
