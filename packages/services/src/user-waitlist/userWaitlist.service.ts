import { randomUUID } from "crypto";
import { and, asc, count, eq, gte, inArray, lt, lte, secondaryDb, type Db } from "@golf-district/database";
import { assets } from "@golf-district/database/schema/assets";
import { courses } from "@golf-district/database/schema/courses";
import { entities } from "@golf-district/database/schema/entities";
import { teeTimes } from "@golf-district/database/schema/teeTimes";
import { users } from "@golf-district/database/schema/users";
import type { InsertUserWaitlists } from "@golf-district/database/schema/userWaitlists";
import { userWaitlists } from "@golf-district/database/schema/userWaitlists";
import { userWaitlistAuditLogs } from "@golf-district/database/secondaryDbSchema/userWaitlistAuditLogs";
import { userWaitlistRecords } from "@golf-district/database/secondaryDbSchema/userWaitlistRecords";
import Logger from "@golf-district/shared/src/logger";
import dayjs from "dayjs";
import UTC from "dayjs/plugin/utc";
import type { NotificationService } from "../notification/notification.service";
import type {
  CreateWaitlistNotification,
  CreateWaitlistNotifications,
  NotificationQstashData,
  UpdateWaitlistNotification,
  WaitlistNotification,
} from "./types";

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

  sendWaitlistNotificationToUser = async (
    courseId: string,
    userId: string,
    CourseLogoURL: string,
    subDomainURL: string,
    courseName: string,
    notificationId?: string
  ) => {
    try {
      const tomorrowsDate = new Date(
        dayjs().utc().startOf("day").add(1, "day").format("YYYY-MM-DD") + "T00:00:00Z"
      ); // want to send notification for tomorrow

      // get all notifications
      let notifications;

      if (notificationId) {
        notifications = await this.database
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
          .where(eq(userWaitlists.id, notificationId))
          .execute()
          .catch((err) => {
            this.logger.error(`error getting waitlist from database: ${err}`);
            throw new Error("Error getting waitlist");
          });
      } else {
        notifications = await this.database
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
          .where(
            and(
              eq(userWaitlists.courseId, courseId),
              eq(userWaitlists.userId, userId),
              eq(userWaitlists.isDeleted, false),
              eq(userWaitlists.isSent, false),
              gte(userWaitlists.date, tomorrowsDate)
            )
          )
          .orderBy(asc(userWaitlists.date), asc(userWaitlists.playerCount), asc(userWaitlists.startTime))
          .execute()
          .catch((err) => {
            this.logger.error(`error getting waitlist from database: ${err}`);
            throw new Error("Error getting waitlist");
          });
      }

      const sortedNotifications = notifications.reduce((acc, notification: WaitlistNotification) => {
        const date = dayjs(notification.date).utc().format("YYYY-MM-DD");
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date]!.push(notification);
        return acc;
      }, {} as Record<string, WaitlistNotification[]>);

      const sortedNotificationsByDate = Object.keys(sortedNotifications).sort((a, b) => {
        const dateA = dayjs(a).utc();
        const dateB = dayjs(b).utc();
        return dateA.isBefore(dateB) ? -1 : 1;
      });

      const MAX_AVAILABLE_TEE_TIMES_TO_RETURN = 5;
      const availableNotificationTimes = [] as WaitlistNotification[];

      for (const date of sortedNotificationsByDate) {
        if (availableNotificationTimes.length >= MAX_AVAILABLE_TEE_TIMES_TO_RETURN) {
          break;
        }

        const availableTeeTime = await this.getAvailableTeeTimesBasedForDay(sortedNotifications[date]);
        if (availableTeeTime) {
          availableNotificationTimes.push(availableTeeTime);
        }
      }

      if (availableNotificationTimes.length > 0) {
        // send email to user
        const availableTimes = availableNotificationTimes.map((notificationTime) => {
          const date = dayjs(notificationTime.date);
          const formattedDate = date.format("dddd MMM DD, YYYY");
          const linkFormattedDate = date.format("YYYY-MM-DD");

          const startTimeDate = dayjs(notificationTime.date)
            .utc()
            .add(Math.floor(notificationTime.startTime / 100), "hour")
            .add(notificationTime.startTime % 100, "minute");
          const endTimeDate = dayjs(notificationTime.date)
            .utc()
            .add(Math.floor(notificationTime.endTime / 100), "hour")
            .add(notificationTime.endTime % 100, "minute");

          const startTimeFormated = startTimeDate.format("hh:mm A");
          const endTimeFormated = endTimeDate.format("hh:mm A");

          return {
            date: formattedDate,
            time: `${startTimeFormated} - ${endTimeFormated}`,
            // bookNowURL: `http://localhost:3000/${courseId}?dateType=custom&startTime=${notificationTime.startTime}&endTime=${notificationTime.endTime}&date=${linkFormattedDate}&playerCount=${notificationTime.playerCount}`,
            bookNowURL: `https://${subDomainURL}/${courseId}?dateType=custom&startTime=${notificationTime.startTime}&endTime=${notificationTime.endTime}&date=${linkFormattedDate}&playerCount=${notificationTime.playerCount}`,
            stopNotificationURL: `https://${subDomainURL}/${courseId}/notify-me/stop-notification/${notificationTime.id}`,
            courseName,
          };
        });

        const dates = [] as string[];

        for (const availableTime of availableTimes) {
          if (availableTime.date in dates) {
            continue;
          } else {
            dates.push(availableTime.date);
          }
        }

        // group available times by date
        // const availableTimesByDate = dates.reduce((acc, date) => {
        //   acc[date] = availableTimes.filter((time) => time.date === date);
        //   return acc;
        // }, {} as Record<string, typeof availableTimes>);

        const template = {
          CourseLogoURL,
          HeaderLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/emailheaderlogo.png`,
          availableTimes: availableTimes,
          dates,
        };

        await this.notificationService.createNotification(
          userId || "",
          "Waitlist Notification",
          "",
          courseId,
          process.env.SENDGRID_USER_WAITLIST_NOTIFICATION_TEMPLATE_ID,
          template
        );

        const notificationIds = availableNotificationTimes.map((notification) => notification.id);

        await this.database
          .update(userWaitlists)
          .set({ isSent: true })
          .where(
            inArray(userWaitlists.id, notificationIds),
          )
          .execute()
          .catch((err) => {
            this.logger.error(`error updating waitlist in database: ${err}`);
          })

        const logData = {
          id: randomUUID(),
          userId: userId,
          courseId: courseId,
          json: JSON.stringify({
            notificationsSentFor: availableNotificationTimes,
            status: "success",
          }),
        };

        await secondaryDb
          .insert(userWaitlistAuditLogs)
          .values(logData)
          .execute()
          .catch((err) => {
            this.logger.error(`error inserting waitlist audit log into database: ${err}`);
          });
      }
      this.logger.info(`sent waitlist notification, userId: ${userId}, courseId: ${courseId}`);
    } catch (error) {
      this.logger.error(error);
      const logData = {
        id: randomUUID(),
        userId: userId,
        courseId: courseId,
        json: JSON.stringify({ notificationsSentFor: [], status: "error", error: JSON.stringify(error) }),
      };

      await secondaryDb
        .insert(userWaitlistAuditLogs)
        .values(logData)
        .execute()
        .catch((err) => {
          this.logger.error(`error inserting waitlist audit log into database: ${err}`);
        });
    }
  };

  sendWaitlistNotifications = async (courseId: string) => {
    try {
      let offset = 0;
      const USER_LIMIT = 50;
      const todaysDate = new Date(dayjs().utc().startOf("day").format("YYYY-MM-DD") + "T00:00:00Z");
      let newRecordData;

      const [course] = await this.database
        .select({
          cdnKey: assets.key,
          extension: assets.extension,
          subDomainURL: entities.subdomain,
          coursesName: courses.name,
        })
        .from(courses)
        .leftJoin(assets, eq(assets.id, courses.logoId))
        .leftJoin(entities, eq(entities.id, courses.entityId))
        .where(eq(courses.id, courseId))
        .execute()
        .catch((err) => {
          this.logger.error(`error getting course logo from database: ${err}`);
          throw new Error("Error getting course logo");
        });

      const [record] = await secondaryDb
        .select({
          id: userWaitlistRecords.id,
          totalUsers: userWaitlistRecords.totalUsers,
          usersDone: userWaitlistRecords.usersDone,
        })
        .from(userWaitlistRecords)
        .where(and(eq(userWaitlistRecords.courseId, courseId), eq(userWaitlistRecords.date, todaysDate)))
        .execute()
        .catch((err) => {
          this.logger.error(`error getting waitlist record from database: ${err}`);
          throw new Error("Error getting waitlist record");
        });

      if (!record) {
        const [allUsers] = await this.database
          .select({ totalUsers: count() })
          .from(users)
          .execute()
          .catch((err) => {
            this.logger.error(`error fetching total users from database: ${err}`);
            throw new Error("Error fetching total users");
          });

        newRecordData = {
          id: randomUUID(),
          courseId,
          totalUsers: allUsers?.totalUsers ?? 0,
          usersDone: 0,
          date: todaysDate,
        };

        await secondaryDb
          .insert(userWaitlistRecords)
          .values(newRecordData)
          .execute()
          .catch((err) => {
            this.logger.error(`error inserting waitlist record into database: ${err}`);
            throw new Error("Error inserting waitlist record");
          });
      }

      if (record) {
        offset = record.usersDone;
      }

      if (record && record.usersDone >= record.totalUsers) {
        return;
      }

      const userIds = await this.database
        .select({ id: users.id })
        .from(users)
        .orderBy(users.email)
        .limit(USER_LIMIT)
        .offset(offset)
        .execute()
        .catch((err) => {
          this.logger.error(`error fetching users from database: ${err}`);
          throw new Error("Error fetching users");
        });

      // send to qstash for further process
      for (const user of userIds) {
        const data = {
          json: {
            courseId,
            userId: user.id,
            courseLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${course?.cdnKey}.${course?.extension}`,
            subDomainURL: course?.subDomainURL,
            courseName: course?.coursesName,
          },
        };

        await this.sendQstashMessage(data);
      }

      if (record || newRecordData) {
        const recordId = record ? record.id : newRecordData ? newRecordData.id : "";
        await secondaryDb
          .update(userWaitlistRecords)
          .set({
            usersDone: (offset > 0 ? record?.usersDone ?? 0 : 0) + userIds.length,
          })
          .where(eq(userWaitlistRecords.id, recordId))
          .execute()
          .catch((err) => {
            this.logger.error(`error updating waitlist record in database: ${err}`);
            throw new Error("Error updating waitlist record");
          });
      }
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  };

  getAvailableTeeTimesBasedForDay = async (notifications: WaitlistNotification[] | undefined) => {
    try {
      if (notifications === undefined) {
        return;
      }

      for (const notification of notifications) {
        const [availableTeeTime] = await this.database
          .select({ id: teeTimes.id })
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
          .limit(1)
          .execute()
          .catch((err) => {
            this.logger.error(`error getting teeTimes from database: ${err}`);
            throw new Error("Error getting teeTimes");
          });
        if (availableTeeTime) {
          return notification;
        }
      }
      return;
    } catch (error) {
      this.logger.error(error);
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
          throw new Error("Error getting notifications");
        });

      const sentNotificationsToUsers = new Set();

      for (const notification of notifications) {
        // don't send notificaton same user or to lister
        if (sentNotificationsToUsers.has(notification.userId) || userId === notification.userId) {
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
    } catch (error) {
      this.logger.error(error);
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
    }
  };
}
