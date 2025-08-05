"use client";

import type {
  Course,
  CourseImagesType,
  FullCourseType,
} from "@golf-district/shared";
import customParseFormat from "dayjs/plugin/customParseFormat";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { createContext, useContext, useMemo, type ReactNode, useCallback } from "react";

dayjs.extend(utc);
dayjs.extend(customParseFormat);

interface CourseContextType {
  course: Course | undefined;
  getAllowedPlayersForTeeTime: (
    time?: number | null,
    date?: string | null,
    availableSlots?: number
  ) => {
    numberOfPlayers: string[];
    selectStatus: string;
  }
}

const CourseContext = createContext<CourseContextType>({
  course: undefined,
  getAllowedPlayersForTeeTime: () => {
    return { numberOfPlayers: [], selectStatus: "" };
  },
});

export const CourseWrapper = ({
  children,
  courseData,
  courseImages,
}: {
  children: ReactNode;
  courseData: FullCourseType | undefined;
  courseImages: CourseImagesType | undefined;
}) => {
  const course = useMemo(() => {
    if (!courseData || !courseImages) return undefined;
    return {
      ...courseData,
      ...courseImages,
    };
  }, [courseData, courseImages]);

  const getAllowedPlayersForTeeTime = useCallback((
    time?: number,
    date?: string,
    availableSlots?: number,
  ) => {
    let binaryMask: number | undefined = undefined;
    const PlayersOptions = ["1", "2", "3", "4"];
    if (!courseData) {
      return { numberOfPlayers: PlayersOptions, selectStatus: "" };
    }

    if (time && date) {
      const day = dayjs.utc(date, "YYYY-MM-DD").format("ddd").toUpperCase();
      const NumberOfPlayers = courseData?.courseAllowedTimeToSellSlots?.find(
        (item) => item.day === day && (item.fromTime <= time && item.toTime >= time),
      )
      if (!NumberOfPlayers) {
        const { primaryMarketAllowedPlayers, primaryMarketSellLeftoverSinglePlayer } = courseData;
        if (primaryMarketAllowedPlayers) {
          binaryMask = primaryMarketAllowedPlayers;
        }
        if (primaryMarketSellLeftoverSinglePlayer && availableSlots === 1) {
          binaryMask = (binaryMask ?? 0) | (1 << 0);
        }
      } else {
        if (NumberOfPlayers?.primaryMarketAllowedPlayers) {
          binaryMask = NumberOfPlayers?.primaryMarketAllowedPlayers;
        }
        if (NumberOfPlayers?.primaryMarketSellLeftoverSinglePlayer && availableSlots === 1) {
          binaryMask = (binaryMask ?? 0) | (1 << 0);
        }
      }
    } else {
      const { primaryMarketAllowedPlayers, primaryMarketSellLeftoverSinglePlayer } = courseData;
      if (primaryMarketAllowedPlayers) {
        binaryMask = primaryMarketAllowedPlayers;
      }
      if (primaryMarketSellLeftoverSinglePlayer && availableSlots === 1) {
        binaryMask = (binaryMask ?? 0) | (1 << 0);
      }
    }
    const numberOfPlayers =
      binaryMask !== null && binaryMask !== undefined
        ? PlayersOptions.filter((_, index) => ((binaryMask ?? 0) & (1 << index)) !== 0)
        : PlayersOptions;
    if (binaryMask === 0) {
      return { numberOfPlayers: PlayersOptions, selectStatus: "ALL_PLAYERS" };
    }

    return { numberOfPlayers, selectStatus: "" };
  }, [])

  const settings = {
    course,
    getAllowedPlayersForTeeTime
  };

  return (
    <CourseContext.Provider value={settings}>{children}</CourseContext.Provider>
  );
};

export const useCourseContext = () => {
  return useContext(CourseContext);
};
