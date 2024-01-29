import { type TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  register?: unknown;
  name: string;
  className?: string;
  error?: string;
}

export const Textarea = ({
  label,
  className,
  name,
  register,
  error,
  ...props
}: TextareaProps) => {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      {label ? (
        <label className="text-[14px] text-primary-gray" htmlFor={props.id}>
          {label}
        </label>
      ) : null}
      <div className="relative">
        <textarea
          className={`rounded-sm bg-stroke-secondary w-full px-4 py-3 text-[14px] outline-none`}
          // @ts-ignore
          {...register(name)}
          {...props}
        />
      </div>
      {error ? <p className="text-[12px] text-red">{error}</p> : null}
    </div>
  );
};
