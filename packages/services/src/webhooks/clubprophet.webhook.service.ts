import { randomUUID } from "crypto";
import type { Db } from "@golf-district/database";
import { and, asc, eq, inArray, sql } from "@golf-district/database";
import { courses } from "@golf-district/database/schema/courses";
import { entities } from "@golf-district/database/schema/entities";
import { providerCourseLink } from "@golf-district/database/schema/providersCourseLink";
import type { InsertTeeTimes } from "@golf-district/database/schema/teeTimes";
import { teeTimes } from "@golf-district/database/schema/teeTimes";
import { dateToUtcTimestamp } from "@golf-district/shared";
import Logger from "@golf-district/shared/src/logger";
import dayjs from "dayjs";
import isEqual from "lodash.isequal";
import type { ProviderService } from "../tee-sheet-provider/providers.service";
import type { ProviderAPI } from "../tee-sheet-provider/sheet-providers";
import type { ClubProphetTeeTimeResponse } from "../tee-sheet-provider/sheet-providers/types/clubprophet.types";
import { providers } from "@golf-district/database/schema/providers";

export class clubprophetWebhookService {
  private readonly clubProphetId = "club-prophet";
  private readonly providerName = "club-prophet";

  constructor(
    private readonly database: Db,
    private readonly providerService: ProviderService
  ) { }
  private readonly logger = Logger(clubprophetWebhookService.name);

  initializeData = async () => {
    // Get course to index
    const [data] = await this.database
      .select({
        courseToIndex: providerCourseLink,
        providerUid: providerCourseLink.providerId,
        internalId: providers.internalId,
        entity: {
          id: courses.entityId,
        },
        providerConfiguration: providerCourseLink.providerCourseConfiguration,
      })
      .from(providerCourseLink)
      .leftJoin(courses, eq(courses.id, providerCourseLink.courseId))
      .leftJoin(entities, eq(entities.id, courses.entityId))
      .leftJoin(providers, eq(providers.id, providerCourseLink.providerId))
      .where(eq(providerCourseLink.courseId, "5df5581f-6e5c-49af-a360-a7c9fd733f24"))
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

    const { courseToIndex, entity, providerUid, providerConfiguration, internalId } = data;

    if (!courseToIndex) {
      this.logger.info("no courses found");
      return null;
    }

    if (!entity?.id) {
      this.logger.info("no entity found");
      return null;
    }

    if (!providerConfiguration) {
      this.logger.info("no provider Configuration found");
      return null;
    }
    console.log("INTERNAL ID", internalId)
    const { provider, token } = await this.providerService.getProviderAndKey(
      internalId ?? "",
      courseToIndex.providerCourseId,
      providerConfiguration
    );

    const baseDate = dayjs().format("YYYY-MM-DD");
    const entityId = entity.id;

    return { courseToIndex, entityId, provider, token, baseDate, providerUid };
  };

