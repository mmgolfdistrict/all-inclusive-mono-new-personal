"use client";

import * as Accordion from "@radix-ui/react-accordion";
import type { ReactNode } from "react";
import { DownChevron } from "../icons/down-chevron";

export const AccordionItem = ({
  title,
  value,
  children,
}: {
  title: string;
  value: string;
  children: ReactNode;
}) => {
  return (
    <Accordion.Item value={value}>
      <Accordion.Header className="flex">
        <Accordion.Trigger
          className={`group w-full`}
          data-testid="accordion-button-id"
        >
          <div className="flex flex-1 cursor-pointer items-left justify-between bg-white p-4 text-[16px] text-secondary-black transition-all md:text-[20px] md:group-data-[state=closed]:rounded-xl md:group-data-[state=open]:rounded-t-xl">
            <div>{title}</div>
            <DownChevron
              fill="#6D777C"
              aria-hidden
              className="w-[21px] transition-transform duration-300 ease-[cubic-bezier(0.87,_0,_0.13,_1)] group-data-[state=open]:rotate-180"
            />
          </div>
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content
        className={`overflow-hidden bg-white text-[15px] data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown md:rounded-b-xl`}
      >
        <div className="px-5 py-[15px] text-[14px] font-light text-primary-gray md:text-[16px]">
          {children}
        </div>
      </Accordion.Content>
    </Accordion.Item>
  );
};
