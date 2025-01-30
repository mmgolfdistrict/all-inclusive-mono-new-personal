import { randomUUID } from "crypto";
import type { Db } from "@golf-district/database";
import { and, asc, between, eq, inArray } from "@golf-district/database";
import { courses } from "@golf-district/database/schema/courses";
import { entities } from "@golf-district/database/schema/entities";
import { providers } from "@golf-district/database/schema/providers";
import { providerCourseLink } from "@golf-district/database/schema/providersCourseLink";
import type { InsertTeeTimes } from "@golf-district/database/schema/teeTimes";
import { teeTimes } from "@golf-district/database/schema/teeTimes";
import { dateToUtcTimestamp, isEqual } from "@golf-district/shared";
import Logger from "@golf-district/shared/src/logger";
import dayjs from "dayjs";
// import { isEqual } from "lodash";
import type { ProviderService } from "../tee-sheet-provider/providers.service";
import type { ProviderAPI } from "../tee-sheet-provider/sheet-providers";
import type { LightspeedTeeTimeResponse } from "../tee-sheet-provider/sheet-providers/types/lightspeed.type";
import { LightspeedTeeTimeDataResponse } from "../tee-sheet-provider/sheet-providers/types/lightspeed.type";

interface IndexingSchedule {
  day: number;
  interval: number;
}
// interface TeeTime {
//   id: string;
//   providerTeeTimeId: string;
//   date: string; // assuming date is stored as a string in ISO format
//   time: number; // military time as integer
//   numberOfHoles: number;
//   maxPlayersPerBooking: number;
//   availableFirstHandSpots: number;
//   availableSecondHandSpots: number;
//   greenFee: number;
//   cartFee: number;
//   greenFeeTax: number;
//   cartFeeTax: number;
//   courseProvider: string;
//   courseId: string;
//   entityId: string;
// }

// type LastIndexed = Record<string, string | undefined>;
const INDEXING_SCHEDULE: IndexingSchedule[] = [
  { day: 1, interval: 15 * 60 * 1000 },
  { day: 2, interval: 30 * 60 * 1000 },
  { day: 3, interval: 1 * 60 * 60 * 1000 },
  { day: 4, interval: 2 * 60 * 60 * 1000 },
  { day: 5, interval: 4 * 60 * 60 * 1000 },
  { day: 6, interval: 5 * 60 * 60 * 1000 },
  { day: 7, interval: 6 * 60 * 60 * 1000 },
  { day: 8, interval: 7 * 60 * 60 * 1000 },
  { day: 9, interval: 8 * 60 * 60 * 1000 },
  { day: 10, interval: 9 * 60 * 60 * 1000 },
  { day: 11, interval: 10 * 60 * 60 * 1000 },
  { day: 12, interval: 11 * 60 * 60 * 1000 },
  { day: 13, interval: 12 * 60 * 60 * 1000 },
  { day: 14, interval: 13 * 60 * 60 * 1000 },
  { day: 15, interval: 14 * 60 * 60 * 1000 },
];

/**
 * `ForeUpWebhookService` - A service for handling ForeUp webhooks and updating tee times in the database.
 *
 * The `ForeUpWebhookService` class provides a method to handle ForeUp webhooks, retrieve the course to index,
 * fetch tee times from the provider, and update the database with the fetched tee times. It utilizes the `Logger`
 * utility for logging information, warnings, and errors to aid in diagnosing issues and understanding the service usage and flow.
 *
 * @example
 * const foreUpWebhookService = new ForeUpWebhookService(database, providerService);
 * await foreUpWebhookService.handelWebhook();
 *
 * @see {@link Logger}
 */
export class LightspeedWebhookService {
  private readonly logger = Logger(LightspeedWebhookService.name);
  /**
   * Creates an instance of `ForeUpWebhookService`.
   *
   * @param {Db} database - The database instance to interact with.
   * @param {ProviderService} providerService - The provider service for fetching tee times from ForeUp.
   */
  constructor(private readonly database: Db, private readonly providerService: ProviderService) {}

