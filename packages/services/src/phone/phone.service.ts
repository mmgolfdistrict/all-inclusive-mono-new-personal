import Logger from "@golf-district/shared/src/logger";
import dayjs from "dayjs";
import UTC from "dayjs/plugin/utc";
import { loggerService } from "../webhooks/logging.service";

export class PhoneService {
  private readonly logger = Logger(PhoneService.name);

  /**
   * Validate the phone number using Abstract API.
   */
  validate = async (phoneNumber: string) => {
    try {
      const response = await fetch(
        `https://phonevalidation.abstractapi.com/v1/?api_key=${process.env.ABSTRACT_API_KEY}&phone=${phoneNumber}`
      );
      const result = await response.json();
      return result;
    } catch (error: any) {
      this.logger.error(error);
      loggerService.errorLog({
        message: "PHONE_VALIDATION_ERROR",
        userId: "",
        url: "/phone",
        userAgent: "",
        stackTrace: `Error fetching phone validation: ${error}`,
        additionalDetailsJSON: JSON.stringify({ error }),
      });
      this.logger.error(`Error validating phone number: ${phoneNumber}`);
      return false;
    }
  };
}
