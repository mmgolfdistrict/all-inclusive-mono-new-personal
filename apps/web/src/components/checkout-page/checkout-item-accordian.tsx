"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { Fragment, type ReactNode } from "react";
import { DownArrow } from "../icons/down-arrow";

const CheckoutItemAccordion = ({
  title,
  value,
  children,
  // icons,
  position = "right",
  amountValues,
  isLoading,
}: {
  title: string;
  value: string;
  children?: ReactNode;
  // icons?: ReactNode;
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
          <div className="flex flex-1 cursor-pointer items-left justify-between bg-white p-2 text-[1rem] text-secondary-black transition-all md:text-[1.25rem] md:group-data-[state=closed]:rounded-xl md:group-data-[state=open]:rounded-t-xl">
            {position === "left" ? (
              <Fragment>
                <div className="flex gap-x-1 items-center">
                  <DownArrow
                    aria-hidden
                    className="w-[1.875rem] h-auto transition-transform duration-300 ease-[cubic-bezier(0.87,_0,_0.13,_1)] group-data-[state=open]:rotate-180"
                  />
                  <div className="text-[1rem]">{title}</div>
                </div>
                <div className="text-[1rem] pr-1.5">
                  {isLoading ? (
                    <Fragment>
                      <p className="px-6 py-0.5 bg-gray-200 text-gray-200 text-sm">
                        Loading...
                      </p>
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
        className={`overflow-hidden bg-white text-[0.938rem] data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown md:rounded-b-xl`}
      >
        <div className="px-3 py-[0.9375rem] text-[0.875rem] font-light text-primary-gray md:text-[1rem]">
          {children}
        </div>
      </Accordion.Content>
    </Accordion.Item>
  );
};

export default CheckoutItemAccordion;
