import type Filter from "bad-words";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import UTC from "dayjs/plugin/utc";

dayjs.extend(UTC);
dayjs.extend(isSameOrBefore);

type Asset = {
  cdn: string;
  key: string;
  extension: string;
};

/**
 * Generates the current UTC timestamp in a string format.
 * Format: 'YYYY-MM-DD HH:MM:SS.sss'
 *
 * @returns {string} The current UTC timestamp in string format.
 */
export const currentUtcTimestamp = (): string => {
  const now = new Date();

  // Convert the date to UTC
  const year = now.getUTCFullYear();
  const month = (now.getUTCMonth() + 1).toString().padStart(2, "0"); // getUTCMonth() returns 0-11
  const day = now.getUTCDate().toString().padStart(2, "0");
  const hours = now.getUTCHours().toString().padStart(2, "0");
  const minutes = now.getUTCMinutes().toString().padStart(2, "0");
  const seconds = now.getUTCSeconds().toString().padStart(2, "0");

  // Format the date as YYYY-MM-DD HH:MM:SS
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.000`;
};

export const formatQueryDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * Converts a Date object to a UTC timestamp in a string format.
 * Format: 'YYYY-MM-DD HH:MM:SS.sss'
 *
 * @param {Date} date - The date object to be converted.
 * @returns {string} The UTC timestamp in string format.
 */
export const dateToUtcTimestamp = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const seconds = date.getUTCSeconds().toString().padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.000`;
};
/**
 * Validates the format of an email address.
 *
 * @param {string} email - The email address to validate.
 *
 * @returns {boolean} `true` if the email adheres to the correct format, otherwise `false`.
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email);
};

/**
 * Validates the format of a password and provides a security score along with feedback.
 * Score is used on the backend feedback and score for front end
 *
 * @param {string} password - The password to validate.
 *
 * @returns {object} An object containing:
 *  - `score`: A security score from 0-10 based on the password's adherence to defined criteria.
 *  - `feedback`: An array of strings providing feedback on how the password can be improved.
 *
 * Criteria and their respective points:
 * - Length: 8 or more characters (+2)
 * - Contains both uppercase and lowercase characters (+2)
 * - Contains at least one numeric digit (+2)
 * - Contains at least one special character (+2)
 * - Exceeds 12 characters (+2)
 */
export const isValidPassword = (password: string): { score: number; feedback: string[] } => {
  let score = 0;
  const feedback: string[] = [];

  // Check for length
  if (password.length >= 8) {
    score += 2;
    if (password.length > 12) {
      score += 2; // Bonus points for extra length
    }
  } else {
    feedback.push("Password should be at least 8 characters.");
  }
  // Check for both upper and lower case characters
  if (/(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
    score += 2;
  } else {
    feedback.push("Password should contain both uppercase and lowercase characters.");
  }
  // Check for numerical digits
  if (/\d/.test(password)) {
    score += 2;
  } else {
    feedback.push("Password should contain at least one number.");
  }
  // Check for special characters
  if (/[!@#$%^&*()_+\-[\]{};':"|,.<>?]+/.test(password)) {
    score += 2;
  } else {
    feedback.push("Password should contain at least one special character.");
  }

  return { score, feedback };
};

/**
 * Checks a string of text for the presence of prohibited or profane words.
 *
 * @param {string} text - The text to check for bad words.
 * @param {Filter} filter - An instance of the `bad-words` filter.
 *
 * @returns {boolean} `true` if the text contains bad words or prohibited strings, otherwise `false`.
 */
export const containsBadWords = (text: string, filter: Filter): boolean => {
  const customWords = ["admin", "sudo", "support", "moderator"];
  for (const word of customWords) {
    if (text.includes(word)) {
      return true;
    }
  }
  return filter.isProfane(text);
};

/**
 * Constructs a URL for an asset based on its properties.
 *
 * The function generates a URL string by concatenating the `cdn`,
 * `key`, and `extension` properties of the provided `asset` object.
 *
 * Format: [cdn]/[key].[extension]
 *
 * @param {Asset} asset - An object containing properties of the asset.
 *   @property {string} cdn - The Content Delivery Network (CDN) base URL.
 *   @property {string} key - The unique identifier/key of the asset.
 *   @property {string} extension - The file extension of the asset.
 *
 * @returns {string} The full URL of the asset.
 */
export const assetToURL = (asset: Asset): string => {
  return `https://${asset.cdn}/${asset.key}.${asset.extension}`;
};

/**
 * Extracts the apex domain (eTLD+1, where eTLD is an effective top-level domain) from a given URL.
 *
 * For example, for the URL "https://subdomain.example.com", the function returns "example.com".
 *
 * @param {string} url - The URL from which to extract the apex domain.
 *
 * @returns {string} The apex domain extracted from the URL. Returns an empty string if the URL is invalid.
 *
 * @throws Will not throw an error if the URL is invalid, instead returns an empty string.
 *
 * @example
 * const apexDomain = getApexDomain('https://subdomain.example.com'); // 'example.com'
 */
export const getApexDomain = (url: string): string => {
  let domain;
  try {
    domain = new URL(url).hostname;
  } catch (e) {
    return "";
  }
  const parts = domain.split(".");
  if (parts.length > 2) {
    return parts.slice(-2).join(".");
  }
  return domain;
};
/**
 * Generates a regular expression for validating domain names.
 *
 * Domain names must:
 * - Consist of alphanumeric characters and hyphens (-).
 * - Not start or end with a hyphen.
 * - Have each label (segment between dots) start and end with an alphanumeric character.
 * - Be followed by a period (.) and a valid top-level domain (TLD) with 2 or more characters.
 *
 * @returns {RegExp} The regular expression for validating domain names.
 *
 * @example
 * const regex = validDomainRegex();
 * const isValid = regex.test('example.com'); // true
 */
export const validDomainRegex = (): RegExp => {
  return new RegExp(/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/);
};

/**
 * Extracts the subdomain from a fully qualified domain name, given the apex domain name.
 *
 * The function logs an informational message, then determines and returns the subdomain
 * part of a fully qualified domain name (if it exists), given the apex domain name.
 * If the name is identical to the apex name, `null` is returned.
 *
 * @param {string} name - The fully qualified domain name (e.g., subdomain.example.com).
 * @param {string} apexName - The apex domain name (e.g., example.com).
 *
 * @returns {string | null} The subdomain part of the name. If no subdomain is present or
 *                          if `name` is identical to `apexName`, `null` is returned.
 */
export const getSubdomain = (name: string, apexName: string): string | null => {
  if (name === apexName) return null;
  return name.slice(0, name.length - apexName.length - 1);
};

export const addDays = (date: Date, days: number) => {
  return new Date(date.setDate(date.getDate() + days));
};

export const normalizeDateToUnixTimestamp = (inputDate: string): number => {
  return dayjs(inputDate).unix();
};

export const formatMoney = (amount: number) => {
  if (!amount) return "$0.00";
  if (amount < 0)
    return `-$${Math.abs(amount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
