import { courseAssets } from "@golf-district/database/schema/courseAssets";
import { currentUtcTimestamp } from "@golf-district/shared";

export const mockCourseAssets: (typeof courseAssets.$inferInsert)[] = [
  {
    id: "courseasset1",
    order: 1,
    courseId: "course1",
    assetId: "asset1",
  },
];
