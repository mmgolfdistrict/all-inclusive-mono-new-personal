"use client";

import { signIn } from "@golf-district/auth/nextjs-exports";
import { useProviders } from "~/hooks/useProviders";
import { usePathname } from "next/navigation";
import { SquareButton } from "../buttons/square-button";
import { Apple } from "../icons/apple";
import { Facebook } from "../icons/facebook";
import { Google } from "../icons/google";
import { Spinner } from "../loading/spinner";

export const ConnectAccount = ({ userId }: { userId: string }) => {
  const { data, isLoading, error } = useProviders({ userId });
  const pathname = usePathname();

  const facebookConnect = async () => {
    await signIn("facebook", {
      callbackUrl: `${window.location.origin}${pathname}`,
    });
  };
  const appleConnect = async () => {
    await signIn("apple", {
      callbackUrl: `${window.location.origin}${pathname}`,
    });
  };

  const googleConnect = async () => {
    try {
      await signIn("google", {
        callbackUrl: `${window.location.origin}${pathname}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const hasProvidersSetUp =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_APPLE_ID;

  if (!hasProvidersSetUp) return null;

  return (
    <section className="h-inherit mx-auto flex w-full flex-col gap-4 bg-white px-3 py-2 md:w-[50%] md:rounded-xl md:p-6 md:py-4">
      <h3 className="text-[18px] md:text-[24px]">Connect Account</h3>
      {isLoading && !error ? (
        <Spinner className="w-[50px] h-[150px] mx-auto" />
      ) : error ? (
        <p className="text-red-500">
          {error?.message ?? "Could not fetch providers for user."}
        </p>
      ) : (
        <>
          {data?.some((provider) => provider !== "google") ? null : process.env
              .NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
            <div className="w-full rounded-lg shadow-outline">
              <SquareButton
                onClick={googleConnect}
                className="flex w-full items-center justify-center gap-3 text-primary-gray shadow-google-btn"
                data-testid="connect-google-button-id"
              >
                <Google className="w-[24px]" />
                Connect Google
              </SquareButton>
            </div>
          ) : null}
          {data?.some((provider) => provider === "apple") ? null : process.env
              .NEXT_PUBLIC_APPLE_ID ? (
            <SquareButton
              onClick={appleConnect}
              className="flex items-center justify-center gap-3 bg-black text-white"
              data-testid="connect-apple-button-id"
            >
              <Apple className="w-[24px]" />
              Connect Apple
            </SquareButton>
          ) : null}
          {data?.some((provider) => provider === "facebook") ? null : process
              .env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID ? (
            <SquareButton
              onClick={facebookConnect}
              className="flex items-center justify-center gap-3 bg-facebook text-white"
              data-testid="connect-facebook-button-id"
            >
              <Facebook className="w-[24px]" />
              Connect Facebook
            </SquareButton>
          ) : null}
        </>
      )}
    </section>
  );
};
