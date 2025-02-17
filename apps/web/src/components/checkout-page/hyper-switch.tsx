import { loadHyper } from "@juspay-tech/hyper-js";
import { HyperElements } from "@juspay-tech/react-hyper-js";
import { useCheckoutContext } from "~/contexts/CheckoutContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import type { CartProduct, SearchObject } from "~/utils/types";
import dayjs from "dayjs";
import isequal from "lodash.isequal";
// import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { useEffect, useState } from "react";
import { Spinner } from "../loading/spinner";
import { CheckoutForm } from "./checkout-form";
import { toast } from "react-toastify";

export type NextAction = {
  type?: string;
  redirect_to_url?: string;
};

type CreatePaymentResponse = {
  clientSecret: string;
  paymentId: string | undefined;
  cartId: string;
  next_action?: NextAction;
  error?: string;
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
  teeTimeDate,
  listingId,
  setIsLoading,
  playerCount,
  teeTimeData,
  isAppleWidgetReload
}: // maxReservation,
{
  cartData: CartProduct[];
  isBuyNowAuction: boolean;
  teeTimeId: string;
  teeTimeDate: string | undefined;
  listingId: string | undefined;
  setIsLoading?: (isLoading: boolean) => void;
  playerCount: string | undefined;
  teeTimeData: SearchObject | null | undefined;
  isAppleWidgetReload?: boolean;
  // maxReservation: MaxReservationResponse;
}) => {
  const { amountOfPlayers,shouldAddSensible } = useCheckoutContext();
  const [showCheckout, setShowCheckout] = useState(true);
  const [options, setOptions] = useState<Options | undefined>(undefined);
  const { user } = useUserContext();
  const { course } = useCourseContext();
  const { mutateAsync: checkout, error: err } =
    api.checkout.buildCheckoutSession.useMutation();
  const [cartId, setCartId] = useState<string>("");
  const [localCartData, setLocalCartData] = useState<unknown[]>(cartData);
  const [error, setError] = useState<undefined | string>(undefined);
  const [roundOffStatus, setRoundOffStatus] = useState("roundup");
  const [nextaction, setNextaction] = useState<NextAction | undefined>(
    undefined
  );
  const [paymentId, setPaymentId] = useState<string | undefined>(undefined);
  let initialLoad = true;

  const convertDateFormat = (dateString: string, utcOffset = 0) => {
    const cleanTimeString = !dateString.includes("T")
      ? dateString.replace(" ", "T") + "Z"
      : dateString;
    const timezone = cleanTimeString.slice(-6) ?? utcOffset;

    return dayjs
      .utc(cleanTimeString)
      .utcOffset(timezone)
      .format("DD-MMM-YYYY hh:mm A");
  };

  const buildSession = async () => {
    initialLoad = false;
    if (!user) return;
    try {
      setError(undefined);
      // setIsLoadingSession(true);

      if (Number(playerCount ?? 0) !== amountOfPlayers) {
        return;
      }

      const data = (await checkout({
        userId: user.id,
        customerId: user.id,
        courseId: course?.id ?? "",
        name: user?.name ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        phone_country_code: "1",
        paymentId: options?.paymentId
          ? options.paymentId
          : paymentId
          ? paymentId
          : null,
        //@ts-ignore
        cart: cartData,
        cartId,
        teeTimeId,
        courseName: course?.name ?? "",
        playDateTime: convertDateFormat(
          teeTimeData?.date ?? "",
          course?.timezoneCorrection
        ),
      })) as CreatePaymentResponse;

      if (data?.error) {
        toast.error(data?.error);
      }

      if (data?.next_action) {
        setNextaction(data?.next_action);
        setPaymentId(data?.paymentId);
      } else {
        setPaymentId(data?.paymentId);
        setOptions({
          clientSecret: data.clientSecret,
          paymentId: data.paymentId,
          appearance: {
            theme: "default",
          },
        });
      }
      setLocalCartData(cartData);
      setCartId(data.cartId);
      // setIsLoadingSession(false);
    } catch (error) {
      // setIsLoadingSession(false);
      setError(
        (error?.message as string) ??
          "An error occurred building checkout seesion."
      );
    }
  };

  useEffect(() => {
    if (!user) return;
    // let isEqualCompare = true;
    // for (let i = 0; i < cartData.length; i++) {
    //   if (!isEqual(cartData[i] as object, localCartData[i] as object)) {
    //     isEqualCompare = false;
    //     break;
    //   }
    // }
    if ((!options && initialLoad) || !isequal(localCartData, cartData)) {
      if (cartData?.length > 0) {

        void buildSession();
      }
    }
  }, [user, options, cartData]);

  useEffect(() => {
    if (err?.data?.httpStatus === 504) {
      setError("Session timed out. Please try again.");
    }
  }, [err]);
  const reloadCheckout = async () => {
    setShowCheckout(false); 
  
    setTimeout(async () => {
      await buildSession(); 
      setShowCheckout(true); 
    }, 100);
  };
 useEffect(()=>{
  if(isAppleWidgetReload){
    void reloadCheckout();
  }
 },[amountOfPlayers,shouldAddSensible])
 
  if (
    setIsLoading &&
    (options !== undefined || nextaction !== undefined) &&
    hyperPromise !== undefined
  ) {
    setIsLoading(false);
  }

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
    <div className="w-full md:min-w-[370px] px-2 md:px-0" >
      { showCheckout && options !== undefined && hyperPromise !== undefined ? (
        <HyperElements options={options} hyper={hyperPromise}>
          <CheckoutForm
            teeTimeId={teeTimeId}
            isBuyNowAuction={isBuyNowAuction}
            cartData={cartData}
            cartId={cartId}
            teeTimeDate={teeTimeDate}
            listingId={listingId ?? ""}
            playerCount={playerCount}
            roundOffStatus={roundOffStatus}
            setRoundOffStatus={setRoundOffStatus}
            // maxReservation={maxReservation}
          />
        </HyperElements>
      ) : nextaction ? (
        <></>
      ) : (
        // <CheckoutForm
        //   teeTimeId={teeTimeId}
        //   isBuyNowAuction={isBuyNowAuction}
        //   cartData={cartData}
        //   cartId={cartId}
        //   teeTimeDate={teeTimeDate}
        //   listingId={listingId ?? ""}
        //   nextAction={nextaction}
        //   callingRef={callingRef.current}
        // />
        <div className="flex justify-center items-center h-full min-h-[200px]">
          <Spinner className="w-[50px] h-[50px]" />
        </div>
      )}
    </div>
  );
};
