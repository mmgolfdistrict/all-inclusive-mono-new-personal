import { type InputHTMLAttributes, type ReactNode } from "react";
import { ReadOnly } from "../icons/read-only";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  register?: unknown;
  name: string;
  className?: string;
  error?: string;
  icon?: ReactNode;
  isReadOnly?: boolean;
}

export const Input = ({
  label,
  className,
  name,
  register,
  error,
  icon,
  isReadOnly,
  ...props
}: InputProps) => {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      {label ? (
        <label className="text-[14px] text-primary-gray" htmlFor={props.id}>
          {label}
        </label>
      ) : null}
      <div className="relative">
        {icon ? <div className="absolute top-3 left-3">{icon}</div> : null}
        <input
          className={`rounded-sm bg-stroke-secondary w-full px-4 py-3 text-[14px]  outline-none ${
            icon ? "pl-10" : ""
          } ${isReadOnly ? "pr-10 text-[#6D777C]" : ""}`}
          // @ts-ignore
          {...register(name)}
          {...props}
          disabled={isReadOnly}
          readOnly={isReadOnly}
        />
        {isReadOnly ? (
          <div className="absolute top-[1.1rem] right-4">
            <ReadOnly />
          </div>
        ) : null}
      </div>
      {error ? <p className="text-[12px] text-red">{error}</p> : null}
    </div>
  );
};
