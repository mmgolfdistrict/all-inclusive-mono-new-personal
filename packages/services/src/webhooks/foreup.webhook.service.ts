import { randomUUID } from "crypto";
import type { Db } from "@golf-district/database";
import { and, asc, between, eq, inArray, sql } from "@golf-district/database";
import { courses } from "@golf-district/database/schema/courses";
import { entities } from "@golf-district/database/schema/entities";
import { providerCourseLink } from "@golf-district/database/schema/providersCourseLink";
import type { InsertTeeTimes } from "@golf-district/database/schema/teeTimes";
import { teeTimes } from "@golf-district/database/schema/teeTimes";
import { dateToUtcTimestamp, isEqual, normalizeDateToUnixTimestamp } from "@golf-district/shared";
import Logger from "@golf-district/shared/src/logger";
import dayjs from "dayjs";
import dayjs1 from "dayjs";
import UTC from "dayjs/plugin/utc";
// import { isEqual } from "lodash";
import type { ProviderService } from "../tee-sheet-provider/providers.service";
import type { ProviderAPI } from "../tee-sheet-provider/sheet-providers";

dayjs1.extend(UTC);

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
//   soldByProvider: string;
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
export class ForeUpWebhookService {
  private readonly logger = Logger(ForeUpWebhookService.name);
  /**
   * Creates an instance of `ForeUpWebhookService`.
   *
   * @param {Db} database - The database instance to interact with.
   * @param {ProviderService} providerService - The provider service for fetching tee times from ForeUp.
   */
  constructor(private readonly database: Db, private readonly providerService: ProviderService) {}

  /**
   * Handles the ForeUp webhook.
   *
   * This method is responsible for processing the ForeUp webhook, retrieving the course to index,
   * fetching tee times from the provider, and updating the database with the fetched tee times.
   *
   * @throws {Error} Throws an error if any part of the process fails.
   *
   * @example
   * ```typescript
   * const foreUpWebhookService = new ForeUpWebhookService(database, providerService);
   * await foreUpWebhookService.handelWebhook();
   * ```
   */
  handleWebhook = async () => {
    this.logger.info("foreup webhook called");

    // Initialize data
    const initData = await this.initializeData();
    if (!initData) return; // Exit if initialization fails

    const { courseToIndex, entityId, provider, token, baseDate } = initData;

    // Process tee times for each day
    // let teeTimesToInsert: InsertTeeTimes[] = [];
    // let teeTimesToUpsert: InsertTeeTimes[] = [];
    // let teeTimesToRemove: InsertTeeTimes[] = [];

    for (let i = 0; i < 30; i++) {
      const dayToCheck = dayjs(baseDate).add(i, "day").format("YYYY-MM-DD"); //adds i days to the base date - base date is current date

      const indexResult = await this.indexDay(
        dayToCheck,
        courseToIndex.providerCourseId,
        courseToIndex.courseId,
        courseToIndex.providerTeeSheetId,
        courseToIndex.providerId,
        provider,
        token,
        entityId
      );
      await this.saveTeeTimes(indexResult.insert, indexResult.upsert, indexResult.remove);

      // teeTimesToInsert.push(...indexResult.insert);
      // teeTimesToUpsert.push(...indexResult.upsert);
      // teeTimesToRemove.push(...indexResult.remove);
    }

    // Save the processed tee times
    this.logger.info("Webhook processing completed");
  };

