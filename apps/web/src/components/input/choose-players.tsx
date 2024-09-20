import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { Item } from "../course-page/filters";
import { toast } from "react-toastify";

export const ChoosePlayers = ({
  players,
  setPlayers,
  playersOptions,
  availableSlots,
  isDisabled,
  className,
  teeTimeId,
  status,
  numberOfPlayers
}: {
  players: string | number;
  setPlayers: (v: string) => void;
  playersOptions: string[];
  availableSlots: number;
  isDisabled?: boolean;
  className?: string;
  teeTimeId: string | undefined;
  status?: string
  numberOfPlayers?: string[]
}) => {


  return (
    <ToggleGroup.Root
      type="single"
      value={players as string}
      onValueChange={(value: string) => {
        if (isDisabled) return;
        if (availableSlots < parseInt(value)) return;
        if (!numberOfPlayers?.includes(value) || status === "SECOND_HAND") {
          return;
        }
        if (value) setPlayers(value);
      }}
      orientation="horizontal"
      className={`flex ${className}`}
      data-testid="player-button-id"
      data-test={teeTimeId}
      data-qa={availableSlots}
      data-cy={players}
    >
      {playersOptions.map((value, index) => (
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
            } px-[1rem] py-[.25rem] ${availableSlots < index + 1 ? "opacity-50 cursor-not-allowed" : ""
            } ${isDisabled || !numberOfPlayers?.includes(value) ? "opacity-50 cursor-not-allowed" : ""} ${className ?? ""
            }`}

        />
      ))}
    </ToggleGroup.Root>
  );
};
// || value == "1" || value === "3"