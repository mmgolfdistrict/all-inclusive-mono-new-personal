"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { Fragment, type ReactNode } from "react";
import { DownArrow } from "../icons/down-arrow";
import { DownChevron } from "../icons/down-chevron";
import Skeleton from "../skeleton/skeleton";

const CheckoutItemAccordion = ({
  title,
  value,
  children,
  icons,
  position = "right",
  amountValues,
  isLoading
}: {
  title: string;
  value: string;
  children?: ReactNode;
  icons?: ReactNode;
  position?: string;
  amountValues?: string;
  isLoading?: boolean;
}) => {
  return (
    <Accordion.Item value={value}>
      <Accordion.Header className="flex">
        <Accordion.Trigger
          className={`group w-full`}
          data-testid="accordion-button-id"
        >
          <div className="flex flex-1 cursor-pointer items-left justify-between bg-white p-2 text-[16px] text-secondary-black transition-all md:text-[20px] md:group-data-[state=closed]:rounded-xl md:group-data-[state=open]:rounded-t-xl">
            {position === "left" ? (
              <Fragment>
                <div className="flex gap-x-1 items-center">
                  <DownArrow
                    aria-hidden
                    className="w-[30px] h-auto transition-transform duration-300 ease-[cubic-bezier(0.87,_0,_0.13,_1)] group-data-[state=open]:rotate-180"
                  />
                  <div className="text-[16px]" >{title}</div>
                </div>
                <div className="text-[16px] pr-1.5">
                  {isLoading ? (
                    <Fragment>
                      <p className="px-6 py-0.5 bg-gray-200 text-gray-200 text-sm">Loading...</p>
                    </Fragment>
                  ) : (
                    amountValues
                  )}
                </div>
              </Fragment>
            ) : null}
          </div>
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content
        className={`overflow-hidden bg-white text-[15px] data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown md:rounded-b-xl`}
      >
        <div className="px-3 py-[15px] text-[14px] font-light text-primary-gray md:text-[16px]">
          {children}
        </div>
      </Accordion.Content>
    </Accordion.Item>
  );
};

export default CheckoutItemAccordion;
