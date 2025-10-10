import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { useRouter, useSearchParams } from "next/navigation";
import { Item } from "../course-page/filters";
import { useMemo } from "react";

export const ChoosePlayers = ({
  players,
  setPlayers,
  playersOptions,
  availableSlots,
  isDisabled,
  className,
  teeTimeId,
  status,
  numberOfPlayers,
  id,
  supportsGroupBooking,
  allowSplit,
  groupBookingParams
}: {
  players: string | number;
  setPlayers: (v: string) => void;
  playersOptions: string[];
  availableSlots: number;
  isDisabled?: boolean;
  className?: string;
  teeTimeId: string | undefined;
  status?: string;
  numberOfPlayers: string[];
  id?: string;
  supportsGroupBooking?: boolean;
  allowSplit?: boolean;
  groupBookingParams?: string;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlWithCourse = useMemo(() => {
    const splitUrl = window.location.href.split("/");
    const courseUrl = splitUrl.slice(0, 4).join("/");
    return courseUrl;
  }, []);

  // Determine if second hand with no split is active
  const isSecondHandNoSplit = status === "SECOND_HAND" && !allowSplit;
  const selectedPlayerStr = String(players);

  const handlePlayerChange = (value: string) => {
    if (isDisabled) return;
    if (availableSlots < parseInt(value)) return;

    // Enforce disabled options for second hand no split - only allow changing to fixed count
    if (isSecondHandNoSplit && value !== selectedPlayerStr) return;

    if (!numberOfPlayers?.includes(value)) return;

    if (value) {
      setPlayers(value);

      // Update URL with playerCount param if present
      const newSearchParams = new URLSearchParams(searchParams.toString());
      if (newSearchParams.has("playerCount")) {
        newSearchParams.set("playerCount", value);
        router.push(`${window.location.pathname}?${newSearchParams.toString()}`);
      }
    }
  };

  return (
    <ToggleGroup.Root
      type="single"
      value={selectedPlayerStr}
      onValueChange={handlePlayerChange}
      orientation="horizontal"
      className={`flex ${className}`}
      data-testid="player-button-id"
      data-test={teeTimeId}
      data-qa={availableSlots}
      data-cy={players}
      id={id}
    >
      {playersOptions.map((value, index) => {
        // Disable all options except currently selected one if second hand no split
        const isOptionDisabled =
          isDisabled ||
          (availableSlots < index + 1) || // disable if slot not available
          (isSecondHandNoSplit && value !== selectedPlayerStr) || // disable others if second hand no split
          !numberOfPlayers?.includes(value); // disable if not allowed per numberOfPlayers

        return (
          <Item
            key={index}
            value={value}
            label={value}
            dataTestId="tee-time-player-id"
            dataTest={teeTimeId}
            dataQa={value}
            className={`${index === 0
              ? "rounded-l-full border border-stroke"
              : index === playersOptions.length - 1
                ? "rounded-r-full border-b border-t border-r border-stroke"
                : "border-b border-r border-t border-stroke"
              } px-[1rem] py-[.25rem] z-[1]
              ${isOptionDisabled ? "opacity-50 cursor-not-allowed" : ""}
              ${className ?? ""}`}
          />
        );
      })}
      {supportsGroupBooking && (
        <button
          className={`!text-primary rounded-full border border-primary
          px-[0.75rem] py-[0.25rem] ml-[0.25rem] bg-white cursor-pointer
          ${className ?? ""}
          `}
          onClick={() => {
            router.push(
              `${urlWithCourse}/group-booking?${groupBookingParams ?? ""}`
            );
          }}
          data-testid="group-booking-button-id"
        >
          5+
        </button>
      )}
    </ToggleGroup.Root>
  );
};
