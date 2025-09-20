import { type NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/database";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const upload_session_id = searchParams.get("upload_session_id");
  if (!upload_session_id) {
    return NextResponse.json(
      { error: "upload_session_id wajib diisi" },
      { status: 400 },
    );
  }

  try {
    const sql = getSql();
    const data = await sql`
      SELECT * FROM orders_temp
      WHERE upload_session_id = ${upload_session_id}
      ORDER BY row_number ASC
    `;

    return NextResponse.json({ rows: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
