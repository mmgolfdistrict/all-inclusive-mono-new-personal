import type { Db } from "@golf-district/database";
import { eq, or } from "@golf-district/database";
import type { InsertBooking } from "@golf-district/database/schema/bookings";
import { bookings } from "@golf-district/database/schema/bookings";
import Logger from "@golf-district/shared/src/logger";
import { getDate } from "date-fns";
import type { HyperSwitchWebhookService } from "./hyperswitch.webhook.service";

export class PaymentVerifierService {
  protected hyperSwitchBaseUrl = process.env.HYPERSWITCH_BASE_URL;
  private readonly logger = Logger(PaymentVerifierService.name);
  constructor(
    private readonly database: Db,
    private readonly hyperSwitchService: HyperSwitchWebhookService
  ) {}

  verifyPayment = async () => {
    const records: InsertBooking[] = await this.database
      .select()
      .from(bookings)
      .where(or(eq(bookings.status, "RESERVED"), eq(bookings.status, "PROCESSING")))
      .execute();

    if (!records) {
      this.logger.error(`Error fetching bookings`);
      throw new Error(`Error creating or finding customer`);
    }

    for (const record of records) {
      const hyperswitchEndPoint = `${this.hyperSwitchBaseUrl}/payments/${record.providerPaymentId}`;
      const myHeaders = new Headers();
      myHeaders.append("api-key", process.env.HYPERSWITCH_API_KEY??"");
      const requestOptions = {
        method: "GET",
        headers: myHeaders,
      };
      const response = await fetch(hyperswitchEndPoint, requestOptions);
      const paymentData = await response.json();
      let paymentStatus = "";
      if (paymentData.status === "succeeded") {
        paymentStatus = "CONFIRMED";
      } else if (paymentData.status === "failed" || paymentData.status === "expired") {
        paymentStatus = "FAILED";
      }
      await this.database.update(bookings).set({
        status: paymentStatus,
      });
    }
  };
}
