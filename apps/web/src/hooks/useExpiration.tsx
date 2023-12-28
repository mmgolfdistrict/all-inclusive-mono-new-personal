import { countdownTime } from "~/utils/formatters";
import { useEffect, useState } from "react";
import { useCountdown } from "usehooks-ts";

export const useExpiration = ({
  expirationDate,
  intervalMs = 1000,
}: {
  expirationDate?: string;
  intervalMs?: number;
}) => {
  const [count, { startCountdown, stopCountdown, resetCountdown }] =
    useCountdown({
      countStart: Math.floor(
        Number(expirationDate) - Number(Date.now() / 1000)
      ),
      intervalMs: intervalMs,
    });
  const [timeTillEnd, setTimeTillEnd] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (count === 0) return;
    setTimeTillEnd(countdownTime(count));
  }, [count]);

  useEffect(() => {
    resetCountdown();
    startCountdown();
    return () => {
      stopCountdown();
    };
  }, [expirationDate]);

  return {
    timeTillEnd,
    count,
  };
};
