import { beforeEach, describe, expect, it, vitest } from "vitest";
import { createDrizzleMock, mockProviderCourseLink, mockTeeTimes } from "../../../mocks";
import { ProviderService } from "../../tee-sheet-provider/providers.service";
import { ForeUpWebhookService } from "../foreup.webhook.service";

let dbMock = {
  select: createDrizzleMock([
    [{ courseToIndex: mockProviderCourseLink[0], entity: { id: "entity1" } }],
    ...Array.from({ length: 100 }, () => mockTeeTimes),
  ]),
  insert: createDrizzleMock([...Array.from({ length: 100 }, () => mockTeeTimes)]),
};

describe("ForeUpWebhookService", () => {
  let foreupWebhookService: ForeUpWebhookService;
  let providerService: ProviderService;

  beforeEach(async () => {
    process.env.NODE_ENV = "test";
    process.env.LOG_LEVEL = "debug";
    providerService = new ProviderService(dbMock as any, "redis-url.com", "redis-token", {
      username: "username",
      password: "password",
    });
    foreupWebhookService = new ForeUpWebhookService(dbMock as any, providerService);
  });

  it("Should handle webhook", async () => {
    const mockGetProviderAndKey = vitest.spyOn(providerService, "getProviderAndKey").mockReturnValue({
      provider: {
        getTeeTimes: () => {
          return [{ attributes: { time: 1900, allowedGroupSizes: [10] } }];
        },
      },
      token: "token",
    });
    vitest.spyOn(providerService, "getTeeTimes").mockReturnValue([]);
    await foreupWebhookService.handelWebhook();
    expect(dbMock.select).toHaveBeenCalled();
  });
});
