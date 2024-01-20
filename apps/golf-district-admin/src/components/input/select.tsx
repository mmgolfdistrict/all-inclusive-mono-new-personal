import * as RadixSelect from "@radix-ui/react-select";
import {
  forwardRef,
  type ReactNode,
  type RefAttributes,
  type RefObject,
} from "react";
import { Check } from "../icons/check";
import { DownChevron } from "../icons/down-chevron";
import { ReadOnly } from "../icons/read-only";

export const Select = ({
  label,
  values,
  value,
  setValue,
  isReadOnly,
  placeholder,
  icon,
}: {
  label: string;
  values: string[];
  value: string;
  setValue: (v: string) => void;
  placeholder: string;
  isReadOnly?: boolean;
  icon?: ReactNode;
}) => {
  return (
    <RadixSelect.Root value={value} onValueChange={setValue}>
      <div className="w-full flex flex-col gap-1">
        <div className="text-[14px] text-primary-gray">{label}</div>
        <RadixSelect.Trigger
          disabled={isReadOnly}
          className={`flex h-[45px] w-full items-center justify-between gap-2 whitespace-nowrap rounded-sm bg-stroke-secondary px-4 py-2 text-[14px] outline-none ${
            value ? "text-secondary-black" : "text-primary-gray"
          }`}
        >
          <div className="flex items-center gap-2">
            {icon}
            <RadixSelect.Value aria-label={value}>
              {value ? value : placeholder}
            </RadixSelect.Value>
          </div>
          <RadixSelect.Icon className="text-primary-gray">
            {isReadOnly ? (
              <ReadOnly />
            ) : (
              <DownChevron className="h-[14px] w-[14px]" />
            )}
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
      </div>

      <RadixSelect.Portal className="w-full">
        <RadixSelect.Content
          position="popper"
          className="rounded-sm w-full bg-white border shadow-lg z-[100]"
        >
          <RadixSelect.ScrollUpButton className="flex h-[25px] cursor-default items-center justify-center bg-white text-primary-gray">
            <DownChevron className="h-[14px] w-[14px] rotate-180" />
          </RadixSelect.ScrollUpButton>
          <RadixSelect.Viewport className="w-full">
            {values.map((item, idx) => (
              <SelectItem value={item} key={idx} className="cursor-pointer">
                {item}
              </SelectItem>
            ))}

            <RadixSelect.Separator />
          </RadixSelect.Viewport>
          <RadixSelect.ScrollDownButton className="flex h-[25px] cursor-default items-center justify-center bg-white text-primary-gray">
            <DownChevron className="h-[14px] w-[14px]" />
          </RadixSelect.ScrollDownButton>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
};

const SelectItem = forwardRef(
  (
    {
      children,
      value,
      className,
      ...props
    }: {
      children: ReactNode;
      className?: string;
      value: string;
      props?: RadixSelect.SelectItemProps & RefAttributes<HTMLDivElement>;
    },
    forwardedRef
  ) => {
    return (
      <RadixSelect.Item
        className={`relative w-full min-w-[250px] py-5 flex h-[30px] select-none items-center rounded-sm pl-[25px] pr-[35px] text-[13px] leading-none text-primary-gray data-[disabled]:pointer-events-none data-[highlighted]:bg-stroke-secondary data-[disabled]:text-stroke data-[highlighted]:text-black data-[highlighted]:outline-none
        ${className ?? ""}`}
        value={value}
        {...props}
        ref={forwardedRef as RefObject<HTMLDivElement>}
      >
        <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
        <RadixSelect.ItemIndicator className="absolute left-0 inline-flex w-[25px] items-center justify-center ">
          <Check className="h-[15px] w-[15px]" />
        </RadixSelect.ItemIndicator>
      </RadixSelect.Item>
    );
  }
);

SelectItem.displayName = "SelectItem";
