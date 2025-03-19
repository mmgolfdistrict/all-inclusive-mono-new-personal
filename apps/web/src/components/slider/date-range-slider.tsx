import { Slider } from "~/components/input/slider";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { format } from "date-fns";

export default function DateRangeSlider({
    min,
    max,
    step,
    onSlideDateRange
}) {
    const formatDate = (date: Date | string): string => {
        const parsedDate = new Date(date);
        return format(parsedDate, "yyyy-MM-dd");
    };

    const [minValue, setMinValue] = useState(min);
    const [maxValue, setMaxValue] = useState(max);
    const today = dayjs().startOf("day").format("YYYY-MM-DD");
    const toDateFromNow = dayjs().add(max, "day").endOf("day").format("YYYY-MM-DD");
    const [fromDate, setFromDate] = useState(formatDate(today));
    const [toDate, setToDate] = useState(formatDate(toDateFromNow));
    
    const handleDateRangeChange = () => {
        const startDate = dayjs().add(minValue, "day").endOf("day").format("YYYY-MM-DD HH:mm:ss");
        const endDate = dayjs().add(maxValue, "day").endOf("day").format("YYYY-MM-DD HH:mm:ss");
        setFromDate(formatDate(startDate));
        setToDate(formatDate(endDate));
    }

    return (
        <div className="flex flex-col w-[75%]">
            <h2 className="text-center">Date Range (From {fromDate} To {toDate})</h2>
            <Slider
                min={min}
                max={max}
                step={step}
                value={[minValue, maxValue]}
                onPointerUp={() => {
                    onSlideDateRange({ startDate: fromDate, endDate: toDate })
                }}
                onValueChange={(values: number[]) => {
                    setMinValue(values[0]);
                    setMaxValue(values[1]);
                    handleDateRangeChange();
                }}
                data-testid="price-forecasting-slider-id"
                data-qa={``}
            />
        </div>
    );
}