  indexDay = async (
    formattedDate: string,
    providerCourseId: string,
    courseId: string,
    providerTeeSheetId: string,
    provider: ProviderAPI,
    token: string,
  ) => {
    const existingTeeTimesForThisDay = await this.database
      .select({
        id: teeTimes.id,
        providerTeeTimeId: teeTimes.providerTeeTimeId,
        numberOfHoles: teeTimes.numberOfHoles,
        date: teeTimes.date,
        time: teeTimes.time,
        maxPlayersPerBooking: teeTimes.maxPlayersPerBooking,
        greenFee: teeTimes.greenFeePerPlayer,
        cartFee: teeTimes.cartFeePerPlayer,
        greenFeeTax: teeTimes.greenFeeTaxPerPlayer,
        cartFeeTax: teeTimes.cartFeeTaxPerPlayer,
        courseId: teeTimes.courseId,
        availableFirstHandSpots: teeTimes.availableFirstHandSpots,
        availableSecondHandSpots: teeTimes.availableSecondHandSpots,
        courseProvider: courses.providerId,
        // entityId: teeTimes.entityId,
        providerDate: teeTimes.providerDate,
      })
      .from(teeTimes)
      .leftJoin(courses, eq(courses.id, courseId))
      .where(and(eq(teeTimes.courseId, courseId), sql`DATE(${teeTimes.providerDate}) = ${formattedDate}`))
      .execute()
      .catch((err) => {
        this.logger.error(err);
        throw new Error("Error getting existing tee times");
      });

    // Retrieve provider te`e times
    const providerTeeTimes: ClubProphetTeeTimeResponse[] = await provider.getTeeTimes(
      token,
      providerCourseId,
      providerTeeSheetId,
      "0000",
      "2359",
      formattedDate
    ) as unknown as ClubProphetTeeTimeResponse[];
    console.log(providerTeeTimes)

    const teeTimesToUpsert: InsertTeeTimes[] = [];
    const teeTimesToInsert: InsertTeeTimes[] = [];
    const teeTimesToRemove: InsertTeeTimes[] = [];

    const providerTeeTimeIds = providerTeeTimes.map((t) => String(t.teeSheetId));
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

    if (existingTeeTimesForThisDay) {
      providerTeeTimes.forEach((teeTimeResponse: ClubProphetTeeTimeResponse) => {
        const indexedTeeTime = existingTeeTimesForThisDay.find(
          (obj) => String(teeTimeResponse.teeSheetId) === obj.providerTeeTimeId
        );

        let providerTeeTime;
        const hours = Number(teeTimeResponse.startTime?.split("T")?.[1]?.split(":")?.[0]);
        const minutes = Number(teeTimeResponse.startTime?.split("T")?.[1]?.split(":")?.[1]?.split(":")?.[0]);
        const militaryTime = hours * 100 + minutes;

        if (indexedTeeTime) {
          providerTeeTime = {
            id: indexedTeeTime.id,
            courseId: courseId,
            providerTeeTimeId: String(teeTimeResponse.teeSheetId),
            // courseProvider: providerId,
            numberOfHoles: teeTimeResponse.is18HoleOnly ? 18 : teeTimeResponse.is9HoleOnly ? 9 : 18,
            date: teeTimeResponse.startTime,
            time: militaryTime,
            maxPlayersPerBooking: teeTimeResponse.freeSlots,
            availableFirstHandSpots: teeTimeResponse.freeSlots > 4 ? 4 : teeTimeResponse.freeSlots,
            availableSecondHandSpots: indexedTeeTime.availableSecondHandSpots,
            greenFeePerPlayer: (teeTimeResponse.greenFee18 ? teeTimeResponse.greenFee18 : teeTimeResponse.greenFee9 ? teeTimeResponse.greenFee9 : 0) * 100,
            cartFeePerPlayer: (teeTimeResponse.cartFee18 ? teeTimeResponse.cartFee18 : teeTimeResponse.cartFee9 ? teeTimeResponse.cartFee9 : 0) * 100,
            greenFeeTaxPerPlayer: indexedTeeTime.greenFeeTax ? indexedTeeTime.greenFeeTax : 0,
            cartFeeTaxPerPlayer: indexedTeeTime.cartFeeTax,
            providerDate: teeTimeResponse.startTime,
            // entityId: entityId ? entityId : "",
          };
          if (providerTeeTime.availableFirstHandSpots !== indexedTeeTime.availableFirstHandSpots) {
            teeTimesToUpsert.push(providerTeeTime);
          }
        } else {
          providerTeeTime = {
            id: randomUUID(),
            courseId: courseId,
            providerTeeTimeId: String(teeTimeResponse.teeSheetId),
            // soldByProvider: providerId,
            numberOfHoles: teeTimeResponse.is18HoleOnly ? 18 : teeTimeResponse.is9HoleOnly ? 9 : 18,
            date: teeTimeResponse.startTime,
            time: militaryTime,
            maxPlayersPerBooking: teeTimeResponse.freeSlots,
            availableFirstHandSpots: teeTimeResponse.freeSlots > 4 ? 4 : teeTimeResponse.freeSlots,
            availableSecondHandSpots: 0,
            greenFeePerPlayer: (teeTimeResponse.greenFee18 ? teeTimeResponse.greenFee18 : teeTimeResponse.greenFee9 ? teeTimeResponse.greenFee9 : 0) * 100,
            cartFeePerPlayer: (teeTimeResponse.cartFee18 ? teeTimeResponse.cartFee18 : teeTimeResponse.cartFee9 ? teeTimeResponse.cartFee9 : 0) * 100,
            greenFeeTaxPerPlayer: 0, // hardcode
            cartFeeTaxPerPlayer: 0,
            providerDate: teeTimeResponse.startTime,
            // entityId: entityId ? entityId : "",
          };
          teeTimesToInsert.push(providerTeeTime);
        }
      });
      return { insert: teeTimesToInsert, upsert: teeTimesToUpsert, remove: teeTimesToRemove };
    } else {
      console.log("No time times for this day");
    }
  };