  saveTeeTimes = async (
    insertArray: InsertTeeTimes[],
    upsertArray: InsertTeeTimes[],
    removeArray: InsertTeeTimes[]
  ) => {
    const teeTimesToUpsert = [...upsertArray, ...removeArray];

    const providerIdsToInsert = insertArray.map((t) => t.providerTeeTimeId);

    if (insertArray.length > 0) {
      const conflictingTeeTimes = await this.database
        .select({ providerTeeTimeId: teeTimes.providerTeeTimeId })
        .from(teeTimes)
        .where(inArray(teeTimes.providerTeeTimeId, providerIdsToInsert))
        .execute();

      const teeTimesToInsertFiltered = insertArray.filter(
        (t) => !conflictingTeeTimes.some((ctt) => ctt.providerTeeTimeId === t.providerTeeTimeId)
      );

      const teeTimesWithConflicts = insertArray.filter((t) =>
        conflictingTeeTimes.some((ctt) => ctt.providerTeeTimeId === t.providerTeeTimeId)
      );

      // teeTimesToUpsert = [...teeTimesToUpsert, ...teeTimesWithConflicts]; //this doubles the amount of tee times to upsert
      // console.log("teeTimesToInsertFiltered", teeTimesToInsertFiltered);
      this.logger.info(`Inserting ${teeTimesToInsertFiltered.length} tee times`);
      console.log(`Inserting ${teeTimesToInsertFiltered.length} tee times`);

      if (teeTimesToInsertFiltered.length > 0) {
        for (const teeTime of teeTimesToInsertFiltered) {
          await this.database
            .insert(teeTimes)
            .values(teeTime)
            .execute()
            .catch((err) => {
              this.logger.error(err);
              throw new Error(`Error inserting teeTime with: ${teeTime.id} ${JSON.stringify(teeTime)}`);
            });
        }
      }
    }

    this.logger.info(`Upserting ${teeTimesToUpsert.length} tee times`);
    console.log(`Upserting ${teeTimesToUpsert.length} tee times`);
    for (const teeTime of teeTimesToUpsert) {
      await this.database
        .update(teeTimes)
        .set({
          numberOfHoles: teeTime.numberOfHoles,
          maxPlayersPerBooking: teeTime.maxPlayersPerBooking,
          availableFirstHandSpots: teeTime.availableFirstHandSpots,
          greenFee: teeTime.greenFee,
          cartFee: teeTime.cartFee,
          greenFeeTax: teeTime.greenFeeTax,
          cartFeeTax: teeTime.cartFeeTax,
          date: dateToUtcTimestamp(new Date(teeTime.date)),
          time: teeTime.time,
          providerDate: teeTime.providerDate,
        })
        .where(eq(teeTimes.id, teeTime.id))
        .execute()
        .catch((err) => {
          this.logger.error(err);
          throw new Error("Error inserting or updating teeTime with id: " + teeTime.id);
        });
    }
    return;
  };

