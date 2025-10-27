import * as RadixAvatar from "@radix-ui/react-avatar";
import { UserIcon } from "./icons/UserIcon";

export const Avatar = ({
  src,
  name,
  className,
  isRounded = true, // Add a prop for conditional rounding
}: {
  src?: string;
  name?: string;
  className?: string;
  isRounded?: boolean;
}) => {
  return (
    <RadixAvatar.Root
      className={`inline-flex min-h-[2.5rem] min-w-[2.5rem] max-h-[2.5rem] max-w-[2.5rem] h-[2.5rem] w-[2.5rem] select-none items-center justify-center overflow-hidden ${isRounded ? "rounded-full" : "rounded-none"
        } bg-stroke align-middle duration-700 ease-in-out ${className ?? ""}`}
    >
      <RadixAvatar.Image
        className={`h-full w-full ${isRounded ? "rounded-full" : "rounded-none"
          } ${isRounded ? "object-cover" : "object-contain bg-white"}`}
        src={src}
        alt="user"
        draggable={false}
      />

      <RadixAvatar.Fallback
        className="leading-1 flex h-full w-full items-center justify-center bg-primary text-[0.9375rem] font-medium text-white"
        delayMs={0}
      >
        <UserIcon />
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
};
