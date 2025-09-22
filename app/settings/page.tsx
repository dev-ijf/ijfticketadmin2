"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Upload,
  Palette,
  Settings as SettingsIcon,
} from "lucide-react";
import Image from "next/image";
import {
  Setting,
  SettingUpdate,
  SETTING_KEYS,
  DEFAULT_SETTINGS,
} from "@/types/settings";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<Record<string, string>>({});
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    setUpdating(key);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key, value }),
      });

      if (!response.ok) throw new Error("Failed to update setting");

      const updatedSetting = await response.json();
      setSettings((prev) =>
        prev.map((setting) => (setting.key === key ? updatedSetting : setting)),
      );

      toast({
        title: "Success",
        description: "Setting updated successfully",
      });

      setLastUpdate(new Date());

      // Dispatch multiple events for better real-time updates
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("settingsUpdated", {
            detail: { key, value },
          }),
        );

        // Also dispatch specific events for different components
        if (key === "app_logo") {
          window.dispatchEvent(new CustomEvent("logoUpdated"));
        }
        if (key === "app_name" || key === "app_description") {
          window.dispatchEvent(new CustomEvent("metadataUpdated"));
        }
        if (key.includes("sidebar_")) {
          window.dispatchEvent(new CustomEvent("sidebarRefresh"));
        }

        console.log("📡 Settings update events dispatched for:", key);
      }, 100);
    } catch (error) {
      console.error("Error updating setting:", error);
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleFileUpload = async (file: File, settingKey: string) => {
    setUploading(settingKey);
    try {
      const filename = `${settingKey}_${Date.now()}.${file.name.split(".").pop()}`;

      const response = await fetch(`/api/upload?filename=${filename}`, {
        method: "POST",
        body: file,
      });

      if (!response.ok) throw new Error("Failed to upload file");

      const blob = await response.json();
      console.log("📁 File uploaded successfully:", blob.url);

      // Update setting in database
      await updateSetting(settingKey, blob.url);

      // Force refresh logo in sidebar by dispatching multiple events
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("settingsUpdated", {
            detail: { key: settingKey, value: blob.url },
          }),
        );

        // Dispatch specific logo events
        window.dispatchEvent(new CustomEvent("logoUpdated"));
        window.dispatchEvent(new CustomEvent("sidebarRefresh"));

        // Force a page metadata refresh if it's favicon
        if (settingKey === "app_favicon") {
          window.dispatchEvent(new CustomEvent("metadataUpdated"));
        }

        console.log("📡 File upload events dispatched for:", settingKey);
      }, 300);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const getSettingsByCategory = (category: string) => {
    return settings.filter((setting) => setting.category === category);
  };

  const getSettingValue = (key: string) => {
    return settings.find((setting) => setting.key === key)?.value || "";
  };

  const renderFileUpload = (setting: Setting) => (
    <div className="space-y-4">
      <div>
        <Label htmlFor={setting.key}>{setting.description}</Label>
        <div className="mt-2 flex items-center space-x-4">
          <Input
            id={setting.key}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileUpload(file, setting.key);
              }
            }}
            disabled={uploading === setting.key}
            className="flex-1"
          />
          {uploading === setting.key && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
        </div>
      </div>
      {setting.value && (
        <div className="mt-2">
          <Label>Current Logo:</Label>
          <div className="mt-2 p-4 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
            <img
              src={setting.value}
              alt={setting.description || setting.key}
              className="max-w-full max-h-24 w-auto h-auto object-contain"
              onError={(e) => {
                e.currentTarget.src = "/logo-main-new.png";
              }}
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderColorInput = (setting: Setting) => (
    <div className="space-y-2">
      <Label htmlFor={setting.key}>{setting.description}</Label>
      <div className="flex items-center space-x-2">
        <Input
          id={setting.key}
          type="color"
          value={setting.value || "#000000"}
          onChange={(e) => updateSetting(setting.key, e.target.value)}
          disabled={updating === setting.key}
          className="w-16 h-10"
        />
        <Input
          type="text"
          value={setting.value || ""}
          onChange={(e) => updateSetting(setting.key, e.target.value)}
          placeholder="#000000"
          disabled={updating === setting.key}
          className="flex-1"
        />
        {updating === setting.key && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
      </div>
    </div>
  );

  const renderTextInput = (setting: Setting) => {
    const tempKey = `temp_${setting.key}`;
    const currentValue =
      tempValues[tempKey] !== undefined
        ? tempValues[tempKey]
        : setting.value || "";

    const handleInputChange = (value: string) => {
      setTempValues((prev) => ({ ...prev, [tempKey]: value }));
    };

    const handleSave = async () => {
      const valueToSave = tempValues[tempKey] || setting.value || "";
      await updateSetting(setting.key, valueToSave);
      // Clear temp value after successful save
      setTempValues((prev) => {
        const newTemp = { ...prev };
        delete newTemp[tempKey];
        return newTemp;
      });
    };

    const hasChanges =
      tempValues[tempKey] !== undefined &&
      tempValues[tempKey] !== setting.value;

    return (
      <div className="space-y-3">
        <Label htmlFor={setting.key}>{setting.description}</Label>
        {setting.type === "string" && setting.key.includes("description") ? (
          <div className="space-y-2">
            <Textarea
              id={setting.key}
              value={currentValue}
              onChange={(e) => handleInputChange(e.target.value)}
              disabled={updating === setting.key}
              placeholder={`Enter ${setting.description?.toLowerCase() || setting.key}`}
              rows={3}
            />
            {hasChanges && (
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleSave}
                  disabled={updating === setting.key}
                  size="sm"
                >
                  {updating === setting.key ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button
                  onClick={() =>
                    setTempValues((prev) => {
                      const newTemp = { ...prev };
                      delete newTemp[tempKey];
                      return newTemp;
                    })
                  }
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Input
                id={setting.key}
                type={setting.type === "number" ? "number" : "text"}
                value={currentValue}
                onChange={(e) => handleInputChange(e.target.value)}
                disabled={updating === setting.key}
                placeholder={`Enter ${setting.description?.toLowerCase() || setting.key}`}
                className="flex-1"
              />
            </div>
            {hasChanges && (
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleSave}
                  disabled={updating === setting.key}
                  size="sm"
                >
                  {updating === setting.key ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button
                  onClick={() =>
                    setTempValues((prev) => {
                      const newTemp = { ...prev };
                      delete newTemp[tempKey];
                      return newTemp;
                    })
                  }
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSetting = (setting: Setting) => {
    if (setting.type === "file") {
      return renderFileUpload(setting);
    } else if (setting.type === "color") {
      return renderColorInput(setting);
    } else {
      return renderTextInput(setting);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <SettingsIcon className="h-8 w-8" />
              Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your application settings, branding, and appearance.
            </p>
          </div>
          {lastUpdate && (
            <div className="text-sm text-muted-foreground">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        {/* Branding Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Branding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {getSettingsByCategory("branding").map((setting) => (
              <div key={setting.id}>{renderSetting(setting)}</div>
            ))}
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {getSettingsByCategory("appearance").map((setting) => (
              <div key={setting.id}>{renderSetting(setting)}</div>
            ))}
          </CardContent>
        </Card>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {getSettingsByCategory("general").map((setting) => (
              <div key={setting.id}>{renderSetting(setting)}</div>
            ))}
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Live Preview
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => {
                    console.log("🔄 Testing current settings values...");
                    console.log(
                      "Primary:",
                      getSettingValue("sidebar_primary_color"),
                    );
                    console.log(
                      "Secondary:",
                      getSettingValue("sidebar_secondary_color"),
                    );
                    console.log("App Name:", getSettingValue("app_name"));
                    toast({
                      title: "Check Console",
                      description: "Current settings logged to console",
                    });
                  }}
                  variant="ghost"
                  size="sm"
                >
                  🔍 Debug
                </Button>
                <Button
                  onClick={async () => {
                    console.log("🔄 Force updating sidebar colors...");
                    await updateSetting("sidebar_primary_color", "#e91984");
                    await updateSetting("sidebar_secondary_color", "#75c64");
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent("settingsUpdated"));
                      window.dispatchEvent(new CustomEvent("sidebarRefresh"));
                    }, 100);
                  }}
                  variant="outline"
                  size="sm"
                >
                  🎨 Fix Colors
                </Button>
                <Button
                  onClick={async () => {
                    console.log("📝 Force updating app title...");
                    const newTitle = "Cianjur Edelweiss Running Festival 2025";
                    await updateSetting("app_name", newTitle);

                    // Force immediate title update
                    document.title = newTitle;

                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent("metadataUpdated"));
                    }, 100);

                    toast({
                      title: "Title Updated",
                      description: "Check browser tab title",
                    });
                  }}
                  variant="outline"
                  size="sm"
                >
                  📝 Fix Title
                </Button>
                <Button
                  onClick={async () => {
                    console.log("🎯 Force updating favicon...");
                    const currentLogo =
                      getSettingValue("app_logo") || "/logo-main-new.png";
                    await updateSetting("app_favicon", currentLogo);

                    // Force immediate favicon update
                    const existingFavicons =
                      document.querySelectorAll("link[rel*='icon']");
                    existingFavicons.forEach((favicon) => favicon.remove());

                    const newFavicon = document.createElement("link");
                    newFavicon.rel = "icon";
                    newFavicon.type = "image/png";
                    newFavicon.href = currentLogo + "?v=" + Date.now();
                    document.head.appendChild(newFavicon);

                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent("metadataUpdated"));
                    }, 100);

                    toast({
                      title: "Favicon Updated",
                      description: "Check browser tab icon",
                    });
                  }}
                  variant="outline"
                  size="sm"
                >
                  🎯 Fix Favicon
                </Button>
                <Button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("settingsUpdated"));
                    window.dispatchEvent(new CustomEvent("logoUpdated"));
                    window.dispatchEvent(new CustomEvent("sidebarRefresh"));
                    window.dispatchEvent(new CustomEvent("metadataUpdated"));
                    toast({
                      title: "Refresh Triggered",
                      description: "All components have been refreshed",
                    });
                  }}
                  variant="outline"
                  size="sm"
                >
                  🔄 Force Refresh
                </Button>
                <Button
                  onClick={() => {
                    window.location.reload();
                  }}
                  variant="ghost"
                  size="sm"
                >
                  ↻ Reload Page
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border-2 border-dashed border-muted-foreground/25">
              <div
                className="p-4 rounded-lg text-white"
                style={{
                  background: `linear-gradient(to bottom, ${getSettingValue("sidebar_primary_color") || "#e91984"}, ${getSettingValue("sidebar_secondary_color") || "#75c64"})`,
                }}
              >
                <div className="flex items-center space-x-4">
                  {getSettingValue("app_logo") && (
                    <div className="w-20 h-20 flex items-center justify-center p-2 bg-white/10 rounded-lg">
                      <img
                        src={getSettingValue("app_logo")}
                        alt="Logo Preview"
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "/logo-main-new.png";
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">
                      {getSettingValue("app_name") || "App Name"}
                    </h3>
                    <p className="text-sm opacity-90">
                      {getSettingValue("app_description") || "App Description"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="text-sm text-muted-foreground p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-900 mb-2">
                  💡 How to test:
                </p>
                <ol className="list-decimal list-inside text-blue-800 space-y-1">
                  <li>Make changes to settings above</li>
                  <li>Click "Save Changes" button</li>
                  <li>Check this preview updates</li>
                  <li>Look at the sidebar on the left</li>
                  <li>Check browser tab title changes</li>
                </ol>
              </div>
              <div className="text-sm p-3 bg-green-50 rounded-lg">
                <p className="font-medium text-green-900 mb-2">
                  ✅ Current Status:
                </p>
                <div className="text-green-800 space-y-1">
                  <div>
                    Logo:{" "}
                    {getSettingValue("app_logo") ? "✅ Set" : "❌ Default"}
                  </div>
                  <div>
                    Primary Color:{" "}
                    <span className="font-mono">
                      {getSettingValue("sidebar_primary_color") || "#e91984"}
                    </span>
                  </div>
                  <div>
                    Secondary Color:{" "}
                    <span className="font-mono">
                      {getSettingValue("sidebar_secondary_color") || "#75c64"}
                    </span>
                  </div>
                  <div>
                    App Name:{" "}
                    {getSettingValue("app_name") ? "✅ Custom" : "❌ Default"}
                  </div>
                  <div className="text-xs">
                    Browser Title:{" "}
                    <span className="font-mono">
                      {typeof document !== "undefined"
                        ? document.title
                        : "Loading..."}
                    </span>
                  </div>
                  <div className="text-xs">
                    Current Favicon:{" "}
                    {typeof document !== "undefined" && (
                      <span className="font-mono">
                        {document
                          .querySelector("link[rel='icon']")
                          ?.getAttribute("href") || "None"}
                      </span>
                    )}
                  </div>
                  {lastUpdate && (
                    <div className="text-xs mt-2 pt-2 border-t border-green-200">
                      Updated: {lastUpdate.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
