import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { datetime, index, int, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const clarityMetricData = mySqlTable('clarityMetricData', {
  id: varchar("id", { length: 36 }).notNull().primaryKey(),
  metricId: varchar("metricId", { length: 36 })
    .notNull(),
  dimensionId: varchar("dimensionId", { length: 36 })
    .notNull(),
  entityId: varchar("entityId", { length: 36 })
    .notNull(),
  dimension: varchar("dimension", { length: 191 }),
  sessionsCount: int('sessionsCount'),
  sessionsWithMetricPercentage: int('sessionsWithMetricPercentage'),
  sessionsWithoutMetricPercentage: int('sessionsWithoutMetricPercentage'),
  pagesViews: int('pagesViews'),
  subTotal: int('subTotal'),
  averageScrollDepth: int('averageScrollDepth'),
  totalSessionCount: int('totalSessionCount'),
  totalBotSessionCount: int('totalBotSessionCount'),
  distinctUserCount: int('distinctUserCount'),
  pagesPerSessionPercentage: int('pagesPerSessionPercentage'),
  totalTime: int('totalTime'),
  activeTime: int('activeTime'),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
    .notNull(),
},
(table) => ({
  metricIdx: index('idx_metric_id').on(table.metricId),
  dimensionIdx: index('idx_dimension_id').on(table.dimensionId),
  metricDimensionIdx: index('idx_metric_dimension_id').on(table.metricId, table.dimensionId),
  createdDateTimeIdx: index('idx_created_date_time').on(table.createdDateTime),
}));

export type SelectClarityMetricData = InferSelectModel<typeof clarityMetricData>;
export type InsertClarityMetricData = InferInsertModel<typeof clarityMetricData>;
