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
import { Fragment, useEffect, useState } from "react";
import { toast } from "react-toastify";
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

const PlayersOptions = ["1", "2", "3", "4"];

export const CheckoutItem = ({
  teeTime,
  isLoading,
  isSensibleInvalid,
  sensibleDataToMountComp,
}: {
  teeTime: SearchObject | null | undefined;
  isLoading: boolean;
  isSensibleInvalid: boolean;
  sensibleDataToMountComp: SensibleDataToMountCompType;
}) => {
  const searchParams = useSearchParams();
  const playerCount = searchParams.get("playerCount");
  const teeTimeId = searchParams?.get("teeTimeId");

  const {
    setAmountOfPlayers,
    amountOfPlayers,
    setValidatePlayers,
    validatePlayers,
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

  const { data: coursePreviewImage } =
    api.course.getCoursePreviewImage.useQuery({ courseId: courseId ?? "" });

  const { data: allowedPlayers } =
    api.course.getNumberOfPlayersByCourse.useQuery({
      courseId: courseId ?? "",
      time: teeTime?.time,
      date: teeTime?.date ?? "",
    });

  const { data: isSupportMemberShip } = api.course.getCourseById.useQuery({
    courseId: courseId ?? "",
  });

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
    if (teeTime?.firstOrSecondHandTeeTime === "SECOND_HAND") {
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

  const handleChangeMemberShipStatus = (event: React.ChangeEvent<HTMLSelectElement>) => {
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
            providerCourseMemberShipId:result.providerCourseMembershipId
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
    }
  };
  useEffect(() => {
    console.log("validatePlayers========>", validatePlayers);
  }, [validatePlayers]);

  return (
    <div className="relative flex w-full flex-col gap-2 bg-secondary-white  pt-4 lg:rounded-lg">
      <div className="flex items-center gap-2 px-4 pb-4 lg:items-start">
        <BlurImage
          src={coursePreviewImage ?? ""}
          width={placeholderImage.width}
          height={placeholderImage.height}
          alt="placeholder"
          className="h-[60px] w-[60px] rounded-lg object-cover lg:h-[100px] lg:w-[100px]"
        />
        <div className="flex w-full flex-col gap-2">
          <div className="font-semibold unmask-time">
            {isLoading ? (
              <div className="h-6 w-[50%] bg-gray-200 rounded-md  animate-pulse" />
            ) : (
              <span className="text-[20px] ">
                {formatTime(
                  teeTime?.date ?? "",
                  true,
                  course?.timezoneCorrection
                )}
              </span>
            )}
          </div>
          <Data
            className="hidden lg:flex"
            canChoosePlayer={(teeTime?.availableSlots ?? 4) > 0}
            players={4 - (teeTime?.availableSlots ?? 0)}
            selectedPlayers={amountOfPlayers.toString()}
            choosePlayers={choosePlayers}
            soldByImage={teeTime?.soldByImage}
            soldByName={teeTime?.soldByName}
            pricePerGolfer={teeTime?.pricePerGolfer}
            isLoading={isLoading || teeTime === undefined || teeTime === null}
            availableSlots={teeTime?.availableSlots}
            isSecondHand={teeTime?.firstOrSecondHandTeeTime === "SECOND_HAND"}
            teeTimeId={teeTime?.teeTimeId}
            courseException={getCourseException(teeTime?.date ?? "")}
            numberOfPlayers={numberOfPlayers}
            selectStatus={allowedPlayers?.selectStatus}
          />
        </div>
      </div>
      <Data
        className="lg:hidden px-4"
        canChoosePlayer={(teeTime?.availableSlots ?? 4) > 0}
        players={4 - (teeTime?.availableSlots ?? 0)}
        selectedPlayers={amountOfPlayers.toString()}
        choosePlayers={choosePlayers}
        soldByImage={teeTime?.soldByImage}
        pricePerGolfer={teeTime?.pricePerGolfer}
        soldByName={teeTime?.soldByName}
        isLoading={isLoading || teeTime === undefined || teeTime === null}
        availableSlots={teeTime?.availableSlots}
        isSecondHand={teeTime?.firstOrSecondHandTeeTime === "SECOND_HAND"}
        teeTimeId={teeTime?.teeTimeId}
        courseException={getCourseException(teeTime?.date ?? "")}
        numberOfPlayers={numberOfPlayers}
        selectStatus={allowedPlayers?.selectStatus}
      />
      <div className="flex flex-col gap-1">
        <div className="flex flex-col gap-2">
          {isSupportMemberShip?.supportsProviderMembership === 1 ? (
            <Fragment>
              <div className="flex gap-2 px-2">
                <h5 className="">Select MemberShip:</h5>
                <select
                  value={membershipStatus}
                  onChange={handleChangeMemberShipStatus}
                >
                  {courseMemberships.length === 0 ? (
                    <Fragment>
                      <option value="no_membership">
                        No Membership Available
                      </option>
                    </Fragment>
                  ) : (
                    courseMemberships.map((membership) => (
                      <option key={membership.id} value={membership.id}>
                        {membership.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="flex flex-wrap justify-between gap-4 p-2">
                {courseMemberships.length === 0 ? null : (
                  <Fragment>
                    {Array.from({ length: Number(playerCount) }, (_, index) => (
                      <div key={index} className="flex gap-2 justify-center items-center">
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
            </Fragment>
          ) : null}
        </div>
      </div>
      {isSensibleInvalid || isLoading ? null : (
        <SensibleWidget sensibleDataToMountComp={sensibleDataToMountComp} />
        // <section className="flex flex-col items-center justify-between gap-4 border-t border-stroke p-4 lg:flex-row">
        //   <div className="flex flex-col gap-2">
        //     <div className="flex items-center gap-2">
        //       <div className="text-secondary-black">
        //         Add a Weather Guarantee for{" "}
        //         {sensiblePrice ? formatMoney(sensiblePrice) : "-"}
        //       </div>
        //       <Tooltip
        //         className="hidden lg:block"
        //         trigger={
        //           <div className="flex items-center gap-1">
        //             <Info className="h-[14px] w-[14px]" />
        //             <div className="whitespace-nowrap text-[12px] text-[#B0B7BC]">
        //               More info
        //             </div>
        //           </div>
        //         }
        //         content="Learn more about the Weather Guarantee"
        //       />
        //     </div>
        //     <div className="flex items-center gap-2">
        //       <div className="text-[12px] text-secondary-black">Offered by</div>
        //       <SensibleIcon className="h-[24px] w-[138px]" />
        //     </div>
        //   </div>
        //   <div className="flex w-full items-center justify-evenly gap-2 lg:w-fit lg:justify-end">
        //     <Tooltip
        //       className="block lg:hidden"
        //       trigger={
        //         <div className="flex items-center gap-1">
        //           <Info className="h-[14px] w-[14px]" />
        //           <div className="whitespace-nowrap text-[12px] text-[#B0B7BC]">
        //             More info
        //           </div>
        //         </div>
        //       }
        //       content="Learn more about the Weather Guarantee"
        //     />
        //     <OutlineButton
        //       onClick={handleSensibleModalOpen}
        //       className="h-fit whitespace-nowrap bg-transparent"
        //     >
        //       Add Coverage
        //     </OutlineButton>
        //   </div>
        // </section>
      )}
    </div>
  );
};

const Data = ({
  className,
  canChoosePlayer,
  players,
  selectedPlayers,
  choosePlayers,
  soldByImage,
  soldByName,
  pricePerGolfer,
  isLoading,
  availableSlots,
  isSecondHand,
  teeTimeId,
  courseException,
  numberOfPlayers,
  selectStatus,
}: {
  className: string;
  canChoosePlayer: boolean;
  players?: number;
  selectedPlayers: string;
  choosePlayers: (amount: string) => void;
  soldByImage?: string;
  soldByName?: string;
  pricePerGolfer?: number;
  isLoading: boolean;
  availableSlots?: number;
  isSecondHand: boolean;
  teeTimeId?: string | undefined;
  courseException: NotificationObject | null;
  numberOfPlayers?: string[];
  selectStatus?: string;
}) => {
  if (isLoading) {
    return (
      <div
        className={`flex w-full flex-col justify-between gap-2 text-sm lg:flex-row ${className}`}
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

  const getTextColor = (type) => {
    if (type === "FAILURE") return "red";
    if (type === "SUCCESS") return "primary";
    if (type === "WARNING") return "primary-gray";
  };
  return (
    <div
      className={`flex w-full flex-col justify-between gap-2 text-sm lg:flex-row ${className}`}
    >
      <div className="flex gap-1 lg:items-start">
        <div className="flex gap-1 flex-col items-start">
          <Tooltip
            trigger={
              isSecondHand ? (
                <Spinner className="w-[40px] h-[40px]" />
              ) : (
                <Avatar
                  src={soldByImage}
                  className="!min-h-[40px] !min-w-[80px] max-h-[40px] max-w-[80px] h-[40px] w-[80px] md:min-h-[40px] md:min-w-[80px] md:max-h-[40px] md:max-w-[80px] md:h-[40px] md:w-[80px] lg:w-[80px] lg:h-[40px]"
                  isRounded={false}
                />
              )
            }
            content={
              "Sold by " +
              (isSecondHand ? "another Golf District golfer." : soldByName)
            }
          />
          <p
            className={`text-${getTextColor(
              courseException?.displayType
            )} font-semibold`}
          >
            {courseException?.shortMessage}
          </p>
          <p
            className={`text-${getTextColor(
              courseException?.displayType
            )} font-semibold`}
          >
            {courseException?.longMessage || courseException?.longMessage}
          </p>
        </div>

        {/* <div className="flex flex-wrap gap-1">
          <div>Sold by</div>
          {soldByName}
        </div> */}
      </div>
      <div className="flex flex-col gap-2 lg:items-end">
        <div className="flex min-h-[31px] items-center gap-2">
          <OutlineClub />
          {canChoosePlayer ? (
            <ChoosePlayers
              players={selectedPlayers}
              setPlayers={choosePlayers}
              playersOptions={PlayersOptions}
              availableSlots={availableSlots ?? 0}
              isDisabled={isSecondHand || selectStatus === "ALL_PLAYERS"}
              teeTimeId={teeTimeId}
              numberOfPlayers={numberOfPlayers ? numberOfPlayers : []}
            />
          ) : (
            players && (
              <div>
                {players} golfer{players > 1 ? "s" : ""}
              </div>
            )
          )}
        </div>
        <div className="flex">
          <div className="text-[18px] font-semibold text-secondary-black">
            {formatMoney(pricePerGolfer ?? 1 ?? 0)}
          </div>
          <div className="text-[16px] text-primary-gray">/golfer</div>
        </div>
      </div>
    </div>
  );
};
