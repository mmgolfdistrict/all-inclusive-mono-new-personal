import { randomBytes, randomUUID } from "crypto";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { and, asc, desc, eq, gt, lt, or } from "@golf-district/database";
import type { Db } from "@golf-district/database";
import { accounts } from "@golf-district/database/schema/accounts";
import { assets } from "@golf-district/database/schema/assets";
import { bookings } from "@golf-district/database/schema/bookings";
import { bookingslots } from "@golf-district/database/schema/bookingslots";
import { courses } from "@golf-district/database/schema/courses";
import { entities } from "@golf-district/database/schema/entities";
import { favorites } from "@golf-district/database/schema/favorites";
import { lists } from "@golf-district/database/schema/lists";
import { teeTimes } from "@golf-district/database/schema/teeTimes";
import type { InsertUser } from "@golf-district/database/schema/users";
import { users } from "@golf-district/database/schema/users";
import type { GroupedBookings } from "@golf-district/shared";
import { assetToURL, currentUtcTimestamp, isValidEmail, isValidPassword } from "@golf-district/shared";
import Logger from "@golf-district/shared/src/logger";
import bcrypt from "bcryptjs";
import { alias } from "drizzle-orm/mysql-core";
import { verifyCaptcha } from "../../../api/src/googleCaptcha";
import { generateUtcTimestamp } from "../../helpers";
import type { NotificationService } from "../notification/notification.service";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface UserCreationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  handle: string;
  phoneNumber: string;
  // location?: string;
  address1?: string;
  address2?: string;
  state?: string;
  city?: string;
  zipcode?: string;
  country?: string;
  redirectHref?: string;
  ReCAPTCHA: string | undefined;
}

interface UserUpdateData {
  handle?: string | null;
  name?: string | null;
  profileVisibility?: "PUBLIC" | "PRIVATE";
  profilePictureAssetId?: string | null;
  bannerImageAssetId?: string | null;
  address1?: string | null;
  address2?: string | null;
  state?: string | null;
  zipcode?: string | null;
  city?: string | null;
  country?: string | null;
  phoneNumber?: string | null;
  phoneNotifications?: boolean | null;
  emailNotifications?: boolean | null;
  courseId?: string;
}
type TeeTimeEntry = {
  teeTimeId: string;
  date: string | null;
  courseName: string | null;
  courseId: string;
  courseImage: string;
};

// Define the type for the map
type UniqueTeeTimesMap = Map<string, TeeTimeEntry>;
/**
 * Service class for user-related operations.
 */
export class UserService {
  //private readonly filter: Filter;
  private readonly logger = Logger(UserService.name);

  /**
   * Constructor for the `UserService` class.
   *
   * @param {Db} database - The database instance.
   * @param {NotificationService} notificationsService - The notification service instance.
   * @example
   * const userService = new UserService(database, notificationService);
   */
  constructor(
    protected readonly database: Db,
    private readonly notificationsService: NotificationService
  ) {
    //this.filter = new Filter();
  }

  //@TODO invite users takes in an array or user ids or emails
  //@TODO my tee time history teetime purchased in the past

  /**
   * Asynchronously registers a new user without utilizing OAuth.
   * This method is for non-OAuth users and the usage is discouraged due to potential security implications.
   *
   * @param data - An object containing user creation data:
   *   - `email`: The email address of the user, which must be in a valid email format.
   *   - `password`: The password for the user, which must pass certain format validations.
   *   - `firstName`: The first name of the user.
   *   - `lastName`: The last name of the user.
   *   - `location`: The location of the user.
   *   - `handle`: The unique username/handle for the user.
   *   - `redirectHref`: The url to redirect to.
   *
   * @returns Promise<void> - A promise that resolves when the user is successfully created and inserted into the database.
   *
   * @throws
   *   - `Error("Invalid email format")`: If the provided email does not adhere to valid email formats.
   *   - `Error("Invalid password format due to profanity filter")`: If the provided password fails format validation, which may involve a profanity filter.
   *   - `Error("Invalid username due to profanity filter")`: If the provided username/handle fails due to containing prohibited words.
   *   - `Error("Invalid first name due to profanity filter")`: If the provided first name fails due to containing prohibited words.
   *   - `Error("Invalid last name due to profanity filter")`: If the provided last name fails due to containing prohibited words.
   *   - `Error("Email already exists")`: If an existing user already has the provided email.
   *   - `Error("Username already exists")`: If an existing user already has the provided handle.
   *
   * @example
   *   createUser({
   *     email: 'user@example.com',
   *     password: 'SecureP@ssw0rd!',
   *     firstName: 'John',
   *     lastName: 'Doe',
   *     location: 'City, Country',
   *     handel: 'johnDoe123'
   *   });
   */
  createUser = async (courseId: string | undefined, data: UserCreationData) => {
    this.logger.info(`createUser called`);
    if (!isValidEmail(data.email)) {
      this.logger.warn(`Invalid email format: ${data.email}`);
      throw new Error("Invalid email format");
    }
    if (!(await this.isValidHandle(data.handle))) {
      this.logger.warn(`Handle already exists: ${data.handle}`);
      return {
        error: true,
        message: "Handle already exists.",
      };
    }
    if (isValidPassword(data.password).score < 8) {
      this.logger.warn("Invalid password");
      return {
        error: true,
        message:
          "Password must include uppercase, lowercase letters, numbers, and special characters (!@#$%^&*).",
      };
    }

    let isNotRobot;
    if (data.ReCAPTCHA) {
      isNotRobot = await verifyCaptcha(data.ReCAPTCHA);
    }
    //if the captcha is not valid, return null
    if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !isNotRobot) {
      this.logger.error(`Invalid captcha`);
      throw new Error("Invalid captcha");
    }
    // if (containsBadWords(data.firstName, this.filter)) {
    //   this.logger.warn(`Invalid first name: ${data.firstName}`);
    //   throw new Error("Invalid first name due to profanity filter");
    // }
    // if (containsBadWords(data.lastName, this.filter)) {
    //   this.logger.warn(`Invalid last name: ${data.lastName}`);
    //   throw new Error("Invalid last name due to profanity filter");
    // }
    const [existingUserWithEmail] = await this.database
      .select()
      .from(users)
      .where(eq(users.email, data.email));
    if (existingUserWithEmail) {
      if (existingUserWithEmail.email == data.email) {
        this.logger.warn(`Email already exists: ${data.email}`);
        return {
          error: true,
          message: "Email already exists",
        };
      }
    }
    const verificationToken = randomBytes(32).toString("hex");
    const hashedVerificationToken = await bcrypt.hash(verificationToken, 10);
    await this.insertUser(data, hashedVerificationToken);
    const user = await this.getUserByEmail(data.email);
    if (!user?.id) {
      this.logger.warn(`User not found: ${data.email}`);
      throw new Error("User not found");
    }
    if (!data.redirectHref) {
      this.logger.warn(`No redirectHref provided`);
      throw new Error("No redirect url provided");
    }
    // user.email,
    // "Reset your password",
    // process.env.SENDGRID_FORGOT_PASSWORD_AUTH_USER_TEMPLATE_ID!,
    // emailParams

    let CourseLogoURL: string | undefined;
    let CourseURL: string | undefined;
    let CourseName: string | undefined;