  indexDay = async (
    formattedDate: string,
    providerCourseId: string,
    courseId: string,
    providerTeeSheetId: string,
    providerId: string,
    provider: ProviderAPI,
    token: string,
    entityId?: string
  ) => {
    // Date formatting

    // const startOfDay = new Date(formattedDate + "T00:00:00");
    // const endOfDay = new Date(formattedDate + "T23:59:59");

    // Retrieve existing tee times
    const existingTeeTimesForThisDay = await this.database
      .select({
        id: teeTimes.id,
        providerTeeTimeId: teeTimes.providerTeeTimeId,
        numberOfHoles: teeTimes.numberOfHoles,
        date: teeTimes.date,
        time: teeTimes.time,
        maxPlayersPerBooking: teeTimes.maxPlayersPerBooking,
        greenFee: teeTimes.greenFee,
        cartFee: teeTimes.cartFee,
        greenFeeTax: teeTimes.greenFeeTax,
        cartFeeTax: teeTimes.cartFeeTax,
        courseId: teeTimes.courseId,
        availableFirstHandSpots: teeTimes.availableFirstHandSpots,
        availableSecondHandSpots: teeTimes.availableSecondHandSpots,
        soldByProvider: teeTimes.soldByProvider,
        entityId: teeTimes.entityId,
        providerDate: teeTimes.providerDate,
      })
      .from(teeTimes)
      .where(
        and(
          eq(teeTimes.courseId, courseId),
          sql`DATE(${teeTimes.providerDate}) = ${formattedDate}`
          // between(teeTimes.date, dateToUtcTimestamp(startOfDay), dateToUtcTimestamp(endOfDay))
        )
      )
      .execute()
      .catch((err) => {
        this.logger.error(err);
        throw new Error("Error getting existing tee times");
      });
    // console.log("teeTimes found for this day", existingTeeTimesForThisDay.length);

    // Retrieve provider tee times
    const providerTeeTimes = await provider.getTeeTimes(
      token,
      providerCourseId,
      providerTeeSheetId,
      "0000",
      "2359",
      formattedDate
    );
    const teeTimesToUpsert: InsertTeeTimes[] = [];
    const teeTimesToInsert: InsertTeeTimes[] = [];
    const teeTimesToRemove: InsertTeeTimes[] = [];

    // Processing for tee times to insert, upsert, and remove
    const providerTeeTimeIds = providerTeeTimes.map((t) => t.id);
    // console.log("providerTeeTimeIds", providerTeeTimeIds.length);
    // console.log("firstProviderTeeTimeId", providerTeeTimes[0]);

    if (existingTeeTimesForThisDay) {
      // Processing logic for missing tee times to remove
      const missingTeeTimesToRemove = existingTeeTimesForThisDay
        .filter((x) => !providerTeeTimeIds.includes(x.providerTeeTimeId) && x.availableFirstHandSpots > 0)
        .map((et) => ({
          ...et,
          availableFirstHandSpots: 0,
        }));
      teeTimesToRemove.push(...missingTeeTimesToRemove);
    }

    // const testTeeTime = providerTeeTimes.find((t) => t.id === "1703279040");
    // console.log("testTeeTime", testTeeTime);
    // const testTeeTime2 = providerTeeTimes.find((t) => t.id === "1703336400");
    // console.log("testTeeTime2", testTeeTime2);

    providerTeeTimes.forEach((teeTimeResponse) => {
      const attributes = teeTimeResponse.attributes;

      if (!attributes) {
        this.logger.error(`No TeeTimeSlotAttributes available for: ${JSON.stringify(teeTimeResponse)}`);
        throw new Error("No TeeTimeSlotAttributes available");
      }
      const maxPlayers = Math.max(...attributes.allowedGroupSizes);

      // format of attributes.time -> 2023-12-20T01:28:00-07:00
      const militaryTime = Number(dayjs1.utc(attributes.time).format("Hmm"));
      // console.log("data", attributes.time);
      // console.log("militaryTime", militaryTime);

      const indexedTeeTime = existingTeeTimesForThisDay.find(
        (obj) => teeTimeResponse.id === obj.providerTeeTimeId
      );

      let providerTeeTime;
      if (indexedTeeTime) {
        providerTeeTime = {
          id: indexedTeeTime.id,
          courseId: courseId,
          providerTeeTimeId: teeTimeResponse.id,
          soldByProvider: providerId,
          numberOfHoles: attributes.holes,
          date: attributes.time,
          time: militaryTime,
          maxPlayersPerBooking: maxPlayers,
          availableFirstHandSpots: attributes.availableSpots,
          availableSecondHandSpots: indexedTeeTime.availableSecondHandSpots,
          greenFee: attributes.greenFee,
          cartFee: attributes.cartFee,
          greenFeeTax: attributes.greenFeeTax ? attributes.greenFeeTax : 0,
          cartFeeTax: attributes.cartFeeTax,
          providerDate: attributes.time,
          entityId: entityId ? entityId : "",
        };
        const providerTeeTimeMatchingKeys = {
          id: indexedTeeTime.id,
          providerTeeTimeId: teeTimeResponse.id,
          numberOfHoles: attributes.holes,
          date: dateToUtcTimestamp(new Date(attributes.time)),
          time: militaryTime,
          maxPlayersPerBooking: maxPlayers,
          greenFee: attributes.greenFee,
          cartFee: attributes.cartFee,
          greenFeeTax: attributes.greenFeeTax ? attributes.greenFeeTax : 0,
          cartFeeTax: attributes.cartFeeTax,
          courseId: courseId,
          availableFirstHandSpots: attributes.availableSpots,
          availableSecondHandSpots: indexedTeeTime.availableSecondHandSpots,
          soldByProvider: providerId,
          providerDate: attributes.time,
          entityId: entityId ? entityId : "",
        };
        if (isEqual(indexedTeeTime, providerTeeTimeMatchingKeys)) {
          // no changes to tee time do nothing

          return;
        } else {
          // console.log("providerTeeTime to upsert", providerTeeTime);
          teeTimesToUpsert.push(providerTeeTime);
        }
      } else {
        //if you insert a teetime that already exists it will fail
        providerTeeTime = {
          id: randomUUID(),
          courseId: courseId,
          providerTeeTimeId: teeTimeResponse.id,
          soldByProvider: providerId,
          numberOfHoles: attributes.holes,
          date: attributes.time,
          time: militaryTime,
          maxPlayersPerBooking: maxPlayers,
          availableFirstHandSpots: attributes.availableSpots,
          availableSecondHandSpots: 0,
          greenFee: attributes.greenFee,
          cartFee: attributes.cartFee,
          greenFeeTax: attributes.greenFeeTax ? attributes.greenFeeTax : 0,
          cartFeeTax: attributes.cartFeeTax,
          providerDate: attributes.time,
          entityId: entityId ? entityId : "",
        };
        // console.log("providerTeeTime to insert", providerTeeTime);
        teeTimesToInsert.push(providerTeeTime);
      }
    });

    return { insert: teeTimesToInsert, upsert: teeTimesToUpsert, remove: teeTimesToRemove };
  };

