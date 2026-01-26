import { db } from "../db";
import { createFunctions, createViews, createTriggers } from "../functions";
import { seedPaymentChannels } from "./payment-channels";
import { seedPaymentInstructions } from "./payment-instructions";
import { seedNotificationTemplates } from "./notification-templates";
import { seedSampleData } from "./sample-data";

async function main() {
  console.log("🌱 Starting database seeding...\n");

  try {
    // Create functions, views, and triggers first
    console.log("📦 Creating database functions, views, and triggers...");
    await createFunctions();
    await createViews();
    await createTriggers();
    console.log("✓ Functions, views, and triggers created\n");

    // Seed payment channels (must be first)
    await seedPaymentChannels();
    console.log("");

    // Seed payment instructions (depends on payment channels)
    await seedPaymentInstructions();
    console.log("");

    // Seed notification templates
    await seedNotificationTemplates();
    console.log("");

    // Seed sample data (events, customers, orders, tickets)
    await seedSampleData();
    console.log("");

    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    process.exit(1);
  }
}

main();
