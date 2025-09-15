import { NextResponse } from "next/server";
import { sql } from "@/lib/database";

export async function GET() {
  try {
    const [
      eventsResult,
      customersResult,
      ordersResult,
      ticketsResult,
      revenueResult,
      pendingOrdersResult,
    ] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM events`,
      sql`SELECT COUNT(*) as count FROM customers`,
      sql`SELECT COUNT(*) as count FROM orders`,
      sql`SELECT COUNT(*) as count FROM tickets`,
      sql`SELECT COALESCE(SUM(final_amount), 0) as total FROM orders WHERE status = 'paid'`,
      sql`SELECT COUNT(*) as count FROM orders WHERE status = 'pending'`,
    ]);

    const stats = {
      totalEvents: Number((eventsResult as any)[0]?.count) || 0,
      totalCustomers: Number((customersResult as any)[0]?.count) || 0,
      totalOrders: Number((ordersResult as any)[0]?.count) || 0,
      totalTickets: Number((ticketsResult as any)[0]?.count) || 0,
      totalRevenue: Number((revenueResult as any)[0]?.total) || 0,
      pendingOrders: Number((pendingOrdersResult as any)[0]?.count) || 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 },
    );
  }
}
