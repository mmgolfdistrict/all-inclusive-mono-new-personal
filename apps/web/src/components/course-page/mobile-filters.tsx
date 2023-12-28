import type { Dispatch, SetStateAction } from "react";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Leaflet } from "../modal/leaflet";
import { Filters } from "./filters";

export const MobileFilters = ({
  setShowFilters,
  toggleFilters,
}: {
  setShowFilters: Dispatch<SetStateAction<boolean>>;
  toggleFilters: () => void;
}) => {
  return (
    <Leaflet setShow={setShowFilters} className="max-h-[70dvh]">
      <div className="relative flex flex-col gap-4 px-4 pb-20">
        <div className="border-b py-2 text-xl font-semibold">Filters</div>
        <Filters />
        <div className="fixed bottom-10 left-1/2 z-10 flex w-full -translate-x-1/2 gap-2 px-4">
          <OutlineButton className="min-w-[40%]" onClick={toggleFilters}>
            Cancel
          </OutlineButton>
          <FilledButton className="w-full" onClick={toggleFilters}>
            Apply
          </FilledButton>
        </div>
      </div>
    </Leaflet>
  );
};
