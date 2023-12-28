import { afterEach, beforeEach, describe, expect, it, vitest } from "vitest";
import { createDrizzleMock, mockAssets } from "../../../mocks";
import { ImageService } from "../image.service";

const dbMock = {
  select: createDrizzleMock([mockAssets, mockAssets, mockAssets]),
  insert: createDrizzleMock([mockAssets, mockAssets]),
};

describe("imageService", () => {
  let imageService: ImageService;
  beforeEach(() => {
    imageService = new ImageService(dbMock as any);
  });

  afterEach(() => {});
  it("Should get the asset", async () => {
    const response = await imageService.getAsset("asset1");
    expect(dbMock.select).toHaveBeenCalled();
    expect(response).toBe("https://cdn.com/key1.png");
  });

  it("Should store the asset", async () => {
    imageService.storeAsset("user1", "key1", ".png", "https://cdn.com");
    expect(dbMock.select).toHaveBeenCalled();
  });
});
