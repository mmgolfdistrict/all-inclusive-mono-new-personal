import { useState, type Dispatch, type SetStateAction, useRef } from "react";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Leaflet } from "../modal/leaflet";
import { Filters } from "./filters";
import { DateType, GolferType, HoleType, useFiltersContext } from "~/contexts/FiltersContext";

interface DayValue {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export const MobileFilters = ({
  setShowFilters,
  toggleFilters,
}: {
  setShowFilters: Dispatch<SetStateAction<boolean>>;
  toggleFilters: () => void;
}) => {
  const {
    setDateType,
    setHoles,
    setGolfers,
    setShowUnlisted,
    setIncludesCart,
    // priceRange,
    setPriceRange,
    setStartTime,
    setSelectedDay
  } = useFiltersContext();
  const childRef: any = useRef();
  const getDataFromChild = () => {
    if (childRef.current) {
      const childData = childRef.current.getChildValue();
      setDateType(childData?.dateType as DateType)
      setHoles(childData?.holes as HoleType)
      setGolfers(childData?.golfers as GolferType)
      setPriceRange(childData?.priceRange as [number, number])
      setStartTime(childData?.startTime as [number, number])
      setSelectedDay(childData?.selectedDay as {
        from: DayValue;
        to: DayValue;
      })
    }
  }
  return (
    <Leaflet setShow={setShowFilters} className="max-h-[70dvh]">
      <div className="relative flex flex-col gap-4 px-4 pb-20">
        <div className="border-b py-2 text-xl font-semibold">Filters</div>
        <Filters ref={childRef} />
        <div className="fixed bottom-10 left-1/2 z-10 flex w-full -translate-x-1/2 gap-2 px-4">
          <OutlineButton className="min-w-[40%]" onClick={() => setShowFilters(false)}>
            Cancel
          </OutlineButton>
          <FilledButton className="w-full" onClick={() => { toggleFilters(); getDataFromChild() }}>
            Apply
          </FilledButton>
        </div>
      </div>
    </Leaflet>
  );
};
