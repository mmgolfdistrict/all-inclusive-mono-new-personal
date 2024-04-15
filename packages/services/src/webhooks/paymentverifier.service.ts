import Logger from "@golf-district/shared/src/logger";
import type { Db } from "@golf-district/database";
import { eq, or } from "@golf-district/database";
import type { HyperSwitchWebhookService } from "./hyperswitch.webhook.service";
import type { InsertBooking } from "@golf-district/database/schema/bookings";
import { bookings } from "@golf-district/database/schema/bookings";
import { getDate } from "date-fns";

export class PaymentVerifierService {
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
      const hyperswitchEndPoint = `https://sandbox.hyperswitch.io/payments/${record.providerPaymentId}`;
      const myHeaders = new Headers();
      myHeaders.append("api-key", "snd_NYL9A7V0hbeKw16eJUAWxJ58IuX4dN4zWpHn8gcq5h5PQ2Ncw1ENGHmvYATH7dbl");
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
