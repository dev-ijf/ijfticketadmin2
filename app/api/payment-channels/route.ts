import { type NextRequest, NextResponse } from "next/server"
import { DatabaseUtils } from "@/lib/database"

export async function GET() {
  try {
    const paymentChannels = await DatabaseUtils.findMany("payment_channels", {}, { column: "name", direction: "ASC" })
    return NextResponse.json(paymentChannels)
  } catch (error) {
    console.error("Error fetching payment channels:", error)
    return NextResponse.json({ error: "Failed to fetch payment channels" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const paymentChannel = await DatabaseUtils.create("payment_channels", {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    return NextResponse.json(paymentChannel)
  } catch (error) {
    console.error("Error creating payment channel:", error)
    return NextResponse.json({ error: "Failed to create payment channel" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...data } = await request.json()
    const paymentChannel = await DatabaseUtils.update("payment_channels", id, {
      ...data,
      updated_at: new Date().toISOString(),
    })
    return NextResponse.json(paymentChannel)
  } catch (error) {
    console.error("Error updating payment channel:", error)
    return NextResponse.json({ error: "Failed to update payment channel" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }
    await DatabaseUtils.delete("payment_channels", Number.parseInt(id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting payment channel:", error)
    return NextResponse.json({ error: "Failed to delete payment channel" }, { status: 500 })
  }
}
