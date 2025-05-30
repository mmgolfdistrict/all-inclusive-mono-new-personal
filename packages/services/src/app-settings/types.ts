export interface AppSetting {
  id: string;
  groupName: string | null;
  internalName: string;
  caption: string;
  description: string | null;
  value: string | null;
  datatype?: string | null;
  createdDateTime: string;
  lastUpdatedDateTime: string;
}

export type AppSettingsResponse = AppSetting[];
