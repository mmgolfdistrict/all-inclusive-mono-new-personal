import { randomUUID } from "crypto";
import { and, asc, eq, gte, inArray, type Db, lt, lte } from "@golf-district/database";
import { courses } from "@golf-district/database/schema/courses";
import type { InsertUserWaitlists } from "@golf-district/database/schema/userWaitlists";
import { userWaitlists } from "@golf-district/database/schema/userWaitlists";
import Logger from "@golf-district/shared/src/logger";
import dayjs from "dayjs";
import UTC from "dayjs/plugin/utc";
import type {
  CreateWaitlistNotification,
  CreateWaitlistNotifications,
  UpdateWaitlistNotification,
  WaitlistNotification,
} from "./types";
import { entities } from "@golf-district/database/schema/entities";
import type { NotificationService } from "../notification/notification.service";
import { teeTimes } from "@golf-district/database/schema/teeTimes";

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
        .orderBy(
          asc(userWaitlists.date),
          asc(userWaitlists.playerCount),
          asc(userWaitlists.startTime)
        )
        .execute()
        .catch((err) => {
          this.logger.error(`error getting waitlist from database: ${err}`);
          throw new Error("Error getting waitlist");
        });
      return waitlist;
    } catch (error) {
      this.logger.error(error);
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
    } catch (error) {
      this.logger.error(error);
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
    } catch (error) {
      this.logger.error(error);
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
    } catch (error) {
      this.logger.error(error);
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
    } catch (error) {
      this.logger.error(error);
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
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  };

  sendWaitlistNotifications = async () => {
    try {
      const today = new Date(dayjs().startOf("day").add(1, "day").utc().format("YYYY-MM-DD HH:mm:ss")); // want to send notification for tomorrow

      // get all notifications
      const notifications = await this.database
        .select({
          id: userWaitlists.id,
          userId: userWaitlists.userId,
          courseId: userWaitlists.courseId,
          startTime: userWaitlists.startTime,
          endTime: userWaitlists.endTime,
          playerCount: userWaitlists.playerCount,
          date: userWaitlists.date,
        })
        .from(userWaitlists)
        .where(and(eq(userWaitlists.isDeleted, false), gte(userWaitlists.date, today)))
        .orderBy(
          asc(userWaitlists.date),
          asc(userWaitlists.playerCount),
          asc(userWaitlists.startTime)
        )
        .execute()
        .catch((err) => {
          this.logger.error(`error getting waitlist from database: ${err}`);
          throw new Error("Error getting waitlist");
        });
      // console.log("notificationsGroupedByCourse", notifications);

      // group notifications by courseIDs (order them by date)
      const notificationsGroupedByCourse = notifications.reduce((acc, notification: WaitlistNotification) => {
        if (!acc[notification.courseId]) {
          acc[notification.courseId] = [];
        }
        acc[notification.courseId]!.push(notification);
        return acc;
      }, {} as Record<string, WaitlistNotification[]>);
      // console.dir(notificationsGroupedByCourse, { depth: null });

      // for each course's notifications group them again by userIDs
      const notificationsGroupedByUserAndCourse = Object.keys(notificationsGroupedByCourse).reduce(
        (acc, courseId) => {
          const notifications = notificationsGroupedByCourse[courseId];
          notifications?.forEach((notification) => {
            if (
              !acc?.[notification.courseId] ||
              (acc?.[notification.courseId] && !acc[notification.courseId]![notification.userId])
            ) {
              if (!acc[notification.courseId]) {
                acc[notification.courseId] = {};
              }
              acc[notification.courseId]![notification.userId] = [];
            }
            acc?.[notification.courseId]?.[notification.userId]?.push(notification);
          });
          return acc;
        },
        {} as Record<string, Record<string, WaitlistNotification[]>>
      );

      // console.dir(notificationsGroupedByUser, { depth: null });

      // for each user's notifications check availablity for each date(for now)
      for (const courseId in notificationsGroupedByUserAndCourse) {
        const [entity] = await this.database
          .select({ subdomain: entities.subdomain })
          .from(courses)
          .innerJoin(entities, eq(courses.entityId, entities.id))
          .where(eq(courses.id, courseId))
          .execute()
          .catch((err) => {
            this.logger.error(err);
            throw new Error(err);
          });

        if (!entity) {
          throw new Error("No subdomain found for course: " + courseId);
        }

        for (const userId in notificationsGroupedByUserAndCourse[courseId]) {
          const notifications = notificationsGroupedByUserAndCourse?.[courseId]?.[userId];

          if (!notifications || notifications.length === 0) {
            continue;
          }

          const availibilites = await this.getAvailableTeeTimesBasedOnNotification(notifications);
          console.log("notifications", notifications);
          console.log("availibilites", availibilites);

          const urls = availibilites.map((teeTime) => {
            // return `https://${entity.subdomain}/${courseId}/checkout?teeTimeId=${teeTime.id}&playerCount=${teeTime.playerCount}`;
            return `http://localhost:3000/${courseId}/checkout?teeTimeId=${teeTime.id}&playerCount=${teeTime.playerCount}`;
          });

          if (availibilites.length > 0) {
            // send email to user
            await this.notificationService.createNotification(userId, "Waitlist Notification",
              `
              Your tee time(s) are available!
              ${urls.join("\n")}
              `
              , courseId);
          }
        }
      }
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  };

  getAvailableTeeTimesBasedOnNotification = async (notifications: WaitlistNotification[]) => {
    try {
      const MAX_AVAILABLE_TEE_TIMES_TO_RETURN = 3;
      const availableTeeTimesToReturn = [];

      for (const notification of notifications) {
        if (availableTeeTimesToReturn.length > MAX_AVAILABLE_TEE_TIMES_TO_RETURN) {
          return availableTeeTimesToReturn.slice(0, MAX_AVAILABLE_TEE_TIMES_TO_RETURN);
        }
        // console.log(dayjs(notification.date).utc().format("YYYY-MM-DD HH:mm:ss.SSS"));
        // console.log(dayjs(notification.date).add(1, 'day').utc().format("YYYY-MM-DD HH:mm:ss.SSS"));
        const availableTeeTimes = await this.database
          .select()
          .from(teeTimes)
          .where(
            and(
              eq(teeTimes.courseId, notification.courseId),
              gte(teeTimes.providerDate, dayjs(notification.date).utc().format("YYYY-MM-DD HH:mm:ss.SSS")),
              lt(
                teeTimes.providerDate,
                dayjs(notification.date).add(1, "day").utc().format("YYYY-MM-DD HH:mm:ss.SSS")
              ),
              gte(teeTimes.time, notification.startTime),
              lte(teeTimes.time, notification.endTime),
              gte(teeTimes.availableFirstHandSpots, notification.playerCount)
            )
          )
          .orderBy(asc(teeTimes.time))
          .limit(MAX_AVAILABLE_TEE_TIMES_TO_RETURN)
          .execute()
          .catch((err) => {
            this.logger.error(`error getting teeTimes from database: ${err}`);
            throw new Error("Error getting teeTimes");
          });
        availableTeeTimesToReturn.push(...availableTeeTimes.map((teeTime) => ({ ...teeTime, playerCount: notification.playerCount })));
      }
      return availableTeeTimesToReturn;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  };
}
