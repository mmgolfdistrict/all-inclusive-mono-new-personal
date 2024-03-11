export interface AppSetting {
  id: string;
  groupName: string | null;
  internalName: string;
  caption: string;
  description: string | null;
  createdDateTime: string;
  lastUpdatedDateTime: string;
}

export type AppSettingsResponse = AppSetting[];
