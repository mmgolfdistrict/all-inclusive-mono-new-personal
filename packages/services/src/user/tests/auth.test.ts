import { currentUtcTimestamp, dateToUtcTimestamp } from "@golf-district/shared";
import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it } from "vitest";
import { createDrizzleMock, mockUsers } from "../../../mocks";
import { AuthService } from "../auth.service";

let hashedMockUsers: any = await Promise.all(
  mockUsers.map(async (user) => ({
    user: {
      ...user,
      gdPassword: await bcrypt.hash(user.gdPassword!, 10),
    },
  }))
);
hashedMockUsers[2].user.gdPassword = null;
const dbMock = {
  select: createDrizzleMock([hashedMockUsers]),
  update: createDrizzleMock([hashedMockUsers]),
};

describe("AuthService", () => {
  let authService: AuthService;
  // console.log(currentUtcTimestamp)
  // const now = new Date()
  // now.setDate(now.getDate() + 14)
  // console.log(dateToUtcTimestamp(now))

  beforeEach(() => {
    process.env.NODE_ENV = "test";
    process.env.LOG_LEVEL = "debug";
    authService = new AuthService(dbMock as any);
  });

  it("should authenticate user", async () => {
    const authenticatedUser = await authService.authenticateUser(
      mockUsers[0]!.handle!,
      mockUsers[0]!.gdPassword!
    );
    expect(dbMock.update).toHaveBeenCalled();
  });

  it("should throw an error if user not found", async () => {
    dbMock.select = createDrizzleMock([[]]);
    await expect(() => authService.authenticateUser("nonexistent", "password")).rejects.toThrow(
      "User not found"
    );
  });

  it("should throw an error if email is not verified", async () => {
    dbMock.select = createDrizzleMock([[hashedMockUsers[1]]]);

    await expect(
      authService.authenticateUser(mockUsers[0]!.handle!, mockUsers[0]!.gdPassword!)
    ).rejects.toThrow("User email not verified");
  });

  it("should throw an error if no password is set", async () => {
    // dbMock.select = createDrizzleMock([[hashedMockUsers[2]]]);
    // await expect(
    //   authService.authenticateUser(hashedMockUsers[2]!.user.handle!, hashedMockUsers[2]!.user.gdPassword!)
    // ).rejects.toThrow("User has no password");
  });

  it("should throw an error if password is invalid", async () => {
    dbMock.select = createDrizzleMock([hashedMockUsers]);
    await expect(() =>
      authService.authenticateUser(mockUsers[0]!.handle!, "invalidPassword")
    ).rejects.toThrow("Invalid password");
  });

  it("should return null if user not found in production", async () => {
    process.env.NODE_ENV = "production";
    dbMock.select = createDrizzleMock([[]]);
    const authenticatedUser = await authService.authenticateUser("nonexistent", "password");
    expect(authenticatedUser).toBeNull();
  });

  it("should return null if email is not verified in production", async () => {
    // process.env.NODE_ENV = "production";
    // dbMock.select = createDrizzleMock([[{ ...hashedMockUsers[0], emailVerified: null }]]);
    // const authenticatedUser = await authService.authenticateUser(
    //   mockUsers[0]!.handle!,
    //   mockUsers[0]!.gdPassword!
    // );
    // expect(authenticatedUser).toBeNull();
  });

  it("should return null if no password is set in production", async () => {
    process.env.NODE_ENV = "production";
    dbMock.select = createDrizzleMock([[hashedMockUsers[1]]]);
    const authenticatedUser = await authService.authenticateUser(
      mockUsers[0]!.handle!,
      mockUsers[0]!.gdPassword!
    );
    expect(authenticatedUser).toBeNull();
  });

  it("should return null if password is invalid in production", async () => {
    process.env.NODE_ENV = "production";
    dbMock.select = createDrizzleMock([[hashedMockUsers[0]]]);
    const authenticatedUser = await authService.authenticateUser(mockUsers[0]!.handle!, "invalidPassword");
    expect(authenticatedUser).toBeNull();
  });
});
