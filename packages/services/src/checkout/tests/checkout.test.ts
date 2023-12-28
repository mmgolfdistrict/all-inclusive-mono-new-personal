import { UserDefinedMessageInstance } from "twilio/lib/rest/api/v2010/account/call/userDefinedMessage";
import { beforeEach, describe, expect, it, vitest } from "vitest";
import { createDrizzleMock, mockUsers } from "../../../mocks";
import { HyperSwitchService } from "../../payment-processor/hyperswitch.service";
import { CheckoutService } from "../checkout.service";
import { CustomerCart, ProductData } from "../types";

let dbMock = {
  select: createDrizzleMock([[mockUsers[0]]]),
};

const productData = {
  name: "product",
  id: "product1",
  price: 10,
  image: "https://image.com/1",
  currency: "USD",
  display_price: "$10.00",
  product_data: {
    metadata: {
      type: "first_hand",
      provider_id: "provider1",
      tee_time_id: "time1",
    },
  },
};
const customerCart: CustomerCart = {
  userId: "user1",
  customerId: "customer1",
  name: "user1",
  email: "user1@example.com",
  phone: "5555555555",
  phone_country_code: "1",
  cart: [productData as any],
};

describe("Checkout Service", () => {
  let checkoutService: CheckoutService;

  beforeEach(async () => {
    process.env.NODE_ENV = "test";
    process.env.LOG_LEVEL = "debug";
    checkoutService = new CheckoutService(dbMock as any, {
      sensible_partner_id: "sensible_partner1",
      sensible_product_id: "sensible_product1",
      SENSIBLE_API_KEY: "sensible_api_key",
      redisUrl: "redis_url.com",
      redisToken: "redisToken",
      hyperSwitchApiKey: "hyperSwitchApiKey",
      foreUpApiKey: "foreUpApiKey",
    });
  });

  describe("buildCheckoutSession", () => {
    it("Should build checkout session", async () => {
      try {
        await checkoutService.buildCheckoutSession("user1", customerCart);
      } catch {}
      expect(dbMock.select).toHaveBeenCalled();
    });
  });

  describe("validateCartItems", () => {
    it("should validate cart items", async () => {
      await checkoutService.validateCartItems(customerCart);
    });
  });
});
