import { randomUUID } from "crypto";
import type { Db } from "@golf-district/database";
import { eq } from "@golf-district/database";
import { appSettings } from "@golf-district/database/schema/appSetting";
import { CacheService } from "../infura/cache.service";
import type { AppSetting, AppSettingsResponse } from "./types";

export class AppSettingsService {
  private cacheService?: CacheService;
  private redisUrl?: string;
  private redisToken?: string;
  private readonly db: Db;
  /**
   * Constructor for the `AppSettings` class.
   *
   * @param {Db} db - The database instance.
   * @param {string} redisUrl - The URL of the Redis server.
   * @param {string} redisToken - The authentication token for Redis.
   */
  constructor(db: Db, cacheService: CacheService);
  constructor(db: Db, redisUrl: string, redisToken: string);
  constructor(db: Db, arg1: CacheService | string, arg2?: string) {
    if (typeof arg1 === "string") {
      const redisUrl = arg1;
      const redisToken = arg2!;
      this.cacheService = new CacheService(redisUrl, redisToken);
      this.db = db;
    } else {
      const cacheService = arg1;
      this.cacheService = cacheService;
      this.db = db;
    }
  }

  getAppSetting = async (internalName: string) => {
    try {
      console.log("getting app settings", internalName);
      const appSettingData: AppSettingsResponse = await this.db
        .select({
          id: appSettings.id,
          groupName: appSettings.groupName,
          internalName: appSettings.internalName,
          caption: appSettings.caption,
          description: appSettings.description,
          value: appSettings.value,
          createdDateTime: appSettings.createdDateTime,
          lastUpdatedDateTime: appSettings.lastUpdatedDateTime,
        })
        .from(appSettings)
        .where(eq(appSettings.internalName, internalName));
      return appSettingData[0] || [];
    } catch (error: any) {
      console.log(error);
    }
  };

  insertAppSetting = async (payload: any) => {
    try {
      if (!this.cacheService) {
        throw new Error("Cache service not available");
      }

      const appSettingData = { ...payload, id: randomUUID() };

      await this.db.insert(appSettings).values(appSettingData);

      if (payload.description) {
        await this.cacheService.setCache(payload.internalName, payload.value);
      }
      console.log("Inserted app-setting: ", payload.internalName);
      return "Insertion successful";
    } catch (error: any) {
      console.error("Error while adding the app-settings", error.message);
    }
  };

  updateAppSetting = async (payload: any) => {
    try {
      if (!this.cacheService) {
        throw new Error("Cache service not available");
      }

      await this.db
        .update(appSettings)
        .set({
          groupName: payload.groupName,
          internalName: payload.internalName,
          caption: payload.caption,
          description: payload.description,
          value: payload.value,
        })
        .where(eq(appSettings.id, payload.id));

      if (payload.value) {
        await this.cacheService.setCache(payload.internalName, payload.value);
      } else {
        await this.cacheService.invalidateCache(payload.internalName);
      }
      console.log("Updated app-setting: ", payload.internalName);
      return "Updating successful";
    } catch (error: any) {
      console.error("Error while updating the app-settings", error.message);
    }
  };

  deleteAppSetting = async (id: string) => {
    try {
      if (!this.cacheService) {
        throw new Error("Cache service not available");
      }

      const [appSetting] = await this.db
        .select({ internalName: appSettings.internalName })
        .from(appSettings)
        .where(eq(appSettings.id, id))
        .execute();
      await this.db.delete(appSettings).where(eq(appSettings.id, id));

      if (appSetting) {
        await this.cacheService.invalidateCache(appSetting.internalName);
      }
      console.log("Deleted app-setting: ", appSetting?.internalName);
      return "Deleted successfully";
    } catch (error: any) {
      console.error("Error while deleting the app-settings", error.message);
    }
  };

