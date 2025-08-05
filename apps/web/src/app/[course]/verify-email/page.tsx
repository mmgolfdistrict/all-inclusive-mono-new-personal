"use client";

import { useCourseContext } from "~/contexts/CourseContext";
import Link from "next/link";

export default function VerifyEmail() {
  const { course } = useCourseContext();

  return (
    <main className="bg-secondary-white py-4 md:py-6">
      <section className="mx-auto mt-6 flex w-full text-center flex-col gap-2 bg-white p-5 sm:max-w-[31.25rem] sm:rounded-xl sm:p-6">
        <h1 className="text-[1.5rem] md:text-[2rem]">
          Verify Your Email Address
        </h1>
        <p className="text-primary-gray">
          A verification link was just sent to the email provided. Please open
          the email and click the verify button.
        </p>
      </section>
      <div className="flex max-w-fit mx-auto items-center gap-4 justify-center flex-col md:flex-row">
        <div className="pt-4 text-center text-[0.875rem] text-primary-gray">
          Don&apos;t have an account?{" "}
          <Link
            className="text-primary"
            href={`/${course?.id}/register`}
            data-testid="signup-button-id"
          >
            Sign Up
          </Link>{" "}
          instead
        </div>
        <div className="md:h-[1.25rem] md:self-end w-full h-[0.125rem] md:w-[0.125rem] bg-stroke" />
        <Link
          className="text-primary  md:self-end text-[0.875rem]"
          href={`/${course?.id}/login`}
          data-testid="back-to-login-button-id"
        >
          Back to Login
        </Link>
      </div>
    </main>
  );
}
