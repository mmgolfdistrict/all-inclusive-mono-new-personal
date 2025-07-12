import { useCourseContext } from "~/contexts/CourseContext";
import { FiltersIcon } from "../icons/filters";
import { SortIcon } from "../icons/sort";
import { useAppContext } from "~/contexts/AppContext";
import { CancelIcon } from "../icons/cancel";
import { useFiltersContext, type DateType } from "~/contexts/FiltersContext";

export const FilterSort = ({
  toggleFilters,
  toggleSort,
}: {
  toggleFilters: () => void;
  toggleSort: () => void;
}) => {
  const { entity } = useAppContext();
  const { course } = useCourseContext();
  const {
    dateType,
    setDateType,
    golfers,
    startTime,
    setGolfers,
    setStartTime
  } = useFiltersContext();

  return (
    <div className="flex text-[0.75rem] text-secondary-black transition-colors">
      <button
        onClick={toggleFilters}
        className="flex items-center gap-1 rounded-full border border-strok border-primary text-primary bg-white px-3.5 py-2 active:bg-stroke-secondary"
        data-testid="toggle-filter-id"
      >
        <FiltersIcon className="h-[0.875rem] w-[0.875rem]" primaryColor={entity?.color1} /> Filters
        {(dateType !== "All" as DateType || golfers !== "Any" || course?.courseOpenTime !== startTime[0] || course?.courseCloseTime !== startTime[1]) && (
          <CancelIcon
            width={16}
            height={16}
            onClick={(e) => {
              e.stopPropagation(); // prevent triggering parent button click
              setDateType("All");  // your function to reset
              setGolfers("Any"); // your function to reset
              setStartTime([course?.courseOpenTime ?? 0, course?.courseCloseTime ?? 0]); // reset to default open and close times
            }}
          />
        )}
      </button>
      {/* <button
        onClick={toggleSort}
        className="flex items-center gap-1 rounded-r-full border-b border-r border-t border-stroke bg-white px-3.5 py-2 active:bg-stroke-secondary"
        data-testid="toggle-sort-id"
      >
        <SortIcon className="h-[0.875rem] w-[0.875rem]" /> Sort
      </button> */}
    </div>
  );
};
