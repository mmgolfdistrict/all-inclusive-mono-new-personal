import { randomUUID } from "crypto";
import type { Db } from "@golf-district/database";
import { and, asc, desc, eq, gte, lte, sql } from "@golf-district/database";
import { assets } from "@golf-district/database/schema/assets";
import { authenticationMethod } from "@golf-district/database/schema/authenticationMethod";
import { bookings } from "@golf-district/database/schema/bookings";
import { courseSwitch } from "@golf-district/database/schema/courseSwitch";
import { charities } from "@golf-district/database/schema/charities";
import { charityCourseLink } from "@golf-district/database/schema/charityCourseLink";
import { courseAllowedTimeToSell } from "@golf-district/database/schema/courseAllowedTimeToSell";
import { courseAssets } from "@golf-district/database/schema/courseAssets";
import { courses } from "@golf-district/database/schema/courses";
import type { InsertCourses } from "@golf-district/database/schema/courses";
import { entities } from "@golf-district/database/schema/entities";
import { lists } from "@golf-district/database/schema/lists";
import { providers } from "@golf-district/database/schema/providers";
import { providerCourseLink } from "@golf-district/database/schema/providersCourseLink";
import { teeTimes } from "@golf-district/database/schema/teeTimes";
import {
  AuthenticationMethodEnum,
  currentUtcTimestamp,
  getApexDomain,
  validDomainRegex,
} from "@golf-district/shared";
import Logger from "@golf-district/shared/src/logger";
import { cacheManager } from "@golf-district/shared/src/utils/cacheManager";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";
import { DomainService } from "../domain/domain.service";
import type { ProviderService } from "../tee-sheet-provider/providers.service";
import { loggerService } from "../webhooks/logging.service";
import { courseSetting } from "@golf-district/database/schema/courseSetting";
import { appSettingService } from "../app-settings/initialized";
import { parseSettingValue } from "../../helpers";
import { courseMerchandise } from "@golf-district/database/schema/courseMerchandise";

dayjs.extend(utc);
dayjs.extend(customParseFormat);

type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

type CourseDetailsQuery = {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  longitude: number | null;
  latitude: number | null;
  forecastApi: string | null;
  convenienceFeesFixedPerPlayer: number | null;
  markupFeesFixedPerPlayer: number | null;
  maxListPricePerGolferPercentage: number | null;
  openTime: string | null;
  closeTime: string | null;
  supportCharity: boolean;
  supportSensibleWeather: boolean;
  timezoneCorrection: number | null;
  furthestDayToBook: number | null;
  allowAuctions: boolean;
  supportsOffers: boolean;
  supportsWatchlist: boolean;
  supportsPromocode: boolean;
  supportsWaitlist: boolean;
  buyerFee: number | null;
  sellerFee: number | null;
  internalId?: string;
  roundUpCharityId: string | null;
  providerConfiguration?: string | null;
  isBookingDisabled: number;
};

type CharityDetails = {
  charityDescription: string | null; // Assuming description might be nullable
  charityName: string | null; // Assuming name is required
  charityId: string | null; // Assuming ID is a string (update if it's a number or UUID)
  logo: string | null; // Assuming logoAssetId might be nullable
  // logoCdn: string; // Uncomment if `cdn` is required and included in the data
  logoExtension: string | null; // Assuming extension is always present
  logoKey: string | null; // Assuming key is always present
};

/**
 * Service handling course-related operations.
 * Extends `DomainService` and provides functionality to retrieve course information,
 * get images associated with a course, and update course details.
 */
export class CourseService extends DomainService {
  /**
   * Constructs a new `CourseService`.
   * @param {Db} database - The database instance.
   * @param {string} PROJECT_ID_VERCEL - Vercel project ID.
   * @param {string} TEAM_ID_VERCEL - Vercel team ID.
   * @param {string} AUTH_BEARER_TOKEN - Bearer token for authentication.
   * @param {ProviderService} providerService - The provider service.
   * @example
   * const courseService = new CourseService(database, "project_id", "team_id", "bearer_token", providerService);
   */
  constructor(
    private readonly database: Db,
    PROJECT_ID_VERCEL: string,
    TEAM_ID_VERCEL: string,
    AUTH_BEARER_TOKEN: string,
    private providerService: ProviderService
  ) {
    super(PROJECT_ID_VERCEL, TEAM_ID_VERCEL, AUTH_BEARER_TOKEN, Logger(CourseService.name));
  }

  getAllSwitchCourses = async (courseId: string) => {
    // const cacheKey = `allSwitchCourses`;
    // const cacheTTL = 600; // Cache TTL in seconds

    // let allSwitchCoursesQuery: any[] | null = await cacheManager.get(cacheKey);

    const allSwitchCoursesQuery = await this.database
      .select({
        id: courseSwitch.id,
        courseId: courseSwitch.courseId,
        switchableCourseId: courseSwitch.switchableCourseId,
        name: courses.name,
      })
      .from(courseSwitch)
      .innerJoin(courses, eq(courses.id, courseSwitch.switchableCourseId))
      .where(eq(courseSwitch.courseId, courseId))
      .execute()
      .catch((err) => {
        this.logger.error(`Error getting all switch courses: ${err}`);
        loggerService.errorLog({
          userId: "",
          url: "/CourseService/getAllSwitchCourses",
          userAgent: "",
          message: "ERROR_GETTING_ALL_SWITCH_COURSES",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({}),
        });
        throw new Error("Error getting all switch courses");
      });

    // await cacheManager.set(cacheKey, allSwitchCoursesQuery, cacheTTL);
    // }

    // Format if needed; currently returning as-is
    return allSwitchCoursesQuery;
  };

