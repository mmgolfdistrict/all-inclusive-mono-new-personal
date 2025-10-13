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
import { useRouter } from "next/navigation";
import { OutlineButton } from "../buttons/outline-button";
import { useAppContext } from "~/contexts/AppContext";

export const InviteFriends = ({
  teeTimeId,
  isConfirmationPage,
  groupId,
  bookingId,
}: {
  teeTimeId: string;
  isConfirmationPage?: boolean;
  groupId?: string;
  bookingId?: string,
}) => {
  const isGroupBooking = teeTimeId?.includes(",");
  const router = useRouter();
  const { entity } = useAppContext();
  const {
    data: bookingData,
    isLoading: isLoadingBookingData,
    refetch,
  } = api.user.getBookingsOwnedForTeeTime.useQuery(
    { teeTimeId, bookingId },
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
    emailOrPhoneNumber: "",
    currentlyEditing: false,
  });
  const debouncedValue = useDebounce<InviteFriend>(newFriend, 500);
  const { data, isLoading } = api.searchRouter.searchUsers.useQuery(
    { searchText: debouncedValue.name },
    { enabled: debouncedValue?.name?.length > 0 }
  );

  const [friends, setFriends] = useState<InviteFriend[]>([]);
  const visibleFriends = isGroupBooking ? friends.slice(0, 4) : friends;
  const invite = api.user.inviteUsers.useMutation();
  const updateNames = api.teeBox.updateNamesOnBookings.useMutation();

  const friendList = useMemo(() => {
    if (!data) return [];
    return data as InviteFriend[];
  }, [data]);

  useEffect(() => {
    if (!bookingData?.bookings || isLoadingBookingData) return;

    setFriends(() => bookingData?.bookings as InviteFriend[]);
  }, [bookingData, isLoadingBookingData]);

  const addFriendUpdated = (
    friendToFind: InviteFriend
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
  }

  const save = async () => {
    if (!selectedTeeTime) {
      toast.error("Tee time not selected");
      return;
    }

    if (updateNames.isLoading) return;
    let resultantData: InviteFriend[] = [];

    selectedTeeTime.forEach((el, index) => {
      friends.forEach((fd) => {
        if (!fd.slotId) {
          fd.slotId = el.slotId;

          if (index === 0) {
            fd.name = user?.name || "Guest";
          } else {
            fd.name = fd.name === "" ? "Guest" : fd.name;
          }
        }

        // Detect if it's a manually typed entry (no id/handle originally)
        const isTypedEntry = !fd.id && !fd.handle;

        if (isTypedEntry) {
          fd.id = "";
          fd.handle = "";
        } else {
          fd.bookingId = bookingData?.bookingIds?.[0] || "";
          fd.handle = fd.handle || "";
        }

        if (fd.name === "") {
          fd.name = "Guest";
        }
      });
    });

    resultantData = friends;


    try {
      // NEW: Call inviteUsers API for all friends that have email/phone
      const invitesPayload = friends
        .filter((f) => f.emailOrPhoneNumber && f.slotId) // only send valid invites
        .map((f) => ({
          emailOrPhoneNumber: f.email,
          teeTimeId: teeTimeId,
          bookingSlotId: f.slotId,
          slotPosition: parseInt(f.slotId?.match(/\d(?=\D*$)/)?.[0] || "0", 10),
        }));

      if (invitesPayload.length > 0) {
        await invite.mutateAsync({
          invites: invitesPayload,
          redirectHref: match[0],
          courseId: course?.id,
          color1: entity?.color1
        });
      }
      // Update names   
      await updateNames.mutateAsync({
        usersToUpdate: resultantData,
        bookingId: bookingData?.bookingIds?.[0] || "",
      });
      toast.success("Tee time listing updated successfully"
        , {
          progressStyle: {
            background: entity?.color1,
          },
        }
      );
      // await refetch();
    } catch (error) {
      toast.error(
        (error as Error)?.message ?? "An error occurred managing tee time"
      );
    }
  };

  if (!user) return null;

  if (!bookingData?.connectedUserIsOwner) return null;

  function handleNavigationForInvitePlayers() {
    router.replace(`/${course?.id}/my-tee-box?section=owned&groupId=${groupId}`);
  }

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
              className="text-base text-primary-gray md:text-lg"
            >
              Add/edit invited friends
            </label>

            {
              visibleFriends.length > 0 &&
              visibleFriends.map((friend, index) => (
                <div key={friend.slotId} className="w-full max-w-[25rem] rounded-lg">
                  <div className="relative">
                    <input
                      type="text"
                      value={index === 0 ? "You" : (friend.name || friend.emailOrPhoneNumber || "")}
                      onFocus={(e: ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value;
                        setFriends(prev =>
                          prev.map(f =>
                            f.slotId === friend.slotId
                              ? { ...f, emailOrPhoneNumber: value }
                              : f
                          )
                        );
                      }}
                      onChange={(e) => {
                        const value = e.target.value;

                        setFriends(prev =>
                          prev.map(f =>
                            f.slotId === friend.slotId
                              ? {
                                ...f,
                                email: value,
                                emailOrPhoneNumber: value,
                                name: value
                              }
                              : f
                          )
                        );

                        if (value.trim().length > 1) {
                          setNewFriend({
                            ...friend,
                            slotId: friend.slotId,
                          });
                        }
                        else {
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
                        }
                      }}
                      placeholder="Enter username, email, or phone"
                      className="mx-auto w-full max-w-[25rem] rounded-lg bg-secondary-white px-4 py-2 text-sm font-semibold outline-none"
                      data-testid={`search-friend-${friend.slotId}`}
                      disabled={index === 0}
                    />

                    {/* Friend search dropdown */}
                    {friendList.length > 0 &&
                      friend.slotId === newFriend.slotId &&
                      newFriend.email?.trim() !== "" && (
                        <ul className="absolute z-10 w-full bg-white shadow-md rounded-lg mt-1">
                          {friendList.map((frnd, idx) => (
                            <li key={idx} className="border-b last:border-b-0">
                              <div
                                className="cursor-pointer p-3 hover:bg-gray-100"
                                onMouseDown={() =>
                                  addFriendUpdated(
                                    {
                                      ...frnd,
                                      slotId: friend.slotId,
                                    }
                                  )
                                }
                              >
                                {frnd.email} ({frnd.handle})
                              </div>
                            </li>
                          ))}
                        </ul>
                      )
                    }
                  </div>
                </div>
              ))}
          </div>

          <div className="flex flex-col gap-2 w-full mx-auto max-w-[25rem]">
            <FilledButton
              onClick={() => void save()}
              data-testid="save-button-id"
              className={`w-full text-[16px] ${updateNames.isLoading || invite.isLoading
                ? "!border-gray-200 !bg-gray-200"
                : ""
                }`}
              disabled={updateNames.isLoading || invite.isLoading}
            >
              Save
            </FilledButton>
          </div>

          {isGroupBooking && isConfirmationPage && friends.length > 4 && (
            <div className="flex flex-col gap-2 w-full mx-auto max-w-[25rem]">
              <OutlineButton
                onClick={() => handleNavigationForInvitePlayers()}
                className="w-full text-[16px]">Manage Invites</OutlineButton>
            </div>
          )}

        </div >
      </div >
    )
  );
};
