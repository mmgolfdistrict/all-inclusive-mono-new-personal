import { setAppSettingsInCache } from "@golf-district/api/src/initialization";

export async function register() {
  await setAppSettingsInCache();
}