  /**
   * Retrieves a course by its ID.
   *
   * This function fetches and returns the course associated with the provided course ID.
   * If no course is found, it returns `null`.
   *
   * @param courseId - The ID of the course to retrieve.
   * @returns A promise that resolves to the course object if found, or `null` if not found.
   * @throws Will throw an error if the query fails.
   */
  getCourseById = async (courseId: string) => {
    const cacheKey = `courseDetails:${courseId}`;
    const cacheTTL = 600; // Cache TTL in seconds

    let courseDetailsQuery: any = await cacheManager.get(cacheKey);
    if (!courseDetailsQuery) {
      courseDetailsQuery = await this.database
        .select({
          id: courses.id,
          name: courses.name,
          address: courses.address,
          description: courses.description,
          longitude: courses.longitude,
          latitude: courses.latitude,
          forecastApi: courses.forecastApi,
          convenienceFeesFixedPerPlayer: courses.convenienceFeesFixedPerPlayer,
          markupFeesFixedPerPlayer: courses.markupFeesFixedPerPlayer,
          maxListPricePerGolferPercentage: courses.maxListPricePerGolferPercentage,
          openTime: courses.openTime,
          closeTime: courses.closeTime,
          supportCharity: courses.supportCharity,
          supportSensibleWeather: courses.supportSensibleWeather,
          timezoneCorrection: courses.timezoneCorrection,
          furthestDayToBook: courses.furthestDayToBook,
          allowAuctions: courses.allowAuctions,
          supportsOffers: courses.supportsOffers,
          supportsWatchlist: courses.supportsWatchlist,
          supportsPromocode: courses.supportsPromocode,
          supportsWaitlist: courses.supportsWaitlist,
          buyerFee: courses.buyerFee,
          sellerFee: courses.sellerFee,
          internalId: providers.internalId,
          roundUpCharityId: courses?.roundUpCharityId,
          providerConfiguration: providerCourseLink.providerCourseConfiguration,
          isBookingDisabled: courses.isBookingDisabled,
          showPricingBreakdown: courses.showPricingBreakdown,
          websiteURL: courses.websiteURL,
          courseOpenTime: courses.courseOpenTime,
          courseCloseTime: courses.courseCloseTime,
          supportsProviderMembership: courses.supportsProviderMembership,
          supportsGroupBooking: courses.supportsGroupBooking,
          timezoneISO: courses?.timezoneISO,
          groupStartTime: courses.groupStartTime,
          groupEndTime: courses.groupEndTime,
          supportsSellingMerchandise: courses.supportsSellingMerchandise
        })
        .from(courses)
        .innerJoin(providerCourseLink, eq(providerCourseLink.courseId, courses.id))
        .innerJoin(providers, eq(providers.id, providerCourseLink.providerId))
        .where(and(eq(courses.id, courseId), eq(courses.isDeleted, false)))
        .limit(1)
        .execute()
        .catch((err) => {
          this.logger.error(`Error getting course by ID: ${err}`);
          loggerService.errorLog({
            userId: "",
            url: "/CourseService/getCourseById",
            userAgent: "",
            message: "ERROR_GETTING_COURSE_BY_ID",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              courseId,
            }),
          });
          throw new Error("Error getting course");
        });

