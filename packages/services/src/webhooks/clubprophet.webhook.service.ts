import { randomUUID } from "crypto";
import { and, asc, Db, eq, inArray, sql } from "@golf-district/database";
import { courses } from "@golf-district/database/schema/courses";
import { entities } from "@golf-district/database/schema/entities";
import { providerCourseLink } from "@golf-district/database/schema/providersCourseLink";
import { InsertTeeTimes, teeTimes } from "@golf-district/database/schema/teeTimes";
import { dateToUtcTimestamp } from "@golf-district/shared";
import Logger from "@golf-district/shared/src/logger";
import dayjs from "dayjs";
import isEqual from "lodash.isequal";
import type { ProviderService } from "../tee-sheet-provider/providers.service";
import { ProviderAPI } from "../tee-sheet-provider/sheet-providers";
import { ClubProphetTeeTimeResponse } from "../tee-sheet-provider/sheet-providers/types/clubprophet.types";

export class clubprophetWebhookService {
  private readonly clubProphetId = "club-prophet";
  private readonly providerName = "club-prophet";

  constructor(
    private readonly database: Db,
    private readonly providerService: ProviderService
  ) {}
  private readonly logger = Logger(clubprophetWebhookService.name);

  initializeData = async () => {
    // Get course to index
    const [data] = await this.database
      .select({
        courseToIndex: providerCourseLink,
        internalId: providerCourseLink.internalId,
        providerUid: providerCourseLink.providerId,
        entity: {
          id: courses.entityId,
        },
        providerConfiguration: providerCourseLink.providerCourseConfiguration,
      })
      .from(providerCourseLink)
      .leftJoin(courses, eq(courses.id, providerCourseLink.courseId))
      .leftJoin(entities, eq(entities.id, courses.entityId))
      .where(eq(providerCourseLink.internalId, this.providerName))
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

    const { courseToIndex, entity, internalId, providerUid, providerConfiguration } = data;

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

    const { provider, token } = await this.providerService.getProviderAndKey(
      internalId,
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
    providerId: string,
    provider: ProviderAPI,
    token: string,
    entityId?: string
  ) => {
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
    );

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
            soldByProvider: providerId,
            numberOfHoles: teeTimeResponse.is18HoleOnly ? 18 : teeTimeResponse.is9HoleOnly ? 9 : 18,
            date: teeTimeResponse.startTime,
            time: militaryTime,
            maxPlayersPerBooking: teeTimeResponse.freeSlots,
            availableFirstHandSpots: teeTimeResponse.freeSlots > 4 ? 4 : teeTimeResponse.freeSlots,
            availableSecondHandSpots: indexedTeeTime.availableSecondHandSpots,
            greenFee: teeTimeResponse.greenFee18 ? 18 : teeTimeResponse.greenFee9 ? 9 : 18,
            cartFee: teeTimeResponse.cartFee18 ? 18 : teeTimeResponse.cartFee9 ? 9 : 18,
            greenFeeTax: indexedTeeTime.greenFeeTax ? indexedTeeTime.greenFeeTax : 0,
            cartFeeTax: indexedTeeTime.cartFeeTax,
            providerDate: teeTimeResponse.startTimeString,
            entityId: entityId ? entityId : "",
          };
          if (providerTeeTime.availableFirstHandSpots !== indexedTeeTime.availableFirstHandSpots) {
            teeTimesToUpsert.push(providerTeeTime);
          }
        } else {
          providerTeeTime = {
            id: randomUUID(),
            courseId: courseId,
            providerTeeTimeId: String(teeTimeResponse.teeSheetId),
            soldByProvider: providerId,
            numberOfHoles: teeTimeResponse.is18HoleOnly ? 18 : teeTimeResponse.is9HoleOnly ? 9 : 18,
            date: teeTimeResponse.startTime,
            time: militaryTime,
            maxPlayersPerBooking: teeTimeResponse.freeSlots,
            availableFirstHandSpots: teeTimeResponse.freeSlots > 4 ? 4 : teeTimeResponse.freeSlots,
            availableSecondHandSpots: 0,
            greenFee: teeTimeResponse.greenFee18 ? 18 : teeTimeResponse.greenFee9 ? 9 : 18,
            cartFee: teeTimeResponse.cartFee18 ? 18 : teeTimeResponse.cartFee9 ? 9 : 18,
            greenFeeTax: 1223, // hardcode
            cartFeeTax: 1223,
            providerDate: teeTimeResponse.startTimeString,
            entityId: entityId ? entityId : "",
          };
          teeTimesToInsert.push(providerTeeTime);
        }
      });
      return { insert: teeTimesToInsert, upsert: teeTimesToUpsert, remove: teeTimesToRemove };
    } else {
      console.log("No time times for this day");
    }
  };

  handleWebhook = async () => {
    debugger;
    const initData = await this.initializeData();
    if (!initData) return; // Exit if initialization fails
    const { courseToIndex, entityId, provider, token, providerUid } = initData;

    const courseId = courseToIndex.providerCourseId;
    let today = dayjs();
    for (let i = 0; i < 5; i++) {
      const date = dayjs(today).add(i, "day");
      let formattedDate = date.format("YYYY-MM-DD");

      const indexResult = await this.indexDay(
        formattedDate,
        courseToIndex.providerCourseId,
        courseToIndex.courseId,
        courseToIndex.providerTeeSheetId,
        courseToIndex.providerId,
        provider,
        token,
        entityId
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
            greenFee: teeTime.greenFee,
            cartFee: teeTime.cartFee,
            greenFeeTax: teeTime.greenFeeTax,
            cartFeeTax: teeTime.cartFeeTax,
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
