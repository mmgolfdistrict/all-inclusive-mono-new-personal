"use client";

import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import { type InviteFriend } from "~/utils/types";
import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";
import { useDebounce } from "usehooks-ts";
import { OutlineButton } from "../buttons/outline-button";
import { Close } from "../icons/close";

export const InviteFriends = ({
  teeTimeId,
  isConfirmationPage,
}: {
  teeTimeId: string;
  isConfirmationPage?: boolean;
}) => {
  const {
    data: bookingData,
    // isLoading: isLoadingBookingData,
    // isError: isErrorBookingData,
  } = api.user.getBookingsOwnedForTeeTime.useQuery(
    { teeTimeId },
    {
      enabled: !!teeTimeId,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  );
  const { user } = useUserContext();

  const [friendsToInvite, setFriendsToInvite] = useState<InviteFriend[]>([]);
  const [newFriend, setNewFriend] = useState<string>("");
  const debouncedValue = useDebounce<string>(newFriend, 500);
  const { data, isLoading, isError, error } =
    api.searchRouter.searchUsers.useQuery(
      { searchText: debouncedValue },
      { enabled: debouncedValue?.length > 0 }
    );

  const maxInvites = !bookingData ? 0 : 4 - bookingData?.bookings?.length;

  const bookingIsFull = bookingData?.bookings?.length === 4;

  const friendList = useMemo(() => {
    if (!data) return [];
    return data as InviteFriend[];
  }, [data]);

  const removeFriend = (index: number) => {
    const newFriends = [...friendsToInvite];
    newFriends.splice(index, 1);
    setFriendsToInvite(newFriends);
  };

  const handleNewFriend = (e: ChangeEvent<HTMLInputElement>) => {
    setNewFriend(e.target.value);
  };

  const addFriend = (e: ChangeEvent<HTMLInputElement>) => {
    if (friendsToInvite?.length + 1 === maxInvites) return;
    const selectedFriend = friendList?.find(
      (friend) => `${friend.email} (${friend.handle})` === e.target.value
    );
    if (selectedFriend) {
      setFriendsToInvite((prev) => [...prev, selectedFriend]);
      setNewFriend("");
    }
  };

  //commented to show its there - no booking data returned atm
  // if (
  //   !bookingData ||
  //   isLoadingBookingData ||
  //   isErrorBookingData ||
  //   !bookingData?.connectedUserIsOwner
  // ) {
  //   return null;
  // }

  if (!user) return null;

  if (!bookingData?.connectedUserIsOwner) return null;
  return (
    <div
      className={`flex w-full flex-col  ${
        isConfirmationPage ? "bg-secondary-white" : "bg-white gap-4"
      } md:rounded-xl`}
    >
      <div
        className={`flex px-4 py-3 md:px-6 md:pr-4 ${
          isConfirmationPage ? "justify-center" : "border-b stroke"
        }`}
      >
        <div className={`text-lg font-semibold`}>
          Invite friends to your tee time
        </div>
      </div>
      <div className="flex max-w-full flex-col gap-2 overflow-auto px-4 pb-2 text-[14px] md:px-6 md:pb-3">
        {friendsToInvite.length > 0
          ? friendsToInvite?.map((friend, idx) => (
              <div
                key={idx}
                className={`mx-auto w-full  rounded-lg ${
                  isConfirmationPage
                    ? "bg-white"
                    : "bg-secondary-white max-w-[400px]"
                } px-4 py-1 flex justify-between text-[16px] font-semibold outline-none`}
              >
                <div>
                  {friend.email} ({friend.handle})
                </div>
                <button onClick={() => removeFriend(idx)}>
                  <Close className="w-[20px]" />
                </button>
              </div>
            ))
          : null}
        {bookingIsFull ? (
          <div className="flex justify-center items-center h-[130px]">
            <div className="text-center">This tee time is full</div>
          </div>
        ) : (
          <>
            {friendsToInvite?.length === maxInvites ? (
              <div className="flex justify-center items-center">
                <div className="text-center">
                  You have invited the maximum number of friends.
                </div>
              </div>
            ) : (
              <>
                <input
                  value={newFriend}
                  type="text"
                  list="searchedFriends"
                  onChange={handleNewFriend}
                  onSelect={addFriend}
                  placeholder="Username or email"
                  className={`mx-auto w-full rounded-lg ${
                    isConfirmationPage
                      ? "bg-white"
                      : "bg-secondary-white  max-w-[400px]"
                  } px-4 py-2 flex justify-between text-[14px] font-semibold outline-none`}
                />
                {isError && error ? (
                  <div className="mx-auto w-full max-w-[400px] text-alert-red">
                    {error?.message ?? "Error occurred searching for friends"}
                  </div>
                ) : null}
                {!isLoading &&
                newFriend?.length > 0 &&
                friendList?.length === 0 ? (
                  <div className="mx-auto w-full max-w-[400px]">
                    No friends found for &quot;{newFriend}&quot;
                  </div>
                ) : null}

                <datalist id="searchedFriends">
                  {friendList?.map((friend, idx) => (
                    <option key={idx}>
                      {friend.email} ({friend.handle})
                    </option>
                  ))}
                </datalist>
              </>
            )}
            {friendsToInvite?.length === maxInvites ? null : (
              <OutlineButton className="mx-auto w-fit">Send</OutlineButton>
            )}
          </>
        )}
      </div>
    </div>
  );
};
