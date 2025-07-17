"use client";

import { FilledButton } from "~/components/buttons/filled-button";
import { GoBack } from "~/components/buttons/go-back";
import { OutlineButton } from "~/components/buttons/outline-button";
import { BookAdvance } from "~/components/icons/book-advance";
import { CloudyWithSun } from "~/components/icons/cloudy-with-sun";
import { PlaylistAddCheck } from "~/components/icons/playlist-add-check";
import { Timer } from "~/components/icons/timer";
import { useCourseContext } from "~/contexts/CourseContext";
import { useRouter } from "next/navigation";
import React from "react";
import { useMediaQuery } from "usehooks-ts";

const Education = () => {
  const { course } = useCourseContext();
  const courseId = course?.id;
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <>
      <section className="mx-auto px-2 flex w-full flex-col gap-4 pt-4 md:max-w-[85rem] md:px-6">
        <div className="flex items-center justify-between px-4 md:px-6">
          <GoBack href={`/${courseId}`} text={`Back to tee times`} />
        </div>
        <div className="col-span-3 flex flex-col items-start pl-4 md:px-6">
          <h1 className="text-[1.25rem] capitalize text-secondary-black md:text-[1.875rem]">
            You can now sell your tee times if plans change.{" "}
          </h1>
          <span className="text-[1.25rem] capitalize md:text-[1.875rem] text-gray-600">
            Book with freedom and comfort.
          </span>
          <div className="mt-8 w-full">
            <div className="flex items-center mb-6">
              <div className="flex-shrink-0 mr-4">
                <BookAdvance width={isMobile ? "1.5625rem" : "1.875rem"} />
              </div>
              <div>
                <h2 className="text-[0.875rem] md:text-[1.125rem] font-semibold">
                  Book 0-{course?.furthestDayToBook} days in advance
                </h2>
              </div>
            </div>
            <hr className="md:mb-6 mb-2 border-gray-300" />

            <div className="flex items-center mb-6">
              <div className="flex-shrink-0 mr-4">
                {/* <Campaign width={isMobile ? "1.5625rem" : "1.875rem"} /> */}
                <PlaylistAddCheck width={isMobile ? "1.5625rem" : "1.875rem"} />
              </div>
              <div>
                <h2 className="text-[0.875rem] md:text-[1.125rem] font-semibold">
                  Easily create listings and cash out
                </h2>
              </div>
            </div>
            <hr className="md:mb-6 mb-2 border-gray-300" />

            <div className="flex items-center mb-6">
              <div className="flex-shrink-0 mr-4">
                <CloudyWithSun width={isMobile ? "1.5625rem" : "1.875rem"} />
              </div>
              <div>
                <h2 className="text-[0.875rem] md:text-[1.125rem] font-semibold">
                  Protection from weather
                </h2>
              </div>
            </div>
            <hr className="md:mb-6 mb-2 border-gray-300" />

            <div className="flex items-center">
              <div className="flex-shrink-0 mr-4">
                {/* <GolfCourse width={isMobile ? "1.5625rem" : "1.875rem"} /> */}
                <Timer width={isMobile ? "1.5625rem" : "1.875rem"} />
              </div>
              <div>
                <h2 className="text-[0.875rem] md:text-[1.125rem] font-semibold">
                  Last minute booking? Find listings!
                </h2>
              </div>
            </div>
          </div>
          <div className="h-screen flex flex-col items-center bg-red-500 p-6 text-center">
            <div className="md:mt-10 mt-2 flex space-x-6">
              <FilledButton
                className={`rounded-full md:text-[1rem] text-[0.75rem]`}
                data-testid="book-tee-time-id"
                onClick={() => router.push(`/${courseId}`)}
              >
                BOOK TEE TIME
              </FilledButton>
              <OutlineButton
                className={`rounded-full md:text-[1rem] text-[0.75rem]`}
                data-testid="sell-tee-time-id"
                onClick={() => router.push(`/${courseId}/my-tee-box`)}
              >
                SELL TEE TIME
              </OutlineButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Education;