  initializeData = async () => {
    // Get course to index
    const [data] = await this.database
      .select({
        courseToIndex: providerCourseLink,
        internalId: providerCourseLink.internalId,
        entity: {
          id: courses.entityId,
        },
      })
      .from(providerCourseLink)
      .leftJoin(courses, eq(courses.id, providerCourseLink.courseId))
      .leftJoin(entities, eq(entities.id, courses.entityId))
      .orderBy(asc(providerCourseLink.lastIndex))
      .limit(1)
      .execute()
      .catch((err) => {
        this.logger.error(err);
        throw new Error("Error getting course to index");
      });

    if (!data) {
      this.logger.info("no courses to index");
      return null;
    }

    const { courseToIndex, entity, internalId } = data;

    if (!courseToIndex) {
      this.logger.info("no courses found");
      return null;
    }

    if (!entity?.id) {
      this.logger.info("no entity found");
      return null;
    }

    const { provider, token } = await this.providerService.getProviderAndKey(
      internalId,
      courseToIndex.courseId
    );

    const baseDate = dayjs().format("YYYY-MM-DD");
    const entityId = entity.id;

    return { courseToIndex, entityId, provider, token, baseDate };
  };

  // handelWebhook = async () => {
  //   this.logger.info("foreup webhook called");
  //   //get course to index
  //   const [data] = await this.database
  //     .select({
  //       courseToIndex: providerCourseLink,
  //       entity: {
  //         id: courses.entityId,
  //       },
  //     })
  //     .from(providerCourseLink)
  //     .leftJoin(courses, eq(courses.id, providerCourseLink.courseId))
  //     .leftJoin(entities, eq(entities.id, courses.entityId))
  //     .orderBy(asc(providerCourseLink.lastIndex))
  //     .limit(1)
  //     .execute()
  //     .catch((err) => {
  //       this.logger.error(err);
  //       throw new Error("Error getting course to index");
  //     });
  //   //data checks
  //   if (!data) {
  //     this.logger.info("no courses to index");
  //     return;
  //   }
  //   const { courseToIndex, entity } = data;
  //   if (!courseToIndex) {
  //     this.logger.info("no courses found");
  //     return;
  //   }
  //   if (!entity?.id) {
  //     this.logger.info("no entity found");
  //     return;
  //   }
  //   //get provider and token from provider service
  //   const { provider, token } = await this.providerService.getProviderAndKey(
  //     this.foreUpId,
  //     courseToIndex.courseId
  //   );
  //   const dateToIndex = new Date();
  //   const baseDate = new Date(dateToIndex.getTime());
  //   // const timezoneDiff = courseToIndex.timezoneCorrection;
  //   // console.log({ timezoneDiff });
  //   let teeTimesToUpsert: InsertTeeTimes[] = [];
  //   const teeTimesToInsert: InsertTeeTimes[] = [];
  //   const teeTimesToRemove: InsertTeeTimes[] = [];
  //   for (let i = 0; i <= 50; i++) {
  //     //const dayKey = `day${i}`;
  //     //const shouldIndex = this.shouldIndexDay(courseToIndex, i);
  //     const shouldIndex = true;
  //     const currentDate = new Date(baseDate.getTime());
  //     currentDate.setDate(baseDate.getDate() + i);

