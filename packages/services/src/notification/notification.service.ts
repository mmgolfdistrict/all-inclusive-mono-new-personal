import { randomUUID } from "crypto";
import type { Db } from "@golf-district/database";
import { and, desc, eq, gte, inArray, lt, sql } from "@golf-district/database";
import { bookings } from "@golf-district/database/schema/bookings";
import { notifications } from "@golf-district/database/schema/notifications";
import { offers } from "@golf-district/database/schema/offers";
import { teeTimes } from "@golf-district/database/schema/teeTimes";
import { userBookingOffers } from "@golf-district/database/schema/userBookingOffers";
import { users } from "@golf-district/database/schema/users";
import { currentUtcTimestamp } from "@golf-district/shared";
import Logger from "@golf-district/shared/src/logger";
import { MailService } from "@sendgrid/mail";
import type pino from "pino";
import twilio from "twilio";
import { AppSettingsService } from "../app-settings/app-settings.service";
import { loggerService } from "../webhooks/logging.service";
import { S } from "vitest/dist/reporters-5f784f42";

interface EmailParams {
  CustomerFirstName?: string;
  CustomerName?: string;
  CourseName?: string;
  GolfDistrictReservationID?: string;
  CourseReservationID?: string;
  ListedPricePerPlayer?: string;
  FacilityName?: string;
  PlayDateTime?: string;
  NumberOfHoles?: number;
  GreenFees?: string;
  TaxesAndOtherFees?: string;
  SensibleWeatherIncluded?: string;
  PurchasedFrom?: string;
  EMail?: string;
  ForgotPasswordURL?: string;
  CourseLogoURL?: string;
  CourseURL?: string;
  VerifyURL?: string;
  BuyTeeTimeURL?: string;
  HeaderLogoURL?: string;
  PlayerCount?: number;
  TotalAmount?: string;
  AmountCashedOut?: number;
  PreviousBalance?: number;
  AvailableBalance?: number;
  BalanceProcessing?: number | string;
  NoteFromUser?: string;
  NeedRentals?: string;
  SellTeeTImeURL?: string;
  ManageTeeTimesURL?: string;
  GreenFeesPerPlayer?: string;
  GroupReservationID?: string;
  PreviousPlayerCount?: number;
  NewPlayerCount?: number;
  PreviousListedPrice?: number;
  NewListedPrice?: number;
  USERNAME?:string;
  PAYMENT_URL?:string;
}

interface Attachment {
  content: string;
  filename: string;
  type: string;
  disposition?: string;
  contentId?: string;
  encoding?: string;
}

/**
 * Service class for handling notifications, including emails, SMS, and user notifications.
 */
export class NotificationService {
  protected logger: pino.Logger;
  protected twilioClient: twilio.Twilio;
  protected sendGridClient: MailService;
  protected database: Db;

  /**
   * Constructs the NotificationService.
   * @param {Db} _database - The database instance to use for queries.
   * @param {string} twillio_phoneNumber - The Twilio phone number for sending SMS.
   * @param {string} sendGrid_email - The SendGrid email for sending emails.
   * @param {string} twilioAccountSid - The Twilio account SID.
   * @param {string} twilioAuthToken - The Twilio authentication token.
   * @param {string} sendGridApiKey - The SendGrid API key.
   * @param {pino.Logger} logger - The logger instance.
   * @example
   * const notificationService = new NotificationService(
   *   dbInstance,
   *   'your-twilio-phone-number',
   *   'your-sendgrid-email',
   *   'your-twilio-account-sid',
   *   'your-twilio-auth-token',
   *   'your-sendgrid-api-key',
   *   customLoggerInstance
   * );
   */
  constructor(
    _database: Db,
    private readonly twillio_phoneNumber: string,
    private readonly sendGrid_email: string,
    twilioAccountSid: string,
    twilioAuthToken: string,
    sendGridApiKey: string,
    logger?: pino.Logger
  ) {
    this.database = _database;
    this.twilioClient = twilio(twilioAccountSid, twilioAuthToken);
    this.sendGridClient = new MailService();
    this.sendGridClient.setApiKey(sendGridApiKey);
    this.logger = logger ? logger : Logger(NotificationService.name);
  }

