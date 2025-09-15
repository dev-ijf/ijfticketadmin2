import { type NextRequest, NextResponse } from "next/server"
import { DatabaseUtils } from "@/lib/database"

export async function GET() {
  try {
    const customers = await DatabaseUtils.findMany("customers", {}, { column: "created_at", direction: "DESC" })
    return NextResponse.json(customers)
  } catch (error) {
    console.error("Error fetching customers:", error)
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const customer = await DatabaseUtils.create("customers", {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    return NextResponse.json(customer)
  } catch (error) {
    console.error("Error creating customer:", error)
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...data } = await request.json()
    const customer = await DatabaseUtils.update("customers", id, {
      ...data,
      updated_at: new Date().toISOString(),
    })
    return NextResponse.json(customer)
  } catch (error) {
    console.error("Error updating customer:", error)
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }
    await DatabaseUtils.delete("customers", Number.parseInt(id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting customer:", error)
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 })
  }
}
