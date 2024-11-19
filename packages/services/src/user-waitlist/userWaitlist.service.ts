import { randomUUID } from "crypto";
import { and, asc, eq, gte, inArray, lte, type Db, secondaryDb } from "@golf-district/database";
import { assets } from "@golf-district/database/schema/assets";
import { courses } from "@golf-district/database/schema/courses";
import { entities } from "@golf-district/database/schema/entities";
import type { InsertUserWaitlists } from "@golf-district/database/schema/userWaitlists";
import { userWaitlists } from "@golf-district/database/schema/userWaitlists";
import { userWaitlistAuditLogs } from "@golf-district/database/secondaryDbSchema/userWaitlistAuditLogs";
import Logger from "@golf-district/shared/src/logger";
import dayjs from "dayjs";
import UTC from "dayjs/plugin/utc";
import type { NotificationService } from "../notification/notification.service";
import type {
  CreateWaitlistNotification,
  CreateWaitlistNotifications,
  NotificationQstashData,
  UpdateWaitlistNotification,
} from "./types";
import { loggerService } from "../webhooks/logging.service";

dayjs.extend(UTC);
/**
 * Service class for handling waitlist notification operations.
 */
export class UserWaitlistService {
  private readonly logger = Logger(UserWaitlistService.name);

  constructor(private readonly database: Db, private readonly notificationService: NotificationService) { }

  getWaitlist = async (userId: string, courseId: string) => {
    try {
      const today = new Date(dayjs().startOf("day").utc().format("YYYY-MM-DD HH:mm:ss"));
      const waitlist = await this.database
        .select({
          id: userWaitlists.id,
          courseId: userWaitlists.courseId,
          startTime: userWaitlists.startTime,
          endTime: userWaitlists.endTime,
          playerCount: userWaitlists.playerCount,
          date: userWaitlists.date,
          courseName: courses.name,
        })
        .from(userWaitlists)
        .innerJoin(courses, eq(courses.id, userWaitlists.courseId))
        .where(
          and(
            eq(userWaitlists.userId, userId),
            eq(userWaitlists.courseId, courseId),
            eq(userWaitlists.isDeleted, false),
            gte(userWaitlists.date, today)
          )
        )
        .orderBy(asc(userWaitlists.date), asc(userWaitlists.playerCount), asc(userWaitlists.startTime))
        .execute()
        .catch((err) => {
          this.logger.error(`error getting waitlist from database: ${err}`);
          throw new Error("Error getting waitlist");
        });
      return waitlist;
    } catch (error: any) {
      this.logger.error(error);
      loggerService.errorLog({
        userId: userId,
        url: `/UserWaitlistService/getWaitlist`,
        userAgent: "",
        message: "ERROR_GETTING_WAITLIST",
        stackTrace: `${error.stack}`,
        additionalDetailsJSON: JSON.stringify({
          courseId
        })
      })
      throw error;
    }
  };

  insertWaitlistNotifications = async (waitlistNotificationsList: InsertUserWaitlists[]) => {
    try {
      await this.database
        .insert(userWaitlists)
        .values(waitlistNotificationsList)
        .execute()
        .catch((err) => {
          this.logger.error(`error creating waitlist notification in database: ${err}`);
          throw new Error("Error creating waitlist notification");
        });

      return "Notification inserted successfully";
    } catch (error: any) {
      this.logger.error(error);
      loggerService.errorLog({
        userId: waitlistNotificationsList[0]?.userId ?? "",
        url: `/UserWaitlistService/insertWaitlistNotifications`,
        userAgent: "",
        message: "ERROR_CREATING_WAITLIST_NOTIFICATION",
        stackTrace: `${error.stack}`,
        additionalDetailsJSON: JSON.stringify({
          waitlistNotificationsList
        })
      })
      throw error;
    }
  };

  updateWaitlistNotification = async (
    notificationId: string,
    notificationData: UpdateWaitlistNotification
  ) => {
    try {
      await this.database
        .update(userWaitlists)
        .set(notificationData)
        .where(eq(userWaitlists.id, notificationId))
        .execute()
        .catch((err) => {
          this.logger.error(`error updating waitlist notification in database: ${err}`);
          throw new Error("Error updating waitlist notification");
        });
      return "Notification updated successfully";
    } catch (error: any) {
      this.logger.error(error);
      loggerService.errorLog({
        userId: "",
        url: `/UserWaitlistService/updateWaitlistNotification`,
        userAgent: "",
        message: "ERROR_UPDATING_WAITLIST_NOTIFICATION",
        stackTrace: `${error.stack}`,
        additionalDetailsJSON: JSON.stringify({
          notificationId,
          notificationData
        })
      })
      throw error;
    }
  };

