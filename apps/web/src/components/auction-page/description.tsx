/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useCourseContext } from "~/contexts/CourseContext";
import { fullDate } from "~/utils/formatters";
import { useState } from "react";
import Markdown from "react-markdown";
import { OutlineButton } from "../buttons/outline-button";

export const Description = ({
  title,
  date,
  location,
  time,
  body,
}: {
  title: string;
  date: string;
  location: string;
  time: string;
  body: string | null;
}) => {
  const [isExpanded, setExpanded] = useState<boolean>(false);
  const { course } = useCourseContext();

  const toggleRead = () => {
    setExpanded(!isExpanded);
  };

  return (
    <div
      className={`relative flex flex-col gap-4 bg-white p-4 text-primary-gray md:rounded-xl md:p-6
      ${
        isExpanded
          ? "h-auto pb-20 md:h-auto md:pb-6"
          : !isExpanded
          ? "h-[250px] overflow-hidden md:h-auto"
          : ""
      }
      transition-all duration-500 ease-in-out
    `}
    >
      <div className="font-semibold text-secondary-black">{title}</div>
      <div className="flex flex-wrap gap-3">
        <div>
          <span className="font-bold">Date:</span>{" "}
          {fullDate(date, course?.timezoneCorrection)}
        </div>
        <div>
          <span className="font-bold">Location:</span> {location}
        </div>
        <div>
          <span className="font-bold">Time:</span> {time}
        </div>
      </div>
      <Markdown
        components={{
          ul: ({ node, ...props }) => {
            return <ul className={"list-disc pl-6"} {...props} />;
          },
          strong: ({ node, ...props }) => {
            return <strong className={""} {...props} />;
          },
        }}
        className={"flex flex-col gap-4"}
      >
        {`${body?.replaceAll("newline", "\n")}`}
      </Markdown>

      {!isExpanded && (
        <div className="absolute bottom-0 left-0 h-48 w-full bg-gradient-to-t from-white to-transparent md:hidden" />
      )}

      <OutlineButton
        className={`absolute bottom-5 left-1/2 mx-auto w-fit -translate-x-1/2 md:hidden`}
        onClick={toggleRead}
        data-testid="toggle-read-button-id"
      >
        {isExpanded ? "Read Less" : "Read More"}
      </OutlineButton>
    </div>
  );
};
