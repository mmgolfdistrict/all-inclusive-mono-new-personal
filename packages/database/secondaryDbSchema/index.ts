import * as clarityDimensions from "./clarityDimension";
import * as clarityMetrics from "./clarityMetric";
import * as clarityMetricData from "./clarityMetricData";
import * as coursePayout from "./coursePayout";
import { coursePayoutDetail } from "./coursePayoutDetail";
import { coursePayoutLog } from "./coursePayoutLog";
import { courseTeeSheetBooking } from "./courseTeeSheetBooking";
import { courseTeeSheetBookingLog } from "./courseTeeSheetBookingLog";
import * as finixPaymentDispute from "./finixPaymentDispute";
import { foreupBooking } from "./foreupBooking";
import { foreupBookingPeople } from "./foreupBookingPeople";
import { foreupBookingPlayer } from "./foreupBookingPlayer";
import { foreupBookingSale } from "./foreupBookingSale";
import { foreupBookingSaleItem } from "./foreupBookingSaleItem";
import * as hyperswitchPayment from "./hyperswitchPayment";
import * as teeTimeIndexLogs from "./teeTimeIndexLogs";
import * as userPhoneCall from "./userPhoneCall";
import { userReminderNotificationAuditLogs } from "./userReminderNotificationAuditLogs";
import * as userWaitlistAuditLogs from "./userWaitlistAuditLogs";
import * as userWaitlistRecords from "./userWaitlistRecords";
import * as teeTimeIndexErrorLogs from "./teeTimeIndexErrorLogs";

export const schema = {
  ...teeTimeIndexLogs,
  ...userWaitlistRecords,
  ...userWaitlistAuditLogs,
  ...coursePayout,
  ...coursePayoutDetail,
  ...coursePayoutLog,
  ...foreupBooking,
  ...foreupBookingSaleItem,
  ...foreupBookingSale,
  ...foreupBookingPlayer,
  ...foreupBookingPeople,
  ...courseTeeSheetBooking,
  ...courseTeeSheetBookingLog,
  ...userPhoneCall,
  ...userReminderNotificationAuditLogs,
  ...finixPaymentDispute,
  ...hyperswitchPayment,
  ...clarityMetrics,
  ...clarityDimensions,
  ...clarityMetricData,
  ...teeTimeIndexErrorLogs
};
