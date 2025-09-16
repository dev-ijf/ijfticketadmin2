import { type NextRequest, NextResponse } from "next/server";
import { DatabaseUtils } from "@/lib/database";

export async function GET() {
  try {
    console.log("Starting to fetch discounts...");

    // Check environment variables
    const databaseUrl =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.NEON_DATABASE_URL;
    console.log("Database URL exists:", !!databaseUrl);
    if (!databaseUrl) {
      console.error("No database URL found in environment variables");
      return NextResponse.json(
        { error: "Database configuration missing" },
        { status: 500 },
      );
    }

    const discounts = await DatabaseUtils.findMany(
      "discounts",
      {},
      { column: "created_at", direction: "DESC" },
    );
    console.log("Discounts fetched:", discounts?.length || 0, "records");
    console.log("First discount:", discounts?.[0]);
    return NextResponse.json(discounts);
  } catch (error) {
    console.error("Error fetching discounts:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }
    return NextResponse.json(
      { error: "Failed to fetch discounts" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const discount = await DatabaseUtils.create("discounts", {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return NextResponse.json(discount);
  } catch (error) {
    console.error("Error creating discount:", error);
    return NextResponse.json(
      { error: "Failed to create discount" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...data } = await request.json();
    const discount = await DatabaseUtils.update("discounts", id, {
      ...data,
      updated_at: new Date().toISOString(),
    });
    return NextResponse.json(discount);
  } catch (error) {
    console.error("Error updating discount:", error);
    return NextResponse.json(
      { error: "Failed to update discount" },
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
    await DatabaseUtils.delete("discounts", Number.parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting discount:", error);
    return NextResponse.json(
      { error: "Failed to delete discount" },
      { status: 500 },
    );
  }
}
