import { randomUUID } from "crypto";
import { and, asc, eq, gte, inArray, type Db } from "@golf-district/database";
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
} from "./types";

dayjs.extend(UTC);
/**
 * Service class for handling waitlist notification operations.
 */
export class UserWaitlistService {
  private readonly logger = Logger(UserWaitlistService.name);

  constructor(private readonly database: Db) { }

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
}
