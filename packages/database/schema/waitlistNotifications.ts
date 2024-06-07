import { relations, sql, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { boolean, date, datetime, index, int, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { courses } from "./courses";
import { users } from "./users";


export const waitlistNotifications = mySqlTable(
    "waitlistNotification",
    {
        id: varchar("id", { length: 36 }).notNull().primaryKey(),
        userId: varchar("userId", { length: 36 }).notNull(),
        courseId: varchar("courseId", { length: 36 }).notNull(),
        date: date("date").notNull(),
        startTime: int("startTime").notNull(),
        endTime: int("endTime").notNull(),
        playerCount: int("playerCount").notNull(),
        createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .notNull(),
        isDeleted: boolean("isDeleted").notNull().default(false),
    },
    (table) => {
        return {
            date: index("WaitlistNotification_date_idx").on(table.date),
            userId: index("WaitlistNotification_userId_idx").on(table.userId),
            courseId: index("WaitlistNotification_courseId_idx").on(table.courseId),
            startTime: index("WaitlistNotification_startTime_idx").on(table.startTime),
            endTime: index("WaitlistNotification_endTime_idx").on(table.endTime),
            playerCount: index("WaitlistNotification_playerCount_idx").on(table.playerCount),
        };
    }
);

export const waitlistNotificationsRelations = relations(waitlistNotifications, ({ one }) => ({
    user: one(users, {
        fields: [waitlistNotifications.userId],
        references: [users.id],
    }),
    course: one(courses, {
        fields: [waitlistNotifications.courseId],
        references: [courses.id],
    }),
}))

export type SelectWaitlistNotifications = InferSelectModel<typeof waitlistNotifications>;
export type InsertWaitlistNotifications = InferInsertModel<typeof waitlistNotifications>;