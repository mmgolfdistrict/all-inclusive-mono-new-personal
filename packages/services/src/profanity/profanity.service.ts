import type { Db } from "@golf-district/database";
import { or, sql } from "@golf-district/database";
import { profanities } from "@golf-district/database/schema/profanities";
import Logger from "@golf-district/shared/src/logger";
import { loggerService } from "../webhooks/logging.service";

export class ProfanityService {
  private readonly db: Db;
  logger = Logger("ProfanityService");

  constructor(db: Db) {
    this.db = db;
  }

  isValidString = (input: string) => {
    const regex = /^[a-z0-9_.]+$/;
    return regex.test(input);
  };

  isProfane = async (profanityText: string) => {
    try {
      const removeRepeatedText = profanityText.replace(/(.)(?=.*\1)/g, "");
      const text = removeRepeatedText
        .replaceAll("'", "")
        .replaceAll("1", "l")
        .replaceAll("0", "o")
        .replaceAll("3", "e")
        .replaceAll("5", "s")
        .replaceAll("7", "l");

      if (text.length < 1) {
        return {
          isProfane: false,
        };
      }

      if (!this.isValidString(text) || text.includes("69")) {
        return {
          isProfane: true,
        };
      }

      // const sqlText = `
      //     Select profanityText
      //     From ${profanitiesTableName} PRO
      //     Where 1 = 1
      //       And
      //       (
      //         Concat( '%', profanityText, '%' ) Like '%${text}%'
      //         Or '%${text}%' Like Concat( '%', profanityText, '%' )
      //       )
      //     `;
      // console.log(sqlText);
      // const sqlobj = sql.raw(sqlText);

      // console.log("sqlobj");
      // console.log(sqlobj);
      // console.log("actual sql");
      // console.log(sqlobj.getSQL());

      // const test = await this.db.execute(sqlobj);
      // console.log(`test.length: ${test.rows.length}`);
      // console.log(test);
      // console.log(test.rows);

      const matchingWords = await this.db
        .select()
        .from(profanities)
        .where(
          or(
            sql`CONCAT('%', profanityText, '%') LIKE ${`%${text}%`}`,
            sql`CONCAT('%', ${text}, '%') LIKE CONCAT('%', profanityText, '%')`
          )
        )
        .catch((err) => {
          this.logger.error(err);
          loggerService.errorLog({
            userId: "",
            url: "/ProfanityService/isProfane",
            userAgent: "",
            message: "ERROR_MATCHING_WORDS",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              profanityText,
            }),
          });
          throw new Error(err);
        });

      // const matchingPhonetically = await this.db
      //   .select()
      //   .from(profanities)
      //   .where(sql`SOUNDEX(profanityText)=SOUNDEX(${text})`)
      //   .catch((err) => {
      //     this.logger.error(err);
      //     throw new Error(err);
      //   });
      console.log(`matchingWords.length: ${matchingWords.length}`);
      console.log(matchingWords);

      if (matchingWords.length > 0) {
        return {
          isProfane: true,
        };
      } else {
        return {
          isProfane: false,
        };
      }
      // if (matchingWords.length > 0 || matchingPhonetically.length > 0) {
      //   return {
      //     isProfane: true,
      //   };
      // } else {
      //   return {
      //     isProfane: false,
      //   };
      // }
    } catch (error: any) {
      this.logger.error(error);
      loggerService.errorLog({
        userId: "",
        url: "/ProfanityService/isProfane",
        userAgent: "",
        message: "ERROR_WHILE_VALIDATING_PROFANITY",
        stackTrace: `${error.stack}`,
        additionalDetailsJSON: JSON.stringify({
          profanityText,
        }),
      });
      return {
        isProfane: false,
      };
    }
  };
}
