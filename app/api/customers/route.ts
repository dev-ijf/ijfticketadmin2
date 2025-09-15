import { type NextRequest, NextResponse } from "next/server";
import { DatabaseUtils } from "@/lib/database";

export async function GET() {
  try {
    console.log("Starting to fetch customers...");

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

    const customers = await DatabaseUtils.findMany(
      "customers",
      {},
      { column: "created_at", direction: "DESC" },
    );
    console.log("Customers fetched:", customers?.length || 0, "records");
    console.log("First customer:", customers?.[0]);
    return NextResponse.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const customer = await DatabaseUtils.create("customers", {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...data } = await request.json();
    const customer = await DatabaseUtils.update("customers", id, {
      ...data,
      updated_at: new Date().toISOString(),
    });
    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
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
    await DatabaseUtils.delete("customers", Number.parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 },
    );
  }
}
