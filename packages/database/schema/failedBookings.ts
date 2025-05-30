import {
    varchar,
    datetime,
} from 'drizzle-orm/mysql-core';
import { mySqlTable } from './_table';
import { type InferInsertModel, type InferSelectModel, sql } from 'drizzle-orm';

export const failedBooking = mySqlTable('failedBooking', {
    id: varchar('id', { length: 36 }).notNull().primaryKey(),
    userId: varchar('userId', { length: 36 }).notNull(),
    teeTimeId: varchar('teeTimeId', { length: 36 }).notNull(),
    cartId: varchar('cartId', { length: 36 }).notNull(),
    providerPaymentId: varchar('providerPaymentId', { length: 36 }).notNull(),
    weatherGuaranteeQuoteId: varchar('weatherGuaranteeQuoteId', { length: 36 }),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
        .default(sql`CURRENT_TIMESTAMP(3)`)
        .notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
        .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
        .notNull(),
});

export type SelectAppRelease = InferSelectModel<typeof failedBooking>;
export type InsertAppRelease = InferInsertModel<typeof failedBooking>;
