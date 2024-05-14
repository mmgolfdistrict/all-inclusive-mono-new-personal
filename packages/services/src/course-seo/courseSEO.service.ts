import type { Db } from "@golf-district/database";
import { eq } from "@golf-district/database";
import { courseSEOs } from "@golf-district/database/schema/courseSEO";
import Logger from "@golf-district/shared/src/logger";

export class CourseSEOService {
    private readonly db: Db;
    logger = Logger("CourseSEOService");

    constructor(db: Db) {
        this.db = db;
    }

    getCourseSEO = async (courseId: string) => {
        try {
            const [courseSEO] = await this.db
                .select({
                    id: courseSEOs.id,
                    courseId: courseSEOs.courseId,
                    seoJSON: courseSEOs.seoJSON,
                    createdDateTime: courseSEOs.createdDateTime,
                    lastUpdatedDateTime: courseSEOs.lastUpdatedDateTime
                })
                .from(courseSEOs)
                .where(eq(courseSEOs.courseId, courseId))

            this.logger.info(`Course render settings fetched: ${courseId}, ${JSON.stringify(courseSEO)}`);
            return courseSEO
        } catch (error) {
            this.logger.error(error);
        }
    }
} 