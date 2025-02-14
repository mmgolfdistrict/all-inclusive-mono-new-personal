import { FilledButton } from "~/components/buttons/filled-button";
import { useMe } from "~/hooks/useMe";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { dayMonthDate, formatMoney, getHour, getTime } from "~/utils/formatters";
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

export type TeeTimeGroups = TeeTimeGroup[];

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
  const [teeTimeGroup, setTeeTimeGroup] = useState<TeeTimeGroup | null | undefined>(teeTimesData ? teeTimesData[0] : null);
  const [otherTeeTimeGroups, setOtherTeeTimeGroups] = useState<TeeTimeGroup[] | null>(null);

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
    void router.push(
      `/${course?.id}/checkout-group?teeTimeIds=${teeTimeIds}&playerCount=${playerCount}`
    );
  };

  useEffect(() => {
    if (teeTimesData) {
      setTeeTimeGroup(teeTimesData[0]);
    } else {
      setOtherTeeTimeGroups(null);
    }
  }, [teeTimesData]);

  useEffect(() => {
    if (teeTimesData) {
      const firstTeeTimesPerHour: Record<number, TeeTimeGroup> = {};
      const firstTeeTime = teeTimesData[0];
      if (!firstTeeTime) return;

      const currentHour = Math.floor(firstTeeTime.time / 100);

      for (const teeTime of teeTimesData) {
        const hour = Math.floor(teeTime.time / 100);

        if (!(hour in firstTeeTimesPerHour) && hour !== currentHour) {
          firstTeeTimesPerHour[hour] = teeTime;
        }
      }
      const otherTeeTimes = Object.keys(firstTeeTimesPerHour).sort().map((key) => firstTeeTimesPerHour[key] as TeeTimeGroup);
      setOtherTeeTimeGroups(otherTeeTimes);
    } else {
      setOtherTeeTimeGroups(null);
    }
  }, [teeTimesData]);

  return (
    <div className="flex flex-col mb-4 justify-center gap-2 md:gap-1  px-4 py-3 rounded-xl md:px-8 md:py-6">
      <LoadingContainer
        isLoading={isLoading || isTeeTimesLoading}
      >
        <div></div>
      </LoadingContainer>
      <div id="your-selection" className="relative flex items-center justify-between md:mb-2">
        <h1 className="text-[20px] capitalize text-secondary-black md:text-[32px] flex items-center gap-6">
          Earliest Available Time
        </h1>
        {otherTeeTimeGroups && otherTeeTimeGroups.length > 0 ? <div>
          <div className="flex flex-col item-start gap-2 lg:flex-row lg:items-center lg:gap-4 text-primary-gray text-[12px] md:text-[16px] ">
            <span>
              Other options for your group available.<br />
              <i>Please adjust the start time.</i>
            </span>
            <div className="flex gap-2">
              {
                otherTeeTimeGroups.slice(0, 3).map((group, index) => {
                  return (
                    <span
                      key={index}
                      className="bg-white px-2 py-1 lg:p-3 rounded-xl border border-stroke"
                    >
                      {getHour(group.date, timezoneCorrection)}
                    </span>
                  );
                })
              }
            </div>
          </div>
        </div> : null}
      </div>
      {
        (!teeTimesData ?
          <div className="flex justify-center items-center h-[200px]">
            <div className="text-center">
              {"No Tee Times Group Available."}
            </div>
          </div> :
          <>
            {
              teeTimeGroup ? (
                <div key={teeTimeGroup.date} className="max-h-[50vh] overflow-y-auto flex flex-col gap-4">
                  {/* Header Row */}
                  <div className="flex flex-row items-center gap-2 md:px-4 md:mt-2">
                    <h2 className="text-[13px] md:text-lg capitalize text-secondary-black unmask-time">
                      {dayMonthDate(teeTimeGroup.date)}
                    </h2>
                  </div>

                  {/* Group booking Items */}
                  <div className="flex flex-row h-[100%] gap-4 overflow-x-auto ">
                    <div key={teeTimeGroup.teeTimeIds.toString()} className="bg-white p-3 rounded-xl max-w-[280px] min-w-[280px] md:max-w-none md:w-[300px] flex flex-col text-[12px] md:text-[16px] text-secondary-black cursor-pointer">
                      {/* First Row */}
                      <div className="flex flex-row justify-between items-center unmask-time">
                        <div className="font-semibold text-[16px] md:text-[20px] unmask-time">
                          {getTime(teeTimeGroup.date, timezoneCorrection)}
                        </div>
                      </div>

                      {/* Second Row */}
                      <div className="flex flex-row items-center gap-1 mt-2">
                        <div className="text-[12px] md:text-[14px] text-primary-gray">
                          Avg. Price
                        </div>
                        <div className="text-[14px] md:text-[16px] font-semibold text-secondary-black" >
                          {formatMoney(teeTimeGroup.pricePerGolfer)}
                        </div>
                      </div >

                      {/* Third Row */}
                      <div>
                        <div className="text-[14px] md:text-[16px] font-semibold text-secondary-black" >
                          {playerCount} Players
                        </div>
                      </div >

                      {/* Fourth Row */}
                      <div className="mt-2 w-full mb-4">
                        <FilledButton
                          className="whitespace-nowrap !min-w-[82px] md:min-w-[110px] !py-[.28rem] md:py-1.5 w-full"
                          data-testid="buy-tee-time-id"
                          data-qa="Buy"
                          onClick={() => buyTeeTimeGroup(teeTimeGroup)}
                        >
                          Buy
                        </FilledButton>
                      </div>
                    </div>
                  </div>
                </div>
              )
                : null
            }
          </>
        )}
    </div>
  );
};

export default GroupBookingPage;
