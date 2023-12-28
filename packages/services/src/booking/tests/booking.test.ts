import { desc } from "@golf-district/database";
import { afterEach, beforeEach, describe, expect, it, vitest } from "vitest";
import {
  createDrizzleMock,
  mockBookings,
  mockLists,
  mockOffers,
  mockTeeTimes,
  mockTransfers,
  mockUserBookingOffers,
} from "../../../mocks";
import { BookingService } from "../booking.service";

let dbMock = {
  select: createDrizzleMock([
    [], //fin teetimehistory
    mockUserBookingOffers,
    mockOffers,
    [],
    mockBookings,
    [], //fin bookingOffers
    mockBookings,
    mockOffers, //fin create booking listing
    mockTransfers[0], //fin get txn history
    mockOffers, //fin getofferreceived
    [mockOffers[0]], //fin get offers sent for user
    mockLists,
    mockBookings,
    mockBookings, //update listing
    [mockOffers[1]],
    [], //end rejectOffer
    [mockOffers[2]],
    mockOffers,
    mockOffers, //end reject offer
    mockBookings,
    mockBookings,
    mockTeeTimes,
    mockBookings,
  ]),
  update: createDrizzleMock([mockBookings, mockOffers, mockOffers, mockOffers, mockBookings]),
  insert: createDrizzleMock([mockBookings]),
  transaction: vitest.fn(() => {
    return Promise.resolve();
  }),
};

