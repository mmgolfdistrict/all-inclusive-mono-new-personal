import * as teeTimeIndexLogs from "./teeTimeIndexLogs";
import * as userWaitlistRecords from "./userWaitlistRecords";
import * as userWaitlistAuditLogs from "./userWaitlistAuditLogs";

export const schema = {
  ...teeTimeIndexLogs,
  ...userWaitlistRecords,
  ...userWaitlistAuditLogs
};
