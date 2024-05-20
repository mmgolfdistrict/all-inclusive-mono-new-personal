import { db } from "@golf-district/database";
import { AppSettingsService } from "./app-settings.service";

export const appSettingService = new AppSettingsService(db, process.env.REDIS_URL!, process.env.REDIS_TOKEN!);
