import { db } from "@golf-district/database";
import { AppSettingsService } from "@golf-district/service/src/app-settings/app-settings.service";

const appSettingService = new AppSettingsService(db, process.env.REDIS_URL!, process.env.REDIS_TOKEN!);

const setAppSettingsInCache = async () => {
  const appSettingsService = new AppSettingsService(db, process.env.REDIS_URL!, process.env.REDIS_TOKEN!);
  try {
    await appSettingsService.bootstrap();
  } catch (err) {
    console.log(err);
  }
};

export { setAppSettingsInCache, appSettingService };
