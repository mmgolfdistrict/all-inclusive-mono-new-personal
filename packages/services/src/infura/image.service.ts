import { randomUUID } from "crypto";
import type { Db } from "@golf-district/database";
import { eq } from "@golf-district/database";
import { assets } from "@golf-district/database/schema/assets";
import { users } from "@golf-district/database/schema/users";
import { assetToURL } from "@golf-district/shared";
import Logger from "@golf-district/shared/src/logger";

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
   * @param {string} cdn - The CDN URL or identifier where the asset is stored.
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
  storeAsset = async (createdById: string, key: string, extension: string, cdn: string): Promise<string> => {
    //this check may be able to be removed
    const user = await this.database.select().from(users).where(eq(users.id, createdById));
    if (!user[0]) {
      this.logger.error(`User not found: ${createdById}`);
      throw new Error("User not found");
    }

    const [asset] = await this.database
      .select()
      .from(assets)
      .where(eq(assets.createdById, createdById))
      .execute()
      .catch((err) => {
        this.logger.error("Error retrieving fetching asset", err);
        throw new Error("Error retrieving fetching asset");
      });

    if (asset) {
      return asset.id;
    } else {
      await this.database
        .insert(assets)
        .values({
          id: randomUUID(),
          key,
          extension,
          cdn,
          createdById,
        })
        .execute()
        .catch((err) => {
          this.logger.error(err);
          throw new Error("Error storing asset");
        });
      const [insertedAsset] = await this.database
        .select()
        .from(assets)
        .where(eq(assets.key, key))
        .execute()
        .catch((err) => {
          this.logger.error("Error retrieving inserted asset", err);
          throw new Error("Error retrieving inserted asset");
        });
      if (!insertedAsset) {
        this.logger.error(`Error asset not found for key ${key}`);
        throw new Error("Error asset not found for key ${key}");
      }
      return insertedAsset.id;
    }
  };
}
