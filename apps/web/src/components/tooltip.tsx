import * as RadixTooltip from "@radix-ui/react-tooltip";
import { type ReactNode } from "react";

export const Tooltip = ({
  trigger,
  content,
  className,
}: {
  trigger: ReactNode;
  content: ReactNode;
  className?: string;
}) => {
  return (
    <RadixTooltip.Provider>
      <RadixTooltip.Root delayDuration={0}>
        <RadixTooltip.Trigger className={`${className ?? ""}`}>
          {trigger}
        </RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            className="rounded-md border relative z-50 border-stroke bg-white px-4 py-2 text-sm shadow-lg"
            sideOffset={5}
          >
            {content}
            <RadixTooltip.Arrow className=" fill-white" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
};
