"use client";

import { signIn } from "@golf-district/auth/nextjs-exports";
import { useAppContext } from "~/contexts/AppContext";
import { SquareButton } from "../buttons/square-button";
import { Apple } from "../icons/apple";
import { Facebook } from "../icons/facebook";
import { Google } from "../icons/google";

export const ConnectAccount = () => {
  const { prevPath } = useAppContext();

  const facebookSignIn = () => {
    void signIn("github", {
      callbackUrl: `${window.location.origin}${
        prevPath !== "/login" ? prevPath : "/"
      }`,
      redirect: true,
    });
  };

  const googleSignIn = async () => {
    try {
      await signIn("google", {
        callbackUrl: `${window.location.origin}${
          prevPath !== "/login" ? prevPath : "/"
        }`,
        redirect: true,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <section className="h-inherit mx-auto flex w-full flex-col gap-4 bg-white px-3 py-2 md:w-[50%] md:rounded-xl md:p-6 md:py-4">
      <h3 className="text-[18px] md:text-[24px]">Connect Account</h3>
      <div className="w-full rounded-lg shadow-outline">
        <SquareButton
          onClick={googleSignIn}
          className="flex w-full items-center justify-center gap-3 text-primary-gray shadow-google-btn"
        >
          <Google className="w-[24px]" />
          Connect Google
        </SquareButton>
      </div>
      <SquareButton className="flex items-center justify-center gap-3 bg-black text-white">
        <Apple className="w-[24px]" />
        Connect Apple
      </SquareButton>
      <SquareButton
        onClick={facebookSignIn}
        className="flex items-center justify-center gap-3 bg-facebook text-white"
      >
        <Facebook className="w-[24px]" />
        Connect Facebook
      </SquareButton>
    </section>
  );
};