  indexTeeTime = async (
    formattedDate: string,
    providerCourseId: string,
    providerTeeSheetId: string,
    provider: ProviderAPI,
    token: string,
    time: number,
    teeTimeId: string
  ) => {
    try {
      const teeTimeResponse = (await provider.getTeeTimes(
        token,
        providerCourseId,
        providerTeeSheetId,
        time.toString().padStart(4, "0"),
        (time + 1).toString().padStart(4, "0"),
        formattedDate
      )) as LightspeedTeeTimeResponse[];

      const [indexedTeeTime] = await this.database
        .select({
          id: teeTimes.id,
          courseId: teeTimes.courseId,
          availableFirstHandSpots: teeTimes.availableFirstHandSpots,
          availableSecondHandSpots: teeTimes.availableSecondHandSpots,
          entityId: courses.entityId,
          providerTeeTimeId: teeTimes.providerTeeTimeId,
        })
        .from(teeTimes)
        .leftJoin(courses, eq(courses.id, teeTimes.courseId))
        .where(eq(teeTimes.id, teeTimeId))
        .execute()
        .catch((err) => {
          this.logger.error(err);
          throw new Error(`Error finding tee time id`);
        });

      const teeTime = teeTimeResponse.find((teetime) => teetime.id === indexedTeeTime?.providerTeeTimeId);

      if (indexedTeeTime && teeTime) {
        const hours = Number(teeTime.attributes.start_time.split(":")?.[0]);
        const minutes = Number(teeTime.attributes.start_time?.split(":")?.[1]);
        const militaryTime = hours * 100 + minutes;
        const formattedDatetime = dayjs(`${teeTime.attributes.date} ${teeTime.attributes.start_time}`)
          .utc()
          .format("YYYY-MM-DD HH:mm:ss.SSS");
        const formattedProviderDate = dayjs(
          `${teeTime.attributes.date} ${teeTime.attributes.start_time}`
        ).format("YYYY-MM-DDTHH:mm:ss.SSS");

        const providerTeeTime = {
          id: randomUUID(),
          courseId: indexedTeeTime.courseId,
          providerTeeTimeId: String(teeTime.id),
          numberOfHoles: teeTime.attributes.hole ? 18 : 9,
          date: formattedDatetime,
          time: militaryTime,
          maxPlayersPerBooking: teeTime.attributes.free_slots,
          availableFirstHandSpots: teeTime.attributes.free_slots,
          availableSecondHandSpots: 0,
          greenFeePerPlayer: (teeTime.attributes.rates[0]?.green_fee ?? 0) * 100,
          cartFeePerPlayer: (teeTime.attributes.rates[0]?.one_person_cart ?? 0) * 100,
          greenFeeTaxPerPlayer: 0,
          cartFeeTaxPerPlayer: 0,
          providerDate: formattedProviderDate,
        };

        const providerTeeTimeMatchingKeys = {
          id: indexedTeeTime.id,
          providerTeeTimeId: indexedTeeTime.providerTeeTimeId,
          numberOfHoles: teeTime.attributes.hole ? 18 : 9,
          date: formattedDatetime,
          time: militaryTime,
          maxPlayersPerBooking: teeTime.attributes.free_slots,
          greenFeePerPlayer: (teeTime.attributes.rates[0]?.green_fee ?? 0) * 100,
          cartFeePerPlayer: (teeTime.attributes.rates[0]?.one_person_cart ?? 0) * 100,
          greenFeeTaxPerPlayer: 0,
          cartFeeTaxPerPlayer: 0,
          courseId: indexedTeeTime.courseId,
          availableFirstHandSpots: indexedTeeTime.availableFirstHandSpots,
          availableSecondHandSpots: indexedTeeTime.availableSecondHandSpots,
          providerDate: formattedProviderDate,
        };
        if (isEqual(indexedTeeTime, providerTeeTimeMatchingKeys)) {
          // no changes to tee time do nothing
          return;
        } else {
          await this.database
            .update(teeTimes)
            .set(providerTeeTime)
            .where(eq(teeTimes.id, indexedTeeTime.id))
            .execute()
            .catch((err) => {
              this.logger.error(err);
              throw new Error(`Error updating tee time: ${err}`);
            });
        }
      }
    } catch (error) {
      this.logger.error(error);
      // throw new Error(`Error indexing tee time: ${error}`);
      // throw new Error(
      //   `We're sorry. This time is no longer available. Someone just booked this. It may take a minute for the sold time you selected to be removed. Please select another time.`
      // );
      return {
        error: true,
        message: `We're sorry. This time is no longer available. Someone just booked this. It may take a minute for the sold time you selected to be removed. Please select another time.`,
      };
    }
  };
}