  /**
   * Sends an email to the specified email address.
   *
   * @param {string} email - The email address to send the email to.
   * @param {string} subject - The subject of the email.
   * @param {string} body - The body of the email.
   *
   * @returns {Promise<void>} A promise that resolves when the email is successfully sent.
   * @throws Will throw an error if there is an issue with sending the email.
   * @example
   * // Sending an email with subject 'Example Subject' and body 'Hello, this is the email body.' to 'example@example.com'.
   * await sendEmail('example@example.com', 'Example Subject', 'Hello, this is the email body.');
   */

  /**
   * Sends an email to the specified email address.
   *
   * @param email - The email address to send the email to.
   * @param subject - The subject of the email.
   * @param body - The body of the email.
   *
   * @returns A promise that resolves when the email is successfully sent.
   */
  sendEmail = async (email: string, subject: string, body: string) => {
    this.logger.info(`Sending email to ${email}`);

    const bccEmailsList = process.env.BCC_CUSTOMER_EMAIL_LIST ? process.env.BCC_CUSTOMER_EMAIL_LIST : "";
    const bccEmails = bccEmailsList.split(",");

    //if (process.env.NODE_ENV === "production") {
    const response = await this.sendGridClient
      .send({
        to: email,
        from: this.sendGrid_email,
        subject: subject,
        html: body,
        bcc: bccEmails,
      })
      .catch((err) => {
        this.logger.error(err);
        loggerService.errorLog({
          userId: "",
          url: "/NotificationService/sendEmail",
          userAgent: "",
          message: "ERROR_SENDING_EMAIL",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            email,
            subject,
            body,
          }),
        });
        throw new Error(`Failed to send email to: ${email}, Response: ${JSON.stringify(response)}`);
      });
    // } else {
    //   console.log("Sending email (simulated):", {
    //     to: email,
    //     subject: subject,
    //     body: body,
    //   });
    // }
  };

  sendEmailByTemplate = async (
    email: string | string[],
    subject: string,
    templateId: string,
    template: EmailParams,
    attachments: Attachment[]
  ) => {
    this.logger.info(`Sending email to ${email.toString()}`);
    const appSettingService = new AppSettingsService(
      this.database,
      process.env.REDIS_URL!,
      process.env.REDIS_TOKEN!
    );
    const bccEmailsList = process.env.BCC_CUSTOMER_EMAIL_LIST ? process.env.BCC_CUSTOMER_EMAIL_LIST : "";
    const bccEmails = bccEmailsList.split(",");

    const appSettings = await appSettingService.getMultiple("ENABLE_ICS_ATTACHMENT");
    if (appSettings?.ENABLE_ICS_ATTACHMENT === "false") {
      const response = await this.sendGridClient
        .send({
          to: email,
          from: this.sendGrid_email,
          subject,
          templateId,
          dynamicTemplateData: { ...template },
          bcc: bccEmails,
        })
        .catch((err) => {
          this.logger.error(err);
          loggerService.errorLog({
            userId: "",
            url: "/NotificationService/sendEmailByTemplate",
            userAgent: "",
            message: "ERROR_SENDING_EMAIL_BY_TEMPLATE",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              email,
              subject,
              template,
              templateId,
              attachments,
            }),
          });
          throw new Error(
            `Failed to send email to: ${email.toString()}, Response: ${JSON.stringify(response)}`
          );
        });
    } else {
      const response = await this.sendGridClient
        .send({
          to: email,
          from: this.sendGrid_email,
          subject,
          templateId,
          dynamicTemplateData: { ...template },
          attachments,
          bcc: bccEmails,
        })
        .catch((err) => {
          this.logger.error(err);
          loggerService.errorLog({
            userId: "",
            url: "/NotificationService/sendEmailByTemplate",
            userAgent: "",
            message: "ERROR_SENDING_EMAIL_BY_TEMPLATE",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              email,
              subject,
              template,
              templateId,
              attachments,
            }),
          });
          throw new Error(
            `Failed to send email to: ${email.toString()}, Response: ${JSON.stringify(response)}`
          );
        });
    }
  };

  /**
   * Sends an SMS to the specified phone number.
   *
   * @param {string} phoneNumber - The phone number to send the SMS to.
   * @param {string} body - The body of the SMS.
   *
   * @returns {Promise<void>} A promise that resolves when the SMS is successfully sent.
   * @throws Will throw an error if there is an issue with sending the SMS.
   * @example
   * // Sending an SMS with body 'Hello, this is the SMS body.' to '+1234567890'.
   * await sendSMS('+1234567890', 'Hello, this is the SMS body.');
   */
  sendSMS = async (phoneNumber: string, body: string) => {
    this.logger.info(`Sending SMS to ${phoneNumber}`);
    if (process.env.NODE_ENV === "production") {
      this.twilioClient.messages
        .create({
          to: phoneNumber,
          from: this.twillio_phoneNumber,
          body: body,
        })
        .catch((err) => {
          this.logger.error(err);
          loggerService.errorLog({
            userId: "",
            url: "/NotificationService/sendSMS",
            userAgent: "",
            message: "ERROR_SENDING_SMS",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              phoneNumber,
              body,
            }),
          });
          throw new Error(`Failed to send SMS to: ${phoneNumber}`);
        });
    } else {
      console.log("Sending SMS (simulated):", {
        to: phoneNumber,
        body: body,
      });
    }
  };

  /**
   * Retrieves the number of unread offers for a given course and user.
   *
   * @param {string} courseId - The ID of the course.
   * @param {string} userId - The ID of the user.
   *
   * @returns {Promise<number>} A promise that resolves to the number of unread offers.
   * @throws Will throw an error if there is an issue retrieving unread offers.
   * @example
   * // Retrieving the number of unread offers for the course with ID 'course123' and user with ID 'user123'.
   * const unreadCount = await getUnreadOffersForCourse('course123', 'user123');
   */
  getUnreadOffersForCourse = async (courseId: string, userId?: string): Promise<number> => {
    if (!userId) {
      return 0;
    }
    //find total of pending offers for this user and course
    const [data] = await this.database
      .select({
        unreadCount: sql<number>`COUNT(*)`,
      })
      .from(offers)
      .leftJoin(userBookingOffers, eq(userBookingOffers.offerId, offers.id))
      .leftJoin(bookings, eq(bookings.id, userBookingOffers.bookingId))
      .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .where(
        and(
          eq(offers.courseId, courseId),
          eq(offers.isDeleted, false),
          eq(offers.status, "PENDING"),
          eq(bookings.ownerId, userId),
          gte(teeTimes.date, currentUtcTimestamp())
        )
      )
      .limit(1)
      .execute();

    // const [data] = await this.database
    //   .select({
    //     unreadCount: sql<number>`COUNT(*)`.as("unreadCount"),
    //   })
    //   .from(offers)
    //   .leftJoin(offerRead, and(eq(offerRead.userId, userId), eq(offerRead.courseId, offers.courseId)))
    //   .innerJoin(userBookingOffers, eq(userBookingOffers.offerId, offers.id))
    //   .leftJoin(bookings, eq(bookings.id, userBookingOffers.bookingId))
    //   .where(
    //     and(
    //       eq(offerRead.userId, userId),
    //       eq(bookings.ownerId, userId),
    //       or(
    //         isNull(offerRead.lastRead),
    //         and(
    //           eq(offers.courseId, courseId),
    //           eq(offers.isDeleted, false),
    //           gt(offers.createdAt, offerRead.lastRead)
    //         )
    //       )
    //     )
    //   )
    //   .groupBy(offers.courseId)
    //   .execute()
    //   .catch((err) => {
    //     this.logger.error(err);
    //     throw new Error("Failed to retrieve unread offers");
    //   });
    if (!data) {
      return 0;
    }
    return data.unreadCount;
  };

  /**
   * Marks offers for a given course and user as read.
   *
   * @param {string} userId - The ID of the user.
   * @param {string} courseId - The ID of the course.
   *
   * @returns {Promise<void>} A promise that resolves when offers are successfully marked as read.
   * @throws Will throw an error if there is an issue marking offers as read.
   * @example
   * // Marking offers as read for user with ID 'user123' and course with ID 'course123'.
   * await readOffersForCourse('user123', 'course123');
   */
  readOffersForCourse = async (userId: string, courseId: string) => {
    this.logger.info(`readOffers: this method is deprecated`);

    return;
    // await this.database
    //   .insert(offerRead)
    //   .values({
    //     userId,
    //     courseId,
    //     lastRead: currentUtcTimestamp(),
    //   })
    //   .onDuplicateKeyUpdate({
    //     set: {
    //       lastRead: currentUtcTimestamp(),
    //     },
    //   })
    //   .execute()
    //   .catch((err) => {
    //     this.logger.error(err);
    //     throw new Error("Failed to update offer read");
    //   });
    // this.logger.debug(`Success marking offers as read for user ${userId} and course ${courseId}`);
  };

  /**
   * Creates a notification for a user.
   *
   * @param {string} userId - The ID of the user.
   * @param {string} subject - The subject of the notification.
   * @param {string} body - The body of the notification.
   * @param {string} entityId - The ID of the associated entity.
   *
   * @returns {Promise<void>} A promise that resolves when the notification is successfully created.
   * @throws Will throw an error if there is an issue creating the notification.
   * @example
   * // Creating a notification for user with ID 'user123' with subject 'New Notification' and body 'You have a new notification.'.
   * await createNotification('user123', 'New Notification', 'You have a new notification.', 'entity123');
   */

  createNotification = async (
    userId: string,
    subject: string,
    body: string,
    courseId?: string | null,
    templateId?: string,
    template?: EmailParams,
    attachments?: Attachment[]
  ) => {
    const [user] = await this.database
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .execute()
      .catch((err) => {
        this.logger.error(`Failed to retrieve user: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/NotificationService/createNotification",
          userAgent: "",
          message: "FAILED_TO_RETRIEVE_USER",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            courseId,
            subject,
            template,
            templateId,
            attachments,
          }),
        });
        throw new Error("Failed to retrieve user");
      });

    if (!user) {
      this.logger.error(`createNotification: User with ID ${userId} not found.`);
      loggerService.errorLog({
        userId: userId,
        url: "/NotificationService/createNotification",
        userAgent: "",
        message: "USER_NOT_FOUND",
        stackTrace: `createNotification: User with ID ${userId} not found.`,
        additionalDetailsJSON: JSON.stringify({
          courseId,
          subject,
          template,
          templateId,
          attachments,
        }),
      });
      return;
    }
    this.logger.info(`Creating notification for user ${userId}`);
    const notification = {
      id: randomUUID(),
      userId,
      subject,
      body,
      courseId,
      createdAt: currentUtcTimestamp(),
    };

    await this.database
      .insert(notifications)
      .values(notification)
      .catch((err) => {
        this.logger.error(`Failed to create notification: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/NotificationService/createNotification",
          userAgent: "",
          message: "FAILED_TO_CREATE_NOTIFICATION",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            courseId,
            subject,
            template,
            templateId,
            attachments,
          }),
        });
        throw new Error("Failed to create notification");
      });

    // if (user[0].phoneNotifications && user[0].phoneNumber) {
    //   this.logger.debug(`Sending SMS to ${user[0].phoneNumber}`);
    //   await this.sendSMS(user[0].phoneNumber, subject);
    // }

    if (user.emailNotifications && user.email) {
      if (templateId && template) {
        this.logger.debug(`Sending email to ${user.email}`);
        await this.sendEmailByTemplate(user.email, subject, templateId, template, attachments || []);
      } else {
        this.logger.debug(`Sending email to ${user.email}`);
        await this.sendEmail(user.email, subject, body);
      }
    }
  };

  /**
   * Retrieves notifications for a user, entity, and optional cursor.
   *
   * @param {string} userId - The ID of the user.
   * @param {string} entityId - The ID of the associated entity.
   * @param {string} [cursor] - Optional cursor for pagination.
   * @param {number} [limit=10] - Maximum number of notifications to retrieve.
   *
   * @returns {Promise<{ data: Array<Object>, nextCursor: string | null }>} A promise that resolves to an object containing the retrieved notifications and the next cursor for pagination.
   * @throws Will throw an error if there is an issue retrieving notifications.
   * @example
   * // Retrieving notifications for user with ID 'user123', entity with ID 'entity123', and a limit of 10.
   * const notifications = await getNotifications('user123', 'entity123');
   */
  getNotifications = async (userId: string, entityId: string, cursor?: string, limit = 10) => {
    this.logger.info(`Retrieving notifications for user ${userId}`);

    let whereClause = and(
      eq(notifications.userId, userId),
      eq(notifications.courseId, entityId),
      eq(notifications.isDeleted, false)
    );
    if (cursor) {
      whereClause = and(whereClause, lt(notifications.createdAt, cursor));
    }
    const query = this.database
      .select()
      .from(notifications)
      .where(whereClause)
      .orderBy(desc(notifications.createdAt))
      .limit(limit + 1);

    const userNotifications = await query.execute().catch((err) => {
      this.logger.error(err);
      loggerService.errorLog({
        userId: userId,
        url: "/NotificationService/getNotifications",
        userAgent: "",
        message: "FAILED_TO_RETRIEVE_NOTIFICATIONS",
        stackTrace: `${err.stack}`,
        additionalDetailsJSON: JSON.stringify({
          userId,
          entityId,
        }),
      });
      throw new Error("Failed to retrieve notifications");
    });

    let nextCursor: string | null = null;
    if (userNotifications.length > limit) {
      const possibleNextCursor = userNotifications[limit - 1]?.createdAt;
      if (possibleNextCursor) {
        nextCursor = possibleNextCursor;
        userNotifications.pop();
      }
    }

    return {
      data: userNotifications,
      nextCursor,
    };
  };

  /**
   * Marks notifications as read for a user.
   *
   * @param {string} userId - The ID of the user.
   * @param {string[]} notificationIds - Array of notification IDs to mark as read.
   *
   * @returns {Promise<void>} A promise that resolves when notifications are successfully marked as read.
   * @throws Will throw an error if there is an issue marking notifications as read.
   * @example
   * // Marking notifications as read for user with ID 'user123' and notification IDs ['notification1', 'notification2'].
   * await markNotificationsAsRead('user123', ['notification1', 'notification2']);
   */
  markNotificationsAsRead = async (userId: string, notificationIds: string[]) => {
    this.logger.info(`Marking notification ${notificationIds.length} as read`);
    return await this.database
      .update(notifications)
      .set({
        isRead: true,
        readAt: currentUtcTimestamp(),
      })
      .where(and(inArray(notifications.id, notificationIds), eq(notifications.userId, userId)))
      .execute();
  };

  /**
   * Marks notifications as deleted for a user.
   *
   * @param {string} userId - The ID of the user.
   * @param {string[]} notificationIds - Array of notification IDs to mark as deleted.
   *
   * @returns {Promise<void>} A promise that resolves when notifications are successfully marked as deleted.
   * @throws Will throw an error if there is an issue marking notifications as deleted.
   * @example
   * // Marking notifications as deleted for user with ID 'user123' and notification IDs ['notification1', 'notification2'].
   * await markNotificationsAsDeleted('user123', ['notification1', 'notification2']);
   */
  markNotificationsAsDeleted = async (userId: string, notificationIds: string[]) => {
    this.logger.info(`Marking ${notificationIds.length} notifications as deleted for user ${userId}`);
    return await this.database
      .update(notifications)
      .set({
        isDeleted: false,
        deletedAt: currentUtcTimestamp(),
      })
      .where(and(inArray(notifications.id, notificationIds), eq(notifications.userId, userId)))
      .execute()
      .catch((err) => {
        this.logger.error(err);
        loggerService.errorLog({
          userId: userId,
          url: "/NotificationService/markNotificationsAsDeleted",
          userAgent: "",
          message: "FAILED_TO_MARK_NOTIFICATIONS_AS_DELETED",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            userId,
            notificationIds,
          }),
        });
        throw new Error("Failed to mark notifications as deleted");
      });
  };
}
