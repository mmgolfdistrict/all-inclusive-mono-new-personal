"use client";

import { type DayValue } from "@taak/react-modern-calendar-datepicker";
import type { SortType } from "~/components/course-page/mobile-sort";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useCourseContext } from "./CourseContext";

export type DateType =
  | "All"
  | "Today"
  | "This Week"
  | "This Weekend"
  | "This Month"
  | "Furthest Day Out To Book"
  | "Custom";

export type GolferType = "Any" | 1 | 2 | 3 | 4 | -1;

export type HoleType = "Any" | "18" | "9";

const startingSelectedDayRange = {
  from: {
    day: new Date().getDate(),
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  },
  to: {
    day: new Date().getDate(),
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  },
};

const StartTimeOptions = [
  { displayTime: "6 AM", value: 600 },
  { displayTime: "7 AM", value: 700 },
  { displayTime: "8 AM", value: 800 },
  { displayTime: "9 AM", value: 900 },
  { displayTime: "10 AM", value: 1000 },
  { displayTime: "11 AM", value: 1100 },
  { displayTime: "12 PM", value: 1200 },
  { displayTime: "1 PM", value: 1300 },
  { displayTime: "2 PM", value: 1400 },
  { displayTime: "3 PM", value: 1500 },
  { displayTime: "4 PM", value: 1600 },
  { displayTime: "5 PM", value: 1700 },
  { displayTime: "6 PM", value: 1800 },
  { displayTime: "7 PM", value: 1900 },
  { displayTime: "8 PM", value: 2000 },
  { displayTime: "9 PM", value: 2100 },
];

type OperationTimeType = {
  displayTime: string;
  value: number;
};

interface FiltersContextType {
  dateType: DateType;
  setDateType: React.Dispatch<React.SetStateAction<DateType>>;
  holes: HoleType;
  setHoles: React.Dispatch<React.SetStateAction<HoleType>>;
  golfers: GolferType;
  setGolfers: React.Dispatch<React.SetStateAction<GolferType>>;
  showUnlisted: boolean;
  setShowUnlisted: React.Dispatch<React.SetStateAction<boolean>>;
  includesCart: boolean;
  setIncludesCart: React.Dispatch<React.SetStateAction<boolean>>;
  priceRange: number[];
  setPriceRange: React.Dispatch<React.SetStateAction<number[]>>;
  startTime: number[] | [number, number];
  setStartTime: React.Dispatch<
    React.SetStateAction<number[] | [number, number]>
  >;
  selectedDay: {
    from: DayValue;
    to: DayValue;
  };
  setSelectedDay: React.Dispatch<
    React.SetStateAction<{
      from: DayValue;
      to: DayValue;
    }>
  >;
  startTimeOptions: OperationTimeType[];
  sortValue: SortType;
  handleSetSortValue: (value: SortType) => void;
}

const FiltersContext = createContext<FiltersContextType>({
  dateType: "All",
  setDateType: () => undefined,
  holes: "Any",
  setHoles: () => undefined,
  golfers: 4,
  setGolfers: () => undefined,
  showUnlisted: false,
  setShowUnlisted: () => undefined,
  includesCart: false,
  setIncludesCart: () => undefined,
  priceRange: [0, 5000],
  setPriceRange: () => undefined,
  startTime: [900, 2100],
  setStartTime: () => undefined,
  selectedDay: startingSelectedDayRange,
  setSelectedDay: () => undefined,
  startTimeOptions: StartTimeOptions,
  sortValue: "Sort by time - Early to Late",
  handleSetSortValue: () => undefined,
});

export const FiltersWrapper = ({ children }: { children: ReactNode }) => {
  const [dateType, setDateType] = useState<DateType>("All");
  const [holes, setHoles] = useState<HoleType>("Any");
  const [golfers, setGolfers] = useState<GolferType>("Any");
  const [showUnlisted, setShowUnlisted] = useState<boolean>(false);
  const [includesCart, setIncludesCart] = useState<boolean>(true);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [startTime, setStartTime] = useState<[number, number]>([900, 2100]); //index of StartTimeOptions
  const [selectedDay, setSelectedDay] = useState<{
    from: DayValue;
    to: DayValue;
  }>(startingSelectedDayRange);
  const [sortValue, setSortValue] = useState<SortType>(
    "Sort by time - Early to Late"
  );

  const { course } = useCourseContext();

  const startTimeOptions = useMemo(() => {
    if (!course) return StartTimeOptions;
    if (!course?.openTime) return StartTimeOptions;
    const startingHour =
      Number(course?.openTime?.split(" ")?.[1]?.split(":")?.[0]) ?? 9;
    const closingHour =
      Number(course?.closeTime?.split(" ")?.[1]?.split(":")?.[0]) ?? 9;
    const hoursOpen = closingHour - startingHour;

    const options: OperationTimeType[] = [];
    for (let i = 0; i <= hoursOpen; i++) {
      const amOrPm = startingHour + i >= 12 ? "PM" : "AM";
      const displayHour =
        startingHour + i > 12 ? startingHour + i - 12 : startingHour + i;
      options.push({
        displayTime: `${displayHour === 0 ? 12 : displayHour} ${amOrPm}`,
        value: (startingHour + i) * 100,
      });
    }

    setStartTime([startingHour * 100, closingHour * 100]);

    return options;
  }, [course]);

  useEffect(() => {
    if (dateType !== "Custom") {
      setSelectedDay(startingSelectedDayRange); //reset range if not custom
    }
  }, [dateType]);

  const handleSetSortValue = (value: SortType) => {
    setSortValue(value);
  };

  const settings = {
    dateType,
    setDateType,
    holes,
    setHoles,
    golfers,
    setGolfers,
    showUnlisted,
    setShowUnlisted,
    includesCart,
    setIncludesCart,
    priceRange,
    setPriceRange,
    startTime,
    setStartTime,
    selectedDay,
    setSelectedDay,
    startTimeOptions,
    sortValue,
    handleSetSortValue,
  };

  return (
    <FiltersContext.Provider value={settings}>
      {children}
    </FiltersContext.Provider>
  );
};

export const useFiltersContext = () => {
  return useContext(FiltersContext);
};
