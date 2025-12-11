import { sql } from "drizzle-orm";
import { int, mysqlView, text, varchar } from "drizzle-orm/mysql-core";
import { courses } from "../schema/courses";
import { adminUsers } from "../schema/adminUsers";
import { adminUserCourse } from "../schema/adminUserCourse";

export const userACLView = mysqlView(
    "user_acl_view",
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
    FROM ${adminUsers} 
    INNER JOIN ${adminUserCourse} 
        ON ${adminUsers.id} = ${adminUserCourse.adminUserId}
    INNER JOIN ${courses} 
        ON ${courses.id} = ${adminUserCourse.courseId}
    GROUP BY ${courses.id}, ${courses.name}
  `
);