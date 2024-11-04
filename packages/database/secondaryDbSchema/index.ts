import * as coursePayout from "./coursePayout";
import { coursePayoutDetail } from "./coursePayoutDetail";
import { coursePayoutLog } from "./coursePayoutLog";
import * as teeTimeIndexLogs from "./teeTimeIndexLogs";
import * as userWaitlistAuditLogs from "./userWaitlistAuditLogs";
import * as userWaitlistRecords from "./userWaitlistRecords";

export const schema = {
  ...teeTimeIndexLogs,
  ...userWaitlistRecords,
  ...userWaitlistAuditLogs,
  ...coursePayout,
  ...coursePayoutDetail,
  ...coursePayoutLog,
};
