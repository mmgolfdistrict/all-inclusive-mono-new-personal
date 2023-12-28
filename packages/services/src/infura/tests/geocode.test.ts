import { LocationClient, SearchPlaceIndexForTextCommand } from "@aws-sdk/client-location";
import { mockClient } from "aws-sdk-client-mock";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GeoService } from "../geo.service";

describe("geocode", () => {
  let geoService: GeoService;
  let locationMock: ReturnType<typeof mockClient>;

  beforeEach(() => {
    locationMock = mockClient(LocationClient);
    geoService = new GeoService("aws_accessKeyId", "aws_secretAccessKey", "aws_region");
  });

  afterEach(() => {
    locationMock.restore();
  });

  it("should geocode address", async () => {
    const address = "1600 Amphitheatre Parkway, Mountain View, CA";

    locationMock
      .on(SearchPlaceIndexForTextCommand, {
        IndexName: "Gold-District-GeoCode-Index",
        Text: address,
        MaxResults: 1,
      })
      .resolves({
        Results: [
          {
            Place: {
              Geometry: {
                Point: [-122.0840575, 37.4219999],
              },
            },
          },
        ],
      });
    const coords = await geoService.geoCodeAddress(address);
    expect(coords).toEqual({ lat: 37.4219999, lng: -122.0840575 });
  });

  it("should throw error if address cannot be geocoded", async () => {
    const address = "Nonexistent Place, Nowhere";
    locationMock.on(SearchPlaceIndexForTextCommand).rejects(new Error("Address not found"));
    await expect(geoService.geoCodeAddress(address)).rejects.toThrow(
      "Error geocoding address: Error: Address not found"
    );
  });

  it("should throw error for unexpected response structure", async () => {
    const address = "1600 Amphitheatre Parkway, Mountain View, CA";
    locationMock.on(SearchPlaceIndexForTextCommand).resolves({});
    await expect(geoService.geoCodeAddress(address)).rejects.toThrow(
      "Unexpected response structure from Amazon Location Service"
    );
  });
});
