import { and, eq, gt, gte, lt, lte, type Db } from "@golf-district/database";
import { courseException } from "@golf-district/database/schema/courseException";
import { courses } from "@golf-district/database/schema/courses";
import type { NotificationObject } from "@golf-district/shared";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

export class CourseExceptionService {
  constructor(private readonly database: Db) { }

  async getCourseException(courseId: string) {
    const courseData = await this.database
      .select({
        timezoneISO: courses.timezoneISO,
      })
      .from(courses)
      .where(eq(courses.id, courseId))
      .execute()
      .catch((e) => {
        console.log("Error in getting time zone Correction");
        throw "Error";
      });

    const timezoneISO = courseData[0]?.timezoneISO ?? "UTC";

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
        bgColor: courseException.bgColor,
        color: courseException.color,
      })
      .from(courseException)
      .where(and(eq(courseException.courseId, courseId)))
      .execute()
      .catch((e) => {
        console.log("Error in getting system notification");
      });

    const notificationUpdated: NotificationObject[] | void = notifications?.map((element) => {
      return {
        ...element,
        startDate: dayjs.utc(element.startDate).tz(timezoneISO, true).format("YYYY-MM-DD HH:mm:ss.SSS"),
        endDate: dayjs.utc(element.endDate).tz(timezoneISO, true).format("YYYY-MM-DD HH:mm:ss.SSS"),
      };
    });

    return notificationUpdated;
  }
}
