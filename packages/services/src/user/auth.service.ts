import { randomUUID } from "crypto";
import { eq, or } from "@golf-district/database";
import type { Db } from "@golf-district/database";
import { assets } from "@golf-district/database/schema/assets";
import { users } from "@golf-district/database/schema/users";
import { userSession } from "@golf-district/database/schema/userSession";
import { assetToURL, currentUtcTimestamp } from "@golf-district/shared";
import Logger from "@golf-district/shared/src/logger";
import bcrypt from "bcryptjs";
import { CacheService } from "../infura/cache.service";
import type { IpInfoService } from "../ipinfo/ipinfo.service";
import type { NotificationService } from "../notification/notification.service";

export class AuthService extends CacheService {
  /**
   * Constructs an instance of the `AuthService`.
   *
   * @param database - A database instance or connector used for user data retrieval and update operations.
   */
  constructor(
    private readonly database: Db,
    private readonly notificationService: NotificationService,
    private readonly ipInfoService: IpInfoService,
    redisUrl: string,
    redisToken: string
  ) {
    super(redisUrl, redisToken, Logger(AuthService.name));
  }

  /**
   * Asynchronously authenticates a user with the provided handle/email and password.
   *
   * This method checks whether a user exists with the provided handle or email,
   * ensures the email is verified, validates the password, and updates the last successful login timestamp
   * in the database upon successful authentication. It behaves differently in production and non-production environments:
   * - In production, it will log warnings and return null for various failure cases.
   * - In non-production environments, it will throw errors for the same failure cases.
   *
   * @param handleOrEmail - A string representing either the user handle or email used for attempting authentication.
   * @param password - A string representing the password provided by the user attempting to authenticate.
   *
   * @returns {Promise<SelectUser | null>}
   *   A promise that resolves to the authenticated user's data or null if authentication fails.
   *   - Returns the user data if authentication is successful.
   *   - Returns null if any of the following occurs (in production):
   *     - No user is found.
   *     - User email is not verified.
   *     - User has no password.
   *     - Password is invalid.
   *   - In non-production environments, instead of returning null, it throws corresponding errors for the above cases.
   *
   * @throws (only in non-production environments)
   *   - `Error("User not found")`: If no user is found with the provided `handleOrEmail`.
   *   - `Error("User email not verified")`: If the user found has not verified their email address.
   *   - `Error("User has no password")`: If the user found does not have a password set in the database (might indicate a social login user).
   *   - `Error("Invalid password")`: If the provided `password` does not match the stored password for the user.
   *
   * @example
   *   authenticateUser('johnDoe123', 'SecureP@ssw0rd!');
   */

  isUserBlocked = async (email: string) => {
    const [data] = await this.database
      .select({
        bannedUntilDateTime: users.bannedUntilDateTime,
      })
      .from(users)
      .where(eq(users.email, email))
      .execute();
    const now = new Date();
    const date = new Date(data?.bannedUntilDateTime ?? "");
    if (now < date) {
      return true;
    }
    return false;
  };

  updateLastSuccessfulLogin = async (userId: string, handleOrEmail: string) => {
    await this.database
      .update(users)
      .set({
        lastSuccessfulLogin: currentUtcTimestamp(),
      })
      .where(eq(users.id, userId))
      .execute()
      .then(() => {
        this.logger.info(`Updated lastSuccessfulLogin for user: ${handleOrEmail}`);
      });
  };

  addUserSession = async (
    userId: string,
    status: string,
    courseId: string,
    loginMethod: string,
    ip?: string,
    userAgent?: string
  ) => {
    console.log("loginMethod", loginMethod);

    try {
      const ipInfo = await this.ipInfoService.getIpInfo(ip);
      await this.database
        .insert(userSession)
        .values({
          id: randomUUID(),
          userId: userId,
          ip: ip,
          userAgent: userAgent,
          status: status,
          courseId: courseId,
          loginMethod: loginMethod,
          ipinfoJSON: ipInfo,
        })
        .execute();
    } catch (error) {
      console.log("error", error);
    }
  };

