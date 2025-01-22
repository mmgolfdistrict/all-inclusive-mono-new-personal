import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import { Close } from "../icons/close";

interface Props {
    closeForecastModal: () => void;
    startDate: string;
    endDate: string;
}

const formatShowDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "EEE MMM dd");
};

export const ForecastModal = ({
    closeForecastModal,
    startDate: propStartDate,
    endDate: propEndDate,
}: Props) => {
    const { course } = useCourseContext();
    const isMobile = useMediaQuery("(max-width: 768px)");
    const [startDate, setStartDate] = useState<string>(propStartDate);
    const [endDate, setEndDate] = useState<string>(propEndDate);
    console.log("propStartDate", propStartDate);
    console.log("startDate", startDate);
    console.log("propEndDate", propEndDate);
    console.log("endDate", endDate);
    useEffect(() => {
        const today = new Date();
        const parsedStartDate = new Date(propStartDate);

        if (parsedStartDate.toDateString() === today.toDateString()) {
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            setStartDate(formatDate(tomorrow));
            setEndDate(getNext7Days(tomorrow, propEndDate));
        } else {
            setStartDate(formatDate(parsedStartDate));
            setEndDate(getNext7Days(parsedStartDate, propEndDate));
        }
    }, [propStartDate, propEndDate]);

    const { data, isLoading } = api.searchRouter.getPriceForecast.useQuery({
        courseId: course?.id ?? "",
        startDate,
        endDate,
    });
    console.log("data", data);

    const getNext7Days = (
        currentStartDate: Date | string,
        propEndDate: string
    ): string => {
        const start = new Date(currentStartDate);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);

        const parsedPropEndDate = new Date(propEndDate);
        if (end > parsedPropEndDate) {
            return formatDate(parsedPropEndDate);
        }
        return formatDate(end);
    };
    const formatDate = (date: Date | string): string => {
        const parsedDate = new Date(date);
        const year = parsedDate.getFullYear();
        const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
        const day = String(parsedDate.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const handleNext = () => {
        if (new Date(endDate) >= new Date(propEndDate)) {
            return;
        }
        const newStartDate = new Date(startDate);
        newStartDate.setDate(newStartDate.getDate() + 7);

        if (newStartDate > new Date(propEndDate)) {
            return;
        }

        let newEndDate = new Date(newStartDate);
        newEndDate.setDate(newStartDate.getDate() + 6);

        if (newEndDate > new Date(propEndDate)) {
            newEndDate = new Date(propEndDate);
        }

        setStartDate(formatDate(newStartDate));
        setEndDate(formatDate(newEndDate));
    };

    const handlePrevious = () => {
        const newStartDate = new Date(startDate);
        newStartDate.setDate(newStartDate.getDate() - 7);

        if (newStartDate < new Date(propStartDate)) {
            return;
        }

        let newEndDate = new Date(newStartDate);
        newEndDate.setDate(newStartDate.getDate() + 6);

        if (newEndDate < new Date(propStartDate)) {
            newEndDate = new Date(propStartDate);
        }

        setStartDate(formatDate(newStartDate));
        setEndDate(formatDate(newEndDate));
    };
    console.log(isMobile);
    const isNextDisabled = new Date(endDate) >= new Date(propEndDate);

    return (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black w-screen backdrop-blur bg-opacity-50 overflow-hidden">
            <div
                className={`bg-white p-6 rounded-lg  sm:max-w-4xl md:max-w-3xl lg:max-w-2xl xl:max-w-5xl w-full ${isMobile && "w-full"
                    }`}
            >
                <div className="flex justify-between items-center">
                    <div className="flex justify-between items-center mb-2 w-[170px]">
                        <button
                            className="text-sm font-medium hover:underline"
                            onClick={handlePrevious}
                            disabled={new Date(startDate) <= new Date(propStartDate)}
                        >
                            &lt; Previous
                        </button>
                        <button
                            className="text-sm font-medium hover:underline"
                            onClick={handleNext}
                            disabled={isNextDisabled}
                        >
                            Next &gt;
                        </button>
                    </div>
                    <button onClick={closeForecastModal} className="text-xl">
                        <Close className="h-[25px] w-[25px]" />
                    </button>
                </div>
                <div className="mt-4 overflow-x-auto">
                    <table className=" w-full border-collapse text-sm">
                        <thead className="top-0 table-header-group">
                            <tr className="text-left">
                                {isLoading ? "" : data?.length === 0 ? (
                                    ""
                                ) : (
                                    <TableHeader text="Dates / Times" />
                                )}
                                {data?.map((item) => (
                                    <TableHeader
                                        key={item.providerDate}
                                        text={formatShowDate(item.providerDate as string)}
                                        className="text-center"
                                    />
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array(5)
                                    .fill(0)
                                    .map((_, index) => (
                                        <SkeletonRow key={index} isMobile={isMobile} />
                                    ))
                            ) : data?.length === 0 ? (
                                <div className={`${isMobile ? "py-36" : "p-36"}  text-center`}>
                                    Data is not available for {formatShowDate(startDate)} -{" "}
                                    {formatShowDate(endDate)}
                                </div>
                            ) : (
                                <>
                                    <tr className="border-b border-stroke text-primary-gray">
                                        <td className="px-4 py-2 font-semibold">
                                            <p className="text-secondary-black">Early Morning</p>{" "}
                                            06:00 AM – 07:30 AM
                                        </td>
                                        {data?.map((item) => (
                                            <td
                                                key={item.providerDate}
                                                className="px-4 py-2 text-center"
                                            >
                                                {item.MidMorning != null && item.MidMorning >= 0
                                                    ? `$${item.MidMorning.toFixed(2)}`
                                                    : "-"}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="border-b border-stroke text-primary-gray">
                                        <td className="px-4 py-2 font-semibold">
                                            <p className="text-secondary-black">Mid-Morning</p> 08:00
                                            AM – 10:30 AM
                                        </td>
                                        {data?.map((item) => (
                                            <td
                                                key={item.providerDate}
                                                className="px-4 py-2 text-center"
                                            >
                                                {item.MidMorning != null && item.MidMorning >= 0
                                                    ? `$${item.MidMorning.toFixed(2)}`
                                                    : "-"}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="border-b border-stroke text-primary-gray">
                                        <td className="px-4 py-2 font-semibold">
                                            <p className="text-secondary-black">Early Afternoon</p>{" "}
                                            10:30 AM – 1:30 PM
                                        </td>
                                        {data?.map((item) => (
                                            <td
                                                key={item.providerDate}
                                                className="px-4 py-2 text-center"
                                            >
                                                {item.EarlyAfternoon != null && item.EarlyAfternoon >= 0
                                                    ? `$${item.EarlyAfternoon.toFixed(2)}`
                                                    : "-"}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="border-b border-stroke text-primary-gray">
                                        <td className="px-4 py-2 font-semibold">
                                            <p className="text-secondary-black">Afternoon</p> 02:00 PM
                                            – 04:00 PM
                                        </td>
                                        {data?.map((item) => (
                                            <td
                                                key={item.providerDate}
                                                className="px-4 py-2 text-center"
                                            >
                                                {item.Afternoon != null && item.Afternoon >= 0
                                                    ? `$${item.Afternoon.toFixed(2)}`
                                                    : "-"}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="border-b border-stroke text-primary-gray pr-1">
                                        <td className="px-4 py-2 font-semibold">
                                            <p className="text-secondary-black">Twilight</p> 04:00 PM
                                            – 06:00 PM
                                        </td>
                                        {data?.map((item) => (
                                            <td
                                                key={item.providerDate}
                                                className="px-4 py-2 text-center"
                                            >
                                                {item.Twilight != null && item.Twilight >= 0
                                                    ? `$${item.Twilight.toFixed(2)}`
                                                    : "-"}
                                            </td>
                                        ))}
                                    </tr>
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const TableHeader = ({
    text,
    className,
}: {
    text: string;
    className?: string;
}) => {
    return (
        <th className={`whitespace-nowrap px-4 font-semibold ${className ?? ""}`}>
            {text}
        </th>
    );
};

const SkeletonRow = ({ isMobile }) => {
    return (
        <tr className="w-full border-b border-stroke text-primary-gray animate-pulse">
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-2">
                        <div className="h-4 w-28 bg-gray-200 rounded-md"></div>
                        <div className="h-3 w-22 bg-gray-200 rounded-md"></div>
                        {isMobile ? (
                            <div className="h-4 w-22 bg-gray-200 rounded-md"></div>
                        ) : (
                            ""
                        )}
                    </div>
                </div>
            </td>
            <td className="px-4 py-3">
                <div className="h-5 w-24 bg-gray-200 rounded-md"></div>
            </td>
            <td className="px-4 py-3">
                <div className="h-5 w-24 bg-gray-200 rounded-md"></div>
            </td>
            <td className="px-4 py-3">
                <div className="h-5 w-24 bg-gray-200 rounded-md"></div>
            </td>
            <td className="px-4 py-3">
                <div className="h-5 w-24 bg-gray-200 rounded-md"></div>
            </td>
            <td className="px-4 py-3">
                <div className="h-5 w-24 bg-gray-200 rounded-md"></div>
            </td>
            <td className="px-4 py-3">
                <div className="h-5 w-24 bg-gray-200 rounded-md"></div>
            </td>
        </tr>
    );
};
