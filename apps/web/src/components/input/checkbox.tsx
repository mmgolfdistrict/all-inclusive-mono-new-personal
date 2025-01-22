import type { ChangeEvent } from "react";

export const Checkbox = ({
  label,
  isChecked,
  onChange,
}: {
  label?: string;
  isChecked: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        className="accent-primary w-5 h-5 cursor-pointer"
        checked={isChecked}
        onChange={onChange}
      />
      {label ? <p>{label}</p> : null}
    </div>
  );
};
