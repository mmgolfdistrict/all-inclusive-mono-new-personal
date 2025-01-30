import { randomUUID } from "crypto";
import type { Db } from "@golf-district/database";
import { eq } from "@golf-district/database";
import { assets } from "@golf-district/database/schema/assets";
import { users } from "@golf-district/database/schema/users";
import { assetToURL } from "@golf-district/shared";
import Logger from "@golf-district/shared/src/logger";
import { loggerService } from "../webhooks/logging.service";

/**
 * `ImageService` provides methods to interact with images, allowing retrieval and storage of image assets in the database.
 * Utilizes the database connection provided during instantiation.
 *
 * @property {Db} database - An instance of the database client.
 */
export class ImageService {
  private readonly logger = Logger(ImageService.name);
  /**
   * Constructs a new instance of `ImageService`.
   *
   * @param {Db} database - The database client instance.
   */
  constructor(private readonly database: Db) {}

  /**
   * Asynchronously retrieves the URL of an image from the database using its asset ID.
   *
   * This method fetches an asset from the database using the provided asset ID and converts it into a URL using the `assetToURL` helper function.
   *
   * @param {string} assetId - The ID of the asset to retrieve.
   * @returns {Promise<string|null>} A promise that resolves to the asset URL if found, or `null` if the asset is not found.
   *
   * @example
   * ```typescript
   * const imageUrl = await imageService.getAsset('asset123id');
   * if(imageUrl) {
   *   console.log(`Image URL: ${imageUrl}`);
   * } else {
   *   console.log('Image not found');
   * }
   * ```
   */
  getAsset = async (assetId: string): Promise<string | null> => {
    const asset = await this.database.select().from(assets).where(eq(assets.id, assetId));
    if (!asset[0]) {
      this.logger.warn(`Asset not found: ${assetId}`);
      return null;
    }

    return assetToURL(asset[0]);
  };

  /**
   * Asynchronously stores an image asset in the database.
   *
   * This method inserts an asset with the provided properties into the database. It validates the existence of the user creating the asset before insertion.
   *
   * @param {string} createdById - The ID of the user creating the asset.
   * @param {string} key - The key/name of the asset.
   * @param {string} extension - The file extension of the asset.
   *
   * @returns {Promise<void>} A promise that resolves when the asset is successfully inserted into the database.
   *
   * @throws
   *   - `Error("User not found")`: If no user is found with the provided `createdById`.
   *
   * @example
   * ```typescript
   * await imageService.storeAsset('user123id', 'imageKey', 'jpg', 'http://golf.cloudfront.com');
   * ```
   */
  storeAsset = async (createdById: string, key: string, extension: string): Promise<string> => {
    //this check may be able to be removed
    const user = await this.database.select().from(users).where(eq(users.id, createdById));
    if (!user[0]) {
      this.logger.error(`User not found: ${createdById}`);
      loggerService.errorLog({
        userId: "",
        url: "/ImageService/storeAsset",
        userAgent: "",
        message: "USER_NOT_FOUND",
        stackTrace: `User not found: ${createdById}`,
        additionalDetailsJSON: JSON.stringify({
          createdById,
          key,
          extension,
        }),
      });
      throw new Error("User not found");
    }

    const assetData = {
      id: randomUUID(),
      key,
      extension,
      createdById,
    };

    await this.database
      .insert(assets)
      .values(assetData)
      .execute()
      .catch((err) => {
        this.logger.error(err);
        loggerService.errorLog({
          userId: "",
          url: "/ImageService/storeAsset",
          userAgent: "",
          message: "ERROR_STORING_ASSET",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            createdById,
            key,
            extension,
            assetData,
          }),
        });
        throw new Error("Error storing asset");
      });

    const [insertedAsset] = await this.database
      .select()
      .from(assets)
      .where(eq(assets.id, assetData.id))
      .execute()
      .catch((err) => {
        this.logger.error("Error retrieving inserted asset", err);
        loggerService.errorLog({
          userId: "",
          url: "/ImageService/storeAsset",
          userAgent: "",
          message: "ERROR_RETRIEVING_INSERTED_ASSET",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            createdById,
            assetData,
          }),
        });
        throw new Error("Error retrieving inserted asset");
      });
    if (!insertedAsset) {
      this.logger.error(`Error asset not found for key ${key}`);
      loggerService.errorLog({
        userId: "",
        url: "/ImageService/storeAsset",
        userAgent: "",
        message: "ERROR_ASSET_NOT_FOUND",
        stackTrace: `Error asset not found for key ${key}`,
        additionalDetailsJSON: JSON.stringify({
          createdById,
          assetData,
        }),
      });
      throw new Error("Error asset not found for key ${key}");
    }
    return insertedAsset.id;
  };
}
