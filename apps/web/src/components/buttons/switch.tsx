import * as RadixSwitch from "@radix-ui/react-switch";
import { type Dispatch, type SetStateAction } from "react";

export const Switch = ({
  value,
  setValue,
  disabled,
  dataTestId,
  id,
}: {
  value: boolean;
  setValue: (
    newValue: boolean
  ) => void | Promise<void> | Dispatch<SetStateAction<boolean>>;
  disabled?: boolean;
  dataTestId?: string;
  id?: string;
}) => {
  return (
    <RadixSwitch.Root
      checked={value}
      data-testid={dataTestId}
      data-qa={value}
      onCheckedChange={(newValue) => setValue(newValue)}
      className={`relative h-[1.625rem] w-[2.5rem] rounded-full bg-stroke shadow-inner transition-colors data-[state=checked]:bg-primary ${disabled ? "opacity-60 cursor-not-allowed" : ""
        }`}
      id={id}
    >
      <RadixSwitch.Thumb className="block h-[1rem] w-[1rem] translate-x-[0.25rem] transform rounded-full bg-white shadow-md transition-transform data-[state=checked]:translate-x-[1.25rem]" />
    </RadixSwitch.Root>
  );
};
