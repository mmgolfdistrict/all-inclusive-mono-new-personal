import { Blob } from "node:buffer";
import { beforeEach, describe, expect, it, vitest } from "vitest";
import { HyperSwitchWebhookService } from "../hyperswitch.webhook.service";
import { HyperSwitchEvent } from "../types/hyperswitch";

describe("HyperSwitchWebhookService", () => {
  let hyperSwitchWebhookService: HyperSwitchWebhookService;
  let hyperSwitchEvent: HyperSwitchEvent;

  beforeEach(async () => {
    process.env.NODE_ENV = "test";
    process.env.LOG_LEVEL = "debug";
    hyperSwitchWebhookService = new HyperSwitchWebhookService();
    hyperSwitchEvent = {
      merchant_id: "merchant1",
      event_id: "event1",
      event_type: "payment_succeeded",
      content: {
        type: "payment_details",
        object: {
          customer_id: "custormer1",
          amount_received: 10,
          metadata: {},
        },
      },
      timestamp: new Date().toString(),
    };
  });

  it("Should process webhook", async () => {
    const obj = {
      webhook: {
        event_type: "type",
      },
    };
    const blob = new Blob([JSON.stringify(obj, null, 2)], {
      type: "application/json",
    });
    const request = new Request("https://example.com", {
      method: "POST",
      referrer: "https://sandbox.hyperswitch.io",
      body: blob,
    });
    // const mockIsFromValidDomain = vitest
    //   .spyOn(hyperSwitchWebhookService, "isFromValidDomain")
    //   .mockReturnValue(true);
    await expect(hyperSwitchWebhookService.processWebhook(request)).rejects.toThrow("Unhandled event type.");
    // expect(mockIsFromValidDomain).toHaveBeenCalled();
  });

  it("Should handle payment failure", async () => {
    await hyperSwitchWebhookService.paymentFailureHandler({
      ...hyperSwitchEvent,
      event_type: "payment_failed",
    });
  });

  it("Should handle payment success", async () => {
    await hyperSwitchWebhookService.paymentSuccessHandler(hyperSwitchEvent);
  });
});
