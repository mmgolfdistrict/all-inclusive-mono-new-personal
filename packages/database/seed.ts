// //import { currentUtcTimestamp } from "@golf-district/shared/src/formatters";
// import { randomUUID } from "crypto";
// import { fa, faker } from "@faker-js/faker";
// import * as dotenv from "dotenv";
// import { db } from "./index";
// import { InsertAsset } from "./schema/assets";
// import { courses, InsertCourses } from "./schema/courses";
// import { entities, InsertEntities } from "./schema/entities";
// import { InsertUser, users } from "./schema/users";

// //The seed to create mock offers for tee times
// const config = {
//   numberOfUsers: 10,
//   numberOfUniqueImages: 10,
//   numberOfEntities: 10,
//   numberOfCoursesPerEntity: 3,
//   numberOfTeeTimesPerCourse: 5,
//   numberOfBookingsPerTeeTime: 2,
//   numberOfListingsPerCourse: 2,
// };
// //update as more fonts are added to the app
// const allowedFonts = ["font-lexend", "font-inter"];
// const main = async () => {
//   console.log("Seed start");
//   console.log(`inserting ${config.numberOfUniqueImages} mock images`);
//   for (let i = 0; i < config.numberOfUniqueImages; i++) {
//     const url = faker.image.url();
//     mockImages.push({
//       id: randomUUID(),
//       gdImage: faker.image.avatar(),
//     });
//   }
//   let mockImages: InsertAsset[] = [];

//   console.log("seeding mock images");
//   console.log(`inserting ${config.numberOfUsers} mock users`);
//   let mockUsers: InsertUser[] = [];
//   for (let i = 0; i < config.numberOfUsers; i++) {
//     mockUsers.push({
//       id: randomUUID(),
//       gdImage: faker.image.avatar(),
//       name: faker.person.fullName(),
//       handle: faker.internet.userName(),
//       phoneNumber: faker.phone.number(),
//       bannerImage: faker.image.url({ width: 1370, height: 270 }),
//       email: faker.internet.email(),
//       location: faker.location.city(),
//       address: faker.location.streetAddress(),
//     });
//   }
//   await db.insert(users).values(mockUsers);
//   console.log("seeding mock entities");
//   console.log(`inserting ${config.numberOfEntities} mock entities`);
//   let mockEntities: InsertEntities[] = [];
//   for (let i = 0; i < config.numberOfEntities; i++) {
//     mockEntities.push({
//       id: randomUUID(),
//       name: faker.company.name(),
//       font: allowedFonts[Math.floor(Math.random() * allowedFonts.length)],
//       color1: faker.color.rgb(),
//       color2: faker.color.rgb(),
//       color3: faker.color.rgb(),
//     });
//   }
//   await db.insert(entities).values(mockEntities);
//   console.log("seeding mock courses");
//   console.log(`inserting ${config.numberOfCoursesPerEntity * config.numberOfCoursesPerEntity} mock courses`);
//   let mockCourses: InsertCourses[] = [];
//   for (let i = 0; i < config.numberOfCoursesPerEntity * config.numberOfCoursesPerEntity; i++) {
//     mockCourses.push({
//       id: randomUUID(),
//       name: faker.company.name(),
//       description: faker.lorem.paragraph(),

//       entityId: mockEntities[Math.floor(Math.random() * mockEntities.length)].id,
//       forecastApi: "",
//     });
//   }
//   const entityId = randomUUID();
//   await db.insert(entities).values({
//     id: entityId,
//     name: "mock entity",
//     font: "mock font",
//     color1: "#763C28",
//     color2: "#382C1E",
//     color3: "#F54021",
//     updatedAt: currentUtcTimestamp(),
//   });
//   console.log("seeding mock course");
//   await db.insert(courses).values({
//     id: "1",
//     name: "mock course",
//     entityId: "1",
//     forecastApi: "",
//   });
//   console.log("Seed done");
// };

// main();
