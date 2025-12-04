import { sql } from "drizzle-orm";
import { int, mysqlView, text, varchar } from "drizzle-orm/mysql-core";

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
        CRS.id AS CourseID,
        CRS.name AS CourseName,
        GROUP_CONCAT(AUSR.email) AS EMailList
    FROM golf_district_adminUser AUSR
    INNER JOIN golf_district_adminUserCourse AUSRCRS
        ON AUSR.id = AUSRCRS.adminUserId
    INNER JOIN golf_district_course CRS
        ON CRS.id = AUSRCRS.courseId
    GROUP BY CRS.id, CRS.name
  `
);