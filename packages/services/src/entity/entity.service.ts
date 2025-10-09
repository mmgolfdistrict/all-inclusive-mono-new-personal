import { and, asc, eq, inArray, isNull, not } from "@golf-district/database";
import type { Db } from "@golf-district/database";
import { assets } from "@golf-district/database/schema/assets";
import { courseAssets } from "@golf-district/database/schema/courseAssets";
import { courses } from "@golf-district/database/schema/courses";
import { entities } from "@golf-district/database/schema/entities";
import Logger from "@golf-district/shared/src/logger";
import { cacheManager } from "@golf-district/shared/src/utils/cacheManager";
import { loggerService } from "../webhooks/logging.service";

/**
 * Service class for handling entity-related operations.
 */
export class EntityService {
  private readonly logger = Logger(EntityService.name);
  /**
   * Constructs the EntityService.
   * @param database - The database instance to use for queries.
   */
  constructor(private readonly database: Db) { }

  /**
   * Retrieves an entity associated with a given course ID.
   *
   * @param {string} courseId - The ID of the course.
   * @returns {Promise<any>} A promise resolving to the entity associated with the provided course ID.
   * @throws Will throw an error if there is an issue retrieving the entity.
   * @example
   * // Get entity for a course with ID 'abc123'.
   * const entity = await getEntityFromCourseId('abc123');
   * console.log(entity);
   */
  getEntityFromCourseId = async (courseId: string) => {
    // this.logger.info(`getEnityFromCourseId called with courseId: ${courseId}`);
    return await this.database.query.courses.findFirst({
      with: {
        entity: true,
      },
      where: eq(courses.id, courseId),
    });
  };

  /**
   * Retrieves static parameters for entities.
   *
   * @returns {Promise<any[]>} A promise resolving to an array of static parameters for entities.
   * @throws Will throw an error if there is an issue retrieving static parameters.
   * @example
   * // Get static parameters for entities.
   * const staticParams = await getStaticParams();
   * console.log(staticParams);
   */
  getStaticParams = async () => {
    const cacheKey = "staticParams";
    let staticParams = await cacheManager.get(cacheKey);

    if (!staticParams) {
      // this.logger.info("Cache miss for staticParams. Querying database.");

      const [subdomains, customDomains] = await Promise.all([
        this.database
          .select({
            subdomain: entities.subdomain,
          })
          .from(entities)
          .execute(),
        this.database
          .select({
            customDomain: entities.customDomain,
          })
          .from(entities)
          .where(not(isNull(entities.customDomain)))
          .execute(),
      ]);

      const allPaths = [
        ...subdomains.map(({ subdomain }) => subdomain),
        ...customDomains.map(({ customDomain }) => customDomain),
      ].filter((path) => path) as string[];

      staticParams = allPaths.map((domain) => ({
        params: {
          domain,
        },
      }));

      // Store the result in cache for 10 minutes
      await cacheManager.set(cacheKey, staticParams, 600000);
    } else {
      // this.logger.info("Cache hit for staticParams. Returning cached data.");
    }

    return staticParams;
  };

  //@TODO get faq for entity

