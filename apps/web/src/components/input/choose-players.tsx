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
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlWithCourse = useMemo(() => {
    const splitUrl = window.location.href.split("/");
    const courseUrl = splitUrl.slice(0, 4).join("/");
    return courseUrl;
  }, []);

  const handlePlayerChange = (value: string) => {
    if (isDisabled) return;
    if (availableSlots < parseInt(value)) return;
    if (!numberOfPlayers?.includes(value) || status === "SECOND_HAND") {
      return;
    }
    if (value) {
      setPlayers(value);

      // Check if playerCount is already present in the query
      const newSearchParams = new URLSearchParams(searchParams.toString());
      if (newSearchParams.has("playerCount")) {
        // If playerCount is present, update the URL with the new playerCount value
        newSearchParams.set("playerCount", value);

        // Push the updated URL
        router.push(
          `${window.location.pathname}?${newSearchParams.toString()}`
        );
      }
    }
  };

  return (
    <ToggleGroup.Root
      type="single"
      value={players as string}
      onValueChange={handlePlayerChange}
      orientation="horizontal"
      className={`flex ${className}`}
      data-testid="player-button-id"
      data-test={teeTimeId}
      data-qa={availableSlots}
      data-cy={players}
      id={id}
    >
      {playersOptions.map((value, index) => (
        <Item
          key={index}
          value={value}
          label={value}
          dataTestId="tee-time-player-id"
          dataTest={teeTimeId}
          dataQa={value}
          className={`${
            index === 0
              ? "rounded-l-full border border-stroke"
              : index === playersOptions.length - 1
              ? "rounded-r-full border-b border-t border-r border-stroke"
              : "border-b border-r border-t border-stroke"
          } px-[1rem] py-[.25rem] z-[1] ${
            availableSlots < index + 1 ? "opacity-50 cursor-not-allowed" : ""
          } ${
            isDisabled || !numberOfPlayers?.includes(value)
              ? "opacity-50 cursor-not-allowed"
              : ""
          } ${className ?? ""}`}
        />
      ))}
      {supportsGroupBooking && !(status === "SECOND_HAND")
        ? <button
          className={`!text-primary rounded-full border border-primary
          px-[.75rem] py-[.25rem] ml-[0.25rem] bg-white cursor-pointer
          ${className ?? ""}
          `}
          onClick={() => {
            router.push(
              `${urlWithCourse}/group-booking`
            )
          }}
        >5+</button>
        : null}
    </ToggleGroup.Root>
  );
};
