import { NextResponse } from "next/server";
import { sql, SettingsService } from "@/lib/database";

export async function GET() {
  try {
    console.log("🔍 Testing database connection...");

    // Test 1: Basic connection
    const connectionTest = await sql`SELECT 1 as test`;
    console.log("✅ Database connection successful");

    // Test 2: Check if settings table exists
    const tableTest = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'settings'
      );
    `;
    console.log("🔍 Settings table exists:", tableTest[0]?.exists);

    // Test 3: Count settings
    const countTest = await sql`SELECT COUNT(*) as count FROM settings`;
    console.log("📊 Settings count:", countTest[0]?.count);

    // Test 4: Get all settings raw
    const rawSettings = await sql`SELECT * FROM settings ORDER BY category, key`;
    console.log("📄 Raw settings:", rawSettings);

    // Test 5: Test SettingsService
    const serviceSettings = await SettingsService.getAll();
    console.log("🔧 Service settings:", serviceSettings);

    // Test 6: Test specific keys
    const logoSetting = await sql`SELECT * FROM settings WHERE key = 'app_logo'`;
    const primaryColorSetting = await sql`SELECT * FROM settings WHERE key = 'sidebar_primary_color'`;
    const secondaryColorSetting = await sql`SELECT * FROM settings WHERE key = 'sidebar_secondary_color'`;

    console.log("🖼️ Logo setting:", logoSetting[0]);
    console.log("🎨 Primary color setting:", primaryColorSetting[0]);
    console.log("🎨 Secondary color setting:", secondaryColorSetting[0]);

    return NextResponse.json({
      success: true,
      tests: {
        connection: !!connectionTest,
        tableExists: tableTest[0]?.exists,
        settingsCount: parseInt(countTest[0]?.count || "0"),
        rawSettings: rawSettings,
        serviceSettings: serviceSettings,
        specificSettings: {
          logo: logoSetting[0] || null,
          primaryColor: primaryColorSetting[0] || null,
          secondaryColor: secondaryColorSetting[0] || null,
        }
      }
    });

  } catch (error) {
    console.error("❌ Database test failed:", error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log("🔧 Creating test settings...");

    // Insert test settings if they don't exist
    const testSettings = [
      {
        key: 'app_logo',
        value: '/logo-main-new.png',
        type: 'file',
        category: 'branding',
        description: 'Main application logo'
      },
      {
        key: 'app_favicon',
        value: '/favicon.png',
        type: 'file',
        category: 'branding',
        description: 'Application favicon'
      },
      {
        key: 'sidebar_primary_color',
        value: '#9333ea',
        type: 'color',
        category: 'appearance',
        description: 'Primary sidebar color'
      },
      {
        key: 'sidebar_secondary_color',
        value: '#7c3aed',
        type: 'color',
        category: 'appearance',
        description: 'Secondary sidebar color'
      },
      {
        key: 'app_name',
        value: 'IJF Ticket Admin - Kreativa Global School',
        type: 'string',
        category: 'general',
        description: 'Application name'
      },
      {
        key: 'app_description',
        value: 'Admin panel untuk sistem ticketing IJF',
        type: 'string',
        category: 'general',
        description: 'Application description'
      }
    ];

    const results = [];
    for (const setting of testSettings) {
      try {
        const result = await sql`
          INSERT INTO settings (key, value, type, category, description)
          VALUES (${setting.key}, ${setting.value}, ${setting.type}, ${setting.category}, ${setting.description})
          ON CONFLICT (key)
          DO UPDATE SET
            value = EXCLUDED.value,
            type = EXCLUDED.type,
            category = EXCLUDED.category,
            description = EXCLUDED.description,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `;
        results.push(result[0]);
        console.log(`✅ Upserted setting: ${setting.key}`);
      } catch (err) {
        console.error(`❌ Failed to upsert setting ${setting.key}:`, err);
        results.push({ error: `Failed to upsert ${setting.key}` });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Test settings created/updated",
      results: results
    });

  } catch (error) {
    console.error("❌ Failed to create test settings:", error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
