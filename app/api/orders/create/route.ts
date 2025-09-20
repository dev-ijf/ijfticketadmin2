import { NextResponse } from "next/server";
import { getSql } from "@/lib/database";

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

function generateOrderReference() {
  // 16 digit angka random
  const randomDigits = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 10),
  ).join("");
  return `TKT${randomDigits}`;
}

function generateTicketCode() {
  // Generate random 8 character string
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customer_name,
      customer_email,
      customer_phone,
      event_id,
      ticket_type_id,
      quantity,
      final_amount,
      order_date,
      payment_channel_id,
      barcode_id,
    } = body;

    console.log("Creating order with data:", body);

    const sql = getSql();

    // Validate required fields
    if (!customer_name || !customer_email) {
      return NextResponse.json(
        { error: "Customer name dan email harus diisi" },
        { status: 400 },
      );
    }

    if (!event_id || !ticket_type_id) {
      return NextResponse.json(
        { error: "Event ID dan Ticket Type ID harus diisi" },
        { status: 400 },
      );
    }

    // 1. Upsert customer
    let customerId: number | null = null;

    // Check if customer exists by email or phone
    let existingCustomer = null;
    if (customer_email) {
      const emailResult = await sql`
        SELECT id FROM customers WHERE email = ${customer_email} LIMIT 1
      `;
      if (emailResult.length > 0) existingCustomer = emailResult[0];
    }

    if (!existingCustomer && customer_phone) {
      const phoneResult = await sql`
        SELECT id FROM customers WHERE phone_number = ${customer_phone} LIMIT 1
      `;
      if (phoneResult.length > 0) existingCustomer = phoneResult[0];
    }

    if (existingCustomer) {
      customerId = existingCustomer.id;
      console.log("Using existing customer:", customerId);
    } else {
      // Create new customer
      const newCustomer = await sql`
        INSERT INTO customers (name, email, phone_number, created_at, updated_at)
        VALUES (${customer_name}, ${customer_email}, ${customer_phone || null}, NOW(), NOW())
        RETURNING id
      `;
      customerId = newCustomer[0].id;
      console.log("Created new customer:", customerId);
    }

    // 2. Create order
    const orderReference = generateOrderReference();

    // Parse order_date properly
    let parsedOrderDate = null;
    if (order_date) {
      try {
        // Handle different date formats
        const date = new Date(order_date);
        if (isNaN(date.getTime())) {
          // Try parsing as YYYY-MM-DD
          const parts = order_date.split("-");
          if (parts.length === 3) {
            parsedOrderDate = new Date(
              parseInt(parts[0]),
              parseInt(parts[1]) - 1,
              parseInt(parts[2]),
            ).toISOString();
          } else {
            parsedOrderDate = new Date().toISOString();
          }
        } else {
          parsedOrderDate = date.toISOString();
        }
      } catch (error) {
        console.error("Error parsing date:", error);
        parsedOrderDate = new Date().toISOString();
      }
    } else {
      parsedOrderDate = new Date().toISOString();
    }

    const orderData = await sql`
      INSERT INTO orders (
        order_reference, customer_id, event_id, payment_channel_id,
        order_date, final_amount, gross_amount, discount_amount, status, created_at, updated_at
      )
      VALUES (
        ${orderReference}, ${customerId}, ${parseInt(event_id)},
        ${payment_channel_id ? parseInt(payment_channel_id) : null},
        ${parsedOrderDate}, ${parseFloat(final_amount)},
        ${parseFloat(final_amount)}, 0, 'paid', NOW(), NOW()
      )
      RETURNING id, order_reference, event_id, customer_id
    `;

    const orderId = orderData[0].id;
    console.log("Created order:", orderId);

    // 3. Create order_items
    const pricePerTicket = parseFloat(final_amount) / parseInt(quantity || 1);
    const orderItemData = await sql`
      INSERT INTO order_items (
        order_id, ticket_type_id, quantity, price_per_ticket, effective_ticket_count, created_at
      )
      VALUES (
        ${orderId}, ${parseInt(ticket_type_id)}, ${parseInt(quantity || 1)},
        ${pricePerTicket}, ${parseInt(quantity || 1)}, NOW()
      )
      RETURNING id
    `;

    const orderItemId = orderItemData[0].id;
    console.log("Created order_item:", orderItemId);

    // 4. Create order_item_attendees (one for each quantity)
    // Trigger will automatically create tickets from attendees
    const attendeeIds = [];
    const quantityNum = parseInt(quantity || 1);

    for (let i = 0; i < quantityNum; i++) {
      const attendeeResult = await sql`
        INSERT INTO order_item_attendees (
          order_item_id, attendee_name, attendee_email, attendee_phone_number,
          custom_answers, created_at
        )
        VALUES (
          ${orderItemId}, ${customer_name}, ${customer_email}, ${customer_phone || null},
          NULL, NOW()
        )
        RETURNING id
      `;
      attendeeIds.push(attendeeResult[0].id);
    }

    console.log(`Created ${attendeeIds.length} order_item_attendees records`);

    // 5. Process each attendee to create tickets via trigger
    for (const attendeeId of attendeeIds) {
      await sql`SELECT process_single_attendee(${attendeeId}, ${orderId})`;
    }

    // Wait a moment then check if tickets were created by trigger
    await new Promise((resolve) => setTimeout(resolve, 100));

    const ticketsCreated = await sql`
      SELECT id, ticket_code FROM tickets WHERE order_id = ${orderId}
    `;

    console.log(
      `Database trigger created ${ticketsCreated.length} tickets for order ${orderId}`,
    );

    const response = NextResponse.json({
      success: true,
      order: orderData[0],
      order_item: { id: orderItemId },
      attendees_created: attendeeIds.length,
      tickets_created: ticketsCreated.length,
      message: `Successfully created order ${orderReference} with ${attendeeIds.length} attendees and ${ticketsCreated.length} tickets`,
    });

    // Add no-cache headers
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate, max-age=0",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      {
        error: "Failed to create order",
        details: error?.message || "Unknown error",
        stack: error?.stack,
      },
      { status: 500 },
    );
  }
}
