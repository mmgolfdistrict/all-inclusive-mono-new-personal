import { and, eq, gt, gte, lt, lte, type Db } from "@golf-district/database";
import { courseGlobalNotification } from "@golf-district/database/schema/courseGlobalNotification";
import { systemNotification } from "@golf-district/database/schema/systemNotification";
import { currentUtcTimestamp } from "@golf-district/shared";
import { walkthrough } from "@golf-district/database/schema/walkthrough";
import { walkthroughSection } from "@golf-district/database/schema/walkthroughSection";

export class SystemNotificationService {
  constructor(private readonly database: Db) {}

  async getSystemNotification() {
    const notifications = await this.database
      .select({
        id: systemNotification.id,
        shortMessage: systemNotification.shortMessage,
        longMessage: systemNotification.longMessage,
        bgColor: systemNotification.bgColor,
        color: systemNotification.color,
      })
      .from(systemNotification)
      .where(
        and(
          lte(systemNotification.startDate, currentUtcTimestamp()),
          gte(systemNotification.endDate, currentUtcTimestamp())
        )
      )
      .execute()
      .catch((e) => {
        console.log("Error in getting system notification");
      });
    return notifications;
  }

  async getCourseGlobalNotification(courseId: string) {
    const courseNotifications = await this.database
      .select({
        id: courseGlobalNotification.id,
        shortMessage: courseGlobalNotification.shortMessage,
        longMessage: courseGlobalNotification.longMessage,
        bgColor: courseGlobalNotification.bgColor,
        color: courseGlobalNotification.color,
      })
      .from(courseGlobalNotification)
      .where(
        and(
          eq(courseGlobalNotification.courseId, courseId),
          and(
            lte(courseGlobalNotification.startDateTime, currentUtcTimestamp()),
            gte(courseGlobalNotification.endDateTime, currentUtcTimestamp())
          )
        )
      )
      .execute()
      .catch((e) => {
        console.log("Error in getting system notification");
      });
    return courseNotifications;
  }

  getWalkthroughSetting = async () =>{
    const walkthroughSetting = await this.database
    .select({
      id: walkthrough.id,
      internalName: walkthrough.internalName,
      name: walkthrough.name,     
    })
    .from(walkthrough)

    return walkthroughSetting
  }

  getGuidMeSetting = async () =>{
    const guideMeSetting = await this.database
    .select({
      id: walkthroughSection.id,
      walkthroughId: walkthroughSection.walkthroughId,
      sectionId: walkthroughSection.sectionId,
      message: walkthroughSection.message,
      displayOrder: walkthroughSection.displayOrder,
    })
    .from(walkthroughSection)
    .orderBy(walkthroughSection.displayOrder)

    return guideMeSetting
  }

}
