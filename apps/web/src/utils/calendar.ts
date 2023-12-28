import { type Day } from "@taak/react-modern-calendar-datepicker";

export const getDisabledDays = (minimumDate: Day): Day[] => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const daysBetween: Day[] = [];

  for (
    let date = new Date(
      minimumDate.year,
      minimumDate.month - 1,
      minimumDate.day
    );
    date <= yesterday;
    date.setDate(date.getDate() + 1)
  ) {
    daysBetween.push({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    });
  }
  return daysBetween;
};
