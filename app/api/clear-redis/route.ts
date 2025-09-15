import { type NextRequest, NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { key, pattern } = body

    if (key) {
      await redis.del(key)
      console.log(`[v0] Cleared Redis key: ${key}`)
    } else if (pattern) {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
        console.log(`[v0] Cleared ${keys.length} Redis keys matching pattern: ${pattern}`)
      }
    } else {
      await redis.flushall()
      console.log("[v0] Cleared all Redis cache")
    }

    return NextResponse.json({
      success: true,
      message: "Redis cache cleared successfully",
    })
  } catch (error: any) {
    console.error("Error clearing Redis cache:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to clear Redis cache",
        detail: error.message,
      },
      { status: 500 },
    )
  }
}
