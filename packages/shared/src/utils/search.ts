export const getDayDifference = (date1: Date, date2: Date): number => {
  const diffInMs = Math.abs(date2.getTime() - date1.getTime());
  return diffInMs / (1000 * 60 * 60 * 24);
};
