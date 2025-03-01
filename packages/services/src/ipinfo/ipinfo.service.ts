import Logger from "@golf-district/shared/src/logger";
import dayjs from "dayjs";
import UTC from "dayjs/plugin/utc";
import { loggerService } from "../webhooks/logging.service";

dayjs.extend(UTC);

type IpInfoDataType = {
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string;
  org?: string;
  postal?: string;
  timezone?: string;
};


/**
 * Service class for handling user ip info operations.
 */
export class IpInfoService {
  private readonly logger = Logger(IpInfoService.name);

  async getIpInfo(ipAddress?: string) {
    try {
      const ipInfoResponse = await fetch(
        `https://ipinfo.io/${ipAddress}/json?token=${process.env.IP_INFO_API_KEY}`
      );
      if (ipInfoResponse.status !== 200) {
        throw new Error(`Error getting ip info for the ip Address: ${ipAddress}`);
      }
      const ipInfo = await ipInfoResponse.json();
      return JSON.stringify(ipInfo);
    } catch (error: any) {
      this.logger.error(error);
      loggerService.errorLog({
        message: "IP_INFO_ERROR",
        userId: "",
        url: "/ipinfo",
        userAgent: "",
        stackTrace: `Error fetching IP info: ${error}`,
        additionalDetailsJSON: JSON.stringify({ error }),
      });
      this.logger.error(`Error getting ip info for the ip Address: ${ipAddress}`);
      return "";
    }
  }

  async getIpInfoData(ipAddress?: string): Promise<IpInfoDataType> {
    try {
      const ipInfoResponse = await fetch(
        `https://ipinfo.io/${ipAddress}/json?token=${process.env.IP_INFO_API_KEY}`
      );
      if (ipInfoResponse.status !== 200) {
        throw new Error(`Error getting ip info for the ip Address: ${ipAddress}`);
      }
      return await ipInfoResponse.json();
    } catch (error: any) {
      this.logger.error(error);
      loggerService.errorLog({
        message: "IP_INFO_ERROR",
        userId: "",
        url: "/ipinfo",
        userAgent: "",
        stackTrace: `Error fetching IP info: ${error}`,
        additionalDetailsJSON: JSON.stringify({ error }),
      });
      this.logger.error(`Error getting ip info for the ip Address: ${ipAddress}`);
      return {
        ip: "",
        city: "",
        region: "",
        country: "",
        loc: "",
        org: "",
        postal: "",
        timezone: "",
      };
    }
  }
}
