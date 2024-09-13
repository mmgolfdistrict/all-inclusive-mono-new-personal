import { and, eq, gt, gte, lt, lte, type Db } from "@golf-district/database";
import { courseException } from "@golf-district/database/schema/courseException";
import { courses } from "@golf-district/database/schema/courses";
import type { NotificationObject } from "@golf-district/shared";
import dayjs from "dayjs";

export class CourseExceptionService {
  constructor(private readonly database: Db) {}

  async getCourseException(courseId: string) {
    const timeZone = await this.database
      .select({
        timezoneCorrection: courses.timezoneCorrection,
      })
      .from(courses)
      .where(eq(courses.id, courseId))
      .execute()
      .catch((e) => {
        console.log("Error in getting time zone Correction");
        throw "Error";
      });

    const offset = timeZone[0]?.timezoneCorrection ?? 0;

    // const time = dayjs.utc(currentUtcTimestamp()).utcOffset(offset).format("YYYY-MM-DD HH:MM:s.000")

    const notifications: NotificationObject[] | void = await this.database
      .select({
        id: courseException.id,
        courseId: courseException.courseId,
        shortMessage: courseException.shortMessage,
        longMessage: courseException.longMessage,
        displayType: courseException.displayType,
        startDate: courseException.startDate,
        endDate: courseException.endDate,
      })
      .from(courseException)
      .where(and(eq(courseException.courseId, courseId)))
      .execute()
      .catch((e) => {
        console.log("Error in getting system notification");
      });
    console.log("------------------------------------------>", notifications);

    const notificationUpdated: NotificationObject[] | void= notifications?.map((element) => {
      return {
        ...element,
        startDate: dayjs.utc(element.startDate).utcOffset(offset).format("YYYY-MM-DD HH:MM:s.000"),
        endDate: dayjs.utc(element.endDate).utcOffset(offset).format("YYYY-MM-DD HH:MM:s.000"),
      };
    });

    return notificationUpdated;
  }
}