  indexTeeTime = async (
    formattedDate: string,
    providerCourseId: string,
    provider: ProviderAPI,
    providerTeeTimeId: string,
    token: string,
  ) => {
    try {
      const teeTimeResponse = await provider.getTeeTimes(
        token,
        providerCourseId,
        "",
        "",
        "",
        formattedDate
      ) as unknown as ClubProphetTeeTimeResponse[];

      let teeTime;
      if (teeTimeResponse && teeTimeResponse.length > 0) {
        teeTime = teeTimeResponse.find((teeTime) => teeTime.teeSheetId.toString() === providerTeeTimeId);
      }
      if (!teeTime) {
        throw new Error("Tee time not available for booking");
      }

      const [indexedTeeTime] = await this.database
        .select({
          id: teeTimes.id,
          courseId: teeTimes.courseId,
          courseProvider: courses.providerId,
          availableSecondHandSpots: teeTimes.availableSecondHandSpots,
          entityId: courses.entityId,
          greenFeeTaxPerPlayer: teeTimes.greenFeeTaxPerPlayer,
          cartFeeTaxPerPlayer: teeTimes.cartFeeTaxPerPlayer
        })
        .from(teeTimes)
        .leftJoin(courses, eq(courses.id, teeTimes.courseId))
        .where(eq(teeTimes.providerTeeTimeId, teeTime.teeSheetId.toString()))
        .execute()
        .catch((err) => {
          this.logger.error(err);
          throw new Error(`Error finding tee time id`);
        });

      if (indexedTeeTime) {
        const hours = Number(teeTime.startTime?.split("T")?.[1]?.split(":")?.[0]);
        const minutes = Number(teeTime.startTime?.split("T")?.[1]?.split(":")?.[1]?.split(":")?.[0]);
        const militaryTime = hours * 100 + minutes;

        const providerTeeTime = {
          id: indexedTeeTime.id,
          courseId: indexedTeeTime.courseId,
          providerTeeTimeId: String(teeTime.teeSheetId),
          numberOfHoles: teeTime.is18HoleOnly ? 18 : teeTime.is9HoleOnly ? 9 : 18,
          date: teeTime.startTime,
          time: militaryTime,
          maxPlayersPerBooking: teeTime.freeSlots,
          availableFirstHandSpots: teeTime.freeSlots > 4 ? 4 : teeTime.freeSlots,
          availableSecondHandSpots: indexedTeeTime.availableSecondHandSpots,
          greenFeePerPlayer: (teeTime.greenFee18 ? teeTime.greenFee18 : teeTime.greenFee9 ? teeTime.greenFee9 : 0) * 100,
          cartFeePerPlayer: (teeTime.cartFee18 ? teeTime.cartFee18 : teeTime.cartFee9 ? teeTime.cartFee9 : 0) * 100,
          greenFeeTaxPerPlayer: indexedTeeTime.greenFeeTaxPerPlayer ? indexedTeeTime.greenFeeTaxPerPlayer : 0,
          cartFeeTaxPerPlayer: indexedTeeTime.cartFeeTaxPerPlayer,
          providerDate: teeTime.startTime,
        };
        const providerTeeTimeMatchingKeys = {
          id: indexedTeeTime.id,
          providerTeeTimeId: String(teeTime.teeSheetId),
          numberOfHoles: teeTime.is18HoleOnly ? 18 : teeTime.is9HoleOnly ? 9 : 18,
          date: teeTime.startTime,
          time: militaryTime,
          maxPlayersPerBooking: teeTime.freeSlots,
          greenFeePerPlayer: (teeTime.greenFee18 ? teeTime.greenFee18 : teeTime.greenFee9 ? teeTime.greenFee9 : 0) * 100,
          cartFeePerPlayer: (teeTime.cartFee18 ? teeTime.cartFee18 : teeTime.cartFee9 ? teeTime.cartFee9 : 0) * 100,
          greenFeeTaxPerPlayer: indexedTeeTime.greenFeeTaxPerPlayer ? indexedTeeTime.greenFeeTaxPerPlayer : 0,
          cartFeeTaxPerPlayer: indexedTeeTime.cartFeeTaxPerPlayer,
          courseId: indexedTeeTime.courseId,
          availableFirstHandSpots: teeTime.freeSlots > 4 ? 4 : teeTime.freeSlots,
          availableSecondHandSpots: indexedTeeTime.availableSecondHandSpots,
          courseProvider: indexedTeeTime.courseProvider,
          providerDate: teeTime.startTime,
          entityId: indexedTeeTime.entityId,
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
      throw new Error(
        `We're sorry. This time is no longer available. Someone just booked this. It may take a minute for the sold time you selected to be removed. Please select another time.`
      );
    }
  };

  handleWebhook = async () => {
    const initData = await this.initializeData();
    if (!initData) return; // Exit if initialization fails
    const { courseToIndex, entityId, provider, token, providerUid } = initData;
    console.log(provider)

    const courseId = courseToIndex.providerCourseId;
    const today = dayjs();
    for (let i = 0; i < 5; i++) {
      const date = dayjs(today).add(i, "day");
      const formattedDate = date.format("YYYY-MM-DD");

      const indexResult = await this.indexDay(
        formattedDate,
        courseToIndex.providerCourseId,
        courseToIndex.courseId,
        courseToIndex.providerTeeSheetId,
        // courseToIndex.providerId,
        provider,
        token,
        // entityId
      );
      if (indexResult) {
        await this.saveTeeTimes(indexResult.insert, indexResult.upsert, indexResult.remove);
      }
    }
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
        .insert(teeTimes)
        .values(teeTime)
        .onDuplicateKeyUpdate({
          set: {
            numberOfHoles: teeTime.numberOfHoles,
            maxPlayersPerBooking: teeTime.maxPlayersPerBooking,
            availableFirstHandSpots: teeTime.availableFirstHandSpots,
            greenFeePerPlayer: teeTime.greenFeePerPlayer,
            cartFeePerPlayer: teeTime.cartFeePerPlayer,
            greenFeeTaxPerPlayer: teeTime.greenFeeTaxPerPlayer,
            cartFeeTaxPerPlayer: teeTime.cartFeeTaxPerPlayer,
            date: teeTime.date,
            time: teeTime.time,
            providerDate: teeTime.providerDate,
          },
        })
        .execute()
        .catch((err) => {
          this.logger.error(err);
          throw new Error("Error inserting or updating teeTime with id: " + teeTime.id);
        });
    }
    return;
  };
}
