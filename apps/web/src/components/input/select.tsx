import * as RadixSelect from "@radix-ui/react-select";
import {
  forwardRef,
  type ReactNode,
  type RefAttributes,
  type RefObject,
} from "react";
import { type SortType } from "../course-page/mobile-sort";
import { Check } from "../icons/check";
import { DownChevron } from "../icons/down-chevron";

export const Select = ({
  values,
  value,
  setValue,
}: {
  values: string[];
  value: string;
  setValue: (v: SortType) => void;
}) => {
  return (
    <RadixSelect.Root value={value} onValueChange={setValue}>
      <RadixSelect.Trigger data-testid="select-id" className="flex h-[35px] items-center justify-between gap-2 whitespace-nowrap rounded-full border border-stroke bg-white px-4 py-2 text-[14px] outline-none data-[placeholder]:text-primary-gray">
        <RadixSelect.Value placeholder="Sort by price" aria-label={value}>
          {value}
        </RadixSelect.Value>
        <RadixSelect.Icon className="text-primary-gray">
          <DownChevron className="h-[14px] w-[14px]" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          className="rounded-lg bg-white shadow-lg z-20"
        >
          <RadixSelect.ScrollUpButton className="flex h-[25px] cursor-default items-center justify-center bg-white text-primary-gray">
            <DownChevron className="h-[14px] w-[14px] rotate-180" />
          </RadixSelect.ScrollUpButton>
          <RadixSelect.Viewport className="">
            {values.map((item, idx) => (
              <SelectItem value={item} key={idx} className="cursor-pointer" data-testid="select-item" data-qa={item}>
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
        className={`relative w-[295px] flex h-[30px] select-none items-center rounded-lg pl-[25px] pr-[35px] text-[13px] leading-none text-primary-gray data-[disabled]:pointer-events-none data-[highlighted]:bg-stroke-secondary data-[disabled]:text-stroke data-[highlighted]:text-black data-[highlighted]:outline-none
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
