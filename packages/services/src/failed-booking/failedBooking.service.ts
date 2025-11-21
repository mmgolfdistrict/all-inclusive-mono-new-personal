import { and, eq, gte, type Db, sql, desc } from "@golf-district/database";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { appSettingService } from "../app-settings/initialized";
import { failedBooking } from "@golf-district/database/schema/failedBookings";

dayjs.extend(utc);

type FailedBookingResponse = {
    isFailedBooking: boolean;
    message?: string;
};

export class FailedBookingService {
    constructor(private readonly database: Db) { }

    async userHasFailedBooking(userId: string): Promise<FailedBookingResponse> {
        const failedBookingDuration = await appSettingService.getAppSetting("FAILED_BOOKING_MAX_HOURS_TO_WAIT");

        if (!failedBookingDuration) {
            return {
                isFailedBooking: false,
                message: '',
            };
        }

        const result = await this.database
            .select({
                lastFailedBooking: failedBooking.createdDateTime,
            })
            .from(failedBooking)
            .where(
                and(
                    eq(failedBooking.userId, userId),
                    gte(
                        failedBooking.createdDateTime,
                        sql`NOW() - INTERVAL ${sql.raw(String(failedBookingDuration.value || 1))} HOUR`
                    )
                )
            )
            .orderBy(desc(failedBooking.createdDateTime))
            .limit(2)
            .execute();

        if (result.length > 0 && result[0]?.lastFailedBooking) {
            const expirationTime = dayjs.utc(result[0].lastFailedBooking)
                .add(Number(failedBookingDuration.value), "hour");

            const now = dayjs.utc();
            const diffInMinutes = expirationTime.diff(now, "minute");

            const message =
                diffInMinutes >= 60
                    ? `Your previous attempts to book a tee time have failed. This could be an indication that there is something wrong with your card or with the course point-of-sale systems. Please wait ${Math.ceil(diffInMinutes / 60)} hour(s) before trying again.`
                    : `Your previous attempts to book a tee time have failed. This could be an indication that there is something wrong with your card or with the course point-of-sale systems. Please wait ${diffInMinutes} minute(s) before trying again.`;

            return {
                isFailedBooking: true,
                message,
            };
        }

        return {
            isFailedBooking: false,
        };
    }
}