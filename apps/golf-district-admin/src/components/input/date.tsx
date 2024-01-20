import { useState, type InputHTMLAttributes } from "react";
import { Calendar as CalendarIcon } from "../icons/calendar";
import "@taak/react-modern-calendar-datepicker/lib/DatePicker.css";
import DatePicker from "@taak/react-modern-calendar-datepicker";

interface DateProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  register?: unknown;
  name: string;
  className?: string;
  error?: string;
}

type CDate = {
  day: number;
  month: number;
  year: number;
};

export const Date = ({
  label,
  className,
  name,
  register,
  error,
  ...props
}: DateProps) => {
  const [selectedDay, setSelectedDay] = useState<CDate | null>(null);

  const renderCustomInput = ({ ref }) => (
    <div className="relative">
      <div className="absolute z-10 top-3 left-3">
        <CalendarIcon />
      </div>
      <input
        value={
          selectedDay
            ? `${selectedDay.month}/${selectedDay.day}/${selectedDay.year}`
            : ""
        }
        readOnly
        ref={ref} // necessary
        className={`rounded-sm bg-stroke-secondary cursor-pointer w-full px-4 py-3 text-[14px] text-gray-500 outline-none pl-10 ${
          selectedDay ? "text-secondary-black" : "text-primary-gray"
        }`}
        //@ts-ignore
        {...register(name)}
        {...props}
      />
    </div>
  );
  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      {label ? (
        <label className="text-[14px] text-primary-gray" htmlFor={props.id}>
          {label}
        </label>
      ) : null}

      <DatePicker
        value={selectedDay}
        onChange={(value: CDate) => setSelectedDay(value)}
        renderInput={renderCustomInput}
        calendarClassName="responsive-calendar"
        colorPrimary="#40942A"
      />
      {error ? <p className="text-[12px] text-red">{error}</p> : null}
    </div>
  );
};
