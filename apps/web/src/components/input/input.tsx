import { type InputHTMLAttributes } from "react";
import { Info } from "../icons/info";
import { Tooltip } from "../tooltip";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  register: unknown;
  name: string;
  className?: string;
  error?: string;
  showInfoTooltip?: boolean;
  content?: string;
  inputRef?: unknown;
}

export const Input = ({
  label,
  className,
  name,
  register,
  error,
  showInfoTooltip = false,
  content,
  inputRef,
  autoComplete,
  ...props
}: InputProps) => {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <div className="flex gap-1">
        <label className="text-[14px] text-primary-gray" htmlFor={props.id}>
          {label}
        </label>
        {showInfoTooltip && (
          <Tooltip
            trigger={<Info className="h-[20px] w-[20px]" />}
            content={content}
          />
        )}
      </div>
      {
        autoComplete && inputRef?
        <input
            className={`rounded-lg bg-secondary-white px-4 py-3 text-[14px] text-gray-500 outline-none text-ellipsis`}
            // @ts-ignore
            {...register(name)}
            {...props}
            ref={inputRef}
            autoComplete="new-password"
          />:
        inputRef ?
          <input
            className={`rounded-lg bg-secondary-white px-4 py-3 text-[14px] text-gray-500 outline-none text-ellipsis`}
            // @ts-ignore
            {...register(name)}
            {...props}
            ref={inputRef}
          /> : <input
            className={`rounded-lg bg-secondary-white px-4 py-3 text-[14px] text-gray-500 outline-none text-ellipsis`}
            // @ts-ignore
            {...register(name)}
            {...props}
          />
      }

      {error && <p className="text-[12px] text-red">{error}</p>}
    </div>
  );
};
