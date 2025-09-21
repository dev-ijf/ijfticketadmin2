import { type NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/database";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const event_id = searchParams.get("event_id");

  if (!event_id) {
    return NextResponse.json(
      { error: "event_id wajib diisi" },
      { status: 400 },
    );
  }

  try {
    const sql = getSql();

    // Get custom fields for the event with their options
    const customFields = await sql`
      SELECT
        ecf.id,
        ecf.event_id,
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
            ) ORDER BY ecfo.sort_order
          ) FILTER (WHERE ecfo.id IS NOT NULL),
          '[]'::json
        ) as options
      FROM event_custom_fields ecf
      LEFT JOIN event_custom_field_options ecfo ON ecf.id = ecfo.custom_field_id
      WHERE ecf.event_id = ${parseInt(event_id)}
      GROUP BY ecf.id, ecf.event_id, ecf.field_name, ecf.field_label, ecf.field_type, ecf.is_required, ecf.sort_order
      ORDER BY ecf.sort_order ASC
    `;

    return NextResponse.json({
      success: true,
      custom_fields: customFields
    });
  } catch (error: any) {
    console.error("Error fetching custom fields:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}
