import { datetime, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { sql } from "drizzle-orm";
export const phoneBookingCourseConfigurations = mySqlTable(`phoneBookingCourseConfigurations`, {
    id: varchar(`id`, { length: 36 }).notNull().primaryKey(),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    coursePhoneNumber: varchar("coursePhoneNumber", { length: 50 }).notNull(),
    // operatorPhoneNumber: varchar("operatorPhoneNumber", { length: 50 }).notNull(),
     createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
        .default(sql`CURRENT_TIMESTAMP(3)`)
        .notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
        .default(sql`CURRENT_TIMESTAMP(3)`)
        .notNull(),
});
