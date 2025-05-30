/**
 * Generates a UTC timestamp offset by a specified number of minutes from the current time.
 *
 * @param minutesOffset - The number of minutes to offset the timestamp.
 *                        Positive values create a future timestamp,
 *                        negative values create a past timestamp.
 * @returns {string} The UTC timestamp in 'YYYY-MM-DD HH:MM:SS.sss' format.
 */
export const generateUtcTimestamp = (minutesOffset: number): string => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutesOffset);

  return date.toISOString().replace("T", " ").replace("Z", "");
};

const TRUE_VALUES = ["t", "y", "true", "1", "yes", "on"];

export function parseSettingValue(value: string, datatype: string): string | number | boolean {
  switch (datatype) {
    case "boolean":
      return TRUE_VALUES.includes(value.toLowerCase()) ? true : false;
    case "number":
      return parseFloat(value);
    default:
      return value;
  }
}
