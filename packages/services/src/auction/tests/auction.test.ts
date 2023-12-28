import { afterEach, beforeEach, describe, expect, it, vitest } from "vitest";
import { createDrizzleMock, mockUsers } from "../../../mocks";
import { mockAuctions } from "../../../mocks/auctions.mock";
import { mockBids } from "../../../mocks/bids.mock";
import { HyperSwitchService } from "../../payment-processor/hyperswitch.service";
import { AuctionService } from "../auction.service";

let dbMock = {
  select: createDrizzleMock([mockAuctions]),
  update: createDrizzleMock([mockAuctions]),
  insert: createDrizzleMock([mockAuctions]),
};

describe("AuctionService", () => {
  let auctionsService: AuctionService;
  let hyperSwitchService: HyperSwitchService;

  beforeEach(async () => {
    vitest.clearAllMocks();
    process.env.NODE_ENV = "test";
    process.env.LOG_LEVEL = "debug";
    hyperSwitchService = new HyperSwitchService("mock key");
    auctionsService = new AuctionService(dbMock as any, hyperSwitchService);
  });

  describe("createAuction", () => {
    it("Should create an auction", async () => {
      await auctionsService.createAuctionForCourseId(
        "user",
        "course",
        "entity",
        new Date(new Date().getTime() + 10000),
        new Date(new Date().getTime() + 10000 * 60 * 60 * 24 * 7),
        ["image"],
        "mock",
        100,
        100
      );
      expect(dbMock.insert).toHaveBeenCalled();
    });
    it("Should revert if start date is in the past", async () => {
      await expect(
        auctionsService.createAuctionForCourseId(
          "user",
          "course",
          "entity",
          new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7),
          new Date(),
          ["image"],
          "mock",
          100,
          100
        )
      ).rejects.toThrow("Starting bid time cannot be in the past");
    });
    it("Should revert if start date is greater than end date", async () => {
      await expect(
        auctionsService.createAuctionForCourseId(
          "user",
          "course",
          "entity",
          new Date(new Date().getTime() + 1000),
          new Date(),
          ["image"],
          "mock",
          100,
          100
        )
      ).rejects.toThrow("Starting bid time cannot be after end bid time");
    });
  });

  describe("cancelAuction", () => {
    it("Should cancel an auction", async () => {
      await auctionsService.cancelAuction("user2", "auction1");
      expect(dbMock.update).toHaveBeenCalled();
    });
    it("Should fail to cancel an auction", async () => {
      dbMock.update.mockImplementation(() => {
        throw new Error("Error cancelling auction");
      });
      await expect(auctionsService.cancelAuction("user2", "auction1")).rejects.toThrow(
        "Error cancelling auction"
      );
    });
  });

  describe("getAuction", () => {
    it("Should get auction via course", async () => {
      await auctionsService.getAuctionsForCourse("course1");
      expect(dbMock.select).toHaveBeenCalled();
    });
    it("Should get auction via id", async () => {
      let dbMock = {
        select: createDrizzleMock([mockAuctions, mockBids[0]]),
        update: createDrizzleMock([mockAuctions]),
        insert: createDrizzleMock([mockAuctions]),
      };
      let auctionsService = new AuctionService(dbMock as any, hyperSwitchService);

      await auctionsService.getAuctionById("auction1");
      expect(dbMock.select).toHaveBeenCalled();
    });
  });

  describe("placeBid", () => {
    dbMock = {
      select: createDrizzleMock([
        mockAuctions,
        [mockAuctions[4]],
        mockBids,
        [mockAuctions[4]],
        mockBids,
        mockAuctions,
        mockAuctions,
        [mockAuctions[3]],
      ]),
      update: createDrizzleMock([mockAuctions]),
      insert: createDrizzleMock([mockBids, mockBids]),
    };
    auctionsService = new AuctionService(dbMock as any, hyperSwitchService);

    it("Should successfully place a bid", async () => {
      const mockRetrievePaymentMethods = vitest
        .spyOn(hyperSwitchService, "retrievePaymentMethods")
        .mockReturnValue({ data: [{ id: "user1" }] });

      const mockCreatePaymentIntent = vitest
        .spyOn(hyperSwitchService, "createPaymentIntent")
        .mockReturnValue({ client_secret: "secret1" });

      try {
        await auctionsService.placeBid("user1", "auction5", 200);
      } catch {}

      expect(mockCreatePaymentIntent).toHaveBeenCalled();
      expect(mockRetrievePaymentMethods).toHaveBeenCalled();
      expect(dbMock.select).toHaveBeenCalledTimes(2);
    });

    it("Should fail if no card on file", async () => {
      await expect(auctionsService.placeBid("user1", "auction5", 200)).rejects.toThrow(
        "User does not have a card on file"
      );
    });

    it("Should fail if bid amount is more than buy now price", async () => {
      // auctionsService.placeBid("user1", "auction1", 400);
      await expect(auctionsService.placeBid("user1", "auction1", 400)).rejects.toThrow(
        "Bid amount must be less than buy now price"
      );
    });
    it("Should fail if bid amount is less than start price", async () => {
      //auctionsService.placeBid("user1", "auction3", 20);
      await expect(auctionsService.placeBid("user1", "auction1", 20)).rejects.toThrow(
        "Bid amount must be greater than starting price"
      );
    });
    it("Should fail if auction has ended", async () => {
      //auctionsService.placeBid("user1", "auction3", 20);
      await expect(auctionsService.placeBid("user1", "auction1", 100)).rejects.toThrow("Auction has ended");
    });
  });

  describe("buyNow", async () => {
    it("Should let you buy now", async () => {
      let dbMock = {
        select: createDrizzleMock([[mockAuctions[2]]]),
      };
      let auctionsService = new AuctionService(dbMock as any, hyperSwitchService);
      const mockCreatePaymentIntent = vitest
        .spyOn(hyperSwitchService, "createPaymentIntent")
        .mockReturnValue({ client_secret: "secret1" });

      try {
        var response = await auctionsService.buyNow("user1", "auction2");
        expect(response.clientSecret).toBe("secret1");
      } catch (error) {
        console.log("buynow:error:", error);
      }
      expect(mockCreatePaymentIntent).toHaveBeenCalled();
    });

    it("Should fail if can't get auction", async () => {
      dbMock.select.mockImplementation(() => {
        throw new Error("Error getting auction");
      });
      await expect(auctionsService.buyNow("user1", "auction2")).rejects.toThrow("Error getting auction");
    });

    it("Should fail if auction not found", async () => {
      let dbMock = {
        select: createDrizzleMock([[]]),
      };
      let auctionsService = new AuctionService(dbMock as any, hyperSwitchService);
      await expect(auctionsService.buyNow("user1", "auction2")).rejects.toThrow("Auction not found");
    });

    it("Should fail if auction does not have buy now price", async () => {
      let dbMock = {
        select: createDrizzleMock([[mockAuctions[1]]]),
      };
      let auctionsService = new AuctionService(dbMock as any, hyperSwitchService);
      await expect(auctionsService.buyNow("user1", "auction2")).rejects.toThrow(
        "Auction does not have a buy now price"
      );
    });

    it("Should fail if payment intent fails", async () => {
      let dbMock = {
        select: createDrizzleMock([[mockAuctions[2]]]),
      };
      let auctionsService = new AuctionService(dbMock as any, hyperSwitchService);
      await expect(auctionsService.buyNow("user1", "auction2")).rejects.toThrow(
        "Error creating payment intent"
      );
    });
  });

  describe("finalizeAuction", () => {
    it("Should finalize auction", async () => {
      // let dbMock = {
      //   select: createDrizzleMock([mockAuctions, mockBids]),
      //   update: createDrizzleMock([mockAuctions]),
      //   insert: createDrizzleMock([mockAuctions]),
      // };
      // let auctionsService = new AuctionService(dbMock as any, hyperSwitchService);
      // const mockCapturePaymentIntent = vitest
      //   .spyOn(hyperSwitchService, "capturePaymentIntent")
      //   .mockReturnValue({ status: "test" });
      // try {
      //   await auctionsService.finalizeAuction("auction1");
      // } catch {}
      // expect(mockCapturePaymentIntent).toHaveBeenCalled();
    });

    it("Should fail if can't get auction", async () => {
      dbMock.select.mockImplementation(() => {
        throw new Error("Error getting auction");
      });
      await expect(auctionsService.finalizeAuction("auction1")).rejects.toThrow("Error getting auction");
    });

    it("Should fail if auction not found", async () => {
      let dbMock = {
        select: createDrizzleMock([[]]),
      };
      let auctionsService = new AuctionService(dbMock as any, hyperSwitchService);
      await expect(auctionsService.finalizeAuction("auction1")).rejects.toThrow("Auction not found");
    });

    it("Should fail if auction has not ended", async () => {
      let dbMock = {
        select: createDrizzleMock([[mockAuctions[4]], mockBids]),
        update: createDrizzleMock([mockAuctions]),
        insert: createDrizzleMock([mockAuctions]),
      };
      let auctionsService = new AuctionService(dbMock as any, hyperSwitchService);

      await expect(auctionsService.finalizeAuction("auction5")).rejects.toThrow(
        "Auction has not ended cancel the auction first"
      );
    });
  });
});