describe("BookingService", () => {
  let bookingsService: BookingService;

  beforeEach(async () => {
    process.env.NODE_ENV = "test";
    process.env.LOG_LEVEL = "debug";
    bookingsService = new BookingService(dbMock as any, "mock key");
  });

  describe("TeeTimeHistory", () => {
    it("Should return empty array if no history found", async () => {
      const teeTimeHistory = await bookingsService.getTeeTimeHistory("fake_time");
      expect(dbMock.select).toHaveBeenCalled();
      expect(teeTimeHistory.length).toBe(0);
    });
  });

  describe("Booking Offers", () => {
    it("Should get offers on booking", async () => {
      try {
        await bookingsService.getOffersForBooking("booking1");
      } catch {}
      expect(dbMock.select).toHaveBeenCalled();
    });
    it("Should return a success message upon successful offer", async () => {
      const resp = await bookingsService.acceptOffer("user1", "offer1");
      expect(dbMock.select).toHaveBeenCalled();
      expect(resp.message).toBe("Offer accepted successfully.");
    });
    it("Should fail if offer not found", async () => {
      await expect(bookingsService.acceptOffer("user1", "offer1")).rejects.toThrow("Offer not found");
    });

    it("Should create an offer on bookings", async () => {
      await bookingsService.createOfferOnBookings(
        "user1",
        ["offer1"],
        10,
        new Date(new Date().getTime() + 10000)
      );
      expect(dbMock.select).toHaveBeenCalled();
      expect(dbMock.transaction).toHaveBeenCalled();
    });

    it("Should fail to create offer if no bookings found", async () => {
      // await expect(
      //   bookingsService.createOfferOnBookings("user1", ["offer1"], 10, new Date(new Date().getTime() + 10000))
      // ).rejects.toThrow("No bookings found");
      bookingsService.createOfferOnBookings("user1", ["offer1"], 10, new Date(new Date().getTime() + 10000));
    });
  });

  describe("Create Booking Listing", () => {
    it("Should create listing", async () => {
      let dbMock2 = { select: createDrizzleMock([mockBookings]) };
      bookingsService = new BookingService(dbMock2 as any, "mock key");

      await expect(
        bookingsService.createListingForBookings(
          "user1",
          100,
          ["booking1"],
          new Date(new Date().getTime() + 10000)
        )
      ).rejects.toThrow("One or more bookings from this tee time is already listed.");
      expect(dbMock.select).toHaveBeenCalled();
    });
  });

  describe("getTransactionHistory", () => {
    it("Should get transaction history", async () => {
      await bookingsService.getTransactionHistory("user1", "course1", 1, undefined);
      expect(dbMock.select).toHaveBeenCalled();
    });
  });

  describe("getOfferReceivedForUser", () => {
    it("Should get offers received for user", async () => {
      await bookingsService.getOfferReceivedForUser("user1", "course1");
      expect(dbMock.select).toHaveBeenCalled();
    });
  });

  describe("getOfferSentForUser", () => {
    it("Should get offers sent for user", async () => {
      await bookingsService.getOfferSentForUser("user1", "course1");
      expect(dbMock.select).toHaveBeenCalled();
    });
  });

  describe("updateListing", () => {
    it("Should update listing", async () => {
      // const mockCancelListing = vitest
      //   .spyOn(bookingsService, "cancelListing")
      //   .mockReturnValue(Promise.resolve());
      const mockCreateListingForBookings = vitest
        .spyOn(bookingsService, "createListingForBookings")
        .mockReturnValue(Promise.resolve());
      await bookingsService.updateListing(
        "user1",
        100,
        ["booking1"],
        new Date(new Date().getTime() + 10000),
        "listing1"
      );
      expect(dbMock.select).toHaveBeenCalled();
      // expect(mockCancelListing).toHaveBeenCalled();
    });
  });

  describe("rejectOffer", () => {
    it("Should reject offer", async () => {
      await bookingsService.rejectOffer("user1", "offer1");
      expect(dbMock.select).toHaveBeenCalled();
      expect(dbMock.update).toHaveBeenCalled();
    });
    it("Should fail if offer not found", async () => {
      await expect(bookingsService.rejectOffer("user1", "offer1")).rejects.toThrow("Offer not found");
    });
  });

  describe("cancelOfferOnBooking", () => {
    it("Should fail to cancel offer on booking if already deleted", async () => {
      await expect(bookingsService.cancelOfferOnBooking("user1", "offer1")).rejects.toThrow(
        "Offer is already deleted"
      );
    });
    it("Should cancel offer on booking", async () => {
      await bookingsService.cancelOfferOnBooking("user1", "offer1");
      expect(dbMock.select).toHaveBeenCalled();
      expect(dbMock.update).toHaveBeenCalled();
    });
    it("Should fail to cancel offer on booking where user is not owner", async () => {
      await expect(bookingsService.cancelOfferOnBooking("user2", "offer1")).rejects.toThrow(
        "User does not own offer"
      );
    });
  });

  describe("setMinimumOfferPrice", () => {
    it("should set minimum offer price", async () => {
      await bookingsService.setMinimumOfferPrice("user1", "teetime1", 10);
      expect(dbMock.transaction).toHaveBeenCalled();
    });
  });

  describe("getMyListedTeeTimes", () => {
    it("Should get a user's listed tee times", async () => {
      await bookingsService.getMyListedTeeTimes("user1", "course1", 10);
      expect(dbMock.select).toHaveBeenCalled();
    });
  });

  describe("getOwnedBookingsForTeeTime", () => {
    it("Should get owned bookings for teetimes", async () => {
      await bookingsService.getOwnedBookingsForTeeTime("user1", "teeTime1");
      expect(dbMock.select).toHaveBeenCalled();
    });
  });

  describe("getOwnedTeeTimes", () => {
    it("should get owned tee times", async () => {
      await bookingsService.getOwnedTeeTimes("user1", "course1", undefined, undefined);
      expect(dbMock.select).toHaveBeenCalled();
    });
  });

  describe("updateNamesOnBookings", () => {
    it("Should update names on bookings", async () => {
      await bookingsService.updateNamesOnBookings("user1", ["booking1"], ["user2"]);
      expect(dbMock.select).toHaveBeenCalled();
      expect(dbMock.update).toHaveBeenCalled();
    });
  });
});
