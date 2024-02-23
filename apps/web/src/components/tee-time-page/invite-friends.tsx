"use client";

import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import { type InviteFriend } from "~/utils/types";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useDebounce } from "usehooks-ts";
import { FilledButton } from "../buttons/filled-button";
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
    isLoading: isLoadingBookingData,
    refetch,
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

  const [newFriend, setNewFriend] = useState<string>("");
  const debouncedValue = useDebounce<string>(newFriend, 500);
  const { data, isLoading, isError, error } =
    api.searchRouter.searchUsers.useQuery(
      { searchText: debouncedValue },
      { enabled: debouncedValue?.length > 0 }
    );
  const [friends, setFriends] = useState<InviteFriend[]>([]);

  const [inviteFriend, setInviteFriend] = useState<string>("");
  const [inviteSucess, setInviteSucess] = useState<boolean>(false);

  const invite = api.user.inviteUser.useMutation();
  const updateNames = api.teeBox.updateNamesOnBookings.useMutation();

  const inviteFriendCall = async () => {
    if (invite.isLoading) return;
    try {
      await invite.mutateAsync({ emailOrPhone: inviteFriend });
      setInviteSucess(true);
      setInviteFriend("");
      setTimeout(() => {
        setNewFriend("");
      }, 4500);
      setTimeout(() => {
        setInviteSucess(false);
      }, 5000);
    } catch (error) {
      setInviteSucess(false);
      setInviteFriend("");
      toast.error(
        (error as Error)?.message ?? "An error occurred inviting friend."
      );
    }
  };

  const friendList = useMemo(() => {
    if (!data) return [];
    return data as InviteFriend[];
  }, [data]);

  useEffect(() => {
    if (!bookingData?.bookings || isLoadingBookingData) return;

    setFriends(() => bookingData?.bookings as InviteFriend[]);
  }, [bookingData, isLoadingBookingData]);

  const maxFriends = useMemo(() => {
    if (!bookingData?.bookings) return 0;
    return bookingData?.bookings.length;
  }, [bookingData?.bookings]);

  const removeFriend = (index: number) => {
    const newFriends = [...friends];
    newFriends.splice(index, 1);
    setFriends(newFriends);
  };

  const addFriend = (e: ChangeEvent<HTMLInputElement>) => {
    if (friends?.length + 1 > maxFriends) return;
    const selectedFriend = friendList?.find(
      (friend) => `${friend.email} (${friend.handle})` === e.target.value
    );
    if (selectedFriend) {
      setFriends((prev) => [...prev, selectedFriend]);
      setNewFriend("");
    }
  };

  const handleNewFriend = (e: ChangeEvent<HTMLInputElement>) => {
    setNewFriend(e.target.value);
  };

  const save = async () => {
    if (!bookingData?.bookingIds) return;
    if (!friends) return;
    if (updateNames.isLoading) return;
    const userIdsForBooking = friends
      .filter((friend) => friend.id !== "")
      .map((i) => i.id);
    try {
      await updateNames.mutateAsync({
        bookingIds: bookingData?.bookingIds?.slice(0, friends.length) ?? [],
        userIds: userIdsForBooking,
      });
      await refetch();
      toast.success("Tee time invites updated successfully");
    } catch (error) {
      toast.error(
        (error as Error)?.message ?? "An error occurred sending invite"
      );
    }
  };

  const areFriendsDifferent = useMemo(() => {
    if (!friends || !bookingData?.bookings) return false;
    if (friends.length !== bookingData.bookings.length) {
      return true;
    }
    for (let i = 0; i < friends.length; i++) {
      if (friends[i]?.id !== bookingData?.bookings?.[i]?.id) {
        return true;
      }
    }
    return false;
  }, [friends, bookingData?.bookings]);

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
        {friends.length > 0
          ? friends?.map((friend, idx) => (
              <div
                key={idx}
                className={`mx-auto w-full  rounded-lg ${
                  isConfirmationPage
                    ? "bg-white"
                    : "bg-secondary-white max-w-[400px]"
                } px-4 py-1 flex justify-between text-[16px] font-semibold outline-none`}
              >
                <div>
                  {idx === 0 && friend.name.toLowerCase() === "guest"
                    ? "You"
                    : friend.name}
                </div>
                <button onClick={() => removeFriend(idx)} data-testid="remove-friend-button-id">
                  <Close className="w-[20px]" />
                </button>
              </div>
            ))
          : null}
        {friends?.length >= maxFriends ? (
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
              onChange={handleNewFriend}
              onSelect={addFriend}
              placeholder="Username or email"
              className={`mx-auto w-full rounded-lg ${
                isConfirmationPage
                  ? "bg-white"
                  : "bg-secondary-white  max-w-[400px]"
              } px-4 py-2 flex justify-between text-[14px] font-semibold outline-none`}
              list="searchedFriends2"
              data-testid="new-friend-id"
            />

            {isError && error ? (
              <div className="mx-auto w-full max-w-[400px] text-alert-red">
                {error?.message ?? "Error occurred searching for friends"}
              </div>
            ) : null}
            {!isLoading &&
            debouncedValue?.length > 0 &&
            friendList?.length === 0 ? (
              <div
                className={`flex justify-center items-center flex-col gap-1 rounded-md w-full mx-auto ${
                  isConfirmationPage ? "" : "max-w-[400px]"
                }`}
              >
                {inviteSucess ? (
                  <div className="text-center fade-in">
                    Friend invited successfully.
                  </div>
                ) : (
                  <>
                    <div className="text-center fade-in">
                      Friend not found. Invite them!
                    </div>
                    <div className="flex items-center gap-1 w-full fade-in">
                      <input
                        value={inviteFriend}
                        type="text"
                        onChange={(e) => {
                          if (invite.isLoading) return;
                          setInviteFriend(e.target.value);
                        }}
                        placeholder="Email or phone number"
                        className={`mx-auto w-full rounded-lg ${
                          isConfirmationPage
                            ? "bg-white"
                            : "bg-secondary-white max-w-[400px]"
                        } px-4 py-2 flex justify-between text-[14px] font-semibold outline-none`}
                        data-testid="invite-friend-id"
                      />
                      <FilledButton
                        className={`w-full !max-w-fit ${
                          invite.isLoading ? "animate-pulse" : ""
                        }`}
                        onClick={inviteFriendCall}
                        data-testid="invite-button-id"
                      >
                        {invite.isLoading ? "Inviting..." : "Invite"}
                      </FilledButton>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </>
        )}
        <datalist id="searchedFriends2">
          {friendList?.map((friend, idx) => (
            <option key={idx} value={`${friend.email} (${friend.handle})`}>
              {friend.email} ({friend.handle})
            </option>
          ))}
        </datalist>
        {friends?.length === maxFriends && !areFriendsDifferent ? null : (
          <OutlineButton
            className={`mx-auto w-fit ${
              updateNames.isLoading ? "animate-pulse" : ""
            }`}
            onClick={() => void save()}
            data-testid="send-button-id"
          >
            {updateNames.isLoading ? "Sending..." : "Send"}
          </OutlineButton>
        )}
      </div>
    </div>
  );
};
