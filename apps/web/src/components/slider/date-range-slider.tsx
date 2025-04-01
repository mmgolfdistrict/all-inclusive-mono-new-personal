import { Slider } from "~/components/input/slider";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { format } from "date-fns";

interface DateRangeSliderProps {
    min: number;
    max: number;
    step: number;
    onSlideDateRange: (range: { startDate: string; endDate: string }) => void;
  }

export default function DateRangeSlider({
    min,
    max,
    step,
    onSlideDateRange
}: DateRangeSliderProps) {
    const formatDate = (date: Date | string): string => {
        const parsedDate = new Date(date);
        return format(parsedDate, "yyyy-MM-dd");
    };

    const [minValue, setMinValue] = useState<number>(min);
    const [maxValue, setMaxValue] = useState<number>(max);
    const today = dayjs().startOf("day").format("YYYY-MM-DD");
    const toDateFromNow = dayjs().add(max, "day").endOf("day").format("YYYY-MM-DD");
    const [fromDate, setFromDate] = useState(formatDate(today));
    const [toDate, setToDate] = useState(formatDate(toDateFromNow));
    
    const handleDateRangeChange = (minValue: number, maxValue: number) => {
        const startDate = minValue === 0 ? dayjs().startOf("day").format("YYYY-MM-DD HH:mm:ss")
        : dayjs().add(minValue, "day").endOf("day").format("YYYY-MM-DD HH:mm:ss");
        const endDate = dayjs().add(maxValue, "day").endOf("day").format("YYYY-MM-DD HH:mm:ss");
        setFromDate(formatDate(startDate));
        setToDate(formatDate(endDate));
    }

    useEffect(() => {
        handleDateRangeChange(minValue, maxValue);
    }, [minValue, maxValue])

    return (
        <div className="flex flex-col w-[75%]">
            <h2 className="text-center">Date Range (From {fromDate} To {toDate})</h2>
            <Slider
                min={min}
                max={max}
                step={step}
                onPointerUp={() => {
                    onSlideDateRange({ startDate: fromDate, endDate: toDate });  
                }}
                value={[minValue, maxValue]}
                onValueChange={(values: number[]) => {
                    setMinValue(values[0] ?? min);
                    setMaxValue(values[1] ?? max);
                }}
                data-testid="price-forecasting-slider-id"
                data-qa={``}
            />
        </div>
    );
}
