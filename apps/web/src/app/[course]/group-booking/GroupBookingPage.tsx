import { FilledButton } from "~/components/buttons/filled-button";
import { useMe } from "~/hooks/useMe";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { dayMonthDate, formatMoney, getTime } from "~/utils/formatters";
import { useCourseContext } from "~/contexts/CourseContext";
import { microsoftClarityEvent } from "~/utils/microsoftClarityUtils";
import { googleAnalyticsEvent } from "~/utils/googleAnalyticsUtils";
import { useSession } from "@golf-district/auth/nextjs-exports";
import { useAppContext } from "~/contexts/AppContext";
import { LoadingContainer } from "../loader";

interface TeeTime {
  id: string;
  providerTeeTimeId: string;
  date: string;
  providerDate: string;
  time: number;
  numberOfHoles: number;
  maxPlayersPerBooking: number;
  availableFirstHandSpots: number;
  availableSecondHandSpots: number;
  greenFeePerPlayer: number;
  cartFeePerPlayer: number;
  greenFeeTaxPerPlayer: number;
  cartFeeTaxPerPlayer: number;
  courseId: string;
  createdDateTime: string;
  lastUpdatedDateTime: string;
}

interface TeeTimeGroup {
  teeTimes: TeeTime[];
  time: number;
  pricePerGolfer: number;
  teeTimeIds: string[];
  date: string;
}

export type TeeTimeGroups = Record<string, TeeTimeGroup[]>;

