import { type NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/database";

export async function GET(request: NextRequest) {
  const sql = getSql();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    if (id) {
      const template = await sql`
        SELECT * FROM notification_templates WHERE id = ${id}
      `;
      if (template.length === 0) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 },
        );
      }
      return NextResponse.json(template[0]);
    } else {
      const templates = await sql`
        SELECT * FROM notification_templates ORDER BY created_at DESC
      `;
      return NextResponse.json(templates);
    }
  } catch (error) {
    console.error("Error fetching notification templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification templates" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const sql = getSql();
  try {
    const body = await request.json();
    const {
      name,
      channel,
      trigger_on,
      subject,
      body: content,
      is_active,
    } = body;

    // Validate required fields
    if (!name || !channel || !trigger_on) {
      return NextResponse.json(
        { error: "Name, channel, and trigger_on are required" },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO notification_templates (name, channel, trigger_on, subject, body, is_active, created_at, updated_at)
      VALUES (${name || ""}, ${channel || ""}, ${trigger_on || ""}, ${subject || null}, ${content || ""}, ${is_active ?? true}, NOW(), NOW())
      RETURNING id
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating notification template:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create notification template";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const sql = getSql();
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { name, channel, trigger_on, subject, body: content, is_active } = body;

    // Validate required fields
    if (!name || !channel || !trigger_on) {
      return NextResponse.json(
        { error: "Name, channel, and trigger_on are required" },
        { status: 400 },
      );
    }

    await sql`
      UPDATE notification_templates
      SET
        name = ${name || ""},
        channel = ${channel || ""},
        trigger_on = ${trigger_on || ""},
        subject = ${subject || null},
        body = ${content || ""},
        is_active = ${is_active ?? true},
        updated_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notification template:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update notification template";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const sql = getSql();
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    await sql`DELETE FROM notification_templates WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification template:", error);
    return NextResponse.json(
      { error: "Failed to delete notification template" },
      { status: 500 },
    );
  }
}
