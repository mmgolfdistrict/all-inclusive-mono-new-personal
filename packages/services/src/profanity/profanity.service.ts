import type { Db } from "@golf-district/database";
import { like, or, sql } from "@golf-district/database";
import { profanities } from "@golf-district/database/schema/profanities";
import Logger from "@golf-district/shared/src/logger";

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

      const matchingWords = await this.db
        .select()
        .from(profanities)
        .where(
          or(sql`${text} like CONCAT('%', profanityText, '%')`, like(profanities.profanityText, `%${text}%`))
        )
        .catch((err) => {
          this.logger.error(err);
          throw new Error(err);
        });
      const matchingPhonetically = await this.db
        .select()
        .from(profanities)
        .where(sql`SOUNDEX(profanityText)=SOUNDEX(${text})`)
        .catch((err) => {
          this.logger.error(err);
          throw new Error(err);
        });
      // console.log("MATHCNING WORDs:", matchingWords)
      // console.log("MATHCNING WORDs PHONETICALLY:", matchingPhonetically)
      if (matchingWords.length > 0 || matchingPhonetically.length > 0) {
        return {
          isProfane: true,
        };
      } else {
        return {
          isProfane: false,
        };
      }
    } catch (error) {
      this.logger.error(error);
      return {
        isProfane: false,
      };
    }
  };
}
