export interface Setting {
  id: number;
  key: string;
  value: string | null;
  type: SettingType;
  category: SettingCategory;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export type SettingType = 'string' | 'color' | 'file' | 'boolean' | 'number';

export type SettingCategory = 'branding' | 'appearance' | 'general';

export interface SettingInput {
  key: string;
  value?: string | null;
  type?: SettingType;
  category: SettingCategory;
  description?: string | null;
}

export interface SettingUpdate {
  key: string;
  value: string;
}

export interface DynamicSettings {
  logo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  appName: string;
  appDescription: string;
}

export interface SettingsResponse {
  success: boolean;
  data?: Setting | Setting[];
  error?: string;
}

export interface UploadResponse {
  url: string;
  downloadUrl: string;
  pathname: string;
  size: number;
}

// Predefined setting keys
export const SETTING_KEYS = {
  // Branding
  APP_LOGO: 'app_logo',
  APP_FAVICON: 'app_favicon',

  // Appearance
  SIDEBAR_PRIMARY_COLOR: 'sidebar_primary_color',
  SIDEBAR_SECONDARY_COLOR: 'sidebar_secondary_color',

  // General
  APP_NAME: 'app_name',
  APP_DESCRIPTION: 'app_description',
} as const;

// Default values
export const DEFAULT_SETTINGS: Record<string, string> = {
  [SETTING_KEYS.APP_LOGO]: '/logo-main-new.png',
  [SETTING_KEYS.APP_FAVICON]: '/favicon.png',
  [SETTING_KEYS.SIDEBAR_PRIMARY_COLOR]: '#9333ea',
  [SETTING_KEYS.SIDEBAR_SECONDARY_COLOR]: '#7c3aed',
  [SETTING_KEYS.APP_NAME]: 'IJF Ticket Admin - Kreativa Global School',
  [SETTING_KEYS.APP_DESCRIPTION]: 'Admin panel untuk sistem ticketing IJF',
};