  /**
   * Fetches an entity based on a domain or subdomain.
   * @param domain - The full domain or subdomain to search for.
   * @param rootDomain - The root domain to be used for extracting the subdomain.
   * @returns Promise resolving to the entity associated with the provided domain or subdomain.
   * @TODO entity return as url
   */
  getEntityFromDomain = async (domain: string, rootDomain: string) => {
    //const subdomain = domain.endsWith(`.${rootDomain}`) ? domain.replace(`.${rootDomain}`, "") : null;
    const subdomain = "demo.golfdistrict.in";

    const query = this.database
      .select({
        id: entities.id,
        name: entities.name,
        description: entities.description,
        font: entities.font,
        color1: entities.color1,
        color2: entities.color2,
        color3: entities.color3,
        subdomain: entities.subdomain,
        customDomain: entities.customDomain,
        createdAt: entities.createdAt,
        updatedAt: entities.updatedAt,
        updatedById: entities.updatedById,
        logo: {
          key: assets.key,
          extension: assets.extension,
        },
        redirectToCourseFlag: entities.redirectToCourseFlag,
      })
      .from(entities)
      .leftJoin(assets, eq(entities.logo, assets.id));
    if (subdomain) {
      await query.where(eq(entities.subdomain, subdomain));
    } else {
      await query.where(eq(entities.customDomain, domain));
    }
    const [entity] = await query.execute().catch((err) => {
      this.logger.error(`Error getting entity from domain: ${err}`);
      loggerService.errorLog({
        userId: "",
        url: "/EntityService/getEntityFromDomain",
        userAgent: "",
        message: "ERROR_GETTING_ENTITY_FROM_DOMAIN",
        stackTrace: `${err.stack}`,
        additionalDetailsJSON: JSON.stringify({
          domain,
          subdomain,
          rootDomain,
        }),
      });
      throw new Error(`Error getting entity from domain: ${err}`);
    });
    return {
      ...entity,
      logo: entity?.logo
        ? `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${entity.logo.key}.${entity.logo.extension}`
        : "/defaults/default-entity-logo.png",
    };
  };

  /**
   * Retrieves all courses associated with a given entity ID.
   * @param entityId - The ID of the entity.
   * @returns Promise resolving to an array of courses associated with the provided entity ID.
   */
  getCoursesByEntityId = async (entityId: string) => {
    // this.logger.info(`findCoursesByEntityId called with entityId: ${entityId}`);

    const cacheKey = `coursesForEntity_${entityId}`;
    let coursesData = (await cacheManager.get(cacheKey)) as any;
    if (!coursesData) {
      // this.logger.info(`Cache miss for entityId: ${entityId}. Querying database.`);
      // Fetch courses data
      const data = await this.database
        .select({
          id: courses.id,
          name: courses.name,
          description: courses.description,
          address: courses.address,
          logo: courses.logoId,
          timezoneIso: courses.timezoneISO,
          display: courses.displayOrder,
          isDeleted: courses.isDeleted,
        })
        .from(courses)
        .where(and(eq(courses.entityId, entityId), eq(courses.isDeleted, false)))
        .orderBy(courses.displayOrder)
        .execute()
        .catch(async (err) => {
          this.logger.error(err);
          await loggerService.errorLog({
            userId: "",
            url: "/EntityService/getCoursesByEntityId",
            userAgent: "",
            message: "ERROR_GETTING_COURSES_FOR_ENTITY",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              entityId,
            }),
          });
          throw new Error(`Error getting courses for entity: ${entityId}`);
        });

      if (data.length > 0) {
        // Find all images for each course
        const images = await this.database
          .select({
            id: assets.id,
            coursesId: assets.courseId,
            key: assets.key,
            extension: assets.extension,
            order: courseAssets.order,
          })
          .from(assets)
          .leftJoin(courseAssets, eq(assets.id, courseAssets.assetId))
          .where(
            inArray(
              assets.courseId,
              data.map(({ id }) => id)
            )
          );

        // Map courses with their images
        coursesData = data.map((course) => ({
          ...course,
          logo: images
            .filter((i) => i.id === course.logo)
            .map(
              ({ key, extension }) =>
                `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${key}.${extension}`
            )[0],
          images: images
            .filter((i) => i.coursesId === course.id && i.id !== course.logo)
            .sort((a, b) => {
              const orderA = a.order !== null ? a.order : Number.MAX_SAFE_INTEGER;
              const orderB = b.order !== null ? b.order : Number.MAX_SAFE_INTEGER;
              return orderA - orderB;
            })
            .map(
              ({ key, extension }) =>
                `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${key}.${extension}`
            ),
        }));
      }

      // Store the result in cache for 10 minutes
      await cacheManager.set(cacheKey, coursesData, 600000);
    } else {
      this.logger.info(`Cache hit for entityId: ${entityId}. Returning cached data.`);
    }

    return coursesData;
  };
}
