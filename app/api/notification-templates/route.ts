import { type NextRequest, NextResponse } from "next/server"
import { DatabaseUtils } from "@/lib/database"

export async function GET() {
  try {
    const templates = await DatabaseUtils.findMany(
      "notification_templates",
      {},
      { column: "created_at", direction: "DESC" },
    )
    return NextResponse.json(templates)
  } catch (error) {
    console.error("Error fetching notification templates:", error)
    return NextResponse.json({ error: "Failed to fetch notification templates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const template = await DatabaseUtils.create("notification_templates", {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    return NextResponse.json(template)
  } catch (error) {
    console.error("Error creating notification template:", error)
    return NextResponse.json({ error: "Failed to create notification template" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...data } = await request.json()
    const template = await DatabaseUtils.update("notification_templates", id, {
      ...data,
      updated_at: new Date().toISOString(),
    })
    return NextResponse.json(template)
  } catch (error) {
    console.error("Error updating notification template:", error)
    return NextResponse.json({ error: "Failed to update notification template" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }
    await DatabaseUtils.delete("notification_templates", Number.parseInt(id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting notification template:", error)
    return NextResponse.json({ error: "Failed to delete notification template" }, { status: 500 })
  }
}
