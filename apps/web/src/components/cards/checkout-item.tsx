import type { NotificationObject } from "@golf-district/shared";
import { useCheckoutContext } from "~/contexts/CheckoutContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import { formatMoney, formatTime } from "~/utils/formatters";
import {
  type SearchObject,
  type SensibleDataToMountCompType,
} from "~/utils/types";
import { useSearchParams } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useMediaQuery } from "usehooks-ts";
import placeholderImage from "../../../public/placeholders/course.png";
import { Avatar } from "../avatar";
import { CheckedIcon } from "../icons/checked";
import { LoaderIcon } from "../icons/loader";
import { OutlineClub } from "../icons/outline-club";
import { BlurImage } from "../images/blur-image";
import { ChoosePlayers } from "../input/choose-players";
import { Spinner } from "../loading/spinner";
import { SensibleWidget } from "../sensible/sensible-widget";
import { Tooltip } from "../tooltip";
import MerchandiseCarousel from "../checkout-page/merchandise-carousel";

const PlayersOptions = ["1", "2", "3", "4"];

export const CheckoutItem = ({
  teeTime,
  isLoading,
  isSensibleInvalid,
  sensibleDataToMountComp,
  isGroupBooking = false,
}: {
  teeTime: SearchObject | null | undefined;
  isLoading: boolean;
  isSensibleInvalid: boolean;
  sensibleDataToMountComp: SensibleDataToMountCompType;
  isGroupBooking?: boolean;
}) => {
  const searchParams = useSearchParams();
  const playerCount = searchParams.get("playerCount");
  const teeTimeId = searchParams?.get("teeTimeId");
  const listingId = searchParams?.get("listingId");
  const {
    setAmountOfPlayers,
    amountOfPlayers,
    setValidatePlayers,
    validatePlayers,
    merchandiseData,
    setMerchandiseData
  } = useCheckoutContext();
  const [membershipStatus, setMembershipStatus] = useState("no_membership");
  const [courseMemberships, setCourseMembership] = useState<
    { id: string; name: string }[]
  >([]);
  const [isCustomerValidated, setIsCustomerValidated] = useState<number | null>(
    null
  );
  const { course } = useCourseContext();
  const { user } = useUserContext();
  const courseId = course?.id;
  const [playerEmails, setPlayerEmails] = useState(
    Array.from({ length: amountOfPlayers }, (_, index) =>
      index === 0 ? user?.email : ""
    )
  );
  const shouldShowGroupBookingButton = useMemo(() => {
    if (course?.groupStartTime && course?.groupEndTime && teeTime?.time) {
      return (teeTime?.time >= course?.groupStartTime && teeTime?.time <= course?.groupEndTime) ? true : false
    } else {
      return true
    }
  }, [teeTime]);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { data: coursePreviewImage } =
    api.course.getCoursePreviewImage.useQuery({ courseId: courseId ?? "" });

  const { data: allowedPlayers } =
    api.course.getNumberOfPlayersByCourse.useQuery({
      courseId: courseId ?? "",
      time: teeTime?.time,
      date: teeTime?.date ?? "",
      availableSlots: teeTime?.availableSlots,
    });

  const { data: isSupportMemberShip } = api.course.getCourseById.useQuery({
    courseId: courseId ?? "",
  });

  const { data: courseMerchandise } = api.course.getCourseMerchandise.useQuery({
    courseId: courseId ?? "",
    teeTimeDate: teeTime?.date ?? "",
  })

  const { data: getAllCourseMemberships } =
    api.checkout.getAllCourseMembership.useQuery({});
  useEffect(() => {
    console.log("getAllCourseMemberships", getAllCourseMemberships);
    if (getAllCourseMemberships) {
      setCourseMembership(getAllCourseMemberships);
    }
  }, [getAllCourseMemberships]);

  const searchCustomerByEmail =
    api.checkout.searchCustomerViaEmail.useMutation();
  const numberOfPlayers = allowedPlayers?.numberOfPlayers;
  const choosePlayers = (amount: string) => {
    setAmountOfPlayers(Number(amount));
  };

  const groupBookingParams = useMemo(() => {
    return `date=${teeTime?.date?.split("T")[0]}&time=${teeTime?.time}`
  }, [teeTime])

  useEffect(() => {
    if (
      playerCount &&
      teeTime &&
      Number(playerCount) <= teeTime?.availableSlots
    ) {
      choosePlayers(playerCount);
    }
  }, [playerCount, teeTime]);

  useEffect(() => {
    if (teeTime?.firstOrSecondHandTeeTime === "SECOND_HAND" && !teeTime?.allowSplit) {
      choosePlayers(teeTime?.availableSlots.toString());
      return;
    }
    if (teeTime?.availableSlots === undefined) return;
    if (amountOfPlayers > teeTime?.availableSlots) {
      choosePlayers(teeTime?.availableSlots.toString());
    }
  }, [playerCount, teeTime]);

  const { data: courseException } =
    api.courseException.getCourseException.useQuery({
      courseId: course?.id ?? "",
    });

  const getCourseException = (playDate: string): NotificationObject | null => {
    let flag = false;
    let msg: NotificationObject | null = null;
    courseException?.forEach((ce) => {
      const startDate = new Date(ce.startDate);
      const endDate = new Date(ce.endDate);
      const dateToCheck = new Date(playDate);
      if (dateToCheck > startDate && dateToCheck < endDate) {
        flag = true;
        msg = ce;
      }
    });
    if (flag) {
      return msg;
    }
    return null;
  };

  const handleChangeMemberShipStatus = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setMembershipStatus(event.target.value);
  };
  const handleValidateMemberShipUser = async (index: number, email: string) => {
    console.log("index", index + 1);
    console.log("email", email);
    try {
      if (email == "") {
        toast.error("email is required");
        setIsCustomerValidated(null);
        return;
      }
      const isDuplicate = validatePlayers.some(
        (player) => player.playerEmail === email
      );
      if (isDuplicate) {
        toast.error("this email is already validated");
        setIsCustomerValidated(null);
        return;
      }
      setIsCustomerValidated(index);
      const result = await searchCustomerByEmail.mutateAsync({
        email: email,
        teeTimeId: teeTimeId ?? "",
        selectedProviderCourseMembershipId: membershipStatus,
      });
      console.log("======>", result);
      if (result.isValidated) {
        setValidatePlayers((prevPlayers) => [
          ...prevPlayers,
          {
            isValidPlayer: true,
            playerEmail: email,
            playerIndex: index,
            courseMemberShipId: result.providerCourseMembership,
            providerCourseMemberShipId: result.providerCourseMembershipId,
          },
        ]);
        toast.success(result.message);
        setIsCustomerValidated(null);
        return;
      } else {
        toast.error(result.message);
        setIsCustomerValidated(null);
        return;
      }
    } catch (error) {
      console.log(error);
      toast.error("something went wrong");
      setIsCustomerValidated(null);
      return;
    }
  };
  useEffect(() => {
    console.log("validatePlayers========>", validatePlayers);
  }, [validatePlayers]);

  const handleMerchandiseUpdate = (itemId: string, newQuantity: number, price: number) => {
    if (newQuantity === 0) {
      setMerchandiseData((prevItems) => prevItems.filter((item) => item.id !== itemId));
    } else {
      const isNewItem = !merchandiseData.some((item) => item.id === itemId);
      if (isNewItem) {
        setMerchandiseData((prevItems) => [...prevItems, { id: itemId, qty: newQuantity, price: price }]);
      } else {
        setMerchandiseData((prevItems) =>
          prevItems.map((item) => {
            if (item.id === itemId) {
              return { ...item, qty: newQuantity };
            } else {
              return item;
            }
          })
        )
      }
    }
  }

  const getTextColor = (type) => {
    if (type === "FAILURE") return "red";
    if (type === "SUCCESS") return "primary";
    if (type === "WARNING") return "primary-gray";
  };

  return (
    <div className="relative flex w-full flex-col gap-2 bg-secondary-white  pt-4 lg:rounded-lg">
      <div
        className={`flex pb-4 lg:items-start ${isMobile ? "gap-1 px-1" : " gap-2 px-4 items-center"
          }`}
      >
        <BlurImage
          src={coursePreviewImage ?? ""}
          width={placeholderImage.width}
          height={placeholderImage.height}
          alt="placeholder"
          className="h-[60px] w-[60px] rounded-lg object-cover lg:h-[100px] lg:w-[100px]"
        />
        {isMobile ? (
          <div className="flex w-full justify-between">
            <div className="flex-col">
              <div className="flex-row font-semibold unmask-time">
                {isLoading ? (
                  <div className="h-6 w-[50%] bg-gray-200 rounded-md animate-pulse" />
                ) : (
                  <span className="text-[16px]" id="date-time-checkout">
                    {formatTime(
                      teeTime?.date ?? "",
                      true,
                      course?.timezoneCorrection
                    )}
                  </span>
                )}
                <div>{course?.name}</div>
              </div>
              <div className="flex-row">
                <Data
                  className="flex"
                  canChoosePlayer={(teeTime?.availableSlots ?? 4) > 0}
                  players={
                    isGroupBooking
                      ? amountOfPlayers
                      : 4 - (teeTime?.availableSlots ?? 0)
                  }
                  selectedPlayers={amountOfPlayers.toString()}
                  choosePlayers={choosePlayers}
                  pricePerGolfer={teeTime?.pricePerGolfer}
                  isLoading={
                    isLoading || teeTime === undefined || teeTime === null
                  }
                  availableSlots={teeTime?.availableSlots}
                  isSecondHand={
                    teeTime?.firstOrSecondHandTeeTime === "SECOND_HAND"
                  }
                  teeTimeId={teeTime?.teeTimeId}
                  numberOfPlayers={numberOfPlayers}
                  selectStatus={allowedPlayers?.selectStatus}
                  canShowPlayers={!isGroupBooking}
                  allowSplit={teeTime?.allowSplit || false}
                  groupBookingParams={groupBookingParams}
                />
              </div>
            </div>
            <div className="flex-col">
              <div className="flex w-full gap-1 flex-col  lg:items-start items-start">
                <Tooltip
                  trigger={
                    teeTime?.firstOrSecondHandTeeTime === "SECOND_HAND" ? (
                      <Spinner className="w-[40px] h-[40px]" />
                    ) : (
                      <Avatar
                        src={teeTime?.soldByImage}
                        className="h-[40px] w-[80px] md:h-[40px] md:w-[80px] lg:h-[40px] lg:w-[80px]"
                        isRounded={false}
                      />
                    )
                  }
                  content={
                    "Sold by " +
                    (teeTime?.firstOrSecondHandTeeTime === "SECOND_HAND"
                      ? "another Golf District golfer."
                      : teeTime?.soldByName)
                  }
                />
                <p
                  className={`text-${getTextColor(
                    getCourseException(teeTime?.date ?? "")?.displayType
                  )} font-semibold`}
                >
                  {getCourseException(teeTime?.date ?? "")?.shortMessage}
                </p>
                <p
                  className={`text-${getTextColor(
                    getCourseException(teeTime?.date ?? "")?.displayType
                  )} font-semibold`}
                >
                  {getCourseException(teeTime?.date ?? "")?.longMessage ||
                    getCourseException(teeTime?.date ?? "")?.longMessage}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-2">
            <div className="flex w-full flex-row justify-between">
              <div className="font-semibold unmask-time">
                {isLoading ? (
                  <div className="h-6 w-[50%] bg-gray-200 rounded-md animate-pulse" />
                ) : (
                  <span
                    className="md:text-[20px] text-[18px]"
                    id="date-time-checkout"
                  >
                    {formatTime(
                      teeTime?.date ?? "",
                      true,
                      course?.timezoneCorrection
                    )}
                  </span>
                )}
                <div>{course?.name}</div>
              </div>

              <div className="flex">
                <Data
                  className="flex"
                  canChoosePlayer={(teeTime?.availableSlots ?? 4) > 0}
                  players={
                    isGroupBooking
                      ? amountOfPlayers
                      : 4 - (teeTime?.availableSlots ?? 0)
                  }
                  selectedPlayers={amountOfPlayers.toString()}
                  choosePlayers={choosePlayers}
                  pricePerGolfer={teeTime?.pricePerGolfer}
                  isLoading={
                    isLoading || teeTime === undefined || teeTime === null
                  }
                  availableSlots={teeTime?.availableSlots}
                  isSecondHand={
                    teeTime?.firstOrSecondHandTeeTime === "SECOND_HAND"
                  }
                  teeTimeId={teeTime?.teeTimeId}
                  numberOfPlayers={numberOfPlayers}
                  selectStatus={allowedPlayers?.selectStatus}
                  canShowPlayers={!isGroupBooking}
                  allowSplit={teeTime?.allowSplit || false}
                  groupBookingParams={groupBookingParams}
                  shouldShowGroupBookingButton={shouldShowGroupBookingButton}
                />
              </div>
            </div>
            <div className="flex w-full gap-1 flex-col  lg:items-start items-start">
              <Tooltip
                trigger={
                  teeTime?.firstOrSecondHandTeeTime === "SECOND_HAND" ? (
                    <Spinner className="w-[40px] h-[40px]" />
                  ) : (
                    <Avatar
                      src={teeTime?.soldByImage}
                      className="!min-h-[40px] !min-w-[80px] max-h-[40px] max-w-[80px] h-[40px] w-[80px] md:min-h-[40px] md:min-w-[80px] md:max-h-[40px] md:max-w-[80px] md:h-[40px] md:w-[80px] lg:w-[80px] lg:h-[40px]"
                      isRounded={false}
                    />
                  )
                }
                content={
                  "Sold by " +
                  (teeTime?.firstOrSecondHandTeeTime === "SECOND_HAND"
                    ? "another Golf District golfer."
                    : teeTime?.soldByName)
                }
              />
              <p
                className={`text-${getTextColor(
                  getCourseException(teeTime?.date ?? "")?.displayType
                )} font-semibold`}
              >
                {getCourseException(teeTime?.date ?? "")?.shortMessage}
              </p>
              <p
                className={`text-${getTextColor(
                  getCourseException(teeTime?.date ?? "")?.displayType
                )} font-semibold`}
              >
                {getCourseException(teeTime?.date ?? "")?.longMessage ||
                  getCourseException(teeTime?.date ?? "")?.longMessage}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex flex-col gap-2">
          {isSupportMemberShip?.supportsProviderMembership === 1 &&
            listingId == null ? (
            <div id="select-membership-checkout">
              <div className="flex gap-2 px-2">
                <h5 className="">Select MemberShip:</h5>
                <select
                  value={membershipStatus}
                  onChange={handleChangeMemberShipStatus}
                >
                  <option value="no_membership">No Membership Selected</option>
                  {courseMemberships && courseMemberships.length > 0 ? (
                    <Fragment>
                      {courseMemberships.map((membership) => (
                        <option key={membership.id} value={membership.id}>
                          {membership.name}
                        </option>
                      ))}
                    </Fragment>
                  ) : null}
                </select>
              </div>
              <div className="flex flex-wrap justify-between gap-1">
                {courseMemberships.length === 0 ||
                  membershipStatus === "no_membership" ? null : (
                  <Fragment>
                    {Array.from({ length: Number(playerCount) }, (_, index) => (
                      <div
                        key={index}
                        className="flex gap-2 justify-center items-center"
                      >
                        <h5 className="text-sm">Player {index + 1}:</h5>
                        <input
                          type="text"
                          className="border border-black focus:border-black focus:outline-none px-2 py-1 text-sm rounded-sm"
                          placeholder={
                            index === 0
                              ? "Current user full email"
                              : "Enter member full email"
                          }
                          disabled={index === 0}
                          value={playerEmails[index]}
                          onChange={(e) => {
                            const updatedEmails = [...playerEmails];
                            updatedEmails[index] = e.target.value;
                            setPlayerEmails(updatedEmails);
                          }}
                        />
                        {validatePlayers[index]?.isValidPlayer ? (
                          <Fragment>
                            <p className="flex items-center text-sm gap-1">
                              <CheckedIcon className="text-green-600" />
                              validated{" "}
                            </p>
                          </Fragment>
                        ) : (
                          <Fragment>
                            <button
                              onClick={() =>
                                handleValidateMemberShipUser(
                                  index,
                                  playerEmails[index] ?? ""
                                )
                              }
                              disabled={isCustomerValidated === index}
                              className="bg-primary px-3 py-1 rounded-[20px] text-white text-sm min-w-[100px] flex items-center justify-center "
                            >
                              {isCustomerValidated === index ? (
                                <LoaderIcon className="w-3 h-3" />
                              ) : (
                                "Validate"
                              )}
                            </button>
                          </Fragment>
                        )}
                      </div>
                    ))}
                  </Fragment>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {isSensibleInvalid || isLoading ? null : (
        <div id="weather-guarantee">
          <SensibleWidget sensibleDataToMountComp={sensibleDataToMountComp} />
        </div>
      )}
      {(isLoading || (courseMerchandise?.length === 0) || !course?.supportsSellingMerchandise) ? null : <section className="p-0 md:p-4">
        <div className="bg-white md:rounded-xl p-4">
          <MerchandiseCarousel
            items={courseMerchandise}
            onItemQuantityChange={handleMerchandiseUpdate}
          />
        </div>
      </section>}
    </div>
  );
};

const Data = ({
  className,
  canChoosePlayer,
  players,
  selectedPlayers,
  choosePlayers,
  pricePerGolfer,
  isLoading,
  availableSlots,
  isSecondHand,
  teeTimeId,
  numberOfPlayers,
  selectStatus,
  canShowPlayers,
  allowSplit,
  groupBookingParams,
  shouldShowGroupBookingButton
}: {
  className: string;
  canChoosePlayer: boolean;
  players?: number;
  selectedPlayers: string;
  choosePlayers: (amount: string) => void;
  pricePerGolfer?: number;
  isLoading: boolean;
  availableSlots?: number;
  isSecondHand: boolean;
  teeTimeId?: string | undefined;
  numberOfPlayers?: string[];
  selectStatus?: string;
  canShowPlayers?: boolean;
  allowSplit?: boolean;
  groupBookingParams?: string;
  shouldShowGroupBookingButton?: boolean;
}) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { course } = useCourseContext();
  if (isLoading) {
    return (
      <div
        className={`flex w-full flex-row justify-between gap-2 text-sm lg:flex-row ${className}`}
      >
        <div className="flex gap-1 lg:items-start">
          <div className="h-8 w-8 bg-gray-200 rounded-full  animate-pulse" />

          <div className="flex flex-col gap-1">
            <div className="h-4 w-16 bg-gray-200 rounded-md  animate-pulse" />
            <div className="h-4 w-28 bg-gray-200 rounded-md  animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col gap-2 lg:items-end w-full">
          <div className="h-8 w-[60%] bg-gray-200 rounded-md  animate-pulse" />
          <div className="h-6 w-[50%] bg-gray-200 rounded-md  animate-pulse" />
        </div>
      </div>
    );
  }
  return (
    <div className={` w-full gap-2 text-sm  ${className}`}>
      <div className="flex flex-col gap-2 lg:items-end">
        {canShowPlayers ? (
          <div className="flex min-h-[31px] items-center gap-2">
            {!isMobile && <OutlineClub />}
            {canChoosePlayer ? (
              <ChoosePlayers
                players={selectedPlayers}
                setPlayers={choosePlayers}
                playersOptions={PlayersOptions}
                availableSlots={availableSlots ?? 0}
                isDisabled={(isSecondHand && !allowSplit) || selectStatus === "ALL_PLAYERS"}
                teeTimeId={teeTimeId}
                numberOfPlayers={numberOfPlayers ? numberOfPlayers : []}
                id="number-of-players-checkout"
                supportsGroupBooking={shouldShowGroupBookingButton ? course?.supportsGroupBooking : false}
                groupBookingParams={groupBookingParams}
              />
            ) : (
              players && (
                <div>
                  {players} golfer{players > 1 ? "s" : ""}
                </div>
              )
            )}
          </div>
        ) : (
          players && (
            <div>
              {players} golfer{players > 1 ? "s" : ""}
            </div>
          )
        )}
        <div className="flex" id="price-per-golfer-checkout">
          <div className="md:text-[18px] text-[16px] font-semibold text-secondary-black">
            {formatMoney(pricePerGolfer ?? 1 ?? 0)}
          </div>
          <div className="md:text-[16px] text-[14px] text-primary-gray">
            /golfer
          </div>
        </div>
      </div>
    </div>
  );
};