  bootstrap = async () => {
    /* 
    This is the method that will be called when the application starts.
    This retrieves all the call keys from the table and stores it in the cache
    */

    try {
      if (!this.cacheService) {
        throw new Error("Cache service not available");
      }

      const appSettingsData: AppSettingsResponse = await this.db
        .select({
          id: appSettings.id,
          groupName: appSettings.groupName,
          internalName: appSettings.internalName,
          caption: appSettings.caption,
          description: appSettings.description,
          value: appSettings.value,
          createdDateTime: appSettings.createdDateTime,
          lastUpdatedDateTime: appSettings.lastUpdatedDateTime,
        })
        .from(appSettings);

      // this.cacheService.invalidateCache("SENSIBLE_CLIENT_ID");
      // this.cacheService.invalidateCache("SENSIBLE_CLIENT_SECRET");
      // this.cacheService.invalidateCache("SENSIBLE_AUDIENCE");

      if (appSettingsData && appSettingsData.length <= 0) {
        return;
      }

      for (const appSetting of appSettingsData) {
        if (appSetting.value) {
          await this.cacheService.setCache(appSetting.internalName, appSetting.value);
        }
      }
    } catch (error: any) {
      console.error("Error while bootstrapping the app-settings", error.message);
    }
  };

  get = async (internalName: string) => {
    /* 
    Takes a single internalName as input and returns the value from the cache.
    If it does not exist in the cache, then it retrieves from the database and adds it to the cache and then returns the value.
    If the value does not exist in the database then it throws an error
    */
    try {
      if (!this.cacheService) {
        throw new Error("Cache service not available");
      }

      const cachedData = await this.cacheService.getCache(internalName);
      if (cachedData) {
        return cachedData as string;
      }

      const appSettingsData: AppSettingsResponse = await this.db
        .select({
          id: appSettings.id,
          groupName: appSettings.groupName,
          internalName: appSettings.internalName,
          caption: appSettings.caption,
          description: appSettings.description,
          value: appSettings.value,
          createdDateTime: appSettings.createdDateTime,
          lastUpdatedDateTime: appSettings.lastUpdatedDateTime,
        })
        .from(appSettings)
        .where(eq(appSettings.internalName, internalName));

      if (!appSettingsData || appSettingsData.length <= 0) {
        throw new Error("Internal Name not available in DB");
      }
      const appSetting: AppSetting = appSettingsData[0]!;

      if (!appSetting) {
        throw new Error("Value of field isn't available");
      }
      await this.cacheService.setCache(internalName, appSetting.value);

      return appSetting.value;
    } catch (error: any) {
      console.error("Error while bootstrapping the app-settings", error.message);
    }
  };

  getMultiple = async (...internalNames: string[]) => {
    /* Same functionality as a single get except this takes multiple internal names. */
    try {
      if (!this.cacheService) {
        throw new Error("Cache service not available");
      }
      const cachedData: Record<string, any> = {};
      const missingNames: string[] = [];

      for (const internalName of internalNames) {
        const cachedValue = await this.cacheService.getCache(internalName);
        if (cachedValue) {
          cachedData[internalName] = cachedValue;
        } else {
          missingNames.push(internalName);
        }
      }

      if (missingNames.length > 0) {
        const appSettingsData = await Promise.all(
          missingNames.map(async (missingName: string) => {
            const response = await this.db
              .select({
                id: appSettings.id,
                groupName: appSettings.groupName,
                internalName: appSettings.internalName,
                caption: appSettings.caption,
                description: appSettings.description,
                value: appSettings.value,
                createdDateTime: appSettings.createdDateTime,
                lastUpdatedDateTime: appSettings.lastUpdatedDateTime,
              })
              .from(appSettings)
              .where(eq(appSettings.internalName, missingName));

            if (response) {
              return response[0];
            }
          })
        );
        for (const appSetting of appSettingsData) {
          if (!appSetting) {
            continue;
          }
          if (appSetting.value) {
            await this.cacheService.setCache(appSetting.internalName, appSetting.value);
          }
          cachedData[appSetting.internalName] = appSetting.value;
        }
      }

      return cachedData;
    } catch (error: any) {
      console.error("Error while getting multiple settigs from app-settings", error);
    }
  };
}