const GroupBookingPage = ({ teeTimesData, isTeeTimesLoading, playerCount }: {
  teeTimesData: TeeTimeGroups | null,
  isTeeTimesLoading: boolean,
  playerCount: number
}) => {
  const { user } = useMe();
  const { course } = useCourseContext();
  const { setPrevPath } = useAppContext();
  const timezoneCorrection = course?.timezoneCorrection;
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  // const [teeTimeGroup, setTeeTimeGroup] = useState<TeeTimeGroup | null | undefined>(null);
  const [otherTeeTimeGroups, setOtherTeeTimeGroups] = useState<TeeTimeGroup[] | null>(null);

  const allocatePlayersAcrossTeeTimes = (group: TeeTimeGroup, totalPlayers: number): { label: string; count: number }[] => {
    const teeTimesSorted = group.teeTimes.sort((a, b) => a.time - b.time);

    let remaining = totalPlayers;
    const allocations: { label: string; count: number }[] = [];

    for (const t of teeTimesSorted) {
      if (remaining <= 0) break;
      const capacity = Math.max(0, t.maxPlayersPerBooking);
      const count = Math.min(remaining, capacity);
      if (count > 0) {
        allocations.push({ label: getTime(t.providerDate, timezoneCorrection), count });
        remaining -= count;
      }
    }

    return allocations;
  };

  const getPlayersPerSlotLabel = (group: TeeTimeGroup, totalPlayers: number): string => {
    const allocations = allocatePlayersAcrossTeeTimes(group, totalPlayers);
    const parts = allocations.map((a) => `${a.label} (${a.count})`.replace(/ /g, "\u00A0"));
    const shown = parts.slice(0, 3);
    const remaining = parts.length - shown.length;
    return remaining > 0 ? `${shown.join(" • ")} • +${remaining} more` : shown.join(" • ");
  };

  // Desktop/Tablet: Show full, non-truncated labels
  const getGroupedTimesLabelFull = (group: TeeTimeGroup): string => {
    const labels = group.teeTimes
      .slice()
      .sort((a, b) => a.time - b.time)
      .map((t) => getTime(t.providerDate, timezoneCorrection));
    return labels.join(" • ");
  };

  const getPlayersPerSlotLabelFull = (group: TeeTimeGroup, totalPlayers: number): string => {
    const allocations = allocatePlayersAcrossTeeTimes(group, totalPlayers);
    const parts = allocations.map((a) => `${a.label} (${a.count})`.replace(/ /g, "\u00A0"));
    return parts.join(" • ");
  };

  const sortedDates = useMemo(() => {
    if (teeTimesData) {
      return Object.keys(teeTimesData).sort((a, b) => {
        const dateA = Number(new Date(a));
        const dateB = Number(new Date(b));
        return dateA - dateB;
      });
    }
  }, [teeTimesData]);

  const fullUrl = window?.location.href;
  const url = new URL(fullUrl);
  const pathname = url.pathname;

  const buyTeeTimeGroup = (teeTimeGroup: TeeTimeGroup) => {
    microsoftClarityEvent({
      action: `CLICKED ON BUY`,
      category: "BUY TEE TIME",
      label: "user clicked on buy to purchase tee time",
      value: pathname,
    });
    googleAnalyticsEvent({
      action: `CLICKED ON BUY`,
      category: "TEE TIME ",
      label: "user clicked on buy to purchase tee time",
      value: "",
    });
    setIsLoading(true);

    const teeTimeIds = teeTimeGroup.teeTimeIds.toString();

    if (!user || !session) {
      setPrevPath({
        path: `/${course?.id}/checkout-group?teeTimeIds=${teeTimeIds}&playerCount=${playerCount}`,
        createdAt: new Date().toISOString(),
      });
      void router.push(`/${course?.id}/login`);
      return;
    }
    void router.replace(
      `/${course?.id}/checkout-group?teeTimeIds=${teeTimeIds}&playerCount=${playerCount}`
    );
  };

  useEffect(() => {
    if (teeTimesData && Object.keys(teeTimesData).length > 0 && sortedDates && sortedDates.length > 0) {
      const searchedDate = sortedDates[0];
      let teeTimeGroups: TeeTimeGroup[] | undefined = [];
      if (searchedDate) {
        teeTimeGroups = teeTimesData[searchedDate];
      }

      let otherTeeTimes: TeeTimeGroup[] | undefined = [];
      if (teeTimeGroups && teeTimeGroups.length > 0) {
        otherTeeTimes = teeTimeGroups.slice(4, 7);
      }
      // const firstTeeTimesPerHour: Record<number, TeeTimeGroup> = {};
      // const firstTeeTime = teeTimesData[0];
      // if (!firstTeeTime) return;

      // const currentHour = Math.floor(firstTeeTime.time / 100);

      // for (const teeTime of teeTimesData) {
      //   const hour = Math.floor(teeTime.time / 100);

      //   if (!(hour in firstTeeTimesPerHour) && hour !== currentHour) {
      //     firstTeeTimesPerHour[hour] = teeTime;
      //   }
      // }
      // const otherTeeTimes = Object.keys(firstTeeTimesPerHour).sort().map((key) => firstTeeTimesPerHour[key] as TeeTimeGroup);
      setOtherTeeTimeGroups(otherTeeTimes);
    } else {
      setOtherTeeTimeGroups(null);
    }
  }, [teeTimesData, sortedDates]);

  return (
    <div className="flex flex-col mb-4 justify-center gap-4 md:gap-1  px-4 py-3 rounded-xl md:px-8 md:py-6">
      <LoadingContainer
        isLoading={isLoading || isTeeTimesLoading}
      >
        <div></div>
      </LoadingContainer>
      <div id="your-selection" className="relative flex flex-col gap-2 sm:flex-row items-start sm:items-center justify-between md:mb-2">
        <h1 className="text-[1.25rem] capitalize text-secondary-black md:text-[2rem] flex items-center gap-6">
          Earliest Available Time
        </h1>
        {otherTeeTimeGroups && otherTeeTimeGroups.length > 0 ?
          <div className="self-end">
            <div className="flex flex-col item-start gap-2 lg:flex-row lg:items-center lg:gap-4 text-primary-gray text-[0.75rem] md:text-[1rem] ">
              <span>
                Other options for your group available.<br />
                <i>Please adjust the start time.</i>
              </span>
              <div className="flex gap-2">
                {
                  otherTeeTimeGroups.map((group, index) => {
                    return (
                      <span
                        key={index}
                        className="bg-white px-2 py-1 lg:p-3 rounded-xl border border-stroke"
                      >
                        {getTime(group.date, timezoneCorrection)}
                      </span>
                    );
                  })
                }
              </div>
            </div>
          </div> : null}
      </div>
      {
        ((!teeTimesData || Object.keys(teeTimesData).length === 0) ?
          <div className="flex justify-center items-center h-[12.5rem]">
            <div className="text-center">
              {"No Tee Times Group Available."}
            </div>
          </div> :
          <>
            {sortedDates?.map((date) =>
            (<div key={date} className="overflow-y-auto flex flex-col gap-2 md:gap-4">
              {/* Header Row */}
              <div className="flex flex-row items-center gap-2 md:px-4 md:mt-2">
                <h2 className="text-[0.8125rem] md:text-lg capitalize text-secondary-black unmask-time">
                  {dayMonthDate(date)}
                </h2>
              </div>

              {/* Group booking Items */}
              <div className="grid grid-cols-[repeat(auto-fit,minmax(17.5rem,1fr))] md:grid-cols-[repeat(auto-fit,minmax(35rem,1fr))] gap-4">
                {teeTimesData[date]?.slice(0, 2).map((teeTimeGroup: TeeTimeGroup) => (
                  <div key={teeTimeGroup.teeTimeIds.toString()} className="bg-white p-3 rounded-xl min-w-[17.5rem] md:max-w-[50rem] flex flex-col text-[0.75rem] md:text-[1rem] text-secondary-black cursor-pointer">
                    <div className="flex gap-4">
                      <div className="min-w-[17.5rem] md:max-w-[50%]">
                        {/* First Row */}
                        <div className="flex flex-row justify-between items-center unmask-time">
                          <div className="font-semibold text-[1rem] md:text-[1.25rem] unmask-time">
                            {getTime(teeTimeGroup.date, timezoneCorrection)}
                          </div>
                        </div>
                        {/* Mobile: compact distribution */}
                        <div className="block md:hidden text-[0.75rem] text-wrap md:text-[0.875rem] text-primary-gray mt-1">
                          <span className="font-medium text-secondary-black">Player Distrbution:</span> {getPlayersPerSlotLabel(teeTimeGroup, playerCount)}
                        </div>

                        {/* Second Row */}
                        <div className="flex flex-row items-center gap-1 mt-2">
                          <div className="text-[0.75rem] md:text-[0.875rem] text-primary-gray">
                            Avg. Price
                          </div>
                          <div className="text-[0.875rem] md:text-[1rem] font-semibold text-secondary-black" >
                            {formatMoney(teeTimeGroup.pricePerGolfer)}
                          </div>
                        </div >

                        {/* Third Row */}
                        <div>
                          <div className="text-[0.875rem] md:text-[1rem] font-semibold text-secondary-black" >
                            {playerCount} Players
                          </div>

                        </div >

                        {/* Fourth Row */}
                        <div className="mt-2 w-full">
                          <FilledButton
                            className="whitespace-nowrap !min-w-[5.125rem] md:min-w-[6.875rem] !py-[.28rem] md:py-1.5 w-full"
                            data-testid="buy-tee-time-id"
                            data-qa="Buy"
                            onClick={() => buyTeeTimeGroup(teeTimeGroup)}
                          >
                            Buy
                          </FilledButton>
                        </div>
                      </div>
                      <div>
                        {/* Desktop/Tablet: richer informative section */}
                        <div className="hidden md:block text-[0.75rem] md:text-[0.875rem] text-primary-gray mt-1">
                          <div>
                            <span className="font-medium text-secondary-black">Tee times in group:</span> {getGroupedTimesLabelFull(teeTimeGroup)}
                          </div>
                          <div className="mt-1">
                            <span className="font-medium text-secondary-black">Player distribution:</span> {getPlayersPerSlotLabelFull(teeTimeGroup, playerCount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            ))}
          </>
        )}
    </div>
  );
};

export default GroupBookingPage;
