import { isEqual } from "@golf-district/shared";
import { loadHyper } from "@juspay-tech/hyper-js";
import { HyperElements } from "@juspay-tech/react-hyper-js";
import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import { useEffect, useRef, useState } from "react";
import { Spinner } from "../loading/spinner";
import { CheckoutForm } from "./checkout-form";

type CreatePaymentResponse = {
  clientSecret: string;
};

type Options = {
  clientSecret: string;
  appearance: {
    theme: string;
  };
};

let hyperPromise: Promise<unknown> | undefined = undefined;

if (typeof window !== "undefined") {
  hyperPromise = loadHyper(process.env.NEXT_PUBLIC_HYPERSWITCH_PUBLISHABLE_KEY);
}

export const HyperSwitch = ({
  cartData,
  isBuyNowAuction,
  teeTimeId,
}: {
  cartData: unknown[];
  isBuyNowAuction: boolean;
  teeTimeId: string;
}) => {
  const [options, setOptions] = useState<Options | undefined>(undefined);
  console.log("options", options);
  const { user } = useUserContext();
  const { course } = useCourseContext();
  const checkout = api.checkout.buildCheckoutSession.useMutation();
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(false);
  const amountToPay =
    //@ts-ignore
    cartData?.reduce((acc: number, i) => acc + i.price, 0) / 100;
  const [localCartData, setLocalCartData] = useState<unknown[]>(cartData);
  const [error, setError] = useState<undefined | string>(undefined);
  const callingRef = useRef<boolean>(false);

  const buildSession = async () => {
    if (!user) return;
    try {
      callingRef.current = true;
      setError(undefined);
      setIsLoadingSession(true);
      const data = (await checkout.mutateAsync({
        userId: user.id,
        customerId: user.id,
        courseId: course?.id ?? "",
        name: user?.name ?? "",
        email: user.email ?? "",
        phone: "",
        phone_country_code: "1",
        //@ts-ignore
        cart: cartData,
      })) as CreatePaymentResponse;
      setOptions({
        clientSecret: data.clientSecret,
        appearance: {
          theme: "default",
        },
      });
      setLocalCartData(cartData);
      setIsLoadingSession(false);
      callingRef.current = false;
    } catch (error) {
      setIsLoadingSession(false);
      callingRef.current = false;
      console.log(error.message);
      setError(
        (error?.message as string) ??
          "An error occurred building checkout seesion."
      );
    }
  };

  useEffect(() => {
    if (callingRef.current) return;
    if (!user) return;
    let isEqualCompare = true;
    for (let i = 0; i < cartData.length; i++) {
      if (!isEqual(cartData[i] as object, localCartData[i] as object)) {
        isEqualCompare = false;
        break;
      }
    }
    if (!options || !isEqualCompare) {
      if (cartData?.length > 0) {
        void buildSession();
      }
    }
  }, [user, options, cartData]);

  if (error) {
    return (
      <div className="w-full md:min-w-[370px] px-2 md:px-0">
        <div className="flex justify-center items-center h-full min-h-[200px] text-center">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full md:min-w-[370px] px-2 md:px-0">
      {options !== undefined &&
      hyperPromise !== undefined &&
      !isLoadingSession ? (
        <HyperElements options={options} hyper={hyperPromise}>
          <CheckoutForm
            teeTimeId={teeTimeId}
            amountToPay={amountToPay}
            isBuyNowAuction={isBuyNowAuction}
          />
        </HyperElements>
      ) : (
        <div className="flex justify-center items-center h-full min-h-[200px]">
          <Spinner className="w-[50px] h-[50px]" />
        </div>
      )}
    </div>
  );
};
