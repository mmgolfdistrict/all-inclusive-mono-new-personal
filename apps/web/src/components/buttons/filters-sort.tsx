import { FiltersIcon } from "../icons/filters";
import { SortIcon } from "../icons/sort";

export const FilterSort = ({
  toggleFilters,
  toggleSort,
}: {
  toggleFilters: () => void;
  toggleSort: () => void;
}) => {
  return (
    <div className="flex text-[12px] text-secondary-black transition-colors">
      <button
        onClick={toggleFilters}
        className="flex items-center gap-1 rounded-full border border-stroke bg-white px-3.5 py-2 active:bg-stroke-secondary"
        data-testid="toggle-filter-id"
      >
        <FiltersIcon className="h-[14px] w-[14px]" /> Filters
      </button>
      {/* <button
        onClick={toggleSort}
        className="flex items-center gap-1 rounded-r-full border-b border-r border-t border-stroke bg-white px-3.5 py-2 active:bg-stroke-secondary"
        data-testid="toggle-sort-id"
      >
        <SortIcon className="h-[14px] w-[14px]" /> Sort
      </button> */}
    </div>
  );
};
