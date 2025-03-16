import * as coursePayout from "./coursePayout";
import { coursePayoutDetail } from "./coursePayoutDetail";
import { coursePayoutLog } from "./coursePayoutLog";
import { courseTeeSheetBooking } from "./courseTeeSheetBooking";
import { courseTeeSheetBookingLog } from "./courseTeeSheetBookingLog";
import { foreupBooking } from "./foreupBooking";
import { foreupBookingPeople } from "./foreupBookingPeople";
import { foreupBookingPlayer } from "./foreupBookingPlayer";
import { foreupBookingSale } from "./foreupBookingSale";
import { foreupBookingSaleItem } from "./foreupBookingSaleItem";
import * as teeTimeIndexLogs from "./teeTimeIndexLogs";
import * as userPhoneCall from "./userPhoneCall";
import * as userWaitlistAuditLogs from "./userWaitlistAuditLogs";
import * as userWaitlistRecords from "./userWaitlistRecords";
import * as finixPaymentDispute from "./finixPaymentDispute";

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
  ...finixPaymentDispute,
};
