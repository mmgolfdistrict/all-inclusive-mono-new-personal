import { afterEach, anything, beforeEach, describe, expect, it, verify, vitest } from "vitest";
import { createDrizzleMock } from "../../../mocks";
import { mockBookings } from "../../../mocks/bookings.mock";
import { mockTeeTimes } from "../../../mocks/teeTimes.mock";
import { mockTransfers } from "../../../mocks/transfers.mock";
import { TokenizeService } from "../tokenize.service";

let atomicDbMock = {
  insert: createDrizzleMock([
    mockBookings[0],
    mockBookings[0],
    mockBookings[0],
    mockBookings[0],
    mockBookings[0],
    mockBookings[0],
    mockBookings[0],
    mockBookings[0],
    mockBookings[0],
    mockBookings[0],
    mockBookings[0],
    mockBookings[0],
    mockBookings[0],
  ]),
};
let dbMock = {
  select: createDrizzleMock([mockTeeTimes, mockBookings, mockBookings]),
  update: createDrizzleMock([mockBookings, mockBookings]),
  insert: createDrizzleMock([mockBookings, mockTransfers]),
  transaction: vitest.fn((f) => f(atomicDbMock)),
};

describe("TokenizeService", () => {
  let tokenizerService: TokenizeService;

  beforeEach(async () => {
    process.env.NODE_ENV = "test";
    process.env.LOG_LEVEL = "debug";
    tokenizerService = new TokenizeService(dbMock as any, "mock_key");
    // dbMock.transaction.mockReset();
  });

  describe("Tokenize Booking", () => {
    it("Should tokenize booking", async () => {
      try {
        await tokenizerService.tokenizeBooking(
          "user1",
          18,
          "course1",
          100,
          new Date(),
          true,
          1, //how many bookings to make
          "provider1"
        );
      } catch {}
      expect(dbMock.select).toHaveBeenCalled();
    });
  });

  describe("Transfer Booking", () => {
    it("Should transfer booking", async () => {
      try {
        await tokenizerService.transferBookings("user1", ["booking1"], "user2", 100);
      } catch {}
      expect(dbMock.select).toHaveBeenCalled();
      // expect(dbMock.tx.update).toHaveBeenCalled();
      // expect(dbMock.insert).toHaveBeenCalled();
      // expect(dbMock.transaction).toHaveBeenCalled();
    });
  });

  describe("addNamesToOwnedBookings", () => {
    it("Should add name to booking", async () => {
      try {
        await tokenizerService.addNamesToOwnedBookings("user1", ["booking1"], ["name1"]);
      } catch {}

      expect(dbMock.select).toHaveBeenCalled();
    });
  });
});
