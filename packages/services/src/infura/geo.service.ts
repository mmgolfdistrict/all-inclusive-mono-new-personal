import { LocationClient, SearchPlaceIndexForTextCommand } from "@aws-sdk/client-location";
import Logger from "@golf-district/shared/src/logger";
import { loggerService } from "../webhooks/logging.service";

/**
 * Constructs a new instance of `GeoService`.
 *
 * @param {string} aws_accessKeyId - AWS access key ID.
 * @param {string} aws_secretAccessKey - AWS secret access key.
 * @param {string} aws_region - AWS region.
 *
 * @example
 * const geoService = new GeoService(
 *   'aws_access_key_id',
 *   'aws_secret_access_key',
 *   'aws_region'
 * );
 * @see {@link geoCodeAddress}
 */
export class GeoService {
  private readonly logger = Logger(GeoService.name);
  static readonly PLACE_INDEX_NAME = "Gold-District-GeoCode-Index";
  private readonly config: {
    region: string;
    credentials: {
      accessKeyId: string;
      secretAccessKey: string;
    };
  };

  /**
   * Constructs a new instance of `GeoService`.
   *
   * @param aws_accessKeyId - AWS access key ID.
   * @param aws_secretAccessKey - AWS secret access key.
   * @param aws_region - AWS region.
   */
  constructor(aws_accessKeyId: string, aws_secretAccessKey: string, aws_region: string) {
    this.config = {
      region: aws_region,
      credentials: {
        accessKeyId: aws_accessKeyId,
        secretAccessKey: aws_secretAccessKey,
      },
    };
  }

  /**
   * Geocode an address, converting it into geographical coordinates.
   *
   * This method uses AWS Location Service to find the latitude and longitude
   * associated with the provided address string. The first result (if any)
   * from the service is returned.
   *
   * @param address - The address to geocode.
   * @returns A promise that resolves to an object containing the latitude (`lat`)
   * and longitude (`lng`) of the address. If the address cannot be geocoded, the
   * promise will be rejected with an error.
   *
   * @example
   * ```typescript
   * const coords = await geoService.geoCodeAddress('1600 Amphitheatre Parkway, Mountain View, CA');
   * console.log(`Coordinates: ${coords.lat}, ${coords.lng}`);
   * ```
   */
  async geoCodeAddress(address: string): Promise<{ lat: number; lng: number }> {
    this.logger.info(`geoCodeAddress called with address: ${address}`);
    const client = new LocationClient(this.config);
    const command = new SearchPlaceIndexForTextCommand({
      IndexName: GeoService.PLACE_INDEX_NAME,
      Text: address,
      MaxResults: 1,
    });
    const data = await client.send(command).catch((err) => {
      this.logger.error(`Error geocoding address: ${err}`);
      loggerService.errorLog({
        userId: "",
        url: "/GeoService/geoCodeAddress",
        userAgent: "",
        message: "ERROR_GEOCODING_ADDRESS",
        stackTrace: `${err.stack}`,
        additionalDetailsJSON: JSON.stringify({
          address,
        })
      })
      throw new Error(`Error geocoding address: ${err}`);
    });

    if (data?.Results?.[0]?.Place?.Geometry?.Point) {
      const [lng, lat] = data.Results[0].Place.Geometry.Point;
      if (typeof lat === "number" && typeof lng === "number") {
        return { lat, lng };
      }
    }
    this.logger.error(`Unexpected response structure from Amazon Location Service: ${JSON.stringify(data)}`);
    loggerService.errorLog({
      userId: "",
      url: "/GeoService/geoCodeAddress",
      userAgent: "",
      message: "UNEXPECTED_RESPONSE_STRUCTURE_FROM_AMAZON_LOCATION_SERVICE",
      stackTrace: `${JSON.stringify(data)}`,
      additionalDetailsJSON: JSON.stringify({
        address
      })
    })
    throw new Error("Unexpected response structure from Amazon Location Service");
  }
}
