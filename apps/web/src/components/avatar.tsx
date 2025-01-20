import * as RadixAvatar from "@radix-ui/react-avatar";

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
      className={`inline-flex min-h-[40px] min-w-[40px] max-h-[40px] max-w-[40px] h-[40px] w-[40px] select-none items-center justify-center overflow-hidden ${
        isRounded ? "rounded-full" : "rounded-none"
      } bg-stroke align-middle duration-700 ease-in-out ${className ?? ""}`}
    >
      <RadixAvatar.Image
        className={`h-full w-full ${
          isRounded ? "rounded-full" : "rounded-none"
        } ${
          isRounded ? "object-cover" : "object-contain bg-white"
        }`}
        src={src ?? "/defaults/default-profile.webp"}
        alt="user"
        draggable={false}
      />

      <RadixAvatar.Fallback
        className="leading-1 flex h-full w-full items-center justify-center bg-primary text-[15px] font-medium text-white"
        delayMs={600}
      >
        {name?.slice(0, 1)}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
};
