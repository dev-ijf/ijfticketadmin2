import { type NextRequest, NextResponse } from "next/server";
import { DatabaseUtils, getSql } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const databaseUrl =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.NEON_DATABASE_URL;

    if (!databaseUrl) {
      console.error("No database URL found in environment variables");
      return NextResponse.json(
        { error: "Database configuration missing" },
        { status: 500 },
      );
    }

    const sql = getSql();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    let users;

    if (q && q.length > 0) {
      const like = `%${q}%`;
      users = await sql`
        SELECT *
        FROM users
        WHERE
          name ILIKE ${like}
          OR email ILIKE ${like}
          OR role ILIKE ${like}
        ORDER BY created_at DESC
      `;
    } else {
      users = await sql`
        SELECT *
        FROM users
        ORDER BY created_at DESC
      `;
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const sql = getSql();

    const result = await sql`
      INSERT INTO users (name, email, role, created_at, updated_at)
      VALUES (${data.name}, ${data.email}, ${data.role}, NOW(), NOW())
      RETURNING *
    `;

    const user = (result as any)[0] || null;

    if (!user) {
      console.error("Insert users RETURNING * menghasilkan result kosong");
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 },
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...data } = await request.json();
    const sql = getSql();

    const result = await sql`
      UPDATE users
      SET
        name = ${data.name},
        email = ${data.email},
        role = ${data.role},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    const user = (result as any)[0] || null;

    if (!user) {
      return NextResponse.json(
        { error: "User not found or failed to update" },
        { status: 404 },
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
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

    const sql = getSql();
    await sql`DELETE FROM users WHERE id = ${Number(id)}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