      await cacheManager.set(cacheKey, courseDetailsQuery, 600000);
    }

    //Get the highest and lowest tee time prices
    //Cache if possible
    const listTeeTimePriceQuery = this.database
      .select({
        highestListedTeeTime: sql`max(${lists.listPrice} * (${courses.buyerFee}/100) + ${lists.listPrice})`,
        lowestListedTeeTime: sql`min(${lists.listPrice} * (${courses.buyerFee}/100) + ${lists.listPrice})`,
      })
      .from(lists)
      .innerJoin(bookings, eq(bookings.listId, lists.id))
      .innerJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .innerJoin(courses, eq(courses.id, teeTimes.courseId))
      .where(
        and(
          eq(teeTimes.courseId, courseId),
          eq(lists.isDeleted, false),
          gte(teeTimes.providerDate, currentUtcTimestamp())
        )
      )
      .limit(1)
      .execute();
    //Get the highest and lowest primary sale tee time prices
    //Cache if possible
    const primarySaleTeeTimePriceQuery = this.database
      .select({
        highestPrimarySaleTeeTime: sql`max(${teeTimes.greenFeePerPlayer} + ${teeTimes.cartFeePerPlayer} + ${courses.markupFeesFixedPerPlayer})`,
        lowestPrimarySaleTeeTime: sql`min(${teeTimes.greenFeePerPlayer} + ${teeTimes.cartFeePerPlayer} + ${courses.markupFeesFixedPerPlayer})`,
      })
      .from(teeTimes)
      .innerJoin(courses, eq(courses.id, teeTimes.courseId))
      .where(and(eq(teeTimes.courseId, courseId), gte(teeTimes.providerDate, currentUtcTimestamp())))
      .limit(1)
      .execute();

    const [courseDetailsArray, listTeeTimePricesArray, primarySaleTeeTimePricesArray] = await Promise.all([
      courseDetailsQuery,
      listTeeTimePriceQuery,
      primarySaleTeeTimePriceQuery,
    ]);

    // Destructure the first element from each resulting array
    const course = courseDetailsArray[0];
    const listTeeTimePrices = listTeeTimePricesArray[0];
    const primarySaleTeeTimePrices = primarySaleTeeTimePricesArray[0];

    if (!course) return null;
    const { providerConfiguration, ...courseDetails } = course;

    // Assemble the final result object
    const result = {
      ...courseDetails,
      ...listTeeTimePrices,
      ...primarySaleTeeTimePrices,
    };

    if (!result) return null;

    const { provider } = await this.providerService.getProviderAndKey(
      courseDetails.internalId,
      courseId,
      providerConfiguration ?? ""
    );

    const supportsPlayerNameChange = provider.supportsPlayerNameChange() ?? false;

    let res = {
      ...result,
      highestListedTeeTime: ((result.highestListedTeeTime as number) ?? 0) / 100,
      lowestListedTeeTime: ((result.lowestListedTeeTime as number) ?? 0) / 100,
      highestPrimarySaleTeeTime: ((result.highestPrimarySaleTeeTime as number) ?? 0) / 100,
      lowestPrimarySaleTeeTime: ((result.lowestPrimarySaleTeeTime as number) ?? 0) / 100,
      supportsPlayerNameChange,
    };

    if (result.supportCharity) {
      const data = await this.database
        .select({
          charityDescription: charities.description,
          charityName: charities.name,
          charityId: charities.id,
        })
        .from(charityCourseLink)
        .leftJoin(charities, eq(charityCourseLink.charityId, charities.id))
        .where(eq(charityCourseLink.courseId, courseId))
        .execute()
        .catch((err) => {
          this.logger.error(`Error getting charity for course: ${err}`);
          loggerService.errorLog({
            userId: "",
            url: "/CourseService/getCourseById",
            userAgent: "",
            message: "ERROR_GETTING_CHARITY_FOR_COURSE",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              courseId,
            }),
          });
          throw new Error("Error getting charity");
        });

      const supportedCharities = data.map((d) => ({
        charityDescription: d.charityDescription,
        charityName: d.charityName,
        charityId: d.charityId,
      }));

      res = {
        ...res,
        supportedCharities,
      };
    }

    if (result.supportsGroupBooking) {
      const courseSettings = await this.database
        .select({
          id: courseSetting.id,
          internalName: courseSetting.internalName,
          value: courseSetting.value,
          datatype: courseSetting.datatype,
        })
        .from(courseSetting)
        .where(eq(courseSetting.courseId, courseId))
        .execute()
        .catch((err) => {
          this.logger.error(`Error getting course settings for course: ${err}`);
          loggerService.errorLog({
            userId: "",
            url: "/CourseService/getCourseById",
            userAgent: "",
            message: "ERROR_GETTING_COURSE_SETTINGS_FOR_COURSE",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              courseId,
            }),
          });
          throw new Error("Error getting course settings");
        });

      let groupBookingMinSize = Number(
        courseSettings.find((setting) => setting.internalName === "GROUP_BOOKING_MIN_SIZE")?.value
      );
      let groupBookingMaxSize = Number(
        courseSettings.find((setting) => setting.internalName === "GROUP_BOOKING_MAX_SIZE")?.value
      );

      const isOnlyGroupOfFourAllowed =
        (Number(
          courseSettings.find((setting) => setting.internalName === "GROUP_BOOKING_ALLOW_SIZE_ONLY_IN_4")
            ?.value
        ) ?? 0) === 1;

      const isAllowSpecialRequest = courseSettings.find(
        (setting) => setting.internalName === "ALLOW_SPECIAL_REQUEST"
      );

      const isAllowClubRental = courseSettings.find(
        (setting) => setting.internalName === "ALLOW_CLUB_RENTAL"
      );

      const isAllowCourseSwitching = courseSettings.find(
        (setting) => setting.internalName === "ALLOW_COURSE_SWITCHING"
      );

      if (isOnlyGroupOfFourAllowed) {
        let sliderMin = groupBookingMinSize;
        let sliderMax = groupBookingMaxSize;
        while (sliderMin % 4 !== 0) {
          sliderMin++;
        }
        while (sliderMax % 4 !== 0) {
          sliderMax++;
        }
        groupBookingMinSize = sliderMin;
        groupBookingMaxSize = sliderMax;
      }

      res = {
        ...res,
        groupBookingMinSize,
        groupBookingMaxSize,
        isOnlyGroupOfFourAllowed,
        isAllowSpecialRequest: parseSettingValue(
          isAllowSpecialRequest?.value ?? "",
          isAllowSpecialRequest?.datatype ?? "string"
        ),
        isAllowClubRental: parseSettingValue(
          isAllowClubRental?.value ?? "",
          isAllowClubRental?.datatype ?? "string"
        ),
        isAllowCourseSwitching: parseSettingValue(
          isAllowCourseSwitching?.value ?? "",
          isAllowCourseSwitching?.datatype ?? "string"
        ),
      };
    }
    return res;
  };

  getCoursePreviewImage = async (courseId: string) => {
    const courseAssets = await this.database
      .select({
        id: assets.id,
        key: assets.key,
        extension: assets.extension,
        courseId: courses.id,
      })
      .from(courses)
      .innerJoin(assets, eq(assets.courseId, courses.id))
      .where(eq(courses.id, courseId))
      .execute()
      .catch((err) => {
        this.logger.error(err);
        throw new Error("Error retrieving Course Assets");
      });

    return `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${courseAssets[0]?.key}.${courseAssets[0]?.extension}`;
  };

  getSupportedCharitiesForCourseId = async (courseId: string) => {
    const cacheKey = `supportedCharitiesForCourseId:${courseId}`;

    let data: CharityDetails[] | null = await cacheManager.get(cacheKey);

    if (!data) {
      data = await this.database
        .select({
          charityDescription: charities.description,
          charityName: charities.name,
          charityId: charities.id,
          logo: charities.logoAssetId,
          //logoCdn: assets.cdn,
          logoExtension: assets.extension,
          logoKey: assets.key,
        })
        .from(charityCourseLink)
        .leftJoin(charities, eq(charityCourseLink.charityId, charities.id))
        .leftJoin(assets, eq(assets.id, charities.logoAssetId))
        .where(eq(charityCourseLink.courseId, courseId))
        .execute()
        .catch((err) => {
          this.logger.error(`Error getting charity for course: ${err}`);
          loggerService.errorLog({
            userId: "",
            url: "/CourseService/getSupportedCharitiesForCourseId",
            userAgent: "",
            message: "ERROR_GETTING_CHARITY_FOR_COURSE",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              courseId,
            }),
          });
          throw new Error("Error getting charity");
        });

      await cacheManager.set(cacheKey, data, 600000);
    }

    const cdnUrl = process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL;
    const updatedData = data?.map((item) => ({
      ...item,
      logoCdn: cdnUrl,
    }));
    const supportedCharities = updatedData.map((d) => ({
      charityDescription: d.charityDescription,
      charityName: d.charityName,
      charityId: d.charityId,
      charityLogo: d.logo ? `https://${d.logoCdn}/${d.logoKey}.${d.logoExtension}` : "",
    }));
    return supportedCharities;
  };

  /**
   * Retrieves images associated with a course.
   * @param {string} courseId - The ID of the course.
   * @returns {Promise<{ logo: string, images: string[] }>} A promise resolving to an object with course images.
   * @throws Will throw an error if the query fails.
   * @example
   * const courseId = "course123";
   * const courseImages = await courseService.getImagesForCourse(courseId);
   */
  getImagesForCourse = async (courseId: string) => {
    const logo = await this.database
      .select({
        id: assets.id,
        key: assets.key,
        extension: assets.extension,
      })
      .from(assets)
      .innerJoin(courses, eq(courses.logoId, assets.id))
      .where(eq(courses.id, courseId))
      .limit(1)
      .execute();

    const images = await this.database
      .select({
        id: assets.id,
        coursesId: assets.courseId,
        key: assets.key,
        extension: assets.extension,
        order: courseAssets.order,
        courseLogoId: courses.logoId,
      })
      .from(assets)
      .innerJoin(courseAssets, eq(assets.id, courseAssets.assetId))
      // .innerJoin(courses, eq(assets.courseId, courses.id))
      // .where(and(eq(assets.courseId, courseId), eq(assets.courseAssetId, courseAssets.id)))
      .innerJoin(courses, eq(courseAssets.courseId, courses.id))
      .where(eq(courses.id, courseId))
      .orderBy(asc(courseAssets.order))
      .execute()
      .catch((err) => {
        this.logger.error(`Error getting images for course: ${err}`);
        loggerService.errorLog({
          userId: "",
          url: "/CourseService/getImagesForCourse",
          userAgent: "",
          message: "ERROR_GETTING_IMAGES_FOR_COURSE",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            courseId,
          }),
        });
        throw new Error("Error getting images");
      });
    return {
      logo: logo[0]
        ? `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${logo[0].key}.${logo[0].extension}`
        : "/defaults/default-profile.webp",
      images: images
        // .filter((i) => i.coursesId === courseId && i.id !== i.courseLogoId)
        .sort((a, b) => {
          const orderA = a.order !== null ? a.order : Number.MAX_SAFE_INTEGER;
          const orderB = b.order !== null ? b.order : Number.MAX_SAFE_INTEGER;
          return orderA - orderB;
        })
        .map(
          ({ key, extension }) => `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${key}.${extension}`
        ),
    };
  };

  /**
   * Updates course information.
   * @param {string} courseId - The ID of the course to update.
   * @param {Object} options - Options for updating course details.
   * @param {string} [options.name] - The new name of the course.
   * @param {string} [options.logoAssetId] - The asset ID for the new course logo.
   * @param {string} [options.openingHours] - The updated opening hours of the course.
   * @param {string} [options.closingHours] - The updated closing hours of the course.
   * @param {string} [options.privacyPolicy] - The updated privacy policy of the course.
   * @param {boolean} [options.supportSensibleWeather] - Indicates whether the course supports sensible weather.
   * @param {Object} [options.charity] - Charity-related options.
   * @param {boolean} [options.charity.supportCharity] - Indicates whether the course supports charity.
   * @param {string} [options.charity.charityName] - The name of the supported charity.
   * @param {string} [options.charity.charityDescription] - The description of the supported charity.
   * @throws Will throw an error if the update fails or if an asset for the logo does not exist.
   * @example
   * const courseId = "course123";
   * const updateOptions = {
   *   name: "New Course Name",
   *   logoAssetId: "asset456",
   *   openingHours: "08:00",
   *   closingHours: "18:00",
   *   privacyPolicy: "Updated privacy policy.",
   *   supportSensibleWeather: true,
   *   charity: {
   *     supportCharity: true,
   *     charityName: "Charity Name",
   *     charityDescription: "Charity Description",
   *   },
   * };
   * await courseService.updateCourseInfo(courseId, updateOptions);
   */
  updateCourseInfo = async (
    courseId: string,
    options: {
      name?: string;
      logoAssetId?: string;
      openingHours?: string;
      closingHours?: string;
      privacyPolicy?: string;
      supportSensibleWeather?: boolean;
      supportCharity?: boolean;
    }
  ) => {
    this.logger.info(`Updating course ${courseId} with options: ${JSON.stringify(options)}`);
    if (options.logoAssetId) {
      const logo = await this.database
        .select()
        .from(assets)
        .where(eq(assets.id, options.logoAssetId))
        .catch((err) => {
          this.logger.error(`Error getting asset: ${err}`);
          loggerService.errorLog({
            userId: "",
            url: "/CourseService/updateCourseInfo",
            userAgent: "",
            message: "ERROR_GETTING_ASSET",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              courseId,
              options,
            }),
          });
          throw new Error("Error getting asset");
        });
      if (!logo[0]) {
        this.logger.warn(`Asset ${options.logoAssetId} does not exist`);
        loggerService.errorLog({
          userId: "",
          url: "/CourseService/updateCourseInfo",
          userAgent: "",
          message: "ASSET_DOES_NOT_EXIST",
          stackTrace: `Asset ${options.logoAssetId} does not exist`,
          additionalDetailsJSON: JSON.stringify({
            courseId,
            options,
          }),
        });
        throw new Error("Asset for logo does not exist");
      }
    }
    await this.database
      .update(courses)
      .set({
        name: options.name,
        logoId: options.logoAssetId,
        openTime: options.openingHours,
        closeTime: options.closingHours,
        privacyPolicy: options.privacyPolicy,
        supportSensibleWeather: options.supportSensibleWeather,
        supportCharity: options.supportCharity,
      })
      .where(eq(courses.id, courseId))
      .execute()
      .catch((err) => {
        this.logger.error(`Error updating course: ${err}`);
        loggerService.errorLog({
          userId: "",
          url: "/CourseService/updateCourseInfo",
          userAgent: "",
          message: "ERROR_UPDATING_COURSE",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            courseId,
            options,
          }),
        });
        throw new Error("Error updating course");
      });
  };

  /**
   * Add assets to a course.
   *
   * This function allows users to add multiple assets to a course while maintaining a specific order.
   * The assets will be ordered based on their position in the provided array.
   *
   * @param courseId - The ID of the course to which the assets will be added.
   * @param assetIds - An array of asset IDs to be added to the course. The order in the array will be the order in the course.
   * @throws Will throw an error if there's an issue adding the assets to the course (e.g., database error, invalid course ID, etc.).
   */
  async addAssetsToCourse(courseId: string, assetIds: string[]): Promise<void> {
    const highestOrderQuery = this.database
      .select({ order: courseAssets.order })
      .from(courseAssets)
      .where(eq(courseAssets.courseId, courseId))
      .orderBy(desc(courseAssets.order))
      .limit(1);

    let highestExistingOrder = (
      await highestOrderQuery.execute().catch((err) => {
        this.logger.error(`Error getting highest order: ${err}`);
        loggerService.errorLog({
          userId: "",
          url: "/CourseService/addAssetsToCourse",
          userAgent: "",
          message: "ERROR_GETTING_HIGHEST_ORDER",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            courseId,
            assetIds,
          }),
        });
        throw new Error("Error getting highest order");
      })
    )[0]?.order;

    if (highestExistingOrder === undefined) {
      highestExistingOrder = -1;
    }
    for (const assetId of assetIds) {
      const existingAsset = await this.database
        .select()
        .from(courseAssets)
        .where(and(eq(courseAssets.courseId, courseId), eq(courseAssets.assetId, assetId)))
        .execute()
        .catch((err) => {
          this.logger.error(`Error checking existing course asset: ${err}`);
          loggerService.errorLog({
            userId: "",
            url: "/CourseService/addAssetsToCourse",
            userAgent: "",
            message: "ERROR_CHECKING_EXISTING_COURSE_ASSET",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              courseId,
              assetIds,
            }),
          });
          throw new Error("Error checking existing course asset");
        });
      if (existingAsset[0]) {
        this.logger.warn(`Asset ${assetId} is already associated with course ${courseId}`);
        continue;
      }

      highestExistingOrder++;
      await this.database
        .insert(courseAssets)
        .values({
          id: randomUUID(),
          courseId: courseId,
          assetId: assetId,
          order: highestExistingOrder,
        })
        .execute()
        .catch((err) => {
          this.logger.error(`Error adding course asset: ${err}`);
          loggerService.errorLog({
            userId: "",
            url: "/CourseService/addAssetsToCourse",
            userAgent: "",
            message: "ERROR_ADDING_COURSE_ASSET",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              courseId,
              assetIds,
            }),
          });
          throw new Error("Error adding course asset");
        });
    }
  }

  /**
   * Update the order of assets for a specific course.
   * @notice This function is also used to remove assets from a course.
   * This function updates the order of assets associated with a specific course, based on the order
   * of asset IDs provided in the input array. The function does not add or remove assets, and
   * expects all asset IDs to already be associated with the course.
   *
   * @param courseId - The ID of the course for which the asset order will be updated.
   * @param assetIds - An array of asset IDs, ordered as they should appear in the course.
   * @throws Will throw an error if there's an issue updating the assets' order (e.g., database error, invalid course ID, etc.).
   */
  /**
   * Update the order of assets for a specific course.
   *
   * @param courseId - The ID of the course.
   * @param assetIds - An array of asset IDs, ordered as they should appear in the course.
   * @throws Will throw an error if there's an issue updating the assets' order.
   */
  updateAssetsOrder = async (courseId: string, assetIds: string[]): Promise<void> => {
    // Validate that all provided asset IDs are associated with the course
    const existingAssetIds = await this.database
      .select({ assetId: courseAssets.assetId })
      .from(courseAssets)
      .where(eq(courseAssets.courseId, courseId))
      .execute()
      .catch((err) => {
        this.logger.error(`Error fetching existing asset IDs: ${err}`);
        loggerService.errorLog({
          userId: "",
          url: "/CourseService/updateAssetsOrder",
          userAgent: "",
          message: "ERROR_FETCHING_EXISTING_ASSET_IDS",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            courseId,
            assetIds,
          }),
        });
        throw new Error("Error validating asset IDs");
      });
    const existingAssetIdsSet = new Set(existingAssetIds.map((a) => a.assetId));
    assetIds.forEach((id) => {
      if (!existingAssetIdsSet.has(id)) {
        throw new Error(`Asset ID ${id} is not associated with the course ${courseId}`);
      }
    });

    await this.database
      .transaction(async (tx) => {
        for (let order = 0; order < assetIds.length; order++) {
          const assetId = assetIds[order];
          if (!assetId) {
            this.logger.warn(`Skipping update for undefined asset ID at order ${order}`);
            continue;
          }
          await tx
            .update(courseAssets)
            .set({ order: order })
            .where(and(eq(courseAssets.courseId, courseId), eq(courseAssets.assetId, assetId)));
        }
      })
      .catch((err) => {
        this.logger.error(`Error updating asset order: ${err}`);
        loggerService.errorLog({
          userId: "",
          url: "/CourseService/updateAssetsOrder",
          userAgent: "",
          message: "ERROR_UPDATING_ASSET_ORDER",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            courseId,
            assetIds,
          }),
        });
        throw new Error("Error updating asset order");
      });
  };

  /**
   * Create a new course with the provided data.
   *
   * @param data - An object containing the course data to be inserted.
   * @throws Will throw an error if there's an issue creating the course.
   */
  async createCourse(data: {
    name: string;
    logoAssetId?: string;
    openingHours?: string;
    closingHours?: string;
    privacyPolicy?: string;
    supportSensibleWeather?: boolean;
    charity?: {
      supportCharity: boolean;
      charityName: string;
      charityDescription: string;
    };
  }): Promise<void> {
    if (!data.name) {
      this.logger.error("Error creating course: name is required");
      loggerService.errorLog({
        userId: "",
        url: "/CourseService/createCourse",
        userAgent: "",
        message: "ERROR_CREATING_COURSE",
        stackTrace: `Error creating course: name is required`,
        additionalDetailsJSON: JSON.stringify({
          data,
        }),
      });
      throw new Error("Error creating course: name is required");
    }
    const courseData: InsertCourses = {
      id: randomUUID(),
      name: data.name,
      logoId: data.logoAssetId,
      openTime: data.openingHours ? data.openingHours : null,
      closeTime: data.closingHours ? data.closingHours : null,
      privacyPolicy: data.privacyPolicy ? data.privacyPolicy : null,
      supportSensibleWeather: data.supportSensibleWeather,
    };

    if (data.charity?.supportCharity) {
      courseData.supportCharity = true;
    }

    await this.database
      .insert(courses)
      .values(courseData)
      .execute()
      .catch((err) => {
        this.logger.error(`Error creating course: ${err}`);
        loggerService.errorLog({
          userId: "",
          url: "/CourseService/createCourse",
          userAgent: "",
          message: "ERROR_CREATING_COURSE",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            data,
          }),
        });
        throw new Error("Error creating course");
      });
  }

  /**
   * Updates the custom domain associated with an entity.
   *
   * This function allows updating the custom domain associated with a given entity.
   * The custom domain can be set, removed (if an empty string is provided), or validated for specific conditions.
   *
   * @param {string} entityId - The ID of the entity to update.
   * @param {string | ""} domain - The new custom domain. Provide an empty string to remove the domain.
   * @throws Will throw an error if the provided domain is not valid, or if there is an issue updating the entity or adding/removing domains from Vercel.
   * @example
   * // Update entity with ID 'entity123' to use the custom domain 'example.com'.
   * await updateCourseDomain('entity123', 'example.com');
   *
   * // Remove the custom domain from the entity with ID 'entity456'.
   * await updateCourseDomain('entity456', '');
   */
  updateCourseDomain = async (
    entityId: string,
    domain: string | "" //remove domain if empty string
  ) => {
    this.logger.info(`Updating entity ${entityId} with domain ${domain}`);
    const courseDomain = await this.database
      .select({ customDomain: entities.customDomain })
      .from(entities)
      .where(eq(entities.id, entityId))
      .execute()
      .catch((err) => {
        this.logger.error(`Error getting course: ${err}`);
        loggerService.errorLog({
          userId: "",
          url: "/CourseService/updateCourseDomain",
          userAgent: "",
          message: "ERROR_GETTING_COURSE",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            entityId,
            domain,
          }),
        });
        throw new Error("Error getting course");
      });

    if (domain.includes("vercel.pub")) {
      this.logger.warn(`Domain ${domain} is not valid vercel.pub domain`);
      throw new Error(`Domain ${domain} is not valid vercel.pud domain`);
    } else if (validDomainRegex().test(domain)) {
      //update the entity with the new domain
      await this.database
        .update(entities)
        .set({
          customDomain: domain,
        })
        .where(eq(entities.id, entityId))
        .execute()
        .catch((err) => {
          this.logger.error(`Error updating course: ${err}`);
          loggerService.errorLog({
            userId: "",
            url: "/CourseService/updateCourseDomain",
            userAgent: "",
            message: "ERROR_UPDATING_COURSE",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              entityId,
              domain,
            }),
          });
          throw new Error("Error updating course");
        });
      //add both domains to vercel
      await Promise.all([
        await this.addDomainToVercel(domain),
        await this.addDomainToVercel(`www.${domain}`),
      ]).catch((err) => {
        this.logger.error(`Error adding domains to vercel: ${err}`);
        loggerService.errorLog({
          userId: "",
          url: "/CourseService/updateCourseDomain",
          userAgent: "",
          message: "ERROR_ADDING_DOMAINS_TO_VERCEL",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            entityId,
            domain,
          }),
        });
        throw new Error(`Error adding domains to vercel: ${err}`);
      });
    }
    // "" remove the domain from the entity
    else if (domain == "") {
      await this.database
        .update(entities)
        .set({
          customDomain: null,
        })
        .where(eq(courses.id, entityId))
        .execute()
        .catch((err) => {
          this.logger.error(`Error updating course: ${err}`);
          loggerService.errorLog({
            userId: "",
            url: "/CourseService/updateCourseDomain",
            userAgent: "",
            message: "ERROR_UPDATING_COURSE",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              entityId,
              domain,
            }),
          });
          throw new Error("Error updating course");
        });
      //the custom dolman has been updated remove the old domain from the vercel
      if (courseDomain[0]?.customDomain && courseDomain[0]?.customDomain !== domain) {
        const apexDomain = getApexDomain(`htttps://${courseDomain[0]?.customDomain}`);
        const domainCount = await this.database
          .select({
            count: sql<number>`COUNT(*)`,
          })
          .from(entities)
          .execute()
          .catch((err) => {
            this.logger.error(`Error getting course: ${err}`);
            loggerService.errorLog({
              userId: "",
              url: "/CourseService/updateCourseDomain",
              userAgent: "",
              message: "ERROR_GETTING_COURSE",
              stackTrace: `${err.stack}`,
              additionalDetailsJSON: JSON.stringify({
                entityId,
                domain,
              }),
            });
            throw new Error("Error getting course");
          });
        //Domain is only use by this site remove it from the team
        if (!domainCount[0]?.count || domainCount[0]?.count === 0) {
          await this.removeDomainFromVercelTeam(apexDomain).catch((err) => {
            this.logger.error(`Error removing domain from vercel team: ${err}`);
            loggerService.errorLog({
              userId: "",
              url: "/CourseService/updateCourseDomain",
              userAgent: "",
              message: "ERROR_REMOVING_DOMAIN_FROM_VERCEL_TEAM",
              stackTrace: `${err.stack}`,
              additionalDetailsJSON: JSON.stringify({
                entityId,
                domain,
              }),
            });
            throw new Error(`Error removing domain from vercel team: ${err}`);
          });
          //Domain is used by other sites remove it from the project
        } else {
          await this.removeDomainFromVercelProject(courseDomain[0]?.customDomain).catch((err) => {
            this.logger.error(`Error removing domain from vercel team: ${err}`);
            loggerService.errorLog({
              userId: "",
              url: "/CourseService/updateCourseDomain",
              userAgent: "",
              message: "ERROR_REMOVING_DOMAIN_FROM_VERCEL_TEAM",
              stackTrace: `${err.stack}`,
              additionalDetailsJSON: JSON.stringify({
                entityId,
                domain,
              }),
            });
            throw new Error(`Error removing domain from vercel team: ${err}`);
          });
        }
      }
    }
  };

  getNumberOfPlayersByCourse = async (
    courseId: string,
    time?: number,
    date?: string,
    availableSlots?: number
  ) => {
    let binaryMask: any;
    const PlayersOptions = ["1", "2", "3", "4"];

    if (time && date) {
      const day = dayjs.utc(date, "YYYY-MM-DD").format("ddd").toUpperCase() as DayOfWeek;
      const cacheKey = `allowed-number-of-players-${courseId}-${day}-${time}`;

      let NumberOfPlayers: any = await cacheManager.get(cacheKey);
      if (!NumberOfPlayers) {
        NumberOfPlayers = await this.database
          .select({
            primaryMarketAllowedPlayers: courseAllowedTimeToSell.primaryMarketAllowedPlayers,
            primaryMarketSellLeftoverSinglePlayer:
              courseAllowedTimeToSell.primaryMarketSellLeftoverSinglePlayer,
          })
          .from(courseAllowedTimeToSell)
          .where(
            and(
              eq(courseAllowedTimeToSell.courseId, courseId),
              eq(courseAllowedTimeToSell.day, day),
              and(lte(courseAllowedTimeToSell.fromTime, time), gte(courseAllowedTimeToSell.toTime, time))
            )
          );
        await cacheManager.set(cacheKey, NumberOfPlayers, 600000);
      }
      if (!NumberOfPlayers[0]) {
        const cacheKey = `allowed-number-of-players-${courseId}`;

        NumberOfPlayers = await cacheManager.get(cacheKey);
        if (!NumberOfPlayers) {
          NumberOfPlayers = await this.database
            .select({
              primaryMarketAllowedPlayers: courses.primaryMarketAllowedPlayers,
              primaryMarketSellLeftoverSinglePlayer: courses.primaryMarketSellLeftoverSinglePlayer,
            })
            .from(courses)
            .where(eq(courses.id, courseId));

          await cacheManager.set(cacheKey, NumberOfPlayers, 600000);
        }
      }

      if (NumberOfPlayers[0]?.primaryMarketAllowedPlayers) {
        binaryMask = NumberOfPlayers[0]?.primaryMarketAllowedPlayers;
      }
      if (NumberOfPlayers[0]?.primaryMarketSellLeftoverSinglePlayer && availableSlots === 1) {
        binaryMask = binaryMask | (1 << 0);
      }
    } else {
      const cacheKey = `allowed-number-of-players-${courseId}`;
      let NumberOfPlayers: any = await cacheManager.get(cacheKey);
      if (!NumberOfPlayers) {
        NumberOfPlayers = await this.database
          .select({
            primaryMarketAllowedPlayers: courses.primaryMarketAllowedPlayers,
            primaryMarketSellLeftoverSinglePlayer: courses.primaryMarketSellLeftoverSinglePlayer,
          })
          .from(courses)
          .where(eq(courses.id, courseId));
        await cacheManager.set(cacheKey, NumberOfPlayers, 600000);
      }
      if (NumberOfPlayers[0]?.primaryMarketAllowedPlayers) {
        binaryMask = NumberOfPlayers[0]?.primaryMarketAllowedPlayers;
      }
      if (NumberOfPlayers[0]?.primaryMarketSellLeftoverSinglePlayer) {
        binaryMask = binaryMask | (1 << 0);
      }
    }
    const numberOfPlayers =
      binaryMask !== null && binaryMask !== undefined
        ? PlayersOptions.filter((_, index) => (binaryMask & (1 << index)) !== 0)
        : PlayersOptions;
    if (binaryMask === 0) {
      return { numberOfPlayers: PlayersOptions, selectStatus: "ALL_PLAYERS" };
    }

    return { numberOfPlayers, selectStatus: "" };
  };

  getPrivacyPolicyAndTCByCourse = async (courseId: string) => {
    const privacyPolicyAndTC = await this.database
      .select({
        privacyPolicyURL: courses.privacyPolicy,
        termsAndConditionsURL: courses.termsAndConditions,
      })
      .from(courses)
      .where(eq(courses.id, courseId));

    return privacyPolicyAndTC[0];
  };
  getAuthenticationMethods = async (courseId: string) => {
    const selectedCourse = await this.database
      .select({
        authenticationMethods: courses.authenticationMethods,
      })
      .from(courses)
      .where(eq(courses.id, courseId));

    if (!selectedCourse?.[0]) {
      return [];
    }

    const authenticationMethodsValue = selectedCourse[0].authenticationMethods;

    if (authenticationMethodsValue === null || authenticationMethodsValue === undefined) {
      return Object.keys(AuthenticationMethodEnum)
        .filter((key) => isNaN(Number(key)))
        .map((key) => AuthenticationMethodEnum[key as keyof typeof AuthenticationMethodEnum]);
    }

    const filteredMethodNames = Object.keys(AuthenticationMethodEnum)
      .filter((key) => isNaN(Number(key)))
      .filter((key) => {
        const methodValue = AuthenticationMethodEnum[key as keyof typeof AuthenticationMethodEnum];
        return (authenticationMethodsValue & methodValue) > 0;
      })
      .map((key) => AuthenticationMethodEnum[key as keyof typeof AuthenticationMethodEnum]);

    console.log("filteredMethodNames", filteredMethodNames);

    return filteredMethodNames;
  };

  getMobileViewVersion = async (courseId: string) => {
    console.log(courseId);
    const rawValue = await appSettingService.get("MOBILE_VIEW_VERSION");
    const mobileViewVersion: string | undefined =
      typeof rawValue === "string" ? rawValue : String(rawValue ?? "");
    return mobileViewVersion || "v1";
  };
  getDesktopViewVersion = async (courseId: string) => {
    const courseSettings = await this.database
      .select({
        id: courseSetting.id,
        internalName: courseSetting.internalName,
        value: courseSetting.value,
      })
      .from(courseSetting)
      .where(eq(courseSetting.courseId, courseId))
      .execute()
      .catch((err) => {
        this.logger.error(`Error getting course settings for course: ${err}`);
        loggerService.errorLog({
          userId: "",
          url: "/CourseService/getCourseById",
          userAgent: "",
          message: "ERROR_GETTING_COURSE_SETTINGS_FOR_COURSE",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            courseId,
          }),
        });
        throw new Error("Error getting course settings");
      });

    const desktopViewVersion = courseSettings.find(
      (setting) => setting.internalName === "DESKTOP_VIEW_VERSION"
    )?.value;

    return desktopViewVersion ?? "v1";
  };

  getPhoneNumberMandatoryAtCheckout = async (courseId: string) => {
    const courseSettings = await this.database
      .select({
        id: courseSetting.id,
        internalName: courseSetting.internalName,
        value: courseSetting.value,
        datatype: courseSetting.datatype,
      })
      .from(courseSetting)
      .where(eq(courseSetting.courseId, courseId))
      .execute()
      .catch((err) => {
        this.logger.error(`Error getting course settings for course: ${err}`);
        loggerService.errorLog({
          userId: "",
          url: "/CourseService/getCourseById",
          userAgent: "",
          message: "ERROR_GETTING_COURSE_SETTINGS_FOR_COURSE",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            courseId,
          }),
        });
        throw new Error("Error getting course settings");
      });

    const desktopViewVersion = courseSettings.find(
      (setting) => setting.internalName === "PHONE_NUMBER_MANDATORY_AT_CHECKOUT"
    );
    return (
      parseSettingValue(desktopViewVersion?.value ?? "", desktopViewVersion?.datatype ?? "string") ?? "v1"
    );
  };

  getCourseMerchandise = async (courseId: string, teeTimeDate: string) => {
    try {
      const merchandise = await this.database
        .select({
          id: courseMerchandise.id,
          caption: courseMerchandise.caption,
          price: courseMerchandise.price,
          description: courseMerchandise.description,
          longDescription: courseMerchandise.longDescription,
          logoURL: courseMerchandise.logoURL,
          qoh: courseMerchandise.qoh,
        })
        .from(courseMerchandise)
        .innerJoin(courses, eq(courseMerchandise.courseId, courses.id))
        .where(
          and(
            eq(courseMerchandise.courseId, courseId),
            eq(courseMerchandise.showDuringBooking, true),
            gte(sql`DATE_FORMAT(CONVERT_TZ(NOW() + INTERVAL ${courseMerchandise.showOnlyIfBookingIsWithinXDays} DAY, '+00:00', ${courses.timezoneISO}), '%Y-%m-%dT23:59:59')`, teeTimeDate),
          )
        );

      return merchandise;
    } catch (error: any) {
      this.logger.error(`Error fetching course merchandise: ${JSON.stringify(error)}`);
      void loggerService.errorLog({
        userId: "",
        url: "/CourseService/getCourseMerchandise",
        userAgent: "",
        message: "ERROR_FETCHING_COURSE_MERCHANDISE",
        stackTrace: `${error.stack}`,
        additionalDetailsJSON: JSON.stringify({
          courseId,
        }),
      })
      return null;
    }
  }
}
