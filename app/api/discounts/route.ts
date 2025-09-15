import { type NextRequest, NextResponse } from "next/server"
import { DatabaseUtils } from "@/lib/database"

export async function GET() {
  try {
    const discounts = await DatabaseUtils.findMany("discounts", {}, { column: "created_at", direction: "DESC" })
    return NextResponse.json(discounts)
  } catch (error) {
    console.error("Error fetching discounts:", error)
    return NextResponse.json({ error: "Failed to fetch discounts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const discount = await DatabaseUtils.create("discounts", {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    return NextResponse.json(discount)
  } catch (error) {
    console.error("Error creating discount:", error)
    return NextResponse.json({ error: "Failed to create discount" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...data } = await request.json()
    const discount = await DatabaseUtils.update("discounts", id, {
      ...data,
      updated_at: new Date().toISOString(),
    })
    return NextResponse.json(discount)
  } catch (error) {
    console.error("Error updating discount:", error)
    return NextResponse.json({ error: "Failed to update discount" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }
    await DatabaseUtils.delete("discounts", Number.parseInt(id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting discount:", error)
    return NextResponse.json({ error: "Failed to delete discount" }, { status: 500 })
  }
}
