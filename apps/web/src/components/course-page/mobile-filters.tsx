import {
  useFiltersContext,
  type DateType,
  type GolferType,
  type HoleType,
} from "~/contexts/FiltersContext";
import { useRef, type Dispatch, type SetStateAction } from "react";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Leaflet } from "../modal/leaflet";
import { Filters } from "./filters";

interface DayValue {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

interface FiltersRef {
  getChildValue: () => {
    dateType: DateType;
    holes: HoleType;
    golfers: GolferType;
    priceRange: [number, number];
    startTime: [number, number];
    selectedDay: {
      from: DayValue;
      to: DayValue;
    };
  };
}

export const MobileFilters = ({
  setShowFilters,
  toggleFilters,
  openForecastModal,
}: {
  setShowFilters: Dispatch<SetStateAction<boolean>>;
  toggleFilters: () => void;
  openForecastModal: () => void;
}) => {
  const {
    setDateType,
    setHoles,
    setGolfers,
    // priceRange,
    setPriceRange,
    setStartTime,
    setSelectedDay,
  } = useFiltersContext();
  const childRef = useRef<FiltersRef>(null);
  const getDataFromChild = () => {
    if (childRef.current) {
      const childData = childRef.current.getChildValue();
      setDateType(childData.dateType); // No type assertion needed
      setHoles(childData.holes); // No type assertion needed
      setGolfers(childData.golfers); // No type assertion needed
      setPriceRange(childData.priceRange);
      setStartTime(childData.startTime);
      setSelectedDay(childData.selectedDay);
    }
  };
  return (
    <Leaflet setShow={setShowFilters} className="max-h-[70dvh]">
      <div className="relative flex flex-col gap-4 px-4 pb-20">
        <div className="border-b py-2 text-xl font-semibold">Filters</div>
        <Filters
          ref={childRef}
          openForecastModal={openForecastModal}
          setShowFilters={setShowFilters}
        />
        <div className="fixed bottom-10 left-1/2 z-10 flex w-full -translate-x-1/2 gap-2 px-4">
          <OutlineButton
            className="min-w-[40%]"
            onClick={() => setShowFilters(false)}
          >
            Cancel
          </OutlineButton>
          <FilledButton
            className="w-full"
            onClick={() => {
              toggleFilters();
              getDataFromChild();
            }}
          >
            Apply
          </FilledButton>
        </div>
      </div>
    </Leaflet>
  );
};