  //     const year = currentDate.getUTCFullYear();
  //     const month = (currentDate.getUTCMonth() + 1).toString().padStart(2, "0");
  //     const day = currentDate.getUTCDate().toString().padStart(2, "0");
  //     //Foreup requires the date to look like this
  //     const formattedDate = `${year}-${month}-${day}`;

  //     const startOfDay = new Date(formattedDate + "T00:00:00");
  //     const endOfDay = new Date(formattedDate + "T23:59:59");

  //     if (shouldIndex) {
  //       //find all teatimes for this day
  //       const existingTeeTimesForThisDay = await this.database
  //         .select({
  //           id: teeTimes.id,
  //           providerTeeTimeId: teeTimes.providerTeeTimeId,
  //           numberOfHoles: teeTimes.numberOfHoles,
  //           date: teeTimes.date,
  //           time: teeTimes.time,
  //           maxPlayersPerBooking: teeTimes.maxPlayersPerBooking,
  //           greenFee: teeTimes.greenFee,
  //           cartFee: teeTimes.cartFee,
  //           greenFeeTax: teeTimes.greenFeeTax,
  //           cartFeeTax: teeTimes.cartFeeTax,
  //           courseId: teeTimes.courseId,
  //           availableFirstHandSpots: teeTimes.availableFirstHandSpots,
  //           availableSecondHandSpots: teeTimes.availableSecondHandSpots,
  //           soldByProvider: teeTimes.soldByProvider,
  //           entityId: teeTimes.entityId,
  //         })
  //         .from(teeTimes)
  //         .where(
  //           and(
  //             eq(teeTimes.courseId, courseToIndex.courseId),
  //             // sql`DATE(${teeTimes.date}) = ${formattedDate}`

  //             between(teeTimes.date, dateToUtcTimestamp(startOfDay), dateToUtcTimestamp(endOfDay))
  //           )
  //         )
  //         .execute()
  //         .catch((err) => {
  //           this.logger.error(err);
  //           throw new Error("Error getting existing tee times");
  //         });

  //       //get all tee times for this day
  //       const providerTeeTimes = await provider.getTeeTimes(
  //         token,
  //         courseToIndex.providerCourseId,
  //         courseToIndex.providerTeeSheetId,
  //         "0100",
  //         "2300",
  //         formattedDate
  //       );

  //       console.log("providerTeeTimes", providerTeeTimes.length);
  //       //it may be better to not use a set here instead an array search would be faster depending on the size of the array
  //       const providerTeeTimeIds = providerTeeTimes.map((t) => t.id);

  //       //teetime not found from foreup this teetime can not be purchased from primary sale anymore
  //       if (existingTeeTimesForThisDay) {
  //         //Teetimes that are found in the database but not provider
  //         const missingTeeTimesToRemove = existingTeeTimesForThisDay
  //           .filter(
  //             (x) =>
  //               !providerTeeTimeIds.includes((x as InsertTeeTimes).providerTeeTimeId) &&
  //               x.availableFirstHandSpots > 0
  //           )
  //           .map((et) => ({
  //             ...et,
  //             availableFirstHandSpots: 0, //no first hand spots available
  //           }));
  //         // console.log("providerTeeTimeIds", providerTeeTimeIds);
  //         // console.log("missingTeeTimesToRemove", missingTeeTimesToRemove);
  //         // console.log(missingTeeTimesToRemove);
  //         teeTimesToRemove.push(...missingTeeTimesToRemove);
  //       }
  //       providerTeeTimes.forEach((teeTimeResponse) => {
  //         const attributes = teeTimeResponse.attributes;

