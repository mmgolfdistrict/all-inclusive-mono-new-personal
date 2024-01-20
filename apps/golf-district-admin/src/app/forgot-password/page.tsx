"use client";

import { FilledButton } from "~/components/buttons/filled-button";
import { GolfDistrict } from "~/components/icons/golf-district";
import { Input } from "~/components/input/input";
import Link from "next/link";

export default function AdminForgotPassword() {
  return (
    <main className="flex items-center justify-center flex-col gap-20 pb-[50px] pt-[100px] overflow-auto">
      <div>
        <GolfDistrict color="black" id="admin-logo" className="w-[322px]" />
      </div>
      <section className="flex flex-col gap-4 items-center">
        <p className="text-center text-[20px] font-500">Forgot Password</p>
        <p className="text-[#6D777C] max-w-[350px] text-center">
          Enter your email address below to reset your password.
        </p>
        <form className="flex flex-col gap-4 w-[400px] items-center">
          <Input
            type="email"
            className="w-full"
            name="email"
            register={() => undefined}
            placeholder="Email address"
          />
          <FilledButton className="w-full rounded-sm">
            Reset Password
          </FilledButton>
        </form>
      </section>
      <Link href="/" className="text-primary">
        Login
      </Link>
    </main>
  );
}
