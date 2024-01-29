import dayjs from "dayjs";
import UTC from "dayjs/plugin/utc";

dayjs.extend(UTC);

export const formatTime = (
  timestamp: string,
  showFullDayOfTheWeek?: boolean,
  utcOffset = 0
): string => {
  const cleanTimeString = timestamp.replace(" ", "T") + "Z";
  if (showFullDayOfTheWeek) {
    return dayjs
      .utc(cleanTimeString)
      .utcOffset(utcOffset)
      .format("dddd, MMM D h:mm A");
  }
  return dayjs
    .utc(cleanTimeString)
    .utcOffset(utcOffset)
    .format("MMM D, YYYY h:mmA");
};

export const formatDate = (timestamp: string, utcOffset = 0): string => {
  const cleanTimeString = timestamp.replace(" ", "T") + "Z";
  return dayjs
    .utc(cleanTimeString)
    .utcOffset(utcOffset)
    .format("ddd MMM D, YYYY");
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

export const formatDateForAuction = (timestamp: string, utcOffset = 0) => {
  const cleanTimeString = timestamp.replace(" ", "T") + "Z";
  return dayjs.utc(cleanTimeString).utcOffset(utcOffset).format("MMM D, YYYY");
};
