"use client";

import { FilledButton } from "~/components/buttons/filled-button";
import { GolfDistrict } from "~/components/icons/golf-district";
import { Input } from "~/components/input/input";
import Link from "next/link";
import { createRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";

export default function RootPage() {
  const recaptchaRef = createRef<ReCAPTCHA>();

  const onReCAPTCHAChange = (captchaCode: string | null | undefined) => {
    // If the reCAPTCHA code is null or undefined indicating that
    // the reCAPTCHA was expired then return early
    if (!captchaCode) {
      return;
    }
  };
  return (
    <main className="flex items-center justify-center flex-col gap-20 pb-[50px] pt-[100px] overflow-auto">
      <div>
        <GolfDistrict color="black" id="admin-logo" className="w-[322px]" />
      </div>
      <section className="flex flex-col gap-2">
        <p className="text-center text-[20px] font-500">Admin Portal</p>
        <form className="flex flex-col gap-4 w-[400px] items-center">
          <Input
            type="email"
            className="w-full"
            name="email"
            register={() => undefined}
            placeholder="Email address"
          />
          <Input
            type="password"
            className="w-full"
            name="password"
            register={() => undefined}
            placeholder="Password"
          />
          <ReCAPTCHA
            size="normal"
            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ""}
            onChange={onReCAPTCHAChange}
            ref={recaptchaRef}
          />
          <Link href="/reservations" className="w-full">
            <FilledButton className="w-full">Login</FilledButton>
          </Link>
        </form>
      </section>
      <Link href="/forgot-password" className="text-primary">
        Forgot password
      </Link>
    </main>
  );
}
