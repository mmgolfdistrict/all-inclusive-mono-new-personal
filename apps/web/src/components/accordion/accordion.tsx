"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { type ReactNode } from "react";

export const AccordionRoot = ({
  children,
  className,
  defaultValue,
}: {
  children: ReactNode;
  className?: string;
  defaultValue: string;
}) => {
  return (
    <Accordion.Root
      className={`flex w-full flex-col gap-4 ${className ?? ""}`}
      type="single"
      defaultValue={defaultValue}
      collapsible
    >
      {children}
    </Accordion.Root>
  );
};
