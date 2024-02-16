import * as RadixSwitch from "@radix-ui/react-switch";
import { type Dispatch, type SetStateAction } from "react";

export const Switch = ({
  value,
  setValue,
  disabled,
  dataTestId
}: {
  value: boolean;
  setValue: (
    newValue: boolean
  ) => void | Promise<void> | Dispatch<SetStateAction<boolean>>;
  disabled?: boolean;
  dataTestId?: string;
}) => {
  return (
    <RadixSwitch.Root
      checked={value}
      data-testid={dataTestId}
      onCheckedChange={(newValue) => setValue(newValue)}
      className={`relative h-[26px] w-[40px] rounded-full bg-stroke shadow-inner transition-colors data-[state=checked]:bg-primary ${
        disabled ? "opacity-60 cursor-not-allowed" : ""
      }`}
    >
      <RadixSwitch.Thumb className="block h-[16px] w-[16px] translate-x-[4px] transform rounded-full bg-white shadow-md transition-transform data-[state=checked]:translate-x-[20px]" />
    </RadixSwitch.Root>
  );
};