  //         if (!attributes) {
  //           this.logger.error(`No TeeTimeSlotAttributes available for: ${JSON.stringify(teeTimeResponse)}`);
  //           throw new Error("No TeeTimeSlotAttributes available");
  //         }
  //         const maxPlayers = Math.max(...attributes.allowedGroupSizes);
  //         const date = new Date(attributes.time);
  //         const hours = date.getHours(); //getUTCHours();
  //         const minutes = date.getMinutes(); //getUTCMinutes();
  //         const militaryTime = hours * 100 + minutes;
  //         const indexedTeeTime = existingTeeTimesForThisDay.find(
  //           (obj) => teeTimeResponse.id === obj.providerTeeTimeId
  //         );

  //         let providerTeeTime;
  //         if (indexedTeeTime) {
  //           providerTeeTime = {
  //             id: indexedTeeTime.id,
  //             courseId: courseToIndex.courseId,
  //             providerTeeTimeId: teeTimeResponse.id,
  //             soldByProvider: courseToIndex.providerId,
  //             numberOfHoles: attributes.holes,
  //             date: attributes.time,
  //             time: militaryTime,
  //             maxPlayersPerBooking: maxPlayers,
  //             availableFirstHandSpots: attributes.availableSpots,
  //             availableSecondHandSpots: indexedTeeTime.availableSecondHandSpots,
  //             greenFee: attributes.greenFee,
  //             cartFee: attributes.cartFee,
  //             greenFeeTax: attributes.greenFeeTax ? attributes.greenFeeTax : 0,
  //             cartFeeTax: attributes.cartFeeTax,
  //             entityId: entity.id ? entity.id : "",
  //           };
  //           const providerTeeTimeMatchingKeys = {
  //             id: indexedTeeTime.id,
  //             providerTeeTimeId: teeTimeResponse.id,
  //             numberOfHoles: attributes.holes,
  //             date: dateToUtcTimestamp(new Date(attributes.time)),
  //             time: militaryTime, //this is different - currently using timezone from where computer is called
  //             maxPlayersPerBooking: maxPlayers,
  //             greenFee: attributes.greenFee,
  //             cartFee: attributes.cartFee,
  //             greenFeeTax: attributes.greenFeeTax ? attributes.greenFeeTax : 0,
  //             cartFeeTax: attributes.cartFeeTax,
  //             courseId: courseToIndex.courseId,
  //             availableFirstHandSpots: attributes.availableSpots,
  //             availableSecondHandSpots: indexedTeeTime.availableSecondHandSpots,
  //             soldByProvider: courseToIndex.providerId,
  //             entityId: entity.id ? entity.id : "",
  //           };
  //           if (isEqual(indexedTeeTime, providerTeeTimeMatchingKeys, "time")) {
  //             //no changes to tee time do nothing
  //             return;
  //           } else {
  //             teeTimesToUpsert.push(providerTeeTime);
  //           }
  //         } else {
  //           //if you insert a teetime that already exists it will fail
  //           providerTeeTime = {
  //             id: randomUUID(),
  //             courseId: courseToIndex.courseId,
  //             providerTeeTimeId: teeTimeResponse.id,
  //             soldByProvider: courseToIndex.providerId,
  //             numberOfHoles: attributes.holes,
  //             date: attributes.time,
  //             time: militaryTime,
  //             maxPlayersPerBooking: maxPlayers,
  //             availableFirstHandSpots: attributes.availableSpots,
  //             availableSecondHandSpots: 0,
  //             greenFee: attributes.greenFee,
  //             cartFee: attributes.cartFee,
  //             greenFeeTax: attributes.greenFeeTax ? attributes.greenFeeTax : 0,
  //             cartFeeTax: attributes.cartFeeTax,
  //             entityId: entity.id ? entity.id : "",
  //           };
  //           // console.log("providerTeeTime to insert", providerTeeTime);
  //           teeTimesToInsert.push(providerTeeTime);
  //         }
  //       });

  //       this.logger.info(`Updating last indexed for day ${i}`);
  //       // await this.database
  //       //   .update(providerCourseLink)
  //       //   .set({
  //       //     [`day${i}`]: currentUtcTimestamp(),
  //       //   })
  //       //   .catch((err) => {
  //       //     this.logger.error(err);
  //       //     throw new Error("Error updating last indexed");
  //       //   });
  //     }
  //   }