  authenticateUser = async (handleOrEmail: string, password: string) => {
    // console.log("Node Env");
    // console.log(process.env.NODE_ENV);
    const [data] = await this.database
      .select({
        user: users,
        asset: {
          assetId: assets.id,
          assetKey: assets.key,
          assetExtension: assets.extension,
        },
      })
      .from(users)
      .where(or(eq(users.handle, handleOrEmail), eq(users.email, handleOrEmail)))
      .leftJoin(assets, eq(users.image, assets.id))
      .execute();
    // console.log("After retrieving data");
    // console.log(data);
    if (!data) {
      this.logger.warn(`User not found: ${handleOrEmail}`);
      if (process.env.NODE_ENV !== "production") {
        return {
          id: "",
          email: "",
          image: "",
          name: "",
          phoneNumber: "",
          profilePicture: "",
          error: true,
          message: "User not found",
        };
      }
      return {
        id: "",
        email: "",
        image: "",
        name: "",
        phoneNumber: "",
        profilePicture: "",
        error: true,
        message: "User not found",
      };
    }

    if (!data.user.emailVerified) {
      this.logger.warn(`User email not verified: ${handleOrEmail}`);
      if (process.env.NODE_ENV !== "production") {
        return {
          id: "",
          email: data.user.email,
          image: "",
          name: "",
          phoneNumber: "",
          profilePicture: "",
          error: true,
          message: "User email not verified",
        };
      }
      return {
        id: "",
        email: data.user.email,
        image: "",
        name: "",
        phoneNumber: "",
        profilePicture: "",
        error: true,
        message: "User email not verified",
      };
    }
    // console.log("EMail verified");
    if (!data.user.gdPassword) {
      this.logger.warn(`User has no password: ${handleOrEmail}`);
      if (process.env.NODE_ENV !== "production") {
        return {
          id: "",
          email: data.user.email,
          image: "",
          name: "",
          phoneNumber: "",
          profilePicture: "",
          error: true,
          message: "User has no password",
        };
      }
      return {
        id: "",
        email: data.user.email,
        image: "",
        name: "",
        phoneNumber: "",
        profilePicture: "",
        error: true,
        message: "User has no password",
      };
    }
    // console.log("GD password found");

    const valid = await bcrypt.compare(password, data.user.gdPassword);
    // console.log("Bcrypt compare");
    if (!valid) {
      this.logger.warn(`Invalid password of email: ${handleOrEmail}`);
      if (process.env.NODE_ENV !== "production") {
        return {
          id: "",
          email: data.user.email,
          image: "",
          name: "",
          phoneNumber: "",
          profilePicture: "",
          error: true,
          message: "The email or password you entered is incorrect.",
        };
      }

      const signInAttempts = await this.incrementOrSetKey(`signinAttempts:${data.user.id}`);
      if (signInAttempts >= 3) {
        this.logger.warn(`Suspicious activity detected`);
        await this.notificationService.sendEmail(
          data.user.email ?? "",
          "Suspicious activity detected",
          `We have detected suspicious activity on your account. If you are not the one attempting to login, please contact support immediately.`
        );
      }
      return {
        id: "",
        email: data.user.email,
        image: "",
        name: "",
        phoneNumber: "",
        profilePicture: "",
        error: true,
        message: "The email or password you entered is incorrect.",
      };
    }
    this.logger.warn(`Password Verified`);

    await this.invalidateCache(`signinAttempts:${data.user.id}`);
    let profilePicture = "";
    if (!data.asset) {
      profilePicture = "/defaults/default-banner.webp";
    } else {
      profilePicture = assetToURL({
        key: data.asset.assetKey,
        extension: data.asset.assetExtension,
      });
    }
    return {
      ...data.user,
      profilePicture,
    };
  };

  //incomplete
  // verify2FA = async (
  //   userId: string,
  //   verificationToken: string
  // ): Promise<boolean> => {
  //   const user = await this.database
  //     .select()
  //     .from(users)
  //     .where(eq(users.id, userId));
  //   if (!user[0]) {
  //     this.logger.warn(`User not found: ${userId}`);
  //     if (process.env.NODE_ENV !== "production") {
  //       throw new Error("User not found");
  //     }
  //     return false;
  //   }
  //   if (!user[0].emailVerified) {
  //     this.logger.warn(`User email not verified: ${userId}`);
  //     if (process.env.NODE_ENV !== "production") {
  //       throw new Error("User email not verified");
  //     }
  //     return false;
  //   }
  //   if (!user[0].gdPassword) {
  //     this.logger.warn(`User has no password: ${userId}`);
  //     if (process.env.NODE_ENV !== "production") {
  //       throw new Error("User has no password");
  //     }
  //     return false;
  //   }
  //   return true;
  // };
}
