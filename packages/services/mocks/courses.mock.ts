import type { courses } from "@golf-district/database/schema/courses";

export const mockCourses: (typeof courses.$inferInsert)[] = [
  {
    id: "course1",
    name: "Course One Name",
    address: "Course One Address",
    description: "Course One Description",
    longitude: 34.0549,
    latitude: 118.2426,
    forecastApi: "forecast api",
    charityName: "Course One Charity Name",
    charityDescription: "Course One Charity Description",
    privacyPolicy: "Course One Privacy Policy",
    termsAndConditions: "Course One Terms and Conditions",
    convenienceFeesFixedPerPlayer: 10,
    markupFeesFixedPerPlayer: 15,
    openTime: new Date(new Date().getTime() - 1000).toISOString().replace("T", " ").replace("Z", ""),
    closeTime: new Date(new Date().getTime() + 10000).toISOString().replace("T", " ").replace("Z", ""),
    logoId: "Course One",
    entityId: "entity1",
    providerId: "provider1",
    supportCharity: true,
    supportSensibleWeather: true,
    isDeleted: false,
  },
];
