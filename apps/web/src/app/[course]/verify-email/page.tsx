"use client";

import { useCourseContext } from "~/contexts/CourseContext";
import Link from "next/link";

export default function VerifyEmail() {
  const { course } = useCourseContext();

  return (
    <main className="bg-secondary-white py-4 md:py-6">
      <section className="mx-auto mt-6 flex w-full text-center flex-col gap-2 bg-white p-5 sm:max-w-[500px] sm:rounded-xl sm:p-6">
        <h1 className="text-[24px] md:text-[32px]">
          Verify Your Email Address
        </h1>
        <p className="text-primary-gray">
          An verification link was just sent to the email provided. Please open
          the email and click the verify button.
        </p>
      </section>
      <div className="flex max-w-fit mx-auto items-center gap-4 justify-center flex-col md:flex-row">
        <div className="pt-4 text-center text-[14px] text-primary-gray">
          Don&apos;t have an account?{" "}
          <Link className="text-primary" href={`/${course?.id}/register`}>
            Sign Up
          </Link>{" "}
          instead
        </div>
        <div className="md:h-[20px] md:self-end w-full h-[2px] md:w-[2px] bg-stroke" />
        <Link
          className="text-primary  md:self-end text-[14px]"
          href={`/${course?.id}/login`}
        >
          Back to Login
        </Link>
      </div>
    </main>
  );
}
