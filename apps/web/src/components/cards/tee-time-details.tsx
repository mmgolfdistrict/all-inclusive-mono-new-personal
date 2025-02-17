"use client";

import { useSession } from "@golf-district/auth/nextjs-exports";
import { WeatherIcons } from "~/constants/weather-icons";
import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import { formatMoney, formatTime } from "~/utils/formatters";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ComponentProps } from "react";
import { toast } from "react-toastify";
import { useCopyToClipboard } from "usehooks-ts";
import { Avatar } from "../avatar";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Check } from "../icons/check";
import { Heart } from "../icons/heart";
import { Players } from "../icons/players";
import { Share } from "../icons/share";
import { ChoosePlayers } from "../input/choose-players";
import { Tooltip } from "../tooltip";

const PlayersOptions = ["1", "2", "3", "4"];

export const TeeTimeDetails = ({
  teeTimeId,
  ...props
}: {
  teeTimeId: string;
  props?: ComponentProps<"div">;
}) => {
  const { course } = useCourseContext();
  const courseId = course?.id;

  const { data, isLoading, error, isError, refetch } =
    api.searchRouter.getTeeTimeById.useQuery({ teeTimeId: teeTimeId });

  const { data: allowedPlayers } =
    api.course.getNumberOfPlayersByCourse.useQuery({
      courseId: courseId ?? "",
      time: data?.time,
      date: data?.date ?? "",
      availableSlots: data?.availableSlots,
    });
  const numberOfPlayers = allowedPlayers?.numberOfPlayers;

  const [players, setPlayers] = useState<string>(
    numberOfPlayers?.length !== 0 && numberOfPlayers !== undefined
      ? String(numberOfPlayers[0])
      : "1"
  );

  const [, copy] = useCopyToClipboard();
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const { user } = useUserContext();
  const router = useRouter();
  const { data: session } = useSession();

  const toggleWatchlist = api.watchlist.toggleWatchlist.useMutation();

  const share = async () => {
    const currentUrl = window.location.href;
    if (navigator?.share) {
      await navigator.share({ url: currentUrl });
    } else {
      await copyToClipboard(currentUrl);
    }
  };

  const copyToClipboard = async (url: string) => {
    await copy(url);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 1000);
  };

  const buyTeeTime = () => {
    if (!user || !session) {
      void router.push(`/${course?.id}/login`);
      return;
    } else {
      void router.push(
        `/${course?.id}/checkout?teeTimeId=${teeTimeId}&playerCount=${players}`
      );
    }
  };

  const addToWatchlist = async () => {
    if (!user || !session) {
      void router.push(`/${course?.id}/login`);
      return;
    }
    try {
      await toggleWatchlist.mutateAsync({
        teeTimeId: teeTimeId,
      });
      await refetch();
    } catch (error) {
      toast.error((error as Error)?.message ?? "Error adding to watchlist");
    }
  };

  useEffect(() => {
    if (numberOfPlayers?.length !== 0 && numberOfPlayers !== undefined) {
      setPlayers(String(numberOfPlayers[0]));
    }
  }, [allowedPlayers]);

  if (isLoading) {
    return <Skeleton />;
  }

  return (
    <div
      className="flex w-full flex-col gap-4 bg-white  md:rounded-xl"
      {...props}
    >
      <div className="stroke flex flex-wrap justify-between gap-4 border-b px-4 py-3 md:gap-2 md:px-6 md:py-4">
        <div className="md:text-[20px] text-[18px] font-semibold" id="time-detail-page">
          {isError || data === null ? (
            <div className="h-4" />
          ) : (
            formatTime(data?.date ?? "", true, course?.timezoneCorrection)
          )}
        </div>
        <div className="flex items-center gap-1">
          {isError || data === null ? (
            <div className="h-4" />
          ) : (
            <>
              <div>{WeatherIcons[data?.weather?.iconCode ?? ""]}</div>
              {data?.weather.temperature && data?.weather.name ? (
                <div>{data?.weather.temperature}°F</div>
              ) : null}
              <div className="hidden text-sm text-primary-gray md:block">
                {data?.weather.shortForecast}
              </div>
            </>
          )}
        </div>
      </div>
      {isError ? (
        <div className="flex justify-center items-center h-[200px]">
          <div className="text-center">
            Error: {error?.message ?? "An error occurred"}
          </div>
        </div>
      ) : data === null ? (
        <div className="flex justify-center items-center h-[200px]">
          <div className="text-center">
            We&apos;re sorry. This time is no longer available. Someone just
            booked this. It may take a minute for the sold time you selected to
            be removed. Please select another time.
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4  px-4 pb-2 text-[14px] md:px-6 md:pb-3">
          <div className="flex items-center gap-1">
            <Tooltip
              trigger={<Avatar src={data?.soldByImage} />}
              content={"Sold by " + data?.soldByName}
            />
            {/* <div>Sold by</div>
            <div>{data?.soldByName}</div> */}
          </div>
          {/* <div className="flex items-center gap-4">
            {data?.includesCart ? <GolfCart className="w-[25px]" /> : null}
            <div>
              {data?.includesCart ? "Includes" : "Doesn't include"} cart
            </div>
          </div> */}
          <div className="flex items-center gap-4">
            <Players className="w-[25px]" />
            <ChoosePlayers
              players={
                allowedPlayers?.selectStatus === "ALL_PLAYERS"
                  ? String(data?.availableSlots)
                  : players
              }
              setPlayers={setPlayers}
              playersOptions={PlayersOptions}
              availableSlots={data?.availableSlots ?? 0}
              teeTimeId={teeTimeId}
              numberOfPlayers={numberOfPlayers ? numberOfPlayers : []}
              status={"FIRST_HAND"}
              isDisabled={allowedPlayers?.selectStatus === "ALL_PLAYERS"}
              id="choose-players-detail-page"
            />
          </div>
          <div className="flex flex-col flex-wrap justify-between gap-2 md:flex-row">
            {data?.pricePerGolfer ? (
              <div className="flex items-center" id="price-detail-page">
                <div className="md:text-[18px] text-[16px] font-semibold text-secondary-black">
                  {formatMoney(data?.pricePerGolfer)}
                </div>
                <div className="text-[16px] text-primary-gray"> /golfer</div>
              </div>
            ) : (
              <div />
            )}
            <div className="flex flex-col md:flex-row items-center gap-2">
              <div id="share-button-detail-page">

              <OutlineButton
                onClick={() => void share()}
                className="w-full whitespace-nowrap"
                data-testid="share-button-id"
                >
                <div className="flex items-center justify-center gap-2">
                  {isCopied ? (
                    <>
                      <Check className="w-[18px] min-w-[18px]" /> Copied
                    </>
                  ) : (
                    <>
                      <Share /> Share
                    </>
                  )}
                </div>
              </OutlineButton>
                  </div>
              {course?.supportsWatchlist ? (
                <div id="watchlist-button-detail-page">
                  <OutlineButton
                    className="w-full whitespace-nowrap"
                    onClick={addToWatchlist}
                    data-testid="watch-list-button-id"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Heart
                        className="w-[20px] min-w-[20px]"
                        fill={data?.userWatchListed ? "#40942A" : undefined}
                      />{" "}
                      Watchlist
                    </div>
                  </OutlineButton>
                </div>
              ) : null}
              <div id="buy-button-detail-page">
                <FilledButton
                  className="w-full whitespace-nowrap md:px-14"
                  onClick={buyTeeTime}
                  data-testid="buy-tee-time-button-id"
                >
                  Buy
                </FilledButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Skeleton = () => (
  <div className="flex w-full flex-col gap-4 bg-white  md:rounded-xl">
    <div className="stroke flex flex-wrap justify-between gap-4 border-b px-4 py-3 md:gap-2 md:px-6 md:py-4">
      <div className="h-8 w-[30%] bg-gray-200 rounded-md  animate-pulse" />
      <div className="h-8 w-[30%] bg-gray-200 rounded-md  animate-pulse" />
    </div>
    <div className="flex flex-col gap-4  px-4 pb-2 text-[14px] md:px-6 md:pb-3">
      <div className="flex items-center gap-1">
        <div className="h-8 w-8 bg-gray-200 rounded-full  animate-pulse" />
        <div className="h-8 w-[30%] bg-gray-200 rounded-md  animate-pulse" />
      </div>
      <div className="h-6 w-[30%] bg-gray-200 rounded-md  animate-pulse" />

      <div className="flex items-center gap-4">
        <div className="h-8 w-8 bg-gray-200 rounded-full  animate-pulse" />

        <div className="h-8 w-[30%] bg-gray-200 rounded-md  animate-pulse" />
      </div>
      <div className="flex flex-col justify-between md:items-center gap-2 md:flex-row ">
        <div className="h-6 w-36  bg-gray-200 rounded-md  animate-pulse" />

        <div className="flex flex-col md:flex-row items-center md:w-fit w-full gap-2">
          <div className="h-8 w-full md:w-24 bg-gray-200 rounded-full  animate-pulse" />
          <div className="h-8 w-full md:w-24 bg-gray-200 rounded-full  animate-pulse" />
          <div className="h-8 w-full md:w-24 bg-gray-200 rounded-full  animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);
