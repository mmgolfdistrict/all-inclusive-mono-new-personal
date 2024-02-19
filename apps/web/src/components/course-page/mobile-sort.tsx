import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { type Dispatch, type SetStateAction } from "react";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Leaflet } from "../modal/leaflet";
import { Item } from "./filters";

export type SortType =
  | "Sort by price - Low to High"
  | "Sort by price - High to Low"
  | "Sort by time - Early to Late"
  | "Sort by time - Late to Early";

export const SortOptions = [
  "Sort by price - Low to High",
  "Sort by price - High to Low",
  "Sort by time - Early to Late",
  "Sort by time - Late to Early",
];

export const MobileSort = ({
  setShowSort,
  toggleSort,
  setSortValue,
  sortValue,
}: {
  sortValue: string;
  setSortValue: Dispatch<SetStateAction<string>>;
  setShowSort: Dispatch<SetStateAction<boolean>>;
  toggleSort: () => void;
}) => {
  return (
    <Leaflet setShow={setShowSort} className="max-h-[70dvh]">
      <div className="relative flex flex-col gap-4 px-4 pb-20">
        <div className="border-b py-2 text-xl font-semibold">Sort</div>
        <ToggleGroup.Root
          type="single"
          value={sortValue}
          onValueChange={(value: string) => {
            if (value) setSortValue(value);
          }}
          orientation="vertical"
          className="flex flex-col"
        >
          {SortOptions.map((value, index) => (
            <Item
              key={index}
              value={value}
              className={`${
                index === 0
                  ? "rounded-t-2xl border border-stroke"
                  : index === SortOptions.length - 1
                  ? "rounded-b-2xl border-b border-l border-r border-stroke"
                  : "border-b border-l border-r border-stroke"
              }`}
              dataTestId={""}
              dataTest={""}
              dataQa={""}
            />
          ))}
        </ToggleGroup.Root>
        <div className="fixed bottom-10 left-1/2 flex w-full -translate-x-1/2 gap-2 px-4">
          <OutlineButton className="w-full" onClick={toggleSort}>
            Cancel
          </OutlineButton>
          <FilledButton className="w-full" onClick={toggleSort}>
            Apply
          </FilledButton>
        </div>
      </div>
    </Leaflet>
  );
};