  //   console.log("teeTimesToRemove", teeTimesToRemove.length);
  //   teeTimesToUpsert = [...teeTimesToUpsert, ...teeTimesToRemove];

  //   const providerIdsToInsert = teeTimesToInsert.map((t) => t.providerTeeTimeId);
  //   console.log("teeTimesToInsert", teeTimesToInsert.length);

  //   if (teeTimesToInsert.length > 0) {
  //     const conflictingTeeTimes = await this.database
  //       .select({ providerTeeTimeId: teeTimes.providerTeeTimeId })
  //       .from(teeTimes)
  //       .where(inArray(teeTimes.providerTeeTimeId, providerIdsToInsert))
  //       .execute();

  //     console.log("conflictingTeeTimes", conflictingTeeTimes.length);

  //     const teeTimesToInsertFiltered = teeTimesToInsert.filter(
  //       (t) => !conflictingTeeTimes.some((ctt) => ctt.providerTeeTimeId === t.providerTeeTimeId)
  //     );

  //     console.log("teeTimesToInsertFiltered", teeTimesToInsertFiltered.length);
  //     // console.log("teeTimesToInsertFiltered", teeTimesToInsertFiltered);
  //     this.logger.info(`Inserting ${teeTimesToInsertFiltered.length} tee times`);

  //     if (teeTimesToInsertFiltered.length > 0) {
  //       for (const teeTime of teeTimesToInsertFiltered) {
  //         await this.database
  //           .insert(teeTimes)
  //           .values(teeTime)
  //           .execute()
  //           .catch((err) => {
  //             this.logger.error(err);
  //             throw new Error(`Error inserting teeTime with: ${teeTime.id} ${JSON.stringify(teeTime)}`);
  //           });
  //       }
  //     }
  //   }

  //   this.logger.info(`Upserting ${teeTimesToUpsert.length} tee times`);

  //   for (const teeTime of teeTimesToUpsert) {
  //     await this.database
  //       .insert(teeTimes)
  //       .values(teeTime)
  //       .onDuplicateKeyUpdate({
  //         set: {
  //           numberOfHoles: teeTime.numberOfHoles,
  //           maxPlayersPerBooking: teeTime.maxPlayersPerBooking,
  //           availableFirstHandSpots: teeTime.availableFirstHandSpots,
  //           greenFee: teeTime.greenFee,
  //           cartFee: teeTime.cartFee,
  //           greenFeeTax: teeTime.greenFeeTax,
  //           cartFeeTax: teeTime.cartFeeTax,
  //         },
  //       })
  //       .execute()
  //       .catch((err) => {
  //         this.logger.error(err);
  //         throw new Error("Error inserting or updating teeTime with id: " + teeTime.id);
  //       });
  //   }
  // };

  /**
   * Determines if tee times for a given day should be indexed.
   *
   * This method checks the last indexed date for the specified day and determines whether
   * tee times should be indexed based on the indexing schedule.
   *
   * @param {any} courseToIndex - The course information to determine indexing for.
   * @param {number} day - The day for which to determine indexing.
   * @returns {boolean} Returns `true` if tee times for the specified day should be indexed, otherwise `false`.
   * @throws {Error} Throws an error if the day is out of the schedule range.
   *
   * @example
   * ```typescript
   * const shouldIndex = this.shouldIndexDay(courseToIndex, 1);
   * ```
   */
  shouldIndexDay(courseToIndex: any, day: number): boolean {
    const now = new Date();
    const dayKey = `day${day}`;
    const lastIndexedDateString = courseToIndex[dayKey];
    const lastIndexedTime = lastIndexedDateString ? new Date(lastIndexedDateString) : null;

    const schedule = INDEXING_SCHEDULE.find((schedule) => schedule.day === day);
    if (!schedule) {
      throw new Error("Day is out of the schedule range");
    }

    if (!lastIndexedTime) {
      return true;
    }

    const nextIndexDue = new Date(lastIndexedTime.getTime() + schedule.interval);
    return now >= nextIndexDue;
  }
}
