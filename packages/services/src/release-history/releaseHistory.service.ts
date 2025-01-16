import type { Db } from "@golf-district/database";
import { asc, eq } from "@golf-district/database";
import { appRelease } from "@golf-district/database/schema/appRelease";
import { appReleaseFeature } from "@golf-district/database/schema/appReleaseFeature";
import Logger from "@golf-district/shared/src/logger";

export class ReleaseHistoryService {
  private readonly logger = Logger(ReleaseHistoryService.name);

  /**
   * Creates an instance of ReleaseHistoryService.
   *
   * @param {Db} database - The database instance.
   */
  constructor(public readonly database: Db) {}

  /**
   * Retrieves the release history.
   */
  getReleaseHistory = async () => {
    const releaseHistoryItems = await this.database
      .select({
        id: appRelease.id,
        releaseDateTime: appRelease.releaseDateTime,
        version: appRelease.version,
        isVisible: appRelease.isVisible,
        description: appReleaseFeature.description,
        engineerName: appReleaseFeature.engineerName,
        name: appReleaseFeature.name,
      })
      .from(appRelease)
      .leftJoin(appReleaseFeature, eq(appRelease.id, appReleaseFeature.releaseId))
      .orderBy(asc(appRelease.createdDateTime))
      .execute()
      .catch((err) => {
        this.logger.error(err);
        throw new Error("Error retrieving Release History");
      });

    return releaseHistoryItems;
  };
}