    if (courseId) {
      const [course] = await this.database
        .select({
          key: assets.key,
          extension: assets.extension,
          websiteURL: courses.websiteURL,
          name: courses.name,
        })
        .from(courses)
        .where(eq(courses.id, courseId))
        .leftJoin(assets, eq(assets.id, courses.logoId))
        .execute()
        .catch((err) => {
          this.logger.error(err);
          return [];
        });

      if (course?.key) {
        CourseLogoURL = `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${course?.key}.${course?.extension}`;
        CourseURL = course?.websiteURL || "";
        CourseName = course.name;
      }
    }

    await this.notificationsService.sendEmailByTemplate(
      data.email,
      "Verify your email",
      process.env.SENDGRID_TEE_TIMES_VERIFY_EMAIL_TEMPLATE_ID!,
      {
        CustomerFirstName: data.handle,
        VerifyURL: `${encodeURI(data?.redirectHref)}/verify?userId=${encodeURIComponent(
          user?.id
        )}&verificationToken=${encodeURIComponent(verificationToken)}`,
        CourseLogoURL,
        CourseURL,
        CourseName,
        HeaderLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/emailheaderlogo.png`,
      },
      []
    );
  };

  getUserByEmail = async (email: string) => {
    const [user] = await this.database.select().from(users).where(eq(users.email, email));
    if (!user) {
      this.logger.warn(`User not found: ${email}`);
      throw new Error("User not found");
    }
    return user;
  };

  inviteUser = async (userId: string, emailOrPhoneNumber: string) => {
    const [user] = await this.database
      .select({
        handle: users.handle,
      })
      .from(users)
      .where(eq(users.id, userId));
    if (!user) {
      this.logger.warn(`User not found: ${userId}`);
      throw new Error("User not found");
    }
    //determine if email or phone number

    const phoneRegex = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/;
    if (isValidEmail(emailOrPhoneNumber)) {
      await this.notificationsService.sendEmail(
        emailOrPhoneNumber,
        "You've been invited to Golf District",
        `${user.handle} has invited to Golf District. link`
      );
      return;
    }
    if (phoneRegex.test(emailOrPhoneNumber)) {
      const userName = user.handle;
      await this.notificationsService.sendSMS(
        emailOrPhoneNumber,
        `${userName} has invited to Golf District link`
      );
      return;
    } else {
      throw new Error("Invalid email or phone number");
    }
  };

  /**
   * Retrieves bookings owned by a user for a specific tee time.
   *
   * @param {string} teeTimeId - The unique identifier of the tee time.
   * @param {string} [userId] - The unique identifier of the user. If not provided, the result will indicate that the connected user is not the owner and return an empty array of bookings.
   * @returns {Promise<{ connectedUserIsOwner: boolean; bookings:any }>} A promise that resolves to an object containing information about the ownership and bookings.
   * @throws {Error} Throws an error if there is an issue retrieving bookings from the database.
   * @example
   * const teeTimeId = "exampleTeeTimeId";
   * const userId = "exampleUserId";
   * const result = await getBookingsOwnedForTeeTime(teeTimeId, userId);
   * // result: { connectedUserIsOwner: true, bookings: ["bookingId1", "bookingId2"] }
   */
  getBookingsOwnedForTeeTime = async (teeTimeId: string, userId?: string) => {
    if (!userId) {
      return {
        connectedUserIsOwner: false,
        bookings: [],
      };
    }
    const data = await this.database
      .select({
        bookingId: bookings.id,
        nameOnBooking: bookingslots.name,
        slotId: bookingslots.slotnumber,
        customerId: bookingslots.customerId,
        slotPosition: bookingslots.slotPosition,
      })
      .from(bookings)
      .leftJoin(bookingslots, eq(bookingslots.bookingId, bookings.id))
      .where(and(eq(bookings.teeTimeId, teeTimeId), eq(bookings.ownerId, userId)))
      .orderBy(asc(bookingslots.slotPosition))
      .execute()
      .catch((err) => {
        this.logger.error(`Error retrieving bookings: ${err}`);
        throw new Error("Error retrieving bookings");
      });
    if (!data || data.length == 0) {
      return {
        connectedUserIsOwner: false,
        bookings: [],
      };
    }

    const finalData: {
      id: string;
      handle: string;
      name: string;
      email: string;
      slotId: string;
      bookingId: string;
      currentlyEditing: boolean;
    }[] = [];

    for (const unit of data) {
      if (unit.customerId !== "") {
        const userData = await this.database
          .select({
            id: users.id,
            handle: users.handle,
            name: users.name,
            email: users.email,
          })
          .from(users)
          .where(eq(users.id, unit.customerId || ""))
          .execute()
          .catch((err) => {
            this.logger.error(`Error retrieving user: ${err}`);
            throw new Error("Error retrieving user");
          });
        if (userData && userData[0]) {
          finalData.push({
            ...userData[0],
            name: unit.nameOnBooking?.length ? unit.nameOnBooking : "Guest",
            email: userData[0]?.email?.length ? userData[0]?.email : "",
            handle: userData[0]?.handle?.length ? userData[0]?.handle : "",
            slotId: unit.slotId!,
            currentlyEditing: false,
            bookingId: unit.bookingId,
          });
        }
      } else {
        finalData.push({
          id: "",
          name: unit.nameOnBooking?.length ? unit.nameOnBooking : "Guest",
          email: "",
          handle: "",
          currentlyEditing: false,
          slotId: unit.slotId!,
          bookingId: unit.bookingId,
        });
      }
    }

    const bookingIds = data.map((i) => i.bookingId);

    return {
      connectedUserIsOwner: true,
      bookings: finalData,
      bookingIds,
    };
  };

  /**
   * Asynchronously verifies a user's email address.
   *
   * This method performs several checks to validate the user and the provided verification token.
   * Upon successful verification, the user's email is marked as verified in the database,
   * and relevant verification fields are updated or cleared.
   *
   * @param userId - A string representing the unique identifier of the user attempting to verify their email.
   * @param token - A string representing the verification token provided by the user.
   *
   * @returns {Promise<void>} A promise that resolves when the email verification is successfully processed.
   *
   * @throws
   *   - `Error("User not found")`: If no user is found with the provided `userId`.
   *   - `Error("User email already verified")`: If the user’s email is already verified (indicated by the absence of a `verificationRequestToken`).
   *   - `Error("Verification token expired")`: If the provided verification token has expired, determined by comparing `verificationRequestExpiry` with the current UTC timestamp.
   *   - `Error("Invalid verification token")`: If the provided `token` does not match the stored `verificationRequestToken` for the user.
   *   - `Error("Unexpected response structure from Amazon Location Service")`: If an unexpected structure is returned from the database during verification (a safeguard).
   *
   * @example
   *   verifyUserEmail('user123id', 'secureverificationtoken');
   */
  verifyUserEmail = async (
    courseId: string | undefined,
    userId: string,
    token: string,
    redirectHref: string
  ) => {
    this.logger.info(`verifyUserEmail called with userId: ${userId} and token: ${token}`);
    const [user] = await this.database.select().from(users).where(eq(users.id, userId));
    if (!user) {
      this.logger.warn(`User not found: ${userId}`);
      throw new Error("User not found");
    }
    if (!user.verificationRequestToken) {
      this.logger.warn(`User email already verified: ${userId}`);
      return {
        error: true,
        message: "User email already verified",
      };
    }
    if (user.verificationRequestExpiry && user.verificationRequestExpiry < currentUtcTimestamp()) {
      await this.deleteUserById(userId);
      this.logger.warn(`Verification token expired: ${userId}`);
      throw new Error("Verification token expired, must create account again");
    }
    const valid = await bcrypt.compare(token, user.verificationRequestToken);

    if (!valid) {
      this.logger.warn(`Invalid verification token: ${userId}`);
      throw new Error("Invalid verification token");
    }

    await this.database
      .update(users)
      .set({
        emailVerified: currentUtcTimestamp(),
        verificationRequestToken: null,
        verificationRequestExpiry: null,
      })
      .where(eq(users.id, userId))
      .execute();

    let CourseLogoURL: string | undefined;
    let CourseURL: string | undefined;
    let CourseName: string | undefined;

    if (courseId) {
      const [course] = await this.database
        .select({
          key: assets.key,
          extension: assets.extension,
          websiteURL: courses.websiteURL,
          name: courses.name,
        })
        .from(courses)
        .where(eq(courses.id, courseId))
        .leftJoin(assets, eq(assets.id, courses.logoId));

      if (course?.key) {
        CourseLogoURL = `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${course?.key}.${course?.extension}`;
        CourseURL = course?.websiteURL || "";
        CourseName = course.name;
      }
    }

    if (user?.email) {
      //send welcome email
      try {
        await this.notificationsService.sendEmailByTemplate(
          user?.email,
          "Welcome to Golf District",
          process.env.SENDGRID_TEE_TIMES_NEW_USER_TEMPLATE_ID!,
          {
            CustomerFirstName: user.handle ?? "",
            CourseLogoURL,
            CourseURL,
            CourseName,
            HeaderLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/emailheaderlogo.png`,
            BuyTeeTimeURL: encodeURI(redirectHref),
          },
          []
        );
      } catch (error) {
        throw new Error("Error sending welcome email");
      }
    }
  };

  deleteUserById = async (userId: string) => {
    try {
      await this.database.delete(users).where(eq(users.id, userId)).execute();
    } catch (error) {
      this.logger.error(`Error deleting user: ${userId} - ${(error as Error)?.message}`);
      throw new Error("Error deleting user from expired email verification token");
    }
  };

  /**
   * Asynchronously updates a user's information in the database.
   *
   * This method performs validations and checks on the provided data such as handle format,
   * name validation against a profanity filter, and asset ID verification.
   * Upon successful validation, the user's information is updated in the database.
   *
   * @param {UserUpdateData} data - Object containing the user's information to be updated.
   *
   * @returns {Promise<void>} Promise that resolves when the user's information is successfully updated.
   *
   * @throws
   *   - `Error("Handle already exists")`: If the provided `handle` does not pass the format validation.
   *   - `Error("Invalid name due to profanity filter")`: If the provided `name` does not pass the profanity filter check.
   *   - `Error("Error recovering asset: [assetId]")`: If there is an error retrieving the asset identified by `[assetId]` from the database.
   *   - `Error("Asset not found: [assetId]")`: If the asset identified by `[assetId]` is not found in the database.
   *   - `Error("Error updating user")`: If there is a database error during the user update operation.
   *
   * @example
   *   updateUser({
   *     userId: 'user123id',
   *     handle: 'newHandle',
   *     name: 'New Name',
   *     profileVisibility: 'public',
   *     profilePictureAssetId: 'asset123id',
   *     bannerImageAssetId: 'asset456id',
   *     location: '1600 Amphitheatre Parkway, Mountain View, CA',
   *     phoneNotifications: true,
   *     emailNotifications: false
   *   });
   */
  updateUser = async (userId: string, data: UserUpdateData) => {
    this.logger.info(`updateUser called for user: ${userId}`);

    if (data.handle) {
      const isValid = await this.isValidHandle(data.handle);
      if (!isValid) {
        this.logger.warn(`Handle already exists: ${data.handle}`);
        return {
          error: true,
          message: "Handle already exists.",
        };
      }
    }
    // if (data.name) {
    //   if (containsBadWords(data.name, this.filter)) {
    //     this.logger.warn(`Invalid name: ${data.name}`);
    //     throw new Error("Invalid name due to profanity filter");
    //   }
    // }
    if (data.bannerImageAssetId) {
      const [bannerAsset] = await this.database
        .select()
        .from(assets)
        .where(and(eq(assets.id, data.bannerImageAssetId), eq(assets.createdById, userId)))
        .catch((err) => {
          this.logger.error(`Error recovering asset: ${data.bannerImageAssetId}, Error: ${err}`);
          throw new Error(`Error recovering asset: ${data.bannerImageAssetId}`);
        });
      if (!bannerAsset) {
        this.logger.warn(`Asset not found: ${data.bannerImageAssetId}`);
        throw new Error(`Asset not found: ${data.bannerImageAssetId}`);
      }
    }
    if (data.profilePictureAssetId) {
      const [profileAsset] = await this.database
        .select()
        .from(assets)
        .where(and(eq(assets.id, data.profilePictureAssetId), eq(assets.createdById, userId)))
        .execute()
        .catch((err) => {
          this.logger.error(`Error recovering asset: ${data.profilePictureAssetId}, Error: ${err}`);
          throw new Error(`Error recovering asset: ${data.profilePictureAssetId}`);
        });
      if (!profileAsset) {
        this.logger.warn(`Asset not found: ${data.profilePictureAssetId}`);
        throw new Error(`Asset not found: ${data.profilePictureAssetId}`);
      }
    }
    // if (data.location) {
    //   //TODO: validate location with geocode service
    // }

    const updateData: Partial<InsertUser> = {
      updatedAt: currentUtcTimestamp(),
    };
    if (Object.prototype.hasOwnProperty.call(data, "handle")) {
      updateData.handle = data.handle;
      // await this.notificationsService.createNotification(
      //   userId,
      //   "Handle updated",
      //   `Your handle has been updated to ${data.handle}`
      // );
      const [user] = await this.database
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .execute()
        .catch((err) => {
          this.logger.error(`Failed to retrieve user: ${err}`);
          throw new Error("Failed to retrieve user");
        });

      if (!user) {
        this.logger.error(`createNotification: User with ID ${userId} not found.`);
        return;
      }

      const [course] = await this.database
        .select({
          key: assets.key,
          extension: assets.extension,
          websiteURL: courses.websiteURL,
          name: courses.name,
        })
        .from(courses)
        .where(eq(courses.id, data.courseId ?? ""))
        .leftJoin(assets, eq(assets.id, courses.logoId))
        .execute()
        .catch((err) => {
          this.logger.error(err);
          return [];
        });

      if (user && user.name && user.email) {
        await this.notificationsService
          .sendEmailByTemplate(
            user.email,
            "Handle Updated",
            process.env.SENDGRID_HANDLE_CHANGED_TEMPLATE_ID!,
            {
              CourseLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${course?.key}.${course?.extension}`,
              CourseURL: course?.websiteURL || "",
              CourseName: course?.name || "",
              HeaderLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/emailheaderlogo.png`,
              CustomerFirstName: user.name,
            },
            []
          )
          .catch((err) => {
            this.logger.error(`Error sending email: ${err}`);
            throw new Error("Error sending email");
          });
      }
    }
    if (Object.prototype.hasOwnProperty.call(data, "name")) updateData.name = data.name;
    if (Object.prototype.hasOwnProperty.call(data, "profileVisibility"))
      updateData.profileVisibility = data.profileVisibility;
    if (Object.prototype.hasOwnProperty.call(data, "profilePictureAssetId"))
      updateData.image = data.profilePictureAssetId;
    if (Object.prototype.hasOwnProperty.call(data, "bannerImageAssetId"))
      updateData.bannerImage = data.bannerImageAssetId;
    // if (Object.prototype.hasOwnProperty.call(data, "location")) updateData.location = data.location;
    if (Object.prototype.hasOwnProperty.call(data, "address1")) updateData.address1 = data.address1;
    if (Object.prototype.hasOwnProperty.call(data, "address2")) updateData.address2 = data.address2;
    if (Object.prototype.hasOwnProperty.call(data, "state")) updateData.state = data.state;
    if (Object.prototype.hasOwnProperty.call(data, "city")) updateData.city = data.city;
    if (Object.prototype.hasOwnProperty.call(data, "zipcode")) updateData.zipcode = data.zipcode;
    if (Object.prototype.hasOwnProperty.call(data, "country")) updateData.country = data.country;
    if (Object.prototype.hasOwnProperty.call(data, "phoneNotifications"))
      updateData.phoneNotifications = data.phoneNotifications ? true : false;
    if (Object.prototype.hasOwnProperty.call(data, "emailNotifications"))
      updateData.emailNotifications = data.emailNotifications ? true : false;
    if (Object.prototype.hasOwnProperty.call(data, "phoneNumber")) {
      updateData.phoneNumber = data.phoneNumber;
      updateData.phoneNumberVerified = null;
    }

    await this.database
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .execute()
      .catch((err) => {
        this.logger.error(`Error updating user: ${userId} - ${err}`);
        throw new Error("Error updating user");
      });
  };

  /**
   * Asynchronously requests an email update for a user and sends a verification email.
   *
   * This method validates the provided email, retrieves the user from the database, generates a verification token,
   * updates the user's record with the new email and verification token, and sends a verification email to the new address.
   *
   * @param {string} userId - A string representing the unique identifier of the user requesting the email update.
   * @param {string} email - A string representing the new email address to be updated for the user.
   *
   * @returns {Promise<void>} A promise that resolves when the verification email has been sent.
   *
   * @throws
   *   - `Error("Invalid email format")`: If the provided `email` does not pass the format validation.
   *   - `Error("User not found")`: If no user is found with the provided `userId`.
   *
   * @example
   *   requestEmailUpdate('user123id', 'newemail@example.com');
   *
   * @see {@link isValidEmail} for the email validation logic.
   * @see {@link generateUtcTimestamp} for generating the verification token expiration timestamp.
   */
  requestEmailUpdate = async (userId: string, email: string): Promise<void> => {
    this.logger.info(`requestEmailUpdate called with userId: ${userId}`);
    if (!isValidEmail(email)) {
      this.logger.warn(`Invalid email format: ${email}`);
      throw new Error("Invalid email format");
    }
    const [user] = await this.database.select().from(users).where(eq(users.id, userId));
    if (!user) {
      this.logger.warn(`User not found: ${userId}`);
      throw new Error("User not found");
    }
    this.logger.debug(`uploading emailVerificationToken for user: ${userId}`);
    const verificationToken = randomBytes(32).toString("hex");
    const hashedVerificationToken = await bcrypt.hash(verificationToken, 10);
    await this.database
      .update(users)
      .set({
        verificationRequestToken: hashedVerificationToken,
        verificationRequestExpiry: generateUtcTimestamp(90),
        updatedEmail: email,
      })
      .where(eq(users.id, userId))
      .execute();
    this.logger.debug(`emailVerificationToken uploaded for user: ${userId}`);
    await this.notificationsService
      .sendEmail(email, "Verify your email", `${verificationToken}`)
      .catch((err) => {
        this.logger.error(`Error sending email: ${err}`);
        throw new Error("Error sending email");
      });
  };

  /**
   * Asynchronously executes an email update for a user upon verification.
   *
   * This method retrieves the user from the database using the provided `userId`, validates the provided verification token,
   * and, if valid, updates the user's email address in the database. The method ensures that the token is not expired and matches
   * the stored token for security. After updating the email, related verification fields in the database are cleared.
   *
   * @param {string} userId - A string representing the unique identifier of the user attempting to update their email.
   * @param {string} token - A string representing the verification token provided by the user.
   *
   * @returns {Promise<void>} A promise that resolves when the email address has been updated in the database.
   *
   * @throws
   *   - `Error("User not found")`: If no user is found with the provided `userId`.
   *   - `Error("Verification token expired")`: If the stored `verificationRequestExpiry` is in the past at the time of the function call.
   *   - `Error("Invalid verification token")`: If the provided `token` does not match the stored `verificationRequestToken` for the user.
   *
   * @example
   *   executeEmailUpdate('user123id', 'secureverificationtoken');
   */
  executeEmailUpdate = async (userId: string, token: string): Promise<void> => {
    this.logger.info(`executeEmailUpdate called with userId: ${userId} and token: ${token}`);
    const [user] = await this.database.select().from(users).where(eq(users.id, userId));
    if (!user) {
      this.logger.warn(`User not found: ${userId}`);
      throw new Error("User not found");
    }
    if (user.verificationRequestExpiry && user.verificationRequestExpiry < currentUtcTimestamp()) {
      this.logger.warn(`Verification token expired: ${userId}`);
      throw new Error("Verification token expired");
    }
    const valid = await bcrypt.compare(token, user.verificationRequestToken!).catch((err) => {
      this.logger.error(`Error comparing token: ${err}`);
      throw new Error("Error comparing token");
    });
    if (!valid) {
      this.logger.warn(`Invalid verification token: ${userId}`);
      throw new Error("Invalid verification token");
    }
    await this.database
      .update(users)
      .set({
        email: user.updatedEmail,
        updatedEmail: null,
        verificationRequestToken: null,
        verificationRequestExpiry: null,
        updatedAt: currentUtcTimestamp(),
      })
      .where(eq(users.id, userId))
      .execute();
    this.logger.debug(`email updated for user: ${userId}`);
  };

  /**
   * Asynchronously initiates a password reset process for a user.
   *
   * This method retrieves the user from the database using the provided `handleOrEmail`, generates a secure token,
   * and sends an email to the user with a link to reset their password. The token is hashed and stored in the database
   * with an expiry time, ensuring that password reset links are time-limited for security.
   *
   * @param {string} handleOrEmail - A string representing the user's handle or email address.
   *
   * @returns {Promise<void>} A promise that resolves when the email has been sent and the database has been updated.
   *
   * @throws
   *   - `Error("User not found")`: If no user is found with the provided `handleOrEmail`.
   *   - `Error("User does not have an email")`: If the user's email field is null or undefined in the database.
   *   - `Error("User email not verified")`: If the user's email has not been verified.
   *
   * @example
   *   forgotPasswordRequest('userHandleOrEmail@example.com');
   *
   */
  forgotPasswordRequest = async (
    redirectHref: string,
    handleOrEmail: string,
    ReCAPTCHA: string | undefined,
    courseProviderId: string | undefined
  ): Promise<void> => {
    let isNotRobot;
    if (ReCAPTCHA) {
      isNotRobot = await verifyCaptcha(ReCAPTCHA);
    }
    if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !isNotRobot) {
      this.logger.error(`Invalid captcha`);
      throw new Error("Invalid captcha");
    }
    let CourseURL: string | undefined;
    let CourseLogoURL: string | undefined;
    let CourseName: string | undefined;

    if (courseProviderId) {
      const [course] = await this.database
        .select({
          key: assets.key,
          extension: assets.extension,
          websiteURL: courses.websiteURL,
          name: courses.name,
        })
        .from(courses)
        .leftJoin(assets, eq(assets.courseId, courseProviderId))
        .where(eq(courses.logoId, assets.id));

      if (course?.key) {
        CourseLogoURL = `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${course?.key}.${course?.extension}`;
        CourseURL = course?.websiteURL || "";
        CourseName = course?.name || "";
      }
    }

    const [user] = await this.database
      .select()
      .from(users)
      .where(or(eq(users.handle, handleOrEmail), eq(users.email, handleOrEmail)));
    if (!user) {
      this.logger.warn(`User not found: ${handleOrEmail}`);
      // throw new Error("User not found");
      return;
    }

    if (!user.email) {
      this.logger.warn(`User email does not exists: ${handleOrEmail}`);
      // throw new Error("User does not have an email");
      return;
    }

    const [accountData] = await this.database
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, user.id)))
      .execute()

    const emailParam = {
      CustomerFirstName: user.name?.split(" ")[0],
      EMail: user.email,
      CourseLogoURL,
      CourseURL,
      CourseName,
      HeaderLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/emailheaderlogo.png`,
    };

    const templateId = process.env.SENDGRID_FORGOT_PASSWORD_AUTH_USER_TEMPLATE_ID;

    if (!templateId) {
      this.logger.error("Missing SendGrid template ID for forgot password email.");
      throw new Error("Missing email template ID");
    }

    if (accountData) {
      await this.notificationsService
        .sendEmail(
          user.email,
          "Reset Password",
          `Since you signed in using ${accountData?.provider} , we cannot reset your password from our end. Please use ${accountData?.provider} to sign in.`
        )
        .catch((err) => {
          this.logger.error(`Error sending email: ${err}`);
          throw new Error("Error sending email");
        });
    }


    if (!user.emailVerified) {
      this.logger.warn(`User email not verified: ${handleOrEmail}`);
      // throw new Error("User email not verified");
      return;
    }
    const verificationToken = randomBytes(32).toString("hex");
    const hashedVerificationToken = await bcrypt.hash(verificationToken, 10);
    await this.database
      .update(users)
      .set({
        forgotPasswordToken: hashedVerificationToken,
        forgotPasswordTokenExpiry: generateUtcTimestamp(90),
      })
      .where(eq(users.id, user.id))
      .execute()
      .catch((err) => {
        this.logger.error(`Error updating forgotPasswordToken for user: ${user.id} - ${err}`);
      });

    const emailParams = {
      CustomerFirstName: user.name?.split(" ")[0],
      EMail: user.email,
      CourseLogoURL,
      CourseURL,
      CourseName,
      HeaderLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/emailheaderlogo.png`,
    };

    if (user.gdPassword) {
      await this.notificationsService
        .sendEmailByTemplate(
          user.email,
          "Reset your password",
          process.env.SENDGRID_FORGOT_PASSWORD_NORMAL_USER_TEMPLATE_ID!,
          {
            ...emailParams,
            ForgotPasswordURL: `${encodeURI(redirectHref)}/reset-password?userId=${encodeURIComponent(
              user?.id
            )}&verificationToken=${encodeURIComponent(verificationToken)}`,
          },
          []
        )
        .catch((err) => {
          this.logger.error(`Error sending email: ${err}`);
          throw new Error("Error sending email");
        });
    } else {
      await this.notificationsService
        .sendEmailByTemplate(
          user.email,
          "Reset your password",
          process.env.SENDGRID_FORGOT_PASSWORD_AUTH_USER_TEMPLATE_ID!,
          emailParams,
          []
        )
        .catch((err) => {
          this.logger.error(`Error sending email: ${err}`);
          throw new Error("Error sending email");
        });
    }
  };

  /**
   * Asynchronously executes a password reset for a user.
   *
   * This method validates the provided parameters and, if they are valid, updates the user's password in the database.
   * Several checks ensure the request is valid and secure, including token validation and expiry check.
   *
   * @param {string} userId - A string representing the unique identifier of the user attempting to reset their password.
   * @param {string} token - A string representing the verification token provided by the user.
   * @param {string} newPassword - A string containing the user's desired new password.
   *
   * @returns {Promise<void>} A promise that resolves when the password has been successfully updated.
   *
   * @throws
   *   - `Error("Invalid password format")`: If `newPassword` does not meet the specified criteria for a valid password.
   *   - `Error("User not found")`: If no user is found with the provided `userId`.
   *   - `Error("User has no forgotPassword request")`: If the user does not have an active password reset request (indicated by the absence of a `forgotPasswordToken`).
   *   - `Error("Verification token expired")`: If the provided verification token has expired, determined by comparing `forgotPasswordTokenExpiry` with the current UTC timestamp.
   *   - `Error("Invalid verification token")`: If the provided `token` does not match the stored `forgotPasswordToken` for the user.
   *   - `Error("Error updating password")`: If an error occurs while updating the password in the database.
   *
   * @example
   *   executeForgotPassword('user123id', 'secureverificationtoken', 'newSecurePassword123');
   */
  executeForgotPassword = async (
    courseId: string | undefined,
    userId: string,
    token: string,
    newPassword: string
  ): Promise<void> => {
    this.logger.info(`executeForgotPassword called with userId: ${userId}`);
    if (isValidPassword(newPassword).score < 8) {
      this.logger.warn(`Invalid password format: ${newPassword}`);
      throw new Error("Invalid password format");
    }
    const [user] = await this.database.select().from(users).where(eq(users.id, userId));

    if (!user) {
      this.logger.warn(`User not found: ${userId}`);
      throw new Error("User not found");
    }

    if (!user.forgotPasswordToken || !user.forgotPasswordTokenExpiry) {
      this.logger.warn(`User has no forgotPassword request: ${userId}`);
      throw new Error("Forgot password request already used.");
    }

    if (user.forgotPasswordTokenExpiry && user.forgotPasswordTokenExpiry < currentUtcTimestamp()) {
      this.logger.warn(`Verification token expired: ${userId}`);
      throw new Error("Verification token expired");
    }
    const valid = await bcrypt.compare(token, user.forgotPasswordToken);
    if (!valid) {
      this.logger.warn(`Invalid verification token: ${userId}`);
      throw new Error("Invalid verification token");
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.database
      .update(users)
      .set({
        gdPassword: hashedPassword,
        forgotPasswordToken: null,
        forgotPasswordTokenExpiry: null,
        updatedAt: currentUtcTimestamp(),
      })
      .where(eq(users.id, userId))
      .execute()
      .catch((err) => {
        this.logger.error(`Error updating password for user: ${userId} - ${err}`);
        throw new Error("Error updating password");
      });

    let CourseLogoURL: string | undefined;
    let CourseURL: string | undefined;
    let CourseName: string | undefined;

    if (courseId) {
      const [course] = await this.database
        .select({
          key: assets.key,
          extension: assets.extension,
          websiteURL: courses.websiteURL,
          name: courses.name,
        })
        .from(courses)
        .where(eq(courses.id, courseId))
        .leftJoin(assets, eq(assets.id, courses.logoId))
        .execute()
        .catch((err) => {
          this.logger.error(err);
          return [];
        });

      if (course?.key) {
        CourseLogoURL = `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${course?.key}.${course?.extension}`;
        CourseURL = course?.websiteURL || "";
        CourseName = course?.name || "";
      }
    }

    if (user?.email) {
      try {
        await this.notificationsService.sendEmailByTemplate(
          user?.email,
          "Golf District - Password Reset Successful",
          process.env.SENDGRID_TEE_TIMES_PASSWORD_RESET_SUCCESSFUL_TEMPLATE_ID!,
          {
            CustomerFirstName: user?.handle ?? "",
            CourseLogoURL,
            CourseURL,
            CourseName,
            HeaderLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/emailheaderlogo.png`,
          },
          []
        );
      } catch (error) {
        throw new Error("Error sending welcome email");
      }
    }
  };

  /**
   * Asynchronously updates the password of a user.
   *
   * This method validates the provided parameters and, if they are valid, updates the user's password in the database.
   * The function allows for setting a new password if one doesn't exist or updating the existing password after validating the old one.
   * Various checks and validations are performed to ensure the security and reliability of the operation.
   *
   * @param {string} userId - A string representing the unique identifier of the user whose password is to be updated.
   * @param {string} oldPassword - A string representing the user's current password. Used for validation when updating the password.
   * @param {string} newPassword - A string containing the user's desired new password.
   *
   * @returns {Promise<void>} A promise that resolves when the password has been successfully updated.
   *
   * @throws
   *   - `Error("User not found")`: If no user is found with the provided `userId`.
   *   - `Error("Invalid password format")`: If `newPassword` does not meet the specified criteria for a valid password.
   *   - `Error("Error setting password")`: If an error occurs while initially setting the password in the database.
   *   - `Error("Invalid password")`: If the provided `oldPassword` does not match the stored password for the user.
   *   - `Error("Error updating password")`: If an error occurs while updating the password in the database.
   *
   * @example
   *   updatePassword('user123id', 'currentPassword123', 'newSecurePassword123');
   * @see {@link isValidPassword} for the password validation logic.
   */
  updatePassword = async (userId: string, oldPassword: string, newPassword: string): Promise<void> => {
    const [user] = await this.database.select().from(users).where(eq(users.id, userId));
    if (!user) {
      this.logger.warn(`User not found: ${userId}`);
      throw new Error("User not found");
    }
    if (isValidPassword(newPassword).score < 8) {
      this.logger.warn(`Invalid password format: ${newPassword}`);
      throw new Error("Invalid password format");
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    if (!user.gdPassword) {
      this.logger.debug(`Setting new password for user: ${userId}`);
      await this.database
        .update(users)
        .set({
          gdPassword: hashedPassword,
          updatedAt: currentUtcTimestamp(),
        })
        .where(eq(users.id, userId))
        .execute()
        .catch((err) => {
          this.logger.error(`Error setting password for user: ${userId} - ${err}`);
          throw new Error("Error setting password");
        });
    } else {
      const valid = await bcrypt.compare(oldPassword, user.gdPassword);
      if (!valid) {
        this.logger.warn(`Invalid password: ${userId}`);
        throw new Error("Invalid password");
      }
      this.logger.debug(`Updating password for user: ${userId}`);
      await this.database
        .update(users)
        .set({
          gdPassword: hashedPassword,
          updatedAt: currentUtcTimestamp(),
        })
        .where(eq(users.id, userId))
        .execute()
        .catch((err) => {
          this.logger.error(`Error updating password for user: ${userId} - ${err}`);
          throw new Error("Error updating password");
        });
    }
  };

  /**
   * Asynchronously validates a user handle.
   *
   * This method checks whether a provided user handle is valid based on specific criteria:
   * - It should not already exist in the database.
   * - It should not contain any words flagged by a predefined filter.
   *
   * If the handle does not meet these criteria, the function throws an error with a message indicating the reason.
   * If the handle is valid, it returns `true`.
   *
   * @param {string} handle - A string representing the user handle to be validated.
   *
   * @returns {Promise<boolean>} A promise that resolves to `true` if the handle is valid.
   *
   * @throws
   *   - `Error("Handle already exists")`: If the `handle` is already associated with a user in the database.
   *   - `Error("Handle contains bad words")`: If the `handle` contains words flagged by the bad words filter.
   *
   * @example
   *   isValidHandle('newUserHandle123').then((isValid) => {
   *     if (isValid) {
   *       console.log('The handle is valid!');
   *     }
   *   }).catch((error) => {
   *     console.error(`Handle validation failed: ${error.message}`);
   *   });
   * @see {@link containsBadWords} for the bad words filter logic.
   */
  isValidHandle = async (handle: string): Promise<boolean> => {
    this.logger.info(`isValidHandle called with handle: ${handle}`);
    if (handle.length < 6 || handle.length > 64) {
      this.logger.debug(`Handle length is invalid: ${handle}`);
      //throw new Error("Handle length is invalid");
      return false;
    }
    if (isValidEmail(handle)) {
      this.logger.debug(`Handle is an email: ${handle}`);
      //throw new Error("Handle is an email");
      return false;
    }
    const [user] = await this.database.select().from(users).where(eq(users.handle, handle));
    if (user) {
      this.logger.debug(`Handle already exists: ${handle}`);
      //throw new Error("Handle already exists");
      return false;
    }
    // if (!containsBadWords(handle, this.filter)) {
    //   this.logger.debug(`Handle contains bad words: ${handle}`);
    //   throw new Error("Handle contains bad words");
    // }
    return true;
  };

  /**
   * Asynchronously inserts a new user into the database.
   *
   * This method takes user creation data and a verification token as input, constructs the user object,
   * and inserts it into the database. The password and verification token are securely hashed using bcrypt
   * before being stored.
   *
   * @param {
   * } data - An object containing the user's data. The object structure is as follows:
   *   - `firstName`: The user's first name.
   *   - `lastName`: The user's last name.
   *   - `handle`: The user's handle.
   *   - `email`: The user's email address.
   *   - `password`: The user's password.
   *   - `location`: The user's location (optional).
   *   - `redirectHref`: The url to redirect to (optional).
   * @param {string} verificationToken - A string representing the verification token associated with the user.
   *
   * @returns {Promise<void>} A promise that resolves when the user data is successfully inserted into the database.
   *
   * @example
   *   const userData = {
   *     firstName: 'John',
   *     lastName: 'Doe',
   *     handle: 'johnDoe123',
   *     email: 'john@example.com',
   *     password: 'securePassword123',
   *     location: '123 Main St, Anytown, USA'
   *   };
   *   const verificationToken = 'secureVerificationToken';
   *
   *   insertUser(userData, verificationToken).then(() => {
   *     console.log('User inserted successfully!');
   *   }).catch((error) => {
   *     console.error(`Failed to insert user: ${error.message}`);
   *   });
   */
  insertUser = async (data: UserCreationData, verificationToken: string): Promise<void> => {
    await this.database
      .insert(users)
      .values({
        id: randomUUID(),
        name: `${data.firstName} ${data.lastName}`,
        handle: data.handle,
        email: data.email,
        gdPassword: await bcrypt.hash(data.password, 10),
        // address: data.location,
        address1: data.address1,
        address2: data.address2,
        state: data.state,
        city: data.city,
        zipcode: data.zipcode,
        country: data.country,
        phoneNumber: data.phoneNumber,
        verificationRequestToken: verificationToken,
        verificationRequestExpiry: generateUtcTimestamp(90), //90 minutes
        createdAt: currentUtcTimestamp(),
        updatedAt: currentUtcTimestamp(),
        profileVisibility: "PRIVATE",
      })
      .execute();
  };

  /**
   * Retrieves user information by user ID. If the caller's ID is provided, additional filtering is applied based on privacy settings.
   * When the profile is public, upcoming tee times and play history are accessible.
   * For private profiles, only for-sale tee times in the upcoming window are visible.
   * The function returns user details including profile and banner pictures.
   *
   * @param {string | undefined} callerId - The unique identifier of the caller. If undefined, only public information is returned. Additional filtering applies if different from the user being queried.
   * @param {string} userId - The unique identifier of the user.
   * @returns {Promise<{ id: string; // additional user properties...; profilePicture: string; bannerPicture: string }>} A promise that resolves to user information including profile and banner pictures.
   * @throws {Error} Throws an error if the user is not found.
   * @example
   * const callerId = "exampleCallerId";
   * const userId = "exampleUserId";
   * const result = await getUserById(callerId, userId);
   * // result: { id: "exampleUserId", // additional user properties..., profilePicture: "/defaults/default-profile.webp", bannerPicture: "/defaults/default-banner.webp" }
   */
  getUserById = async (userId: string, callerId?: string) => {
    console.log("getUserById called with userId: ", userId);
    console.log("callerId: ", callerId);

    const profileAsset = alias(assets, "profileAsset");
    const bannerAsset = alias(assets, "bannerAsset");

    // Fetch user and related assets data
    const [data] = await this.database
      .select({
        user: users,
        profileImage: {
          assetId: profileAsset.id,
          assetKey: profileAsset.key,
          assetExtension: profileAsset.extension,
        },
        bannerImage: {
          assetId: bannerAsset.id,
          assetKey: bannerAsset.key,
          assetExtension: bannerAsset.extension,
        },
      })
      .from(users)
      .leftJoin(profileAsset, eq(users.image, profileAsset.id))
      .leftJoin(bannerAsset, eq(users.bannerImage, bannerAsset.id))
      .where(eq(users.id, userId))
      .limit(1)
      .execute();

    if (!data) {
      this.logger.warn(`User not found: ${userId}`);
      throw new Error("User not found");
    }

    const { user, profileImage, bannerImage } = data;
    const profilePicture = profileImage
      ? assetToURL({
        key: profileImage.assetKey,
        extension: profileImage.assetExtension,
      })
      : "/defaults/default-profile.webp";
    const bannerPicture = bannerImage
      ? assetToURL({
        key: bannerImage.assetKey,
        extension: bannerImage.assetExtension,
      })
      : "/defaults/default-banner.webp";
    let res;

    // If the caller is the user or the profile is public, return full details
    if (callerId === userId || user.profileVisibility === "PUBLIC") {
      res = {
        ...user,
        profilePicture,
        bannerPicture,
      };
    } else {
      // If the profile is private and the caller is not the user, return limited details
      res = {
        id: user.id,
        profilePicture,
        bannerPicture,
        handle: user.handle,
        name: user.name,
        // location: user.location,
        address1: user.address1,
        address2: user.address2,
        state: user.state,
        city: user.city,
        zipcode: user.zipcode,
        country: user.country,
      };
    }
    return res;
  };

  /**
   * Retrieves upcoming tee times for a user, including both tee times owned by the user and those where the user is added as a golfer.
   * The function returns standardized tee time tiles with relevant actions like "SELL", "Details", "Manage".
   * Tee times that are sold before play or where the user's name is removed are not included.
   *
   * @param {string} userId - The unique identifier of the user.
   * @param {string} courseId - The unique identifier of the course.
   * @param {number} take - The number of upcoming tee times to retrieve.
   * @param {string} [cursor] - Optional cursor for pagination.
   * @returns {Promise<void>} A promise that resolves once the upcoming tee times are retrieved.
   * @throws {Error} Throws an error if there is an issue retrieving the upcoming tee times.
   * @example
   * const userId = "exampleUserId";
   * const courseId = "exampleCourseId";
   * const take = 5;
   * const cursor = "exampleCursor";
   * await getUpcomingTeeTimesForUser(userId, courseId, take, cursor);
   */
  getUpcomingTeeTimesForUser = async (userId: string, courseId: string, callerId?: string) => {
    let userProfileVisibility = "PUBLIC";
    let showGolfers = true;
    if (callerId !== userId) {
      this.logger.debug("callerId is not userId");
      const [userProfile] = await this.database
        .select({ userProfileVisibility: users.profileVisibility })
        .from(users)
        .where(eq(users.id, userId))
        .execute();
      userProfileVisibility = userProfile?.userProfileVisibility || "PUBLIC"; // Default to PUBLIC if visibility is undefined
    }
    // Building the where clause
    let whereClause = and(eq(teeTimes.courseId, courseId), gt(teeTimes.date, currentUtcTimestamp()));

    if (userProfileVisibility === "PUBLIC" && callerId !== userId) {
      this.logger.debug("Profile is PUBLIC");
      showGolfers = false;
      whereClause = and(whereClause, eq(bookings.ownerId, userId));
    } else if (userProfileVisibility === "PRIVATE" && callerId !== userId) {
      this.logger.debug("Profile is PRIVATE");
      showGolfers = false;
      // Profile is PRIVATE
      whereClause = and(
        whereClause,
        eq(bookings.isListed, true), // Show only listed tee times
        eq(bookings.ownerId, userId)
      );
    } else {
      // callerId === userId
      this.logger.debug("caller is user including additional data");
      whereClause = and(whereClause, or(eq(bookings.ownerId, userId), eq(bookings.nameOnBooking, userId)));
    }
    const upcomingTeeTimeData = await this.database
      .select({
        id: bookings.id,
        ownerId: bookings.ownerId,
        teeTimeId: bookings.teeTimeId,
        time: teeTimes.time,
        date: teeTimes.providerDate,
        numberOfHoles: bookings.numberOfHoles,
        courseName: courses.name,
        courseId: teeTimes.courseId,
        withCart: bookings.includesCart,
        ownerHandle: users.handle,
        favorites: favorites.id,
        firstHandPrice: teeTimes.greenFeePerPlayer,
        minimumOfferPrice: bookings.minimumOfferPrice,
        purchasedFor: bookings.totalAmount,
        golfers: bookings.nameOnBooking,
        listed: bookings.isListed,
        listPrice: lists.listPrice,
        listingId: lists.id,
        profilePicture: {
          key: assets.key,
          extension: assets.extension,
        },
      })
      .from(bookings)
      .leftJoin(users, eq(users.id, bookings.ownerId))
      .leftJoin(assets, eq(assets.id, users.image))
      .leftJoin(lists, eq(lists.id, bookings.listId))
      .leftJoin(favorites, and(eq(favorites.teeTimeId, bookings.teeTimeId), eq(favorites.userId, userId)))
      .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .leftJoin(courses, eq(courses.id, teeTimes.courseId))
      .where(whereClause)
      .orderBy(asc(bookings.purchasedAt))
      .execute();

    if (!upcomingTeeTimeData || upcomingTeeTimeData.length === 0) {
      return [];
    }
    const groupedBookings: GroupedBookings = {};
    upcomingTeeTimeData.forEach((booking) => {
      const key = booking.teeTimeId;

      if (!groupedBookings[key]) {
        groupedBookings[key] = {
          soldById: booking.ownerId,
          soldByName: booking.ownerHandle ? booking.ownerHandle : "Anonymous",
          soldByImage: booking.profilePicture
            ? `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${booking.profilePicture.key}.${booking.profilePicture.extension}`
            : "/defaults/default-profile.webp",
          availableSlots: booking.listed ? 0 : 1,
          pricePerGolfer: booking.listPrice ? booking.listPrice : 0,
          teeTimeId: booking.teeTimeId,
          date: booking.date ? booking.date : "",
          time: booking.time ? booking.time : 2400,
          userWatchListed: booking.favorites ? true : false,
          includesCart: booking.withCart ? booking.withCart : false,
          teeTimeOwnedByCaller: booking.ownerId === userId ? true : false,
          listsPrice: booking.listed ? booking.listingId : null,
          teeTimeStatus: booking.listed ? "LISTED" : "UNLISTED",
          listingId: booking.listed ? booking.listingId : null,
          minimumOfferPrice: booking.minimumOfferPrice ?? 0,
          firstHandPrice: booking.firstHandPrice ?? 0,
          purchasedFor: booking.purchasedFor ?? 0,
          golfers: showGolfers && booking.golfers ? [booking.golfers] : [],
          bookings: [booking.id],
        };
      } else {
        const group = groupedBookings[key]!;
        group.bookings.push(booking.id);
        if (bookings.isListed) {
          group.availableSlots -= 1;
        }
        if (showGolfers) {
          group.golfers.push(booking.golfers);
        }
      }
    });

    const groupedBookingsArr = Object.values(groupedBookings);

    return groupedBookingsArr;
  };
  /**
   * Retrieves the play history for a user at a specific golf course. This includes the course name and the date of play.
   * It does not include tee times that were sold before play or where the user's name was removed prior to the tee time.
   *
   * @param {string} userId - The unique identifier of the user.
   * @param {string} courseId - The unique identifier of the course.
   * @returns {Promise<void>} A promise that resolves once the play history is retrieved.
   * @throws {Error} Throws an error if there is an issue retrieving the play history.
   * @example
   * const userId = "exampleUserId";
   * const courseId = "exampleCourseId";
   * await getTeeTimeHistoryForUser(userId, courseId);
   */
  getTeeTimeHistoryForUser = async (userId: string, courseId: string) => {
    this.logger.debug("getTeeTimeHistoryForUser called with userId: ", userId);
    this.logger.debug("courseId: ", courseId);

    const [entity] = await this.database
      .select({ entityId: courses.entityId })
      .from(courses)
      .leftJoin(entities, eq(entities.id, courses.entityId))
      .where(eq(courses.id, courseId));

    if (!entity?.entityId) {
      throw new Error("Course not found");
    }

    const teeTimeHistoryData = await this.database
      .select({
        teeTimeId: bookings.teeTimeId,
        date: teeTimes.providerDate,
        courseName: courses.name,
        courseId: teeTimes.courseId,
        courseImage: {
          key: assets.key,
          extension: assets.extension,
        },
      })
      .from(bookings)
      .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .leftJoin(courses, eq(courses.id, teeTimes.courseId))
      .leftJoin(assets, eq(assets.id, courses.logoId))
      .where(
        and(
          eq(courses.entityId, entity.entityId),
          or(eq(bookings.ownerId, userId), eq(bookings.nameOnBooking, userId)),
          lt(bookings.purchasedAt, currentUtcTimestamp())
        )
      )
      .orderBy(desc(bookings.purchasedAt))
      .execute();

    if (!teeTimeHistoryData || teeTimeHistoryData.length === 0) {
      this.logger.debug(`No tee time history found for user: ${userId}`);
      return [];
    }
    const uniqueTeeTimes: UniqueTeeTimesMap = new Map();
    teeTimeHistoryData.forEach((booking) => {
      if (!uniqueTeeTimes.has(booking.teeTimeId)) {
        uniqueTeeTimes.set(booking.teeTimeId, {
          teeTimeId: booking.teeTimeId,
          date: booking.date,
          courseName: booking.courseName,
          courseId: booking.courseId ?? "",
          courseImage: booking.courseImage
            ? `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${booking.courseImage.key}.${booking.courseImage.extension}`
            : "/defaults/default-course.webp",
        });
      }
    });
    const formattedData = Array.from(uniqueTeeTimes.values());
    return formattedData;
  };

  /**
   * Retrieves OAuth providers associated with a given user ID.
   * @param userId - The ID of the user.
   * @returns An array of provider names.
   */
  getProvidersByUserId = async (userId: string) => {
    const providers = await this.database
      .select({ provider: accounts.provider })
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .execute();

    const cleanedProviders = providers?.map((provider) => {
      return provider.provider;
    });

    return cleanedProviders;
  };

  getS3HtmlContent = async (keyName: string) => {
    console.log(`Bucket Name: ${process.env.AWS_BUCKET}, File Name: ${keyName}`);

    const getObjectParams = {
      Bucket: process.env.AWS_BUCKET,
      Key: keyName,
    };

    try {
      const { Body } = await s3Client.send(new GetObjectCommand(getObjectParams));
      const htmlContent = await this.streamToString(Body);
      // return htmlContent;
      let replacedHTML = htmlContent;
      replacedHTML = replacedHTML.replace(/background:\s?#?\b[a-zA-Z0-9]+;?/gi, "");
      replacedHTML = replacedHTML.replace(/background-color:\s?#?\b[a-zA-Z0-9]+;?/gi, "");

      return replacedHTML;
    } catch (err) {
      console.error("Error fetching HTML file:", err);
      throw err;
    }
  };

  streamToString = async (stream: any) => {
    // const chunks: Uint8Array[] = [];
    // return new Promise((resolve, reject) => {
    //   stream.on("data", (chunk: Uint8Array) => chunks.push(chunk));
    //   stream.on("error", reject);
    //   stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    // });
    const chunks: any[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString("utf8");
  };

  generateUsername = async (digit: number) => {
    // Generate a random buffer
    const buffer = randomBytes(3);

    // Convert buffer to hex string
    const hex = buffer.toString("hex");

    // Convert hex string to integer
    const randomNumber = parseInt(hex, 16);

    // Get the six least significant digits
    const sixDigitNumber = randomNumber % 1000000;

    // Pad the number with zeros if necessary
    const handle = sixDigitNumber.toString().padStart(digit, "0");

    const isValid = await this.isValidHandle(handle);

    if (!isValid) {
      this.generateUsername(digit);
    }
    return handle ? `golfdistrict${handle}` : "golfdistrict";
  };

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
}
