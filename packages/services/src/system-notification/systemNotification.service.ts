import { and, gt, gte, lt, lte, type Db } from "@golf-district/database";
import { systemNotification } from "@golf-district/database/schema/systemNotification";
import { currentUtcTimestamp } from "@golf-district/shared";


export class SystemNotificationService{
    constructor(
        private readonly database: Db,
      ) {}

async getSystemNotification (){
console.log("===========>",currentUtcTimestamp())
    const notifications = await this.database
      .select({
        id : systemNotification.id,
        shortMessage : systemNotification.shortMessage,
        longMessage : systemNotification.longMessage,
        displayType : systemNotification.displayType,
      })
      .from(systemNotification)
      .where(and(lte(systemNotification.startDate, currentUtcTimestamp()), gte(systemNotification.endDate, currentUtcTimestamp())))
      .execute().catch((e)=>{
        console.log("Error in getting system notification")
      });
        return notifications
    }
}