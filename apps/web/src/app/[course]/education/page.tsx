"use client";

import { FilledButton } from "~/components/buttons/filled-button";
import { OutlineButton } from "~/components/buttons/outline-button";
import { useCourseContext } from "~/contexts/CourseContext";
import { useRouter } from "next/navigation";
import React from "react";

const Education = () => {
  const { course } = useCourseContext();
  const courseId = course?.id;
  const router = useRouter();

  return (
    <div className="h-screen flex flex-col items-center bg-red-500 p-6 text-center">
      <h2 className="md:mt-5 mb-5 md:text-3xl text-xl font-bold text-gray-800">
        You can now sell your tee times if plans change.{" "}
        <span className="text-gray-600">Book with freedom and comfort.</span>
      </h2>

      <ul className="mt-4 space-y-4 md:text-xl text-gray-700">
        <li>✔️ Book 0-{course?.furthestDayToBook} days in advance</li>
        <li>✔️ Easily create listings and cash out</li>
        <li>✔️ Protection from weather</li>
        <li>✔️ Last minute booking? Find listings!</li>
      </ul>

      <div className="mt-10 flex space-x-6">
        <OutlineButton
          className={`rounded-full md:text-[16px] text-[12px]`}
          data-testid="book-tee-time-id"
          onClick={() => router.push(`/${courseId}`)}
        >
          BOOK TEE TIME
        </OutlineButton>
        <FilledButton
          className={`rounded-full md:text-[16px] text-[12px]`}
          data-testid="sell-tee-time-id"
          onClick={() => router.push(`/${courseId}/my-tee-box`)}
        >
          SELL TEE TIME
        </FilledButton>
      </div>
    </div>
  );
};

export default Education;
