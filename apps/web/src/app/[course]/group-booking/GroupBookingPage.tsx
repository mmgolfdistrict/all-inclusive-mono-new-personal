import { FilledButton } from "~/components/buttons/filled-button";
import { useMe } from "~/hooks/useMe";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Spinner } from "~/components/loading/spinner";
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

export type TeeTimeGroups = Record<string, TeeTimeGroup[]>

const GroupBookingPage = ({ teeTimesData, isTeeTimesLoading, playerCount }: {
  teeTimesData: TeeTimeGroups | null,
  isTeeTimesLoading: boolean,
  playerCount: number
}) => {
  const { user } = useMe();
  // const { course } = useParams();
  const { course } = useCourseContext();
  const { setPrevPath } = useAppContext();
  const timezoneCorrection = course?.timezoneCorrection;
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const fullUrl = window.location.href;
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

  return (
    <div className="flex flex-col mb-4 justify-center gap-2 md:gap-1  px-4 py-3 rounded-xl md:px-8 md:py-6">
      <LoadingContainer
        isLoading={isLoading}
      >
        <div></div>
      </LoadingContainer>
      <div className="relative flex items-center justify-between md:mb-2">
        <h1 className="text-[20px] capitalize text-secondary-black md:text-[32px] flex items-center gap-6">
          Available Tee Times
        </h1>
      </div>
      {
        isTeeTimesLoading ? (
          <div className="flex justify-center items-center h-[200px] w-full md:min-w-[370px]">
            <Spinner className="w-[50px] h-[50px]" />
          </div>
        ) : (!teeTimesData ?
          <div className="flex justify-center items-center h-[200px]">
            <div className="text-center">
              {"No Tee Times Group Available."}
            </div>
          </div> :
          <>
            {
              Object.keys(teeTimesData).sort().map(date => (
                <div key={date} className="max-h-[50vh] overflow-y-auto flex flex-col gap-4">
                  {/* Header Row */}
                  <div className="flex flex-row items-center gap-2 md:px-4 md:mt-2">
                    <h2 className="text-[13px] md:text-lg capitalize text-secondary-black unmask-time">
                      {dayMonthDate(date)}
                    </h2>
                  </div>

                  {/* Group booking Items */}
                  <div className="flex flex-row h-[100%] gap-4 overflow-x-auto ">
                    {
                      teeTimesData[date]?.map((teeTimeGroup: TeeTimeGroup) => (
                        <div key={teeTimeGroup.teeTimeIds.toString()} className="bg-white p-3 rounded-xl max-w-[280px] min-w-[280px] md:max-w-none md:w-[300px] flex flex-col text-[12px] md:text-[16px] text-secondary-black cursor-pointer">
                          {/* First Row */}
                          <div className="flex flex-row justify-between items-center unmask-time">
                            <div className="font-semibold text-[16px] md:text-[20px] unmask-time">
                              {getTime(teeTimeGroup.date, timezoneCorrection)}
                            </div>
                          </div>

                          {/* Second Row */}
                          <div className="flex flex-row items-center gap-1 mt-2">
                            <div className="text-[14px] md:text-[16px] font-semibold text-secondary-black">
                              {formatMoney(teeTimeGroup.pricePerGolfer)}
                            </div>
                            <div className="text-[12px] md:text-[14px] text-primary-gray">
                              /golfer
                            </div>
                          </div>

                          {/* Third Row */}
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
                      ))
                    }
                  </div>
                </div>
              ))
            }
          </>
        )}
    </div>
  );
};

export default GroupBookingPage;
