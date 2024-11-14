"use client";

import React, { useEffect, useState } from "react";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";

interface CustomTimePickerProps {
  label: string;
  setTime: (time: Dayjs) => void;
  flag?: boolean;
}

const CustomTimePicker: React.FC<CustomTimePickerProps> = ({ label, setTime, flag }) => {
    const hours = [12, ...Array.from({ length: 11 }, (_, i) => i + 1)];
    const minutes = ["00", "15", "30", "45"];
    const amPmOptions = ["AM", "PM"];
  
    const [tempHour, setTempHour] = useState<string | number>("");
    const [tempMinute, setTempMinute] = useState<string | number>("");
    const [tempAmPm, setTempAmPm] = useState<string>("");
  
    useEffect(() => {
      if (tempHour !== "" && tempMinute !== "") {
        const hour = tempAmPm === "PM" ? (Number(tempHour) % 12) + 12 : Number(tempHour) % 12;
        const newTime = dayjs().hour(hour).minute(Number(tempMinute));
        setTime(newTime);
      }
    }, [tempHour, tempMinute, tempAmPm, setTime]);
  
    const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
      setTempHour(e.target.value ? parseInt(e.target.value, 10) : "");
  
    const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
      setTempMinute(e.target.value ? parseInt(e.target.value, 10) : "");
  
    const handleAmPmChange = (e: React.ChangeEvent<HTMLInputElement>) =>
      setTempAmPm(e.target.value);
  
    return (
      <div className="flex gap-2 items-center">
        <label className="text-primary-gray">{label}</label>
        <select
          value={tempHour}
          onChange={handleHourChange}
          className={flag ? "border px-2 py-1 rounded ml-2" : "border px-2 py-1 rounded"}
        >
          <option value="" disabled>HH</option>
          {hours.map((hour) => (
            <option key={hour} value={hour}>{hour}</option>
          ))}
        </select>
        <select
          value={tempMinute}
          onChange={handleMinuteChange}
          className="border px-2 py-1 rounded"
        >
          <option value="" disabled>mm</option>
          {minutes.map((minute) => (
            <option key={minute} value={minute}>{minute}</option>
          ))}
        </select>
        <div>
          {amPmOptions.map((option) => (
            <label key={option} className="mx-1">
              <input
                className="mx-1"
                type="radio"
                name={`${label}-amPm`}
                value={option}
                checked={tempAmPm === option}
                onChange={handleAmPmChange}
              />
              {option}
            </label>
          ))}
        </div>
      </div>
    );
  }

  export default CustomTimePicker;
  