import { useCheckoutContext } from "~/contexts/CheckoutContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { formatMoney, formatTime } from "~/utils/formatters";
import {
  type SearchObject,
  type SensibleDataToMountCompType,
} from "~/utils/types";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import placeholderImage from "../../../public/placeholders/course.png";
import { Avatar } from "../avatar";
import { OutlineClub } from "../icons/outline-club";
import { BlurImage } from "../images/blur-image";
import { ChoosePlayers } from "../input/choose-players";
import { SensibleWidget } from "../sensible/sensible-widget";

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

  const { setAmountOfPlayers, amountOfPlayers } = useCheckoutContext();
  const { course } = useCourseContext();

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

  return (
    <div className="relative flex w-full flex-col gap-2 bg-secondary-white  pt-4 lg:rounded-lg">
      <div className="flex items-center gap-2 px-4 pb-4 lg:items-start">
        <BlurImage
          src={placeholderImage.src}
          width={placeholderImage.width}
          height={placeholderImage.height}
          alt="placeholder"
          className="h-[60px] w-[60px] rounded-lg object-cover lg:h-[100px] lg:w-[100px]"
        />
        <div className="flex w-full flex-col gap-2">
          <div className="font-semibold ">
            {isLoading ? (
              <div className="h-6 w-[50%] bg-gray-200 rounded-md  animate-pulse" />
            ) : (
              formatTime(teeTime?.date ?? "", true, course?.timezoneCorrection)
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
      />
      {isSensibleInvalid ? null : (
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
  return (
    <div
      className={`flex w-full flex-col justify-between gap-2 text-sm lg:flex-row ${className}`}
    >
      <div className="flex gap-1 lg:items-start">
        <Avatar src={soldByImage} />
        <div className="flex flex-wrap gap-1">
          <div>Sold by</div>
          {soldByName}
        </div>
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
              isDisabled={isSecondHand}
              teeTimeId={teeTimeId}
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
          <div className="text-[20px] font-semibold text-secondary-black">
            {formatMoney(
              (pricePerGolfer ?? 1) * parseInt(selectedPlayers) ?? 0
            )}
          </div>
          <div className="text-[16px] text-primary-gray">/golfer</div>
        </div>
      </div>
    </div>
  );
};
