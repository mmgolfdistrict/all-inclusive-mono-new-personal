import { isEqual } from "@golf-district/shared";
import { loadHyper } from "@juspay-tech/hyper-js";
import { HyperElements } from "@juspay-tech/react-hyper-js";
import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import type { CartProduct } from "~/utils/types";
import { useEffect, useRef, useState } from "react";
import { Spinner } from "../loading/spinner";
import { CheckoutForm } from "./checkout-form";

type CreatePaymentResponse = {
  clientSecret: string;
  paymentId: string | undefined;
  cartId: string;
};

type Options = {
  clientSecret: string;
  paymentId: string | undefined;
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
  teeTimeDate
}: {
  cartData: CartProduct[];
  isBuyNowAuction: boolean;
  teeTimeId: string;
  teeTimeDate:string | undefined;
}) => {
  const [options, setOptions] = useState<Options | undefined>(undefined);
  const { user } = useUserContext();
  const { course } = useCourseContext();
  const checkout = api.checkout.buildCheckoutSession.useMutation();
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(false);
  const [cartId, setCartId] = useState<string>("");
  const amountToPay =
    //@ts-ignore
    cartData
      ?.filter(({ product_data }) => product_data.metadata.type !== "markup")
      ?.reduce((acc: number, i: CartProduct) => acc + i.price, 0) / 100;
  const [localCartData, setLocalCartData] = useState<unknown[]>(cartData);
  const [error, setError] = useState<undefined | string>(undefined);
  const callingRef = useRef<boolean>(false);

  const buildSession = async () => {
    if (!user) return;
    try {
      callingRef.current = true;
      setError(undefined);
      // setIsLoadingSession(true);
      const data = (await checkout.mutateAsync({
        userId: user.id,
        customerId: user.id,
        courseId: course?.id ?? "",
        name: user?.name ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        phone_country_code: "1",
        paymentId: options?.paymentId ? options.paymentId : null,
        //@ts-ignore
        cart: cartData,
        cartId
      })) as CreatePaymentResponse;
      setOptions({
        clientSecret: data.clientSecret,
        paymentId: data.paymentId,
        appearance: {
          theme: "default",
        },
      });
      setLocalCartData(cartData);
      setCartId(data.cartId);

      // setIsLoadingSession(false);
      callingRef.current = false;
    } catch (error) {
      // setIsLoadingSession(false);
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
            cartData={cartData}
            cartId={cartId}
            teeTimeDate={teeTimeDate}
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
