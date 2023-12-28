import { type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  register: unknown;
  name: string;
  className?: string;
  error?: string;
}

export const Input = ({
  label,
  className,
  name,
  register,
  error,
  ...props
}: InputProps) => {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <label className="text-[14px] text-primary-gray" htmlFor={props.id}>
        {label}
      </label>
      <input
        className="rounded-lg bg-secondary-white px-4 py-3 text-[14px] text-gray-500 outline-none"
        // @ts-ignore
        {...register(name)}
        {...props}
      />
      {error && <p className="text-[12px] text-red">{error}</p>}
    </div>
  );
};
