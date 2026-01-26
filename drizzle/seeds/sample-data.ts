import { db } from "../db";
import { events, customers, ticketTypes, orders, orderItems, orderItemAttendees, tickets } from "../schema";

export async function seedSampleData() {
  console.log("Seeding sample data...");
  
  try {
    // Create sample event
    const [event] = await db.insert(events).values({
      name: "Sample Event 2025",
      slug: "sample-event-2025",
      description: "<p>Ini adalah event sample untuk testing aplikasi.</p>",
      startDate: new Date("2025-12-01T10:00:00Z"),
      endDate: new Date("2025-12-01T18:00:00Z"),
      location: "Jakarta Convention Center",
      imageUrl: null,
    }).returning();

    console.log("✓ Created sample event:", event.id);

    // Create sample ticket types
    const [ticketType1, ticketType2] = await db.insert(ticketTypes).values([
      {
        eventId: event.id,
        name: "VIP Ticket",
        price: "500000.00",
        quantityTotal: 100,
        quantitySold: 0,
        ticketsPerPurchase: 1,
      },
      {
        eventId: event.id,
        name: "Regular Ticket",
        price: "250000.00",
        quantityTotal: 200,
        quantitySold: 0,
        ticketsPerPurchase: 2,
      },
    ]).returning();

    console.log("✓ Created sample ticket types");

    // Create sample customers
    const [customer1, customer2] = await db.insert(customers).values([
      {
        name: "John Doe",
        email: "john.doe@example.com",
        phoneNumber: "081234567890",
      },
      {
        name: "Jane Smith",
        email: "jane.smith@example.com",
        phoneNumber: "081234567891",
      },
    ]).returning();

    console.log("✓ Created sample customers");

    // Create sample order (paid)
    const orderRef1 = `TKT${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const [order1] = await db.insert(orders).values({
      orderReference: orderRef1,
      customerId: customer1.id,
      eventId: event.id,
      paymentChannelId: 17, // QRIS
      grossAmount: "500000.00",
      discountAmount: "0.00",
      finalAmount: "500000.00",
      status: "paid",
      paidAt: new Date(),
      isEmailCheckout: false,
      isWaCheckout: false,
      isEmailPaid: false,
      isWaPaid: false,
    }).returning();

    console.log("✓ Created sample order 1 (paid):", order1.id);

    // Create order items for order1
    const [orderItem1] = await db.insert(orderItems).values({
      orderId: order1.id,
      ticketTypeId: ticketType1.id,
      quantity: 1,
      pricePerTicket: "500000.00",
      effectiveTicketCount: 1,
    }).returning();

    // Create attendee for order1
    await db.insert(orderItemAttendees).values({
      orderItemId: orderItem1.id,
      attendeeName: "John Doe",
      attendeeEmail: "john.doe@example.com",
      attendeePhoneNumber: "081234567890",
      customAnswers: null,
      barcodeId: null,
    });

    console.log("✓ Created order items and attendees for order 1");

    // Create sample order (pending)
    const orderRef2 = `TKT${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const [order2] = await db.insert(orders).values({
      orderReference: orderRef2,
      customerId: customer2.id,
      eventId: event.id,
      paymentChannelId: 3, // Mandiri VA
      grossAmount: "500000.00",
      discountAmount: "0.00",
      finalAmount: "500000.00",
      status: "pending",
      paidAt: null,
      virtualAccountNumber: "8830835802102130",
      paymentResponseUrl: "https://web.faspay.co.id/pws/100003/2830000010100000/example",
      isEmailCheckout: true,
      isWaCheckout: false,
      isEmailPaid: false,
      isWaPaid: false,
    }).returning();

    console.log("✓ Created sample order 2 (pending):", order2.id);

    // Create order items for order2
    const [orderItem2] = await db.insert(orderItems).values({
      orderId: order2.id,
      ticketTypeId: ticketType1.id,
      quantity: 1,
      pricePerTicket: "500000.00",
      effectiveTicketCount: 1,
    }).returning();

    // Create attendee for order2
    await db.insert(orderItemAttendees).values({
      orderItemId: orderItem2.id,
      attendeeName: "Jane Smith",
      attendeeEmail: "jane.smith@example.com",
      attendeePhoneNumber: "081234567891",
      customAnswers: null,
      barcodeId: null,
    });

    console.log("✓ Created order items and attendees for order 2");

    // Note: Tickets untuk order1 akan dibuat otomatis oleh trigger karena status = 'paid'
    // Tapi kita bisa buat manual untuk testing
    const [ticket1] = await db.insert(tickets).values({
      orderId: order1.id,
      ticketTypeId: ticketType1.id,
      ticketCode: "ABC12345",
      attendeeName: "John Doe",
      attendeeEmail: "john.doe@example.com",
      attendeePhoneNumber: "081234567890",
      isCheckedIn: false,
      checkedInAt: null,
    }).returning();

    console.log("✓ Created sample ticket:", ticket1.id);

    console.log("✓ Sample data seeded successfully");
  } catch (error) {
    console.error("✗ Error seeding sample data:", error);
    throw error;
  }
}
