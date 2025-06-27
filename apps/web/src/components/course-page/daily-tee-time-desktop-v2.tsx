import {
    TeeTimeType,
    type CombinedObject,
    type NotificationObject,
} from "@golf-district/shared";
import { WeatherIcons } from "~/constants/weather-icons";
import { useCourseContext } from "~/contexts/CourseContext";
import { useFiltersContext } from "~/contexts/FiltersContext";
import { useDraggableScroll } from "~/hooks/useDraggableScroll";
import { api } from "~/utils/api";
import { dayMonthDate, dayMonthDateV2 } from "~/utils/formatters";
import { useEffect, useRef, useState } from "react";
import { TeeTime } from "../cards/tee-time";
import { Info } from "../icons/info";
import { LeftChevron } from "../icons/left-chevron";
import { Tooltip } from "../tooltip";
import { TeeTimeSkeleton } from "./tee-time-skeleton";
import dayjs from "dayjs";

export const DailyTeeTimesDesktopV2 = ({
    minDate,
    maxDate,
    setError,
    handleLoading,
    dateType,
    dates,
    isLoadingTeeTimeDate
}: {
    minDate: string;
    maxDate: string;
    setError: (t: string | null) => void;
    handleLoading?: (val: boolean) => void;
    dateType: string,
    dates: string[],
    isLoadingTeeTimeDate: boolean
}) => {
    const overflowRef = useRef<HTMLDivElement>(null);
    const { onMouseDown } = useDraggableScroll(overflowRef, {
        direction: "horizontal",
    });
    const [date, setDate] = useState<string>(dates[0] ?? '');
    const [isAtStart, setIsAtStart] = useState(true);
    const [isAtEnd, setIsAtEnd] = useState(false);
    const { course } = useCourseContext();
    const courseId = course?.id;
    useEffect(() => {
        setDate(dates[0] ?? '')
    }, [dateType, minDate])

    const { data: courseException } =
        api.courseException.getCourseException.useQuery({
            courseId: courseId ?? "",
        });

    const getCourseException = (playDate: string): null | NotificationObject => {
        let flag = false;
        let msg: NotificationObject | null = null;
        courseException?.forEach((ce) => {
            const startDate = new Date(ce.startDate);
            const endDate = new Date(ce.endDate);
            const dateToCheck = new Date(playDate);
            if (dateToCheck > startDate && dateToCheck < endDate) {
                flag = true;
                msg = ce;
            }
        });
        if (flag) {
            return msg;
        }
        return null;
    };

    const courseExceptions = getCourseException(date)

    const {
        showUnlisted,
        includesCart,
        golfers,
        holes,
        priceRange,
        startTime,
        sortValue,
    } = useFiltersContext();
    const teeTimeStartTime = startTime[0];
    const teeTimeEndTime = startTime[1];

    const { data: allowedPlayers } =
        api.course.getNumberOfPlayersByCourse.useQuery({
            courseId: courseId ?? "",
        });

    const numberOfPlayers = allowedPlayers?.numberOfPlayers[0];

    const playersCount = numberOfPlayers ? Number(numberOfPlayers) : 0;

    const { data: weather, isLoading: isLoadingWeather } =
        api.searchRouter.getWeatherForDay.useQuery(
            {
                courseId: course?.id ?? "",
                date,
            },
            {
                enabled: course?.id !== undefined && date !== undefined,
            }
        );
    const TAKE = 250;
    const {
        data: teeTimeData,
        isLoading,
        error,
        refetch,
    } = api.searchRouter.getTeeTimesForDay.useInfiniteQuery(
        {
            courseId: course?.id ?? "",
            date,
            minDate,
            maxDate,
            startTime: teeTimeStartTime,
            endTime: teeTimeEndTime,
            holes: holes === "Any" || holes === "18" ? 18 : 9,
            showUnlisted,
            includesCart,
            golfers: golfers === "Any" ? -1 : golfers,
            lowerPrice: priceRange[0]!,
            upperPrice: priceRange[1]!,
            sortTime:
                sortValue === "Sort by time - Early to Late"
                    ? "asc"
                    : sortValue === "Sort by time - Late to Early"
                        ? "desc"
                        : "",
            sortPrice:
                sortValue === "Sort by price - Low to High"
                    ? "asc"
                    : sortValue === "Sort by price - High to Low"
                        ? "desc"
                        : "",
            timezoneCorrection: course?.timezoneCorrection,
            take: TAKE,
        },
        {
            getNextPageParam: (lastPage) => {
                if (lastPage?.results?.length === 0) return null;
                if (lastPage?.results?.length < TAKE) return null;
                let c = lastPage.cursor ?? 1;
                c = c + 1;
                return c;
            },
            enabled: course?.id !== undefined && date !== undefined,
            refetchOnWindowFocus: false,
        }
    );

    useEffect(() => {
        setError(error?.message ?? null);
    }, [error]);


    const allTeeTimes =
        teeTimeData?.pages[teeTimeData?.pages?.length - 1]?.results ?? [];

    const isScrolling = useRef(false);

    const scrollCarousel = (direction: "left" | "right") => {
        const container = overflowRef.current;
        if (!container) return;

        const boxWidth = 265;
        const containerWidth = container.clientWidth;

        const visibleCount = Math.floor(containerWidth / (boxWidth + 16));
        const scrollAmount = visibleCount * (boxWidth + 16);

        if (direction === "right") {
            container.classList.add("scroll-smooth");
            container.scrollBy({ left: scrollAmount, behavior: "smooth" });
            setTimeout(() => {
                isScrolling.current = false;
            }, 500);
        } else {
            container.classList.add("scroll-smooth");
            container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
        }
        updateArrowState(container)
    };

    const scrollRight = () => scrollCarousel("right");
    const scrollLeft = () => scrollCarousel("left");

    useEffect(() => {
        setIsAtStart(true);
        setIsAtEnd(false);
        if (overflowRef.current) {
            overflowRef.current.scrollLeft = 0;
        }
    }, [dateType]);

    const updateArrowState = (container: HTMLElement) => {
        if (!container) return;

        const isAtStart = container.scrollLeft === 0;
        const isAtEnd = Math.ceil(container.scrollLeft + container.clientWidth) >= container.scrollWidth;

        setIsAtStart(isAtStart);
        setIsAtEnd(isAtEnd);
    };
    useEffect(() => {
        const container = overflowRef.current;
        if (container) {
            updateArrowState(container);

            const handleScroll = () => {
                updateArrowState(container);
            };

            container.addEventListener("scroll", handleScroll);

            return () => {
                container.removeEventListener("scroll", handleScroll);
            };
        }
    }, [overflowRef]);

    return (
        <div className="flex flex-col gap-1 md:gap-4 bg-white px-4 py-2 md:rounded-xl md:px-8 md:py-6">
            <div className="relative" >

                <div className="absolute top-1/2 md:block -translate-y-1/2 z-[2] flex items-center justify-center -left-1 md:-left-6">
                    <button
                        onClick={() => scrollLeft()}
                        className={`flex h-fit items-center justify-center rounded-full bg-white p-2 shadow-overflow-indicator ${isAtStart ? 'hidden' : ""}`}
                        data-testid="tee-time-left-chevron-id"
                        aria-label="Scroll Left"
                    // disabled={isAtStart}
                    >
                        <LeftChevron fill="#40942A" className="w-[16px]" />
                    </button>
                </div>
                <div
                    className="scrollbar-none w-full flex overflow-x-auto overflow-y-hidden gap-4"
                    ref={overflowRef}
                    onMouseDown={onMouseDown}
                    style={{
                        scrollSnapType: "x mandatory",
                        scrollBehavior: "smooth",
                    }}
                >
                    <ul
                        style={{
                            position: "relative",
                            display: "flex",
                            margin: "0px",
                            padding: "0px",
                            listStyle: "none",
                            overflowY: "visible",
                            scrollbarWidth: "none",
                            scrollSnapType: "x mandatory",
                            scrollMarginInlineStart: "2.5em",
                            gap: 15
                        }}
                    >
                        {isLoadingTeeTimeDate
                            ? Array.from({ length: 16 }).map((_, idx) => (
                                <li
                                    key={idx}
                                    className="p-4 min-w-[160px] border rounded-lg text-center bg-gray-200 animate-pulse"
                                >
                                    <div className="h-6 w-[50%] bg-gray-300 rounded-md mx-auto animate-pulse"></div>
                                </li>
                            ))
                            : dates?.map((elm: string, idx: number) => {
                                const isSelected = dayjs(date).format("YYYY-MM-DD") === dayjs(elm).format("YYYY-MM-DD");

                                return (
                                    <button
                                        key={idx}
                                        className={`p-4 min-w-[160px] border rounded-lg text-center cursor-pointer ${isSelected ? "bg-primary text-white" : ""
                                            }`}
                                        onClick={() => setDate(elm)}
                                    >
                                        <div className={`text-gray-700 ${isSelected ? "text-white" : ""}`}>
                                            {dayMonthDateV2(elm)}
                                        </div>
                                    </button>
                                );
                            })}
                    </ul>
                </div>
                <div className="absolute z-[2] md:block top-1/2 -translate-y-1/2 flex items-center justify-center -right-1 md:-right-6">
                    <button
                        onClick={scrollRight}
                        className={`flex h-fit items-center justify-center rounded-full bg-white p-2 shadow-overflow-indicator ${isAtEnd || dates.length <= 5 ? 'hidden' : ""}`}
                        data-testid="tee-time-right-chevron-id"
                        aria-label="Scroll Right"
                    >
                        <LeftChevron fill="#40942A" className="w-[16px] rotate-180" />
                    </button>
                </div>
            </div>
            <div className="flex flex-wrap justify-between gap-2 unmask-time">
                {isLoading ? (
                    <div className="h-8 min-w-[150px] w-[20%] bg-gray-200 rounded-md  animate-pulse unmask-time" />
                ) : (
                    <div
                        id="tee-time-box"
                        className="text-[16px] md:text-[20px] unmask-time"
                        data-testid="date-group-id"
                        data-qa={dayMonthDate(date)}
                    >
                        {dayMonthDate(date)}
                    </div>
                )}

                {courseExceptions && (
                    <div className="flex-1 flex items-center gap-1">
                        <p
                            style={{
                                backgroundColor: courseExceptions.bgColor,
                                color: courseExceptions.color,
                            }}
                            className="inline text-left text-[13px] md:text-lg"
                        >
                            {courseExceptions.shortMessage}
                        </p>

                        {courseExceptions.longMessage && (
                            <Tooltip
                                className="text-left"
                                trigger={
                                    <span className="cursor-pointer" title="More Info">
                                        <Info className="h-4 md:h-5" />
                                    </span>
                                }
                                content={courseExceptions.longMessage}
                            />
                        )}
                    </div>
                )}

                {isLoadingWeather && !weather ? (
                    <div className="h-8 w-[30%] bg-gray-200 rounded-md  animate-pulse" />
                ) : weather && !isLoadingWeather && (
                    <div className="flex items-center gap-1">
                        <div>{WeatherIcons[weather?.iconCode ?? ""]}</div>
                        <div
                            className="text-[12px] md:text-[16px] unmask-temperature"
                            data-testid="weather-degrees-id"
                            data-qa={weather?.temperature}
                        >
                            {weather?.temperature !== 0 ? `${weather?.temperature}°F` : ""}
                        </div>
                        <div
                            className="hidden text-sm text-primary-gray md:block"
                            data-testid="weather-text-id"
                            data-qa={weather?.shortForecast}
                        >
                            {weather?.shortForecast ?? ""}
                        </div>
                    </div>
                )}
            </div>

            <div>
                <ul
                    style={{
                        // display:"flex",
                        // flexWrap:'wrap',
                        margin: "0px",
                        padding: "0px",
                        listStyle: "none",
                    }}
                >
                    {allTeeTimes?.map((i: CombinedObject, idx: number) => {
                        if (
                            i.firstOrSecondHandTeeTime === TeeTimeType.SECOND_HAND ||
                            i.availableSlots >= playersCount
                        ) {
                            return (
                                <li
                                    key={idx}
                                    style={{
                                        scrollSnapAlign: "start",
                                        padding: "0 11px",
                                        display: "inline-block",
                                        marginTop: "20px"
                                    }}
                                >
                                    <TeeTime
                                        time={i.date}
                                        key={idx}
                                        items={i}
                                        index={idx}
                                        canChoosePlayer={i.availableSlots > 0}
                                        availableSlots={i.availableSlots}
                                        players={String(4 - i.availableSlots)}
                                        firstHandPurchasePrice={i?.firstHandPurchasePrice}
                                        price={i.pricePerGolfer}
                                        isOwned={i?.isOwned}
                                        soldById={i?.soldById}
                                        soldByImage={i?.soldByImage}
                                        soldByName={i?.soldByName}
                                        teeTimeId={i?.teeTimeId}
                                        isLiked={i?.userWatchListed}
                                        status={i?.firstOrSecondHandTeeTime}
                                        minimumOfferPrice={i?.minimumOfferPrice}
                                        bookingIds={i?.bookingIds ?? []}
                                        listingId={i?.listingId}
                                        listedSlots={i?.listedSlots}
                                        handleLoading={handleLoading}
                                        refetch={refetch}
                                        groupId={i?.groupId}
                                        allowSplit={i?.allowSplit}
                                    />
                                </li>
                            );
                        }
                    })}

                    {isLoading
                        ? Array(8)
                            .fill(null)
                            .map((_, idx) => <li
                                key={idx}
                                style={{
                                    scrollSnapAlign: "start",
                                    paddingRight: "16px",
                                    display: "inline-block",
                                    marginTop: 15
                                }}
                            > <TeeTimeSkeleton key={idx} /> </li>)
                        : null}
                </ul>
            </div>
        </div>
    );
};
