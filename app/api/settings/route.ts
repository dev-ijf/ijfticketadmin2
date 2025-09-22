import { NextRequest, NextResponse } from "next/server";
import { SettingsService } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const key = searchParams.get("key");

    console.log("🔍 Settings API GET request:", { category, key });

    if (key) {
      console.log(`🔑 Fetching setting by key: ${key}`);
      const setting = await SettingsService.getByKey(key);
      console.log("🔑 Setting result:", setting);
      if (!setting) {
        console.log("❌ Setting not found");
        return NextResponse.json(
          { error: "Setting not found" },
          { status: 404 },
        );
      }
      const response = NextResponse.json(setting);
      response.headers.set(
        "Cache-Control",
        "no-cache, no-store, must-revalidate",
      );
      return response;
    }

    if (category) {
      console.log(`📂 Fetching settings by category: ${category}`);
      const settings = await SettingsService.getByCategory(category);
      console.log("📂 Category settings result:", settings);
      const response = NextResponse.json(settings);
      response.headers.set(
        "Cache-Control",
        "no-cache, no-store, must-revalidate",
      );
      return response;
    }

    console.log("📊 Fetching all settings");
    const allSettings = await SettingsService.getAll();
    console.log("📊 All settings result count:", allSettings?.length || 0);
    console.log("📊 All settings:", allSettings);

    const response = NextResponse.json(allSettings);
    // Add cache-control headers to ensure fresh data
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  } catch (error) {
    console.error("❌ Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;

    console.log("🔄 Settings API PUT request:", { key, value });

    if (!key) {
      console.log("❌ Missing key in PUT request");
      return NextResponse.json(
        { error: "Setting key is required" },
        { status: 400 },
      );
    }

    console.log(`🔄 Updating setting: ${key} = ${value}`);
    const updatedSetting = await SettingsService.updateByKey(key, value);
    console.log("🔄 Update result:", updatedSetting);

    if (!updatedSetting) {
      console.log("❌ Setting not found for update");
      return NextResponse.json({ error: "Setting not found" }, { status: 404 });
    }

    console.log("✅ Setting updated successfully");
    const response = NextResponse.json(updatedSetting);
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate",
    );
    return response;
  } catch (error) {
    console.error("❌ Error updating setting:", error);
    return NextResponse.json(
      { error: "Failed to update setting" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value, type, category, description } = body;

    if (!key || !type || !category) {
      return NextResponse.json(
        { error: "Key, type, and category are required" },
        { status: 400 },
      );
    }

    const newSetting = await SettingsService.create({
      key,
      value: value || null,
      type: type || "string",
      category,
      description: description || null,
    });

    return NextResponse.json(newSetting, { status: 201 });
  } catch (error) {
    console.error("Error creating setting:", error);
    return NextResponse.json(
      { error: "Failed to create setting" },
      { status: 500 },
    );
  }
}
