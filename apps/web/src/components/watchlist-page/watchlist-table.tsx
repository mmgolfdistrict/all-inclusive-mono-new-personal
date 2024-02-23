"use client";

import { useSession } from "@golf-district/auth/nextjs-exports";
import { type WatchlistItem } from "@golf-district/shared";
import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import { formatMoney, formatTime } from "~/utils/formatters";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Avatar } from "../avatar";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Trashcan } from "../icons/trashcan";
import { SkeletonRow } from "../my-tee-box-page/skeleton-row";
import { MakeAnOffer } from "./make-an-offer";

export const WatchlistTable = () => {
  const { course } = useCourseContext();
  const courseId = course?.id;
  const [isMakeAnOfferOpen, setIsMakeAnOfferOpen] = useState<boolean>(false);
  const [selectedTeeTime, setSelectedTeeTime] = useState<
    WatchlistItem | undefined
  >(undefined);

  const { data: session } = useSession();
  const router = useRouter();
  const { user } = useUserContext();

  const { data, isLoading, isError, error, refetch } =
    api.watchlist.getWatchlist.useQuery(
      {
        courseId: courseId ?? "",
      },
      {
        enabled: !!courseId,
      }
    );

  const toggleWatchlist = api.watchlist.toggleWatchlist.useMutation();

  const cleanedWatchlist = useMemo(() => {
    if (!data) return [];
    return data.items.map((item) => {
      return {
        ...item,
      };
    }) as WatchlistItem[];
  }, [data]);

  const openMakeAnOffer = (teeTime: WatchlistItem) => {
    setSelectedTeeTime(teeTime);
    setIsMakeAnOfferOpen(true);
  };

  const buyTeeTime = (
    teeTimeId: string,
    playerCount: "1" | "2" | "3" | "4" = "1"
  ) => {
    //only for listed or first party
    if (!user || !session) {
      void router.push(`/${course?.id}/login`);
      return;
    }
    void router.push(
      `/${courseId}/checkout?teeTimeId=${teeTimeId}&playerCount=${playerCount}`
    );
  };

  const removeFromWatchlist = async (teeTimeId: string) => {
    try {
      await toggleWatchlist.mutateAsync({
        teeTimeId: teeTimeId,
      });
      await refetch();
      toast.success("Removed from watchlist");
    } catch (error) {
      toast.error((error as Error)?.message ?? "Error removing from watchlist");
      console.log(error);
    }
  };

  if (!user || !session) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] rounded-xl gap-4 bg-white p-6 text-center">
        <div className="text-2xl font-semibold">
          Login to view your watchlist
        </div>
        <Link href={`/${courseId}/login`}>
          <FilledButton>Login</FilledButton>
        </Link>
      </div>
    );
  }

  if (isError && error) {
    return (
      <div className="text-center h-[200px] flex items-center justify-center rounded-xl bg-white p-6">
        {error?.message ?? "An error occurred fetching watchlist"}
      </div>
    );
  }

  if (
    (!cleanedWatchlist || cleanedWatchlist?.length === 0) &&
    !isLoading &&
    !isError &&
    !error
  ) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] rounded-xl bg-white p-6 text-center">
        <div className="text-2xl font-semibold">Your Watchlist is Empty</div>
        <div className="text-primary-gray">
          You can add items to your watchlist by clicking the heart icon on a
          tee time
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative flex max-w-full flex-col gap-4 overflow-auto  rounded-xl bg-white px-6 pb-14 pt-4 text-[14px]">
        <table className="w-full table-auto  overflow-auto">
          <thead className="top-0 table-header-group">
            <tr className="text-left">
              <TableHeader text="Details" />
              <TableHeader text="Price" />
              <TableHeader text="Golfers" />
              <TableHeader text="Status" />
              <TableHeader text="" className="text-right" />
            </tr>
          </thead>
          <tbody className={`max-h-[300px] w-full flex-col overflow-scroll`}>
            {isLoading
              ? Array(3)
                  .fill(null)
                  .map((_, idx) => <SkeletonRow key={idx} />)
              : cleanedWatchlist.map((i, idx) => (
                  <TableRow
                    course={i.ownedBy}
                    date={i.teeTimeExpiration}
                    iconSrc={i.image}
                    key={idx}
                    listedPrice={i.price}
                    golfers={i.availableSpots}
                    status={i.status}
                    type={i.type}
                    buyTeeTime={() =>
                      buyTeeTime(
                        i.teeTimeId,
                        i.availableSpots.toString() as "1" | "2" | "3" | "4"
                      )
                    }
                    removeFromWatchlist={removeFromWatchlist}
                    openMakeAnOffer={() => openMakeAnOffer(i)}
                    teeTimeId={i.teeTimeId}
                    ownedByName={i.ownedBy}
                    courseId={courseId ?? ""}
                    ownedById={i.ownedById}
                    listingId={i.listId ?? ""}
                    timezoneCorrection={course?.timezoneCorrection}
                  />
                ))}
          </tbody>
        </table>
      </div>
      <MakeAnOffer
        isMakeAnOfferOpen={isMakeAnOfferOpen}
        setIsMakeAnOfferOpen={setIsMakeAnOfferOpen}
        availableSlots={selectedTeeTime?.availableSpots ?? 0}
        courseName={course?.name ?? ""}
        courseImage={course?.logo ?? ""}
        date={selectedTeeTime?.teeTimeExpiration ?? ""}
        minimumOfferPrice={
          selectedTeeTime?.minimumOfferPrice ?? selectedTeeTime?.price ?? 0
        }
        bookingIds={selectedTeeTime?.bookingIds ?? []}
      />
    </>
  );
};

