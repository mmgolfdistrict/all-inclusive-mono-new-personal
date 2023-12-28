export const Stepper = () => {
  return (
    <div className="flex text-primary-gray transition-colors">
      <button className="rounded-l-full border border-stroke bg-white px-3.5 py-1 active:bg-stroke-secondary">
        -
      </button>
      <button className="rounded-r-full border-b border-r border-t border-stroke bg-white px-3.5 py-1 active:bg-stroke-secondary">
        +
      </button>
    </div>
  );
};
