import { NextResponse } from "next/server";
import { getSql } from "@/lib/database";

export async function GET() {
  const sql = getSql();
  try {
    const eventsResult = await sql`SELECT COUNT(*) as count FROM events`;
    const customersResult = await sql`SELECT COUNT(*) as count FROM customers`;
    const ordersResult = await sql`SELECT COUNT(*) as count FROM orders`;
    const ticketsResult = await sql`SELECT COUNT(*) as count FROM tickets`;
    const revenueResult =
      await sql`SELECT COALESCE(SUM(final_amount), 0) as total FROM orders WHERE status = 'paid'`;
    const pendingOrdersResult =
      await sql`SELECT COUNT(*) as count FROM orders WHERE status = 'pending'`;

    const stats = {
      totalEvents: Number(eventsResult[0]?.count) || 0,
      totalCustomers: Number(customersResult[0]?.count) || 0,
      totalOrders: Number(ordersResult[0]?.count) || 0,
      totalTickets: Number(ticketsResult[0]?.count) || 0,
      totalRevenue: Number(revenueResult[0]?.total) || 0,
      pendingOrders: Number(pendingOrdersResult[0]?.count) || 0,
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
