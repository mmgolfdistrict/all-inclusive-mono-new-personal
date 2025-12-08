import { sql } from "drizzle-orm";
import { int, mysqlView, text, varchar } from "drizzle-orm/mysql-core";
import { courses } from "../schema/courses";
import { adminUsers } from "../schema/adminUsers";
import { adminUserCourse } from "../schema/adminUserCourse";

export const userACLView = mysqlView(
    "userACLView",
    {
        CourseID: int("CourseID"),
        CourseName: varchar("CourseName", { length: 255 }),
        EMailList: text("EMailList"),
    }
).as(
    sql`
    SELECT 
        ${courses.id} AS CourseID,
        ${courses.name} AS CourseName,
        GROUP_CONCAT(${adminUsers.email}) AS EMailList
    FROM ${adminUsers} AUSR
    INNER JOIN ${adminUserCourse} AUSRCRS
        ON AUSR.id = AUSRCRS.adminUserId
    INNER JOIN ${courses} CRS
        ON CRS.id = AUSRCRS.courseId
    GROUP BY CRS.id, CRS.name
  `
);