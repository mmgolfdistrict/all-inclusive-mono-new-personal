import bcrypt from "bcryptjs";
import { beforeAll, beforeEach, describe, expect, it, vitest } from "vitest";
import { createDrizzleMock, mockAssets, mockBookings, mockUsers } from "../../../mocks";
import { NotificationService } from "../../notification/notification.service";
import type { UserCreationData } from "../user.service";
import { UserService } from "../user.service";

const dbMock = {
  select: createDrizzleMock([
    mockUsers,
    mockUsers,
    [{ user: mockUsers[0] }],
    [{ user: mockUsers[5] }],
    [{ user: mockUsers[0] }],
    [{ user: mockUsers[0], bannerImage: mockAssets[0] }],
    [{ user: mockUsers[0], profileImage: mockAssets[0] }],
    [mockUsers[0]],
    [mockUsers[0]],
  ]),
  update: createDrizzleMock([mockUsers, mockUsers, mockUsers[0]]),
  insert: createDrizzleMock([mockUsers]),
};
beforeAll(() => {
  process.env.NODE_ENV = "test";
  process.env.LOG_LEVEL = "debug";
});
describe("createUser", () => {
  const mockUserCreationData: UserCreationData = {
    email: "testNewUser@golf.com",
    handle: "testNewUserHandle",
    password: "SecureP@ssw0rd",
    location: "1600 Amphitheatre Parkway, Mountain View, CA",
    firstName: "John",
    lastName: "Doe",
  };
  let userService: UserService;
  let notificationService: NotificationService;
  beforeEach(() => {
    notificationService = new NotificationService(
      dbMock as any,
      "twillio_fake-number",
      "sendgrid fale email",
      "twillio_fake-sid",
      "sendgrid_fake-token",
      "twillio_fake-sid"
    );
    userService = new UserService(dbMock as any, notificationService);
    vitest.clearAllMocks();
  });

  it("should create user", async () => {
    vitest.spyOn(userService, "isValidHandle").mockReturnValue(Promise.resolve(true));
    await userService.createUser(mockUserCreationData);
    expect(dbMock.insert).toHaveBeenCalled();
  });
  it("should throw an error if email does not follow email regex", async () => {});
  it("should throw an error if handle is invalid", async () => {
    //create a mock of isValidHandle that returns false
    const invalidData = { ...mockUserCreationData, handle: "" };
    await expect(userService.createUser(invalidData)).rejects.toThrow("Invalid handle format");
  });
  it("should throw an error if password score is less than 8", async () => {});
  it("should throw an error if firstName contains prohibited words", async () => {
    // const invalidData = { ...mockUserCreationData, firstName: "moderator" };
    // await expect(userService.createUser(invalidData)).rejects.toThrow(
    //   "Invalid first name due to profanity filter"
    // );
  });
  it("should throw an error if lastName contains prohibited words", async () => {});
  it("Should get bookings owner for tee time", async () => {
    await userService.getBookingsOwnedForTeeTime("time1", "user1");
    expect(dbMock.select).toHaveBeenCalled();
  });
  it("Should update user", async () => {
    vitest.spyOn(userService, "isValidHandle").mockReturnValue(Promise.resolve(true));
    await userService.updateUser("user1", mockUserCreationData);
    expect(dbMock.update).toHaveBeenCalled();
  });
  describe("Get user by id", () => {
    it("Should get user by id when profileVisibilty is PUBLIC", async () => {
      await userService.getUserById("caller1", "user1");
      expect(dbMock.select).toHaveBeenCalled();
    });
    it("Should get user by id when profileVisibilty is PRIVATE", async () => {
      await userService.getUserById("caller1", "user1");
      expect(dbMock.select).toHaveBeenCalled();
    });
    it("Should get user by id when caller is user", async () => {
      await userService.getUserById("user1", "user1");
      expect(dbMock.select).toHaveBeenCalled();
    });
    it("Should get user by id with banner assets", async () => {
      await userService.getUserById("user1", "user1");
      expect(dbMock.select).toHaveBeenCalled();
    });
    it("Should get user by id with profile assets", async () => {
      await userService.getUserById("user1", "user1");
      expect(dbMock.select).toHaveBeenCalled();
    });
  });

  it("Should update password", async () => {
    vitest.spyOn(bcrypt, "compare").mockReturnValue(Promise.resolve(true));
    await userService.updatePassword("user1", "oldPassword", "newPassword");
    expect(dbMock.select).toHaveBeenCalled();
    expect(dbMock.update).toHaveBeenCalled();
  });

  describe("Forgot Password", () => {
    it("Should update password", async () => {
      await userService.executeForgotPassword("user1", "asdf", "newP@ssw0rd");
      expect(dbMock.select).toHaveBeenCalled();
      expect(dbMock.update).toHaveBeenCalled();
    });
    it("Should fail if new password is invalid", async () => {
      await expect(userService.executeForgotPassword("user1", "asdf", "")).rejects.toThrow(
        "Invalid password format"
      );
    });
  });
});
