import type { providerCourseLink } from "@golf-district/database/schema/providersCourseLink";
import { currentUtcTimestamp } from "@golf-district/shared";

export const mockProviderCourseLink: (typeof providerCourseLink.$inferInsert)[] = [
  {
    id: "providerCourseLink1",
    courseId: "course1",
    providerId: "provider1",
    providerCourseId: "providerCourse1",
    providerTeeSheetId: "providerTeeSheet1",
    lastIndex: currentUtcTimestamp,
    day1: currentUtcTimestamp,
    day2: currentUtcTimestamp,
    day3: currentUtcTimestamp,
    day4: currentUtcTimestamp,
    day5: currentUtcTimestamp,
    day6: currentUtcTimestamp,
    day7: currentUtcTimestamp,
    day8: currentUtcTimestamp,
    day9: currentUtcTimestamp,
    day10: currentUtcTimestamp,
    day11: currentUtcTimestamp,
    day12: currentUtcTimestamp,
    day13: currentUtcTimestamp,
    day14: currentUtcTimestamp,
  },
];
