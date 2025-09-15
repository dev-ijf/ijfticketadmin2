import type { NextApiRequest, NextApiResponse } from "next"
import { sql } from "@/lib/database"

/*
const STARSENDER_URL = 'https://api.starsender.online/api/send';
const STARSENDER_TOKEN = '94d86acf-0dcd-4c91-b104-6594a7a609dc';
*/

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }
  const { order_id } = req.body
  if (!order_id) return res.status(400).json({ error: "order_id required" })

  try {
    const orderResult = await sql`
      SELECT 
        o.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone_number as customer_phone,
        e.name as event_name,
        e.location as event_location,
        e.start_date,
        e.end_date
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN events e ON o.event_id = e.id
      WHERE o.id = ${order_id}
    `

    if (orderResult.length === 0) return res.status(404).json({ error: "Order not found" })
    const order = orderResult[0]

    // Fetch order_items
    const items = await sql`
      SELECT * FROM order_items WHERE order_id = ${order_id}
    `

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "No order_items found" })
    }

    // Generate tickets
    const tickets = items.flatMap((item) => {
      const qty = Number(item.quantity) || 0
      const eff = Number(item.effective_ticket_count) || 0
      if (qty < 1 || eff < 1) return []
      return Array.from({ length: qty * eff }).map(() => ({
        order_id: order.id,
        ticket_type_id: item.ticket_type_id,
        attendee_name: order.customer_name || "-",
        attendee_email: order.customer_email || null,
      }))
    })

    if (tickets.length === 0) {
      return res.status(400).json({ error: "No valid tickets to create" })
    }

    // Insert tickets
    for (const ticket of tickets) {
      await sql`
        INSERT INTO tickets (order_id, ticket_type_id, attendee_name, attendee_email, created_at, updated_at)
        VALUES (${ticket.order_id}, ${ticket.ticket_type_id}, ${ticket.attendee_name}, ${ticket.attendee_email}, NOW(), NOW())
      `
    }

    console.log("[v0] WhatsApp messaging disabled - tickets issued successfully without notification")

    return res.status(200).json({ success: true })
  } catch (error: any) {
    console.error("Error in issue-tickets:", error)
    return res.status(500).json({ error: "Internal server error", detail: error.message })
  }
}
