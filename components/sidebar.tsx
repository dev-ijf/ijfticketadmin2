"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Users,
  ShoppingCart,
  CreditCard,
  Tag,
  FileText,
  BarChart3,
  Home,
  Bell,
  MessageSquare,
  QrCode,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { DynamicLogo } from "@/components/dynamic-logo";

// Color utility functions
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 147, g: 51, b: 234 }; // fallback to default purple
};

const rgbToHex = (r: number, g: number, b: number) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

const darkenColor = (hex: string, amount: number = 0.2) => {
  const rgb = hexToRgb(hex);
  const newRgb = {
    r: Math.max(0, Math.floor(rgb.r * (1 - amount))),
    g: Math.max(0, Math.floor(rgb.g * (1 - amount))),
    b: Math.max(0, Math.floor(rgb.b * (1 - amount))),
  };
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
};

const lightenColor = (hex: string, amount: number = 0.3) => {
  const rgb = hexToRgb(hex);
  const newRgb = {
    r: Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * amount)),
    g: Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * amount)),
    b: Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * amount)),
  };
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
};

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Events & Tickets", href: "/events", icon: Calendar },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Tickets", href: "/tickets", icon: FileText },
  { name: "Scan", href: "/scan-ticket", icon: QrCode },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Users", href: "/users", icon: Users },
  { name: "Discounts", href: "/discounts", icon: Tag },
  {
    name: "Payment & Instructions",
    href: "/payment-channels",
    icon: CreditCard,
  },
  {
    name: "Notification Templates",
    href: "/notification-templates",
    icon: Bell,
  },
  { name: "Payment Logs", href: "/payment-logs", icon: BarChart3 },
  {
    name: "Notification Logs",
    href: "/notification-logs",
    icon: MessageSquare,
  },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface DynamicSettings {
  logo: string;
  primaryColor: string;
  secondaryColor: string;
}

