"use client";

import { useState, useEffect, useCallback } from "react";
import { Setting, SettingUpdate, SETTING_KEYS, DEFAULT_SETTINGS } from "@/types/settings";

export function useSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async (category?: string) => {
    try {
      setLoading(true);
      setError(null);
      const url = category ? `/api/settings?category=${category}` : "/api/settings";
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }

      const data = await response.json();
      setSettings(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSetting = useCallback(async (key: string, value: string) => {
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key, value }),
      });

      if (!response.ok) {
        throw new Error("Failed to update setting");
      }

      const updatedSetting = await response.json();
      setSettings(prev =>
        prev.map(setting =>
          setting.key === key ? updatedSetting : setting
        )
      );

      return updatedSetting;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update setting";
      throw new Error(errorMessage);
    }
  }, []);

  const getSettingValue = useCallback((key: string): string => {
    const setting = settings.find(s => s.key === key);
    return setting?.value || DEFAULT_SETTINGS[key] || "";
  }, [settings]);

  const getSettingsByCategory = useCallback((category: string): Setting[] => {
    return settings.filter(setting => setting.category === category);
  }, [settings]);

  const getBrandingSettings = useCallback(() => {
    return getSettingsByCategory("branding");
  }, [getSettingsByCategory]);

  const getAppearanceSettings = useCallback(() => {
    return getSettingsByCategory("appearance");
  }, [getSettingsByCategory]);

  const getGeneralSettings = useCallback(() => {
    return getSettingsByCategory("general");
  }, [getSettingsByCategory]);

  const getDynamicSettings = useCallback(() => {
    return {
      logo: getSettingValue(SETTING_KEYS.APP_LOGO),
      favicon: getSettingValue(SETTING_KEYS.APP_FAVICON),
      primaryColor: getSettingValue(SETTING_KEYS.SIDEBAR_PRIMARY_COLOR),
      secondaryColor: getSettingValue(SETTING_KEYS.SIDEBAR_SECONDARY_COLOR),
      appName: getSettingValue(SETTING_KEYS.APP_NAME),
      appDescription: getSettingValue(SETTING_KEYS.APP_DESCRIPTION),
    };
  }, [getSettingValue]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSetting,
    getSettingValue,
    getSettingsByCategory,
    getBrandingSettings,
    getAppearanceSettings,
    getGeneralSettings,
    getDynamicSettings,
  };
}

export function useDynamicSettings() {
  const { getDynamicSettings, loading } = useSettings();
  const [dynamicSettings, setDynamicSettings] = useState({
    logo: DEFAULT_SETTINGS[SETTING_KEYS.APP_LOGO],
    favicon: DEFAULT_SETTINGS[SETTING_KEYS.APP_FAVICON],
    primaryColor: DEFAULT_SETTINGS[SETTING_KEYS.SIDEBAR_PRIMARY_COLOR],
    secondaryColor: DEFAULT_SETTINGS[SETTING_KEYS.SIDEBAR_SECONDARY_COLOR],
    appName: DEFAULT_SETTINGS[SETTING_KEYS.APP_NAME],
    appDescription: DEFAULT_SETTINGS[SETTING_KEYS.APP_DESCRIPTION],
  });

  useEffect(() => {
    if (!loading) {
      setDynamicSettings(getDynamicSettings());
    }
  }, [getDynamicSettings, loading]);

  return { dynamicSettings, loading };
}
