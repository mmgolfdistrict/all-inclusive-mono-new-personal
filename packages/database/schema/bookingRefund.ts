import { datetime, index, int, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { sql } from "drizzle-orm";
import { table } from "console";

export const bookingRefund = mySqlTable("bookingRefund",
    {
        id: varchar("id", { length: 191 }).notNull().primaryKey(),
        bookingId: varchar('bookingId', { length: 36 }).notNull(),
        refundAmount: int("refundAmount").notNull(),
        status: varchar("status", { length: 15 }).notNull().$type<"PENDING" | "INITIATED" | "COMPLETED" | "REJECTED" | "AI GENERATED">(),
        extrenalRefundId: varchar("extrenalRefundId", { length: 100 }),
        createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
            .notNull()
            .default(sql`CURRENT_TIMESTAMP(3)`),
        lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
            .notNull().default(
                sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`
            ),
    },
    (table) => {
        return {
            bookingId: index('BookingRefund_bookingId_idx').on(table.bookingId)
        }
    }
)