import * as RadixTooltip from "@radix-ui/react-tooltip";
import { useState, type ReactNode } from "react";

export const TooltipMobile = ({
  trigger,
  content,
  className,
  isDisabled = false,
}: {
  trigger: ReactNode;
  content: ReactNode;
  className?: string;
  isDisabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {isDisabled ? (
        <>{trigger}</>
      ) : (
        <RadixTooltip.Provider>
          <RadixTooltip.Root open={isOpen} onOpenChange={setIsOpen}>
            <RadixTooltip.Trigger
              className={`${className ?? ""}`}
              data-testid="trigger-button-id"
              onClick={handleToggle}
            >
              {trigger}
            </RadixTooltip.Trigger>
            <RadixTooltip.Portal>
              <RadixTooltip.Content
                className="rounded-md max-w-[15rem] md:max-w-[30rem] border relative z-50 border-stroke bg-white px-4 py-2 text-sm shadow-lg"
                sideOffset={5}
              >
                {content}
                <RadixTooltip.Arrow className="fill-white" />
              </RadixTooltip.Content>
            </RadixTooltip.Portal>
          </RadixTooltip.Root>
        </RadixTooltip.Provider>
      )}
    </>
  );
};
