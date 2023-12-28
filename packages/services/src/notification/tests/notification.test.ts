import { Db, db, not } from "@golf-district/database";
import Logger from "@golf-district/shared/src/logger";
import pino from "pino";
import { anything, instance, mock, verify, when } from "ts-mockito";
import { beforeEach, describe, expect, it } from "vitest";
import { createDrizzleMock, mockNotifications, mockOffers, mockUsers } from "../../../mocks";
import { NotificationService } from "../notification.service";

let dbMock = {
  select: createDrizzleMock([[mockNotifications[0]], mockUsers[0], mockOffers]),
  update: createDrizzleMock([[mockNotifications[0]], mockNotifications[0], mockNotifications[0]]),
  insert: createDrizzleMock([mockNotifications]),
};

describe("NotificationService", () => {
  let notificationService: NotificationService;
  let mockDatabase: Db;
  let mockLogger: pino.Logger;

  beforeEach(() => {
    notificationService = new NotificationService(
      dbMock as any,
      "mockNumber",
      "mockemail",
      "mocktwilliossid",
      "mocktwillioauth",
      "mockSendGridApiKey"
    );
  });

  describe("getNotifications", () => {
    it("should return notifications for a user", async () => {
      const mockNotifications = [{ id: "1", userId: "user1", entityId: "entity1", isDeleted: false }];
      //when(mockDatabase.select(anything())).thenResolve(mockNotifications);
      const result = await notificationService.getNotifications("user1", "entity1");
      expect(result.data).toEqual(mockNotifications);
      expect(result.nextCursor).toBeNull();
    });
  });

  describe("createNotifications", () => {
    it("should create a notification", async () => {
      await notificationService.createNotification("user1", "subject", "body", "entity1");
      expect(dbMock.select).toHaveBeenCalled();
      // verify(dbMock.insert(anything())).once();
    });
  });

  describe("markNotificationsAsRead", () => {
    it("should mark notifications as read", async () => {
      await notificationService.markNotificationsAsRead("user1", ["1"]);
      expect(dbMock.update).toHaveBeenCalled();
    });
  });

  describe("markNotificationsAsDeleted", () => {
    it("should mark notifications as deleted", async () => {
      await notificationService.markNotificationsAsDeleted("user1", ["1"]);
      expect(dbMock.update).toHaveBeenCalled();
    });
  });

  describe("getUnreadOffersForCourse", () => {
    it("Should get unread offers for course", async () => {
      await notificationService.getUnreadOffersForCourse("course1", "user1");
      expect(dbMock.select).toHaveBeenCalled();
    });
  });
});
