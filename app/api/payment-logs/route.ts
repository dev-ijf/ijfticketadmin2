import { type NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/database";

export async function GET() {
  const sql = getSql();
  try {
    const logs = await sql`
      SELECT * FROM payment_logs ORDER BY created_at DESC
    `;
    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching payment logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment logs" },
      { status: 500 },
    );
  }
}
