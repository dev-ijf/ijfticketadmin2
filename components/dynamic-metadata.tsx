"use client";

import { useEffect, useState } from "react";

interface MetadataSettings {
  appName: string;
  appDescription: string;
  favicon: string;
}

// Global metadata state to ensure consistency
let globalMetadata: MetadataSettings = {
  appName: "Cianjur Edelweiss Running Festival 2025",
  appDescription: "Admin Event Cianjur Edelweiss Running Festival 2025",
  favicon: "/favicon.png",
};

// Force DOM metadata update
const forceDOMUpdate = (metadata: MetadataSettings) => {
  if (typeof window === "undefined") return;

  console.log("🔄 Force updating DOM metadata:", metadata);

  // Update document title immediately
  document.title = metadata.appName;

  // Remove all existing favicons first, with a safety check
  const existingFavicons = document.querySelectorAll("link[rel*='icon']");
  existingFavicons.forEach((favicon) => {
    if (favicon.parentNode) {
      favicon.parentNode.removeChild(favicon);
    }
  });

  const cacheBustedFaviconUrl = metadata.favicon + "?v=" + Date.now();

  // Create new favicon
  const newFavicon = document.createElement("link");
  newFavicon.rel = "icon";
  newFavicon.type = "image/png";
  newFavicon.href = cacheBustedFaviconUrl; // Cache bust
  document.head.appendChild(newFavicon);

  // Also create shortcut icon for better browser support
  const shortcutIcon = document.createElement("link");
  shortcutIcon.rel = "shortcut icon";
  shortcutIcon.href = cacheBustedFaviconUrl;
  document.head.appendChild(shortcutIcon);

  // Update meta description
  let metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute("content", metadata.appDescription);
  } else {
    metaDescription = document.createElement("meta");
    metaDescription.setAttribute("name", "description");
    metaDescription.setAttribute("content", metadata.appDescription);
    document.head.appendChild(metaDescription);
  }
  console.log("📄 Meta description updated");

  // Store in global state
  globalMetadata = { ...metadata };
};

export function useDynamicMetadata() {
  const [metadata, setMetadata] = useState<MetadataSettings>(globalMetadata);

  const fetchAndApplyMetadata = async () => {
    try {
      console.log("🔍 Fetching metadata settings...");

      // Fetch with cache buster
      const timestamp = Date.now();
      const response = await fetch(`/api/settings?t=${timestamp}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const allSettings = await response.json();
      console.log("📄 All settings received:", allSettings);

      if (Array.isArray(allSettings) && allSettings.length > 0) {
        const faviconSetting = allSettings.find(
          (s: any) => s.key === "app_favicon",
        );
        const nameSetting = allSettings.find((s: any) => s.key === "app_name");
        const descriptionSetting = allSettings.find(
          (s: any) => s.key === "app_description",
        );

        const newMetadata = {
          appName:
            nameSetting?.value || "Cianjur Edelweiss Running Festival 2025",
          appDescription:
            descriptionSetting?.value ||
            "Admin Event Cianjur Edelweiss Running Festival 2025",
          favicon: faviconSetting?.value || "/favicon.png",
        };

        console.log("✅ New metadata to apply:", newMetadata);

        setMetadata(newMetadata);
        forceDOMUpdate(newMetadata);
      }
    } catch (error) {
      console.error("❌ Failed to fetch metadata settings:", error);
    }
  };

  useEffect(() => {
    fetchAndApplyMetadata();

    // Listen for settings updates with multiple event types
    const handleUpdate = () => {
      console.log("🔄 Metadata update event received");
      setTimeout(fetchAndApplyMetadata, 200);
    };

    const events = ["settingsUpdated", "metadataUpdated", "sidebarRefresh"];
    events.forEach((event) => {
      window.addEventListener(event, handleUpdate);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleUpdate);
      });
    };
  }, []);

  // Apply metadata changes whenever state changes
  useEffect(() => {
    forceDOMUpdate(metadata);
  }, [metadata]);

  return metadata;
}

export function DynamicMetadata() {
  useDynamicMetadata();
  return null;
}

export default DynamicMetadata;
