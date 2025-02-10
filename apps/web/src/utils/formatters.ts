import dayjs from "dayjs";
import UTC from "dayjs/plugin/utc";

dayjs.extend(UTC);

export const capitalize = (s: string) => {
  if (typeof s !== "string") return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const truncate = (str: string, num: number) => {
  if (!str) return "";
  if (str.length <= num) {
    return str;
  }
  return str.slice(0, num) + "...";
};

export const getBlurDataURL = async (url: string | null) => {
  if (!url) {
    return "data:image/webp;base64,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
  }
  try {
    const response = await fetch(
      `https://wsrv.nl/?url=${url}&w=50&h=50&blur=5`
    );
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    return `data:image/png;base64,${base64}`;
  } catch (error) {
    return "data:image/webp;base64,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
  }
};

export const placeholderBlurhash =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAoJJREFUWEfFl4lu4zAMRO3cx/9/au6reMaOdkxTTl0grQFCRoqaT+SQotq2bV9N8rRt28xms87m83l553eZ/9vr9Wpkz+ezkT0ej+6dv1X81AFw7M4FBACPVn2c1Z3zLgDeJwHgeLFYdAARYioAEAKJEG2WAjl3gCwNYymQQ9b7/V4spmIAwO6Wy2VnAMikBWlDURBELf8CuN1uHQSrPwMAHK5WqwFELQ01AIXdAa7XawfAb3p6AOwK5+v1ugAoEq4FRSFLgavfQ49jAGQpAE5wjgGCeRrGdBArwHOPcwFcLpcGU1X0IsBuN5tNgYhaiFFwHTiAwq8I+O5xfj6fOz38K+X/fYAdb7fbAgFAjIJ6Aav3AYlQ6nfnDoDz0+lUxNiLALvf7XaDNGQ6GANQBKR85V27B4D3QQRw7hGIYlQKWGM79hSweyCUe1blXhEAogfABwHAXAcqSYkxCtHLUK3XBajSc4Dj8dilAeiSAgD2+30BAEKV4GKcAuDqB4TdYwBgPQByCgApUBoE4EJUGvxUjF3Q69/zLw3g/HA45ABKgdIQu+JPIyDnisCfAxAFNFM0EFNQ64gfS0EUoQP8ighrZSjn3oziZEQpauyKbfjbZchHUL/3AS/Dd30gAkxuRACgfO+EWQW8qwI1o+wseNuKcQiESjALvwNoMI0TcRzD4lFcPYwIM+JTF5x6HOs8yI7jeB5oKhpMRFH9UwaSCDB2Jmg4rc6E2TT0biIaG0rQhNqyhpHBcayTTSXH6vcDL7/sdqRK8LkwTsU499E8vRcAojHcZ4AxABdilgrp4lsXk8oVqgwh7+6H3phqd8J0Kk4vbx/+sZqCD/vNLya/5dT9fAH8g1WdNGgwbQAAAABJRU5ErkJggg==";

export const toDateString = (date: Date) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const random = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

export const countdownTime = (
  seconds: number
): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} => {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  const remainingSeconds = seconds % 60;

  const daysValue = days > 0 ? days : 0;
  const hoursValue = hours > 0 ? hours : 0;
  const minutesValue = minutes > 0 ? minutes : 0;
  const secondsValue = remainingSeconds > 0 ? remainingSeconds : 0;

  return {
    days: daysValue,
    hours: hoursValue,
    minutes: minutesValue,
    seconds: secondsValue,
  };
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

export const formatTime = (
  timestamp: string,
  showFullDayOfTheWeek?: boolean,
  utcOffset = 0
): string => {
  const cleanTimeString = !timestamp.includes("T")
    ? timestamp.replace(" ", "T") + "Z"
    : timestamp;
  const timezone = cleanTimeString.slice(-6) ?? utcOffset;
  if (showFullDayOfTheWeek) {
    return dayjs
      .utc(cleanTimeString)
      .utcOffset(timezone)
      .format("dddd, MMM D h:mm A");
  }
  return dayjs
    .utc(cleanTimeString)
    .utcOffset(timezone)
    .format("dddd, MMM D h:mm A");
};

export const fullDate = (timestamp: string, utcOffset = 0): string => {
  const cleanTimeString = !timestamp.includes("T")
    ? timestamp.replace(" ", "T") + "Z"
    : timestamp;
  return dayjs.utc(cleanTimeString).utcOffset(utcOffset).format("M/D/YYYY");
};

export const dayMonthDate = (date: string): string => {
  const cleanTimeString = !date.includes("T")
    ? date.replace(" ", "T") + "Z"
    : date;
  return dayjs.utc(cleanTimeString).format("dddd, MMM D");
};

export const getTime = (date: string, utcOffset = 0): string => {
  const cleanTimeString = !date.includes("T")
    ? date.replace(" ", "T") + "Z"
    : date;
  const timezone = cleanTimeString.slice(-6) ?? utcOffset;

  return dayjs.utc(cleanTimeString).utcOffset(timezone).format("h:mm A");
};

export const getHour = (date: string, utcOffset = 0): string => {
  const cleanTimeString = !date.includes("T")
    ? date.replace(" ", "T") + "Z"
    : date;
  const timezone = cleanTimeString.slice(-6) ?? utcOffset;

  return dayjs.utc(cleanTimeString).utcOffset(timezone).format("h A");
};

export const cleanTimeString = (timestamp: string): string => {
  return !timestamp.includes("T")
    ? timestamp.replace(" ", "T") + "Z"
    : timestamp;
};

export const getPromoCodePrice = (
  currentPrice: number,
  discount: number,
  type: "PERCENTAGE" | "AMOUNT"
) => {
  if (discount === 0) return currentPrice;
  if (type === "PERCENTAGE") {
    const discountAmount = (currentPrice * discount) / 100;
    return Number((currentPrice - discountAmount).toFixed(2));
  }
  return Number((currentPrice - discount).toFixed(2));
};

export const getBgColor = (type) => {
  console.log("type", type);

  if (type === "FAILURE") return "bg-alert-red";
  if (type === "SUCCESS") return "bg-green-500";
  if (type === "WARNING") return "bg-slate-400";
};
