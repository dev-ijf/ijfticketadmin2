import { type NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/database";

export async function GET(request: NextRequest) {
  const sql = getSql();
  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get("channelId");

  if (!channelId) {
    return NextResponse.json(
      { error: "channelId is required" },
      { status: 400 },
    );
  }

  try {
    const channelResult = await sql`
      SELECT * FROM payment_channels WHERE id = ${channelId}
    `;
    const channel = channelResult[0];

    if (!channel) {
      return NextResponse.json(
        { error: "Payment channel not found" },
        { status: 404 },
      );
    }

    const instructions = await sql`
      SELECT * FROM payment_instructions
      WHERE payment_channel_id = ${channelId}
      ORDER BY step_order ASC
    `;

    return NextResponse.json({ channel, instructions });
  } catch (error) {
    console.error("Error fetching payment instructions:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment instructions" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { payment_channel_id } = data;

    // Get the next step_order
    const result = await sql`
        SELECT MAX(step_order) as max_order
        FROM payment_instructions
        WHERE payment_channel_id = ${payment_channel_id}
    `;
    const nextStepOrder = (result[0]?.max_order || 0) + 1;

    const instruction = await DatabaseUtils.create("payment_instructions", {
      ...data,
      step_order: nextStepOrder,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return NextResponse.json(instruction, { status: 201 });
  } catch (error) {
    console.error("Error creating payment instruction:", error);
    return NextResponse.json(
      { error: "Failed to create payment instruction" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...data } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    const instruction = await DatabaseUtils.update("payment_instructions", id, {
      ...data,
      updated_at: new Date().toISOString(),
    });
    return NextResponse.json(instruction);
  } catch (error) {
    console.error("Error updating payment instruction:", error);
    return NextResponse.json(
      { error: "Failed to update payment instruction" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    await DatabaseUtils.delete("payment_instructions", Number.parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting payment instruction:", error);
    return NextResponse.json(
      { error: "Failed to delete payment instruction" },
      { status: 500 },
    );
  }
}