const TableHeader = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  return (
    <th className={`whitespace-nowrap px-4 font-semibold ${className ?? ""}`}>
      {text}
    </th>
  );
};

const TableRow = ({
  iconSrc,
  date,
  course,
  listedPrice,
  golfers,
  status,
  teeTimeId,
  ownedByName,
  type,
  courseId,
  ownedById,
  listingId,
  timezoneCorrection,
  buyTeeTime,
  removeFromWatchlist,
  openMakeAnOffer,
}: {
  course: string;
  date: string;
  iconSrc: string;
  golfers: number;
  listedPrice: number;
  status: "LISTED" | "UNLISTED";
  teeTimeId: string;
  type: "FIRST_PARTY" | "SECOND_HAND";
  ownedByName: string;
  courseId: string;
  ownedById: string;
  listingId: string;
  timezoneCorrection: number | undefined;
  buyTeeTime: () => void;
  removeFromWatchlist: (id: string) => Promise<void>;
  openMakeAnOffer: () => void;
}) => {
  const href = useMemo(() => {
    if (type === "FIRST_PARTY") {
      return `/${courseId}/${teeTimeId}`;
    }
    if (type === "SECOND_HAND" && status === "LISTED") {
      return `/${courseId}/${teeTimeId}/listing/${listingId}`;
    }
    return `/${courseId}/${teeTimeId}/owner/${ownedById}`;
  }, [status, listingId, teeTimeId, courseId, ownedById]);

  return (
    <tr className="w-full border-b border-stroke text-primary-gray">
      <td className="gap-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <Avatar src={iconSrc} />
          <div className="flex flex-col">
            <Link
              href={href}
              className="whitespace-nowrap text-secondary-black underline"
              data-testid="course-id"
              data-qa={course}
            >
              {course}
            </Link>
            <div className="whitespace-nowrap text-primary-gray">
              {formatTime(date, false, timezoneCorrection)}
            </div>
            {type === "FIRST_PARTY" ? (
              <div className="whitespace-nowrap">Sold by {ownedByName}</div>
            ) : (
              <Link
                href={`/${courseId}/profile/${ownedById}`}
                className="whitespace-nowrap"
                data-testid="owned-by-name-id"
                data-test={ownedById}
                data-qa={ownedByName}
              >
                {type === "SECOND_HAND" && status === "LISTED"
                  ? "Listed"
                  : "Owned"}{" "}
                by <span className="text-primary">{ownedByName}</span>
              </Link>
            )}
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        {formatMoney(listedPrice)}
        <span className="font-[300]">/golfer</span>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        {golfers} {golfers === 1 ? "golfers" : "golfers"}
      </td>
      <td className="whitespace-nowrap px-4 py-3 capitalize">
        {status.toLowerCase()}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <div className="flex  justify-end gap-2">
          <Link href={href} data-testid="details-button-id">
            <OutlineButton className="min-w-[155px]">Details</OutlineButton>
          </Link>
          {status === "LISTED" ? (
            <FilledButton className="min-w-[155px]" onClick={buyTeeTime} data-testid="buy-button-id">
              Buy
            </FilledButton>
          ) : (
            <FilledButton className="min-w-[155px]" onClick={openMakeAnOffer} data-testid="make-offer-button-id">
              Make an Offer
            </FilledButton>
          )}
          <button onClick={() => void removeFromWatchlist(teeTimeId)} data-testid="remove-watch-list-button-id">
            <Trashcan className="w-[25px] max-w-[25px]" />
          </button>
        </div>
      </td>
    </tr>
  );
};