  deleteWaitlistNotifications = async (notificationIds: string[]) => {
    try {
      await this.database
        .update(userWaitlists)
        .set({
          isDeleted: true,
        })
        .where(inArray(userWaitlists.id, notificationIds))
        .execute()
        .catch((err) => {
          this.logger.error(`error deleting waitlist notification from database: ${err}`);
          throw new Error("Error deleting waitlist notification");
        });
      return "Notification deleted successfully";
    } catch (error: any) {
      this.logger.error(error);
      loggerService.errorLog({
        userId: "",
        url: `/UserWaitlistService/deleteWaitlistNotifications`,
        userAgent: "",
        message: "ERROR_DELETING_WAITLIST_NOTIFICATION",
        stackTrace: `${error.stack}`,
        additionalDetailsJSON: JSON.stringify({
          notificationIds
        })
      })
      throw error;
    }
  };

  createWaitlistNotifications = async (waitlistNotifications: CreateWaitlistNotifications) => {
    try {
      for (const date of waitlistNotifications.dates) {
        const [insertNotifications, deleteNotifications] = await this.calculateOverlappingNotifications({
          ...waitlistNotifications,
          date,
        });

        if (insertNotifications.length > 0) {
          await this.insertWaitlistNotifications(insertNotifications);
        }

        if (deleteNotifications.length > 0) {
          // const deletedNotificationsPromises = deleteNotifications.map(async (notificationId) => {
          //   return await this.deleteWaitlistNotification(notificationId);
          // });
          // await Promise.all(deletedNotificationsPromises);

          await this.deleteWaitlistNotifications(deleteNotifications);
        }
      }

      return "Notifications created successfully";
    } catch (error: any) {
      this.logger.error(error);
      loggerService.errorLog({
        userId: waitlistNotifications.userId ?? "",
        url: `/UserWaitlistService/createWaitlistNotifications`,
        userAgent: "",
        message: "ERROR_CREATING_WAITLIST_NOTIFICATIONS",
        stackTrace: `${error.stack}`,
        additionalDetailsJSON: JSON.stringify({
          waitlistNotifications
        })
      })
      throw error;
    }
  };

  calculateOverlappingNotifications = async (
    waitlistNotification: CreateWaitlistNotification
  ): Promise<[InsertUserWaitlists[], string[]]> => {
    try {
      const insertNotifications: InsertUserWaitlists[] = [];
      const deleteNotifications: string[] = [];

      const newNotification = waitlistNotification;

      // converting date to utc format
      const date = new Date(dayjs(waitlistNotification.date).format("YYYY-MM-DD") + "T00:00:00Z");

      const waitlist = await this.database
        .select()
        .from(userWaitlists)
        .where(
          and(
            eq(userWaitlists.userId, waitlistNotification.userId),
            eq(userWaitlists.courseId, waitlistNotification.courseId),
            eq(userWaitlists.playerCount, waitlistNotification.playerCount),
            eq(userWaitlists.date, date),
            eq(userWaitlists.isDeleted, false)
          )
        )
        .orderBy(asc(userWaitlists.startTime))
        .execute()
        .catch((err) => {
          this.logger.error(`error getting waitlist from database: ${err}`);
          loggerService.errorLog({
            userId: waitlistNotification.userId,
            url: `/UserWaitlistService/calculateOverlappingNotifications`,
            userAgent: "",
            message: "ERROR_GETTING_WAITLIST",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              waitlistNotification
            })
          })
          throw new Error("Error getting waitlist");
        });

      if (waitlist.length > 0) {
        for (const prevNotification of waitlist) {
          if (
            prevNotification.startTime <= newNotification.startTime &&
            prevNotification.endTime >= newNotification.endTime
          ) {
            return [[], []];
          }

          if (prevNotification.startTime > newNotification.endTime) {
            break;
          }

          if (
            (prevNotification.endTime >= newNotification.startTime &&
              prevNotification.endTime <= newNotification.endTime) ||
            (prevNotification.startTime >= newNotification.startTime &&
              prevNotification.endTime <= newNotification.endTime) ||
            (prevNotification.startTime >= newNotification.startTime &&
              prevNotification.startTime <= newNotification.endTime)
          ) {
            newNotification.startTime = Math.min(prevNotification.startTime, newNotification.startTime);
            newNotification.endTime = Math.max(prevNotification.endTime, newNotification.endTime);
            deleteNotifications.push(prevNotification.id);
          }
        }
      }

