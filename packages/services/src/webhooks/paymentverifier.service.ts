import type { Db } from "@golf-district/database";
import { and, eq, or } from "@golf-district/database";
import type { InsertBooking } from "@golf-district/database/schema/bookings";
import { bookings } from "@golf-district/database/schema/bookings";
import { courses } from "@golf-district/database/schema/courses";
import { providers } from "@golf-district/database/schema/providers";
import { providerCourseLink } from "@golf-district/database/schema/providersCourseLink";
import { teeTimes } from "@golf-district/database/schema/teeTimes";
import Logger from "@golf-district/shared/src/logger";
import { SensibleService } from "../sensible/sensible.service";
import { ProviderService } from "../tee-sheet-provider/providers.service";
import type { HyperSwitchWebhookService } from "./hyperswitch.webhook.service";

export class PaymentVerifierService {
  protected hyperSwitchBaseUrl = process.env.HYPERSWITCH_BASE_URL;
  private readonly logger = Logger(PaymentVerifierService.name);
  constructor(
    private readonly database: Db,
    private readonly hyperSwitchService: HyperSwitchWebhookService,
    private readonly sensibleService: SensibleService,
    private readonly providerService: ProviderService
  ) { }

  verifyPayment = async () => {
    // const records: InsertBooking[] = await this.database
    //   .select()
    //   .from(bookings)
    //   .where(or(eq(bookings.status, "RESERVED"), eq(bookings.status, "PROCESSING")))
    //   .execute();

    const records = await this.database
      .select({
        courseId: teeTimes.courseId,
        providerPaymentId: bookings.providerPaymentId,
        providerBookingId: bookings.providerBookingId,
        providerCourseId: providerCourseLink.providerCourseId,
        internalId: providers.internalId,
        providerTeeSheetId: providerCourseLink.providerTeeSheetId,
        weatherGuaranteeId: bookings.weatherGuaranteeId,
        providerCourseConfiguration: providerCourseLink.providerCourseConfiguration,
      })
      .from(bookings)
      .innerJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .innerJoin(courses, eq(courses.id, teeTimes.courseId))
      .innerJoin(
        providerCourseLink,
        and(
          eq(providerCourseLink.courseId, teeTimes.courseId),
          eq(providerCourseLink.providerId, courses.providerId)
        )
      )
      .innerJoin(providers, eq(providers.id, providerCourseLink.providerId))
      .where(or(eq(bookings.status, "RESERVED"), eq(bookings.status, "PROCESSING")))
      .execute();

    console.log("verify Payment records called", records);

    if (!records) {
      this.logger.error(`Error fetching bookings`);
      throw new Error(`Error creating or finding customer`);
    }

    for (const record of records) {
      const hyperswitchEndPoint = `${this.hyperSwitchBaseUrl}/payments/${record.providerPaymentId}`;
      const myHeaders = new Headers();
      myHeaders.append("api-key", process.env.HYPERSWITCH_API_KEY ?? "");
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

        console.log("record", record);

        if (record.weatherGuaranteeId) {
          await this.sensibleService.cancelGuarantee(record.weatherGuaranteeId);
        }

        const { provider, token } = await this.providerService.getProviderAndKey(
          record.internalId!,
          record.courseId ?? "",
          record.providerCourseConfiguration!
        );

        await provider
          .deleteBooking(
            token,
            record.providerCourseId!,
            record.providerTeeSheetId!,
            record.providerBookingId
          )
          .catch((err) => {
            this.logger.error(`Error deleting booking: ${err}`);
            throw new Error(`Error deleting booking`);
          });
      }
      await this.database.update(bookings).set({
        status: paymentStatus,
      });
    }
  };
}
