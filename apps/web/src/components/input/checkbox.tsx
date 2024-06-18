export const Checkbox = ({
  label,
  isChecked,
}: {
  label?: string;
  isChecked: boolean;
}) => {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        className="accent-primary w-5 h-5 cursor-pointer"
        checked={isChecked}
        onChange={() => null}
      />
      {label ? <p>{label}</p> : null}
    </div>
  );
};
