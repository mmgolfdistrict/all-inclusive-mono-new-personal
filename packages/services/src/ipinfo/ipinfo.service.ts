import Logger from "@golf-district/shared/src/logger";
import dayjs from "dayjs";
import UTC from "dayjs/plugin/utc";
import { loggerService } from "../webhooks/logging.service";

dayjs.extend(UTC);
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
}
