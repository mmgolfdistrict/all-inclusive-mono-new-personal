"use client";

import { useCourseContext } from "~/contexts/CourseContext";
import { useUserContext } from "~/contexts/UserContext";
import { api } from "~/utils/api";
import { type InviteFriend } from "~/utils/types";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useDebounce } from "usehooks-ts";
import { FilledButton } from "../buttons/filled-button";
import { Edit } from "../icons/edit";

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

  useEffect(() => {
    void refetch();
  }, []);

  const { user } = useUserContext();
  const { course } = useCourseContext();
  const [isInviteVisible, setIsInviteVisible] = useState(false);
  const selectedTeeTime: InviteFriend[] = bookingData?.bookings || [];
  const href = window.location.href;
  const match = href.match(/^(https?:\/\/[^/]+\/[0-9A-Fa-f-]+)/) || "";

  const [newFriend, setNewFriend] = useState<InviteFriend>({
    id: "",
    handle: "",
    name: "",
    email: "",
    slotId: "",
    bookingId: "",
    currentlyEditing: false,
  });
  const debouncedValue = useDebounce<InviteFriend>(newFriend, 500);
  const { data, isLoading } = api.searchRouter.searchUsers.useQuery(
    { searchText: debouncedValue.name },
    { enabled: debouncedValue?.name?.length > 0 }
  );

  const [friends, setFriends] = useState<InviteFriend[]>([]);
  const [inviteSuccess, setInviteSuccess] = useState<Record<string, boolean>>(
    {}
  );

  const invite = api.user.inviteUser.useMutation();
  const updateNames = api.teeBox.updateNamesOnBookings.useMutation();

  const handleInviteFriend = async (friend: InviteFriend, index: number) => {
    if (invite.isLoading) return;

    const bookingSlotId = selectedTeeTime[index]?.slotId || "";

    try {
      await invite.mutateAsync({
        emailOrPhone: friend.name || "",
        teeTimeId: teeTimeId || "",
        bookingSlotId, // Directly passing the slotId from the array
        slotPosition: index + 1,
        redirectHref: match[0],
      });
      setInviteSuccess((prev) => ({ ...prev, [bookingSlotId]: true }));
      setIsInviteVisible(false);
      toast.success("Invitation sent successfully.");
    } catch (error) {
      // Remove the friend from UI on failure
      setFriends((prev) =>
        prev.map((f) =>
          f.slotId === bookingSlotId ? { ...f, name: "", email: "", handle: "", id: "", currentlyEditing: true } : f
        )
      );
      setNewFriend({
        id: "",
        handle: "",
        name: "",
        email: "",
        slotId: bookingSlotId,
        bookingId: "",
        currentlyEditing: true,
      });
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

  const removeFriend = (slotId: string) => {
    const newFriends: InviteFriend[] = JSON.parse(JSON.stringify(friends));

    newFriends.forEach((friend) => {
      if (friend.slotId == slotId) {
        friend.currentlyEditing = true;
      }
    });
    setNewFriend({ ...newFriend, name: "", slotId: slotId });
    setFriends(newFriends);
  };

  const addFriendUpdated = async (
    friendToFind: InviteFriend,
    index: number
  ) => {
    const friendsCopy = [...friends];
    const currentSlotId = friendToFind.slotId;
    friendsCopy.forEach((friend) => {
      if (friend.slotId == currentSlotId) {
        (friend.email = friendToFind.email),
          (friend.name = friendToFind.name),
          (friend.handle = friendToFind.handle),
          (friend.id = friendToFind.id),
          (friend.currentlyEditing = false);
      }
    });
    setFriends(friendsCopy);
    setNewFriend({
      id: "",
      handle: "",
      name: "",
      email: "",
      slotId: "",
      bookingId: "",
      currentlyEditing: false,
      emailOrPhoneNumber: "",
    });

    const bookingSlotId = selectedTeeTime[index]?.slotId || "";

    try {
      await invite.mutateAsync({
        emailOrPhone: friendToFind.emailOrPhoneNumber || "",
        teeTimeId: teeTimeId || "",
        bookingSlotId, // Ensure a string is passed
        slotPosition: index + 1,
        redirectHref: match[0],
      });
      setInviteSuccess((prev) => ({ ...prev, [bookingSlotId]: true }));
      toast.success("Invitation sent successfully.");
    } catch (error) {
      // Remove the friend from UI on failure
      setFriends((prev) =>
        prev.map((f) =>
          f.slotId === friendToFind.slotId
            ? { ...f, name: "", email: "", handle: "", id: "", currentlyEditing: true }
            : f
        )
      );

      setNewFriend({
        id: "",
        handle: "",
        name: "",
        email: "",
        slotId: friendToFind.slotId,
        bookingId: "",
        currentlyEditing: true,
      });
      toast.error(
        (error as Error)?.message ?? "An error occurred inviting friend."
      );
    }
  };

  const addFriend = (e: ChangeEvent<HTMLInputElement>) => {
    if (friends?.length + 1 > maxFriends) return;
    const selectedFriend = friendList?.find(
      (friend) => `${friend.email} (${friend.handle})` === e.target.value
    );
    if (selectedFriend) {
      selectedFriend.slotId = newFriend.slotId;
    }
    if (selectedFriend) {
      setFriends((prev) => [...prev, selectedFriend]);
      setNewFriend({
        id: "",
        handle: "",
        name: "",
        email: "",
        slotId: "",
        bookingId: "",
        currentlyEditing: false,
      });
    }
  };

  const handleNewFriend = (
    e: ChangeEvent<HTMLInputElement>,
    friend: InviteFriend
  ) => {
    const friendsCopy = [...friends];
    friendsCopy.forEach((frnd) => {
      if (frnd.slotId == friend.slotId) {
        frnd.name = e.target.value;
        if (e.target.value == "") {
          frnd.id = "";
          frnd.handle = "";
          frnd.name = "";
          frnd.email = "";
        }
      }
    });

    setFriends(friendsCopy);
    setNewFriend({
      id: "",
      handle: "",
      name: e.target.value,
      email: "",
      slotId: friend.slotId,
      bookingId: "",
      currentlyEditing: false,
    });
    setIsInviteVisible(true);
  };

  const save = async () => {
    if (!selectedTeeTime) {
      toast.error("Tee time not selected");
      return;
    }

    if (updateNames.isLoading) return;
    let resultantData: InviteFriend[] = [];
    selectedTeeTime.map((el) => {
      friends.forEach((fd) => {
        if (!fd.slotId) {
          fd.slotId = el.slotId;
          fd.name = fd.name == "" ? "Guest" : fd.name;
        }
        fd.bookingId = bookingData?.bookingIds?.[0] || "";
        fd.handle = fd.handle ? fd.handle : "";
        fd.name = fd.name == "" ? "Guest" : fd.name;
      });
    });

    resultantData = friends;

    try {
      await updateNames.mutateAsync({
        usersToUpdate: resultantData,
        bookingId: bookingData?.bookingIds?.[0] || "",
      });
      toast.success("Tee time listing updated successfully");
      await refetch();
    } catch (error) {
      toast.error(
        (error as Error)?.message ?? "An error occurred managing tee time"
      );
    }
  };

  if (!user) return null;

  if (!bookingData?.connectedUserIsOwner) return null;
  return (
    course?.supportsPlayerNameChange && (
      <div
        className={`flex w-full flex-col  ${isConfirmationPage
          ? "bg-secondary-white bg-white gap-4"
          : "bg-white gap-4"
          } md:rounded-xl`}
      >
        <div
          className={`flex px-4 py-3 md:px-6 md:pr-4 ${isConfirmationPage
            ? "justify-center border-b stroke"
            : "border-b stroke"
            }`}
        >
          <div
            className={`text-lg font-semibold ${isConfirmationPage ? "justify-center" : ""
              }`}
          >
            {isConfirmationPage
              ? "Tee Time Player information"
              : "Invite friends to your tee time"}
          </div>
        </div>
        <div className="flex max-w-full flex-col gap-2 overflow-auto px-4 pb-2 text-[0.875rem] md:px-6 md:pb-3">
          <div className={`flex flex-col gap-2 pb-6 text-center items-center`}>
            <label
              htmlFor="friends"
              className="text-[1rem] text-primary-gray md:text-[1.125rem]"
            >
              Add/edit invited friends
            </label>
            {friends.length
              ? friends.map((friend, index) => {
                return (
                  <div
                    key={friend.slotId}
                    className="w-full max-w-[25rem] rounded-lg"
                  >
                    {!friend.currentlyEditing ? (
                      <div className="mx-auto w-full rounded-lg bg-secondary-white px-4 py-1 flex justify-between text-[1rem] font-semibold outline-none">
                        <div style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}>{index === 0 ? "You" : friend.name}</div>
                        {index !== 0 && course?.supportsPlayerNameChange ? (
                          <button onClick={() => removeFriend(friend.slotId)}>
                            <Edit className="w-[1.25rem]" />
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <>
                        <input
                          value={friend.name}
                          type="search"
                          list="searchedFriends"
                          onChange={(e) => handleNewFriend(e, friend)}
                          onSelect={addFriend}
                          placeholder="Username or email"
                          className="mx-auto w-full max-w-[25rem] rounded-lg bg-secondary-white px-4 py-2 flex justify-between text-[0.875rem] font-semibold outline-none"
                          data-testid="search-friend-id"
                        />
                        {friend.slotId === newFriend.slotId &&
                          friendList?.length ? (
                          <div className="mx-auto w-full max-w-[25rem] rounded-lg py-2 flex justify-between text-[0.875rem] font-semibold outline-none">
                            <ul className="w-full text-opacity-100 text-gray-700 shadow-md border border-solid border-gray-200 rounded-8 text-start">
                              {friendList?.map((frnd, idx) => (
                                <li key={idx}>
                                  <div
                                    className="cursor-pointer p-4 border-b border-solid border-gray-300"
                                    onClick={() =>
                                      addFriendUpdated(
                                        {
                                          ...frnd,
                                          slotId: friend.slotId,
                                        },
                                        index
                                      )
                                    }
                                  >
                                    {frnd.email} ({frnd.handle})
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {friend.slotId === newFriend.slotId &&
                          debouncedValue.name.length > 0 &&
                          !isLoading &&
                          !friendList.length && (
                            <div className="flex justify-center items-center flex-col gap-1 rounded-md w-full mx-auto max-w-[25rem]">
                              {(!inviteSuccess[friend.slotId] ||
                                isInviteVisible) && (
                                  <>
                                    <div className="flex justify-center gap-4 mt-2 items-center w-full fade-in">
                                      Friend not found. Invite them!
                                      <FilledButton
                                        className={`w-full !max-w-fit ${invite.isLoading ? "animate-pulse" : ""
                                          }`}
                                        onClick={() =>
                                          handleInviteFriend(friend, index)
                                        }
                                        data-testid="invite-button-id"
                                      >
                                        {invite.isLoading
                                          ? "Inviting..."
                                          : "Invite"}
                                      </FilledButton>
                                    </div>
                                  </>
                                )}
                            </div>
                          )}
                      </>
                    )}
                  </div>
                );
              })
              : null}
          </div>

          <div className="flex flex-col gap-2 w-full mx-auto max-w-[25rem]">
            <FilledButton
              onClick={() => void save()}
              data-testid="save-button-id"
              className={`w-full ${updateNames.isLoading || invite.isLoading
                ? "!border-gray-200 !bg-gray-200"
                : ""
                }`}
              disabled={updateNames.isLoading || invite.isLoading}
            >
              Save
            </FilledButton>
          </div>
        </div>
      </div>
    )
  );
};