export function Sidebar({
  open,
  setOpen,
}: { open?: boolean; setOpen?: (open: boolean) => void } = {}) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [dynamicSettings, setDynamicSettings] = useState<DynamicSettings>({
    logo: "/logo-main-new.png",
    primaryColor: "#e91984", // Pink color from settings
    secondaryColor: "#75c64", // Green color from settings
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        console.log("🔍 Fetching sidebar settings...");
        setIsLoading(true);

        // Add cache buster to force fresh data
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/settings?t=${timestamp}`);
        console.log("API Response status:", response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const allSettings = await response.json();
        console.log("📄 All settings received:", allSettings);

        if (Array.isArray(allSettings) && allSettings.length > 0) {
          const logoSetting = allSettings.find(
            (s: any) => s.key === "app_logo",
          );
          const primaryColorSetting = allSettings.find(
            (s: any) => s.key === "sidebar_primary_color",
          );
          const secondaryColorSetting = allSettings.find(
            (s: any) => s.key === "sidebar_secondary_color",
          );

          console.log("🖼️ Logo setting:", logoSetting);
          console.log("🎨 Primary color setting:", primaryColorSetting);
          console.log("🎨 Secondary color setting:", secondaryColorSetting);

          const newSettings = {
            logo: logoSetting?.value || "/logo-main-new.png",
            primaryColor: primaryColorSetting?.value || "#e91984",
            secondaryColor: secondaryColorSetting?.value || "#75c64",
          };

          console.log("✅ New dynamic settings:", newSettings);
          console.log("🖼️ Logo URL that will be used:", newSettings.logo);
          console.log(
            "🎨 Colors to be applied:",
            newSettings.primaryColor,
            "→",
            newSettings.secondaryColor,
          );

          // Force state update immediately
          setDynamicSettings({ ...newSettings });

          // Additional force update after delay
          setTimeout(() => {
            setDynamicSettings({ ...newSettings, timestamp: Date.now() });
          }, 100);
        } else {
          console.log("⚠️ No settings received, using defaults");
        }
      } catch (error) {
        console.error("❌ Failed to fetch dynamic settings:", error);
        // Keep default values on error
        console.log("🔄 Using default settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();

    // Add event listener for settings updates
    const handleSettingsUpdate = (event?: CustomEvent) => {
      console.log("🔄 Settings updated event received:", event?.detail);
      setTimeout(() => {
        fetchSettings();
        // Force component rerender by updating state timestamp
        setDynamicSettings((prev) => ({ ...prev }));
      }, 200); // Small delay to ensure DB is updated
    };

    // Also listen for storage changes (in case settings are updated in another tab)
    const handleStorageChange = () => {
      console.log("🔄 Storage change detected, refetching settings...");
      setTimeout(fetchSettings, 100);
    };

    // Force refresh mechanism
    const handleForceRefresh = () => {
      console.log("🔄 Force refresh triggered");
      fetchSettings();
    };

    // Multiple event listeners for better coverage
    window.addEventListener(
      "settingsUpdated",
      handleSettingsUpdate as EventListener,
    );
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("logoUpdated", handleForceRefresh);
    window.addEventListener("sidebarRefresh", handleForceRefresh);

    // Cleanup
    return () => {
      window.removeEventListener(
        "settingsUpdated",
        handleSettingsUpdate as EventListener,
      );
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("logoUpdated", handleForceRefresh);
      window.removeEventListener("sidebarRefresh", handleForceRefresh);
    };
  }, []);

  // Additional effect to watch for changes in dynamicSettings
  useEffect(() => {
    console.log("🔄 Dynamic settings state changed:", dynamicSettings);
  }, [dynamicSettings]);

  console.log("🎨 Rendering sidebar with colors:", dynamicSettings);
  console.log(
    "🎨 Actual gradient:",
    `linear-gradient(to bottom, ${dynamicSettings.primaryColor}, ${dynamicSettings.secondaryColor})`,
  );

  const sidebarContent = (
    <div
      className="flex h-full w-64 flex-col"
      style={{
        background: `linear-gradient(to bottom, ${dynamicSettings.primaryColor}, ${dynamicSettings.secondaryColor})`,
      }}
      key={`sidebar-${dynamicSettings.primaryColor}-${dynamicSettings.secondaryColor}`}
    >
      <div className="flex h-24 shrink-0 items-center justify-center px-4">
        {isLoading ? (
          <div className="w-20 h-20 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        ) : (
          <div
            className="w-20 h-20 flex items-center justify-center p-1"
            key={`logo-${dynamicSettings.logo}-${Date.now()}`} // Force re-render when logo changes
          >
            <img
              src={dynamicSettings.logo}
              alt="Application Logo"
              className="max-w-full max-h-full object-contain transition-all duration-300"
              style={{
                width: "auto",
                height: "auto",
                maxWidth: "100%",
                maxHeight: "100%",
              }}
              onError={(e) => {
                console.error("❌ Logo failed to load:", dynamicSettings.logo);
                console.log("🔄 Falling back to default logo");
                e.currentTarget.src = "/logo-main-new.png";
              }}
              onLoad={() => {
                console.log(
                  "✅ Logo loaded successfully:",
                  dynamicSettings.logo,
                );
              }}
            />
          </div>
        )}
      </div>
      <nav className="flex flex-1 flex-col px-4 pb-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-all duration-200 text-white",
                )}
                style={{
                  backgroundColor:
                    pathname === item.href
                      ? darkenColor(dynamicSettings.primaryColor, 0.3)
                      : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (pathname !== item.href) {
                    const hoverColor = lightenColor(
                      dynamicSettings.primaryColor,
                      0.2,
                    );
                    e.currentTarget.style.backgroundColor = hoverColor;
                    console.log("🎨 Menu hover color applied:", hoverColor);
                  }
                }}
                onMouseLeave={(e) => {
                  if (pathname !== item.href) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
                onClick={() => setOpen && setOpen(false)}
              >
                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );

  if (isMobile && open !== undefined && setOpen) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="p-0 w-64 max-w-full"
          style={{
            background: `linear-gradient(to bottom, ${dynamicSettings.primaryColor}, ${dynamicSettings.secondaryColor})`,
          }}
          key={`mobile-sidebar-${dynamicSettings.primaryColor}-${dynamicSettings.secondaryColor}`}
        >
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className="hidden md:flex h-full w-64 flex-col"
      style={{
        background: `linear-gradient(to bottom, ${dynamicSettings.primaryColor}, ${dynamicSettings.secondaryColor})`,
      }}
      key={`desktop-sidebar-${dynamicSettings.primaryColor}-${dynamicSettings.secondaryColor}`}
    >
      {sidebarContent}
    </div>
  );
}
