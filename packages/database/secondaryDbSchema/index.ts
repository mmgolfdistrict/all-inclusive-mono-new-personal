import * as teeTimeIndexLogs from "./teeTimeIndexLogs";
import * as userWaitlistAuditLogs from "./userWaitlistAuditLogs";
import * as userWaitlistRecords from "./userWaitlistRecords";

export const schema = {
  ...teeTimeIndexLogs,
  ...userWaitlistRecords,
  ...userWaitlistAuditLogs,
};
