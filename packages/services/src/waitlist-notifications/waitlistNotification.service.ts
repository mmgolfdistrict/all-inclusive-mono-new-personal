import { randomUUID } from "crypto";
import { and, asc, eq, type Db, inArray, gte } from "@golf-district/database";
import type { InsertWaitlistNotifications } from "@golf-district/database/schema/waitlistNotifications";
import { waitlistNotifications } from "@golf-district/database/schema/waitlistNotifications";
import Logger from "@golf-district/shared/src/logger";
import type {
  CreateWaitlistNotification,
  CreateWaitlistNotifications,
  UpdateWaitlistNotification,
} from "./types";
import dayjs from "dayjs";
import { courses } from "@golf-district/database/schema/courses";
import UTC from "dayjs/plugin/utc";

dayjs.extend(UTC);
/**
 * Service class for handling waitlist notification operations.
 */
export class WaitlistNotificationService {
  private readonly logger = Logger(WaitlistNotificationService.name);

  constructor(private readonly database: Db) { }

  getWaitlist = async (userId: string, courseId: string) => {
    try {
      const today = new Date(dayjs().startOf('day').utc().format("YYYY-MM-DD HH:mm:ss"));
      const waitlist = await this.database
        .select({
          id: waitlistNotifications.id,
          courseId: waitlistNotifications.courseId,
          startTime: waitlistNotifications.startTime,
          endTime: waitlistNotifications.endTime,
          playerCount: waitlistNotifications.playerCount,
          date: waitlistNotifications.date,
          courseName: courses.name,
        })
        .from(waitlistNotifications)
        .innerJoin(courses, eq(courses.id, waitlistNotifications.courseId))
        .where(
          and(
            eq(waitlistNotifications.userId, userId),
            eq(waitlistNotifications.courseId, courseId),
            eq(waitlistNotifications.isDeleted, false),
            gte(waitlistNotifications.date, today)
          )
        )
        .orderBy(asc(waitlistNotifications.date), asc(waitlistNotifications.playerCount), asc(waitlistNotifications.startTime))
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

  insertWaitlistNotifications = async (waitlistNotificationsList: InsertWaitlistNotifications[]) => {
    try {
      await this.database
        .insert(waitlistNotifications)
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
        .update(waitlistNotifications)
        .set(notificationData)
        .where(eq(waitlistNotifications.id, notificationId))
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
        .update(waitlistNotifications)
        .set({
          isDeleted: true,
        })
        .where(inArray(waitlistNotifications.id, notificationIds))
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
  ): Promise<[InsertWaitlistNotifications[], string[]]> => {
    try {
      const insertNotifications: InsertWaitlistNotifications[] = [];
      const deleteNotifications: string[] = [];

      const newNotification = waitlistNotification;

      // converting date to utc format
      const date = new Date(dayjs(waitlistNotification.date).format("YYYY-MM-DD") + "T00:00:00Z");

      const waitlist = await this.database
        .select()
        .from(waitlistNotifications)
        .where(
          and(
            eq(waitlistNotifications.userId, waitlistNotification.userId),
            eq(waitlistNotifications.courseId, waitlistNotification.courseId),
            eq(waitlistNotifications.playerCount, waitlistNotification.playerCount),
            eq(waitlistNotifications.date, date),
            eq(waitlistNotifications.isDeleted, false)
          )
        )
        .orderBy(asc(waitlistNotifications.startTime))
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