      insertNotifications.push({
        ...newNotification,
        id: randomUUID(),
        date: date,
      });
      return [insertNotifications, deleteNotifications];
    } catch (error: any) {
      this.logger.error(error);
      loggerService.errorLog({
        userId: waitlistNotification.userId,
        url: `/UserWaitlistService/calculateOverlappingNotifications`,
        userAgent: "",
        message: "ERROR_CALCULATING_OVERLAPPING_NOTIFICATIONS",
        stackTrace: `${error.stack}`,
        additionalDetailsJSON: JSON.stringify({
          waitlistNotification
        })
      })
      throw error;
    }
  };

  sendNotificationsForAvailableTeeTime = async (
    date: string | undefined,
    time: number,
    courseId: string,
    userId?: string
  ) => {
    try {
      if (!date || !time) {
        throw new Error("date or time is undefined, can't send notifications to users");
      }

      if (dayjs(date).utc().isBefore(dayjs().utc(), "day")) {
        throw new Error("date is in the past, can't send notifications to users");
      }

      const notifications = await this.database
        .select({
          id: userWaitlists.id,
          userId: userWaitlists.userId,
          courseId: userWaitlists.courseId,
          date: userWaitlists.date,
          subDomainURL: entities.subdomain,
          courseName: courses.name,
          cdnKey: assets.key,
          extension: assets.extension,
        })
        .from(userWaitlists)
        .innerJoin(courses, eq(courses.id, courseId))
        .innerJoin(assets, eq(assets.id, courses.logoId))
        .innerJoin(entities, eq(entities.id, courses.entityId))
        .where(
          and(
            eq(userWaitlists.courseId, courseId),
            eq(userWaitlists.isDeleted, false),
            eq(userWaitlists.date, new Date(dayjs(date).format("YYYY-MM-DD") + "T00:00:00Z")),
            lte(userWaitlists.startTime, time),
            gte(userWaitlists.endTime, time)
          )
        )
        .execute()
        .catch((err) => {
          this.logger.error(`error getting notifications from database: ${err}`);
          loggerService.errorLog({
            userId: userId ?? "",
            url: `/UserWaitlistService/sendNotificationsForAvailableTeeTime`,
            userAgent: "",
            message: "ERROR_GETTING_NOTIFICATIONS",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              date,
              time,
              courseId
            })
          })
          throw new Error("Error getting notifications");
        });

      const sentNotificationsToUsers = new Set();

      const sentNotificationsToTodaysUsers = await secondaryDb.select({
        userId: userWaitlists.userId,
      })
        .from(userWaitlistAuditLogs)
        .where(
          and(
            eq(userWaitlistAuditLogs.date, new Date(dayjs(date).format("YYYY-MM-DD") + "T00:00:00Z")),
            eq(userWaitlistAuditLogs.isCancelledNotification, true)
          )
        )

      for (const notification of notifications) {
        // don't send notificaton same user or to lister
        if (sentNotificationsToUsers.has(notification.userId) || userId === notification.userId || sentNotificationsToTodaysUsers.filter((user) => user.userId === notification.userId).length > 0) {
          continue;
        }
        sentNotificationsToUsers.add(notification.userId);
        const data = {
          json: {
            notificationId: notification.id,
            courseId: notification.courseId,
            userId: notification.userId,
            courseLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${notification.cdnKey}.${notification.extension}`,
            subDomainURL: notification.subDomainURL,
            courseName: notification.courseName,
          },
        };

        await this.sendQstashMessage(data);
      }
    } catch (error: any) {
      this.logger.error(error);
      loggerService.errorLog({
        userId: userId ?? "",
        url: `/UserWaitlistService/sendNotificationsForAvailableTeeTime`,
        userAgent: "",
        message: "ERROR_SENDING_NOTIFICATIONS",
        stackTrace: `${error.stack}`,
        additionalDetailsJSON: JSON.stringify({
          date,
          time,
          courseId
        })
      })
    }
  };

  sendQstashMessage = async (data: NotificationQstashData) => {
    const res = await fetch(
      `${process.env.QSTASH_BASE_URL}${process.env.QSTASH_WAITLIST_NOTIFICATION_TOPIC}`,
      {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${process.env.QSTASH_TOKEN}`,
        },
      }
    );

    if (res.ok) {
      this.logger.info(
        `message sent successfully for user: ${data.json.userId} and course: ${data.json.courseId}`
      );
    } else {
      this.logger.error(
        `error sending message for user: ${data.json.userId} and course: ${data.json.courseId}`
      );
      loggerService.errorLog({
        userId: "",
        url: `/UserWaitlistService/sendQstashMessage`,
        userAgent: "",
        message: "ERROR_SENDING_QSTASH_MESSAGE",
        stackTrace: `Error sending message for user: ${data.json.userId} and course: ${data.json.courseId}`,
        additionalDetailsJSON: JSON.stringify({
          data
        })
      })
    }
  };
}
