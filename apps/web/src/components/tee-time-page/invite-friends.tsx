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
  const { user } = useUserContext();
  const selectedTeeTime: InviteFriend[] = bookingData?.bookings || [];

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
        setNewFriend({
          id: "",
          handle: "",
          name: "",
          email: "",
          slotId: "",
          bookingId: "",
          currentlyEditing: false,
        });
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

  const addFriendUpdated = (friendToFind: InviteFriend) => {
    const friendsCopy = [...friends];
    friendsCopy.forEach((friend) => {
      if (friend.slotId == friendToFind.slotId) {
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
    });
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
  };

  const save = async () => {
    if (!selectedTeeTime) {
      toast.error("Tee time not selected");
      return;
    }
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
      await refetch();
      toast.success("Tee time listing updated successfully");
    } catch (error) {
      toast.error(
        (error as Error)?.message ?? "An error occurred managing tee time"
      );
    }
  };

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
        {friends.length
          ? friends.map((friend, index) => {
              return (
                <>
                  {!friend.currentlyEditing ? (
                    <div
                      key={friend.slotId}
                      className="mx-auto w-full max-w-[400px] rounded-lg bg-secondary-white px-4 py-1 flex justify-between text-[16px] font-semibold outline-none"
                    >
                      <div>{index === 0 ? "You" : friend.name}</div>
                      {index !== 0 ? (
                        <button
                          onClick={() => {
                            removeFriend(friend.slotId);
                          }}
                          data-testid="remove-friend-button-id"
                        >
                          {!friend.currentlyEditing ? (
                            <Edit className="w-[20px]" />
                          ) : (
                            <Close className="w-[20px]" />
                          )}
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <>
                      <input
                        value={friend.name}
                        type="search"
                        list="searchedFriends"
                        onChange={(e) => {
                          handleNewFriend(e, friend);
                        }}
                        onSelect={addFriend}
                        placeholder="Username or email"
                        className="mx-auto w-full max-w-[400px] rounded-lg bg-secondary-white px-4 py-2 flex justify-between text-[14px] font-semibold outline-none"
                        data-testid="search-friend-id"
                      />
                      {friend.slotId == newFriend.slotId ? (
                        <div className="mx-auto w-full max-w-[400px] rounded-lg py-2 flex justify-between text-[14px] font-semibold outline-none rounded-8 ">
                          {friendList.length ? (
                            <ul className="w-full text-opacity-100 text-gray-700 shadow-md border border-solid border-gray-200 rounded-8 text-start">
                              {friendList?.map((frnd, idx) => (
                                // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
                                <li
                                  className="cursor-pointer p-4 border-b border-solid border-gray-300"
                                  onClick={() => {
                                    addFriendUpdated({
                                      ...frnd,
                                      slotId: friend.slotId,
                                    });
                                  }}
                                  key={idx}
                                >
                                  {frnd.email} ({frnd.handle})
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      ) : null}

                      {!isLoading &&
                      friendList?.length === 0 &&
                      debouncedValue.name.length > 0 ? (
                        <div className="flex justify-center items-center flex-col gap-1 rounded-md w-full mx-auto max-w-[400px]">
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
                                  className="mx-auto w-full max-w-[400px] rounded-lg bg-secondary-white px-4 py-2 flex justify-between text-[14px] font-semibold outline-none"
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
                </>
              );
            })
          : null}

        <div className="flex flex-col gap-2 w-full mx-auto max-w-[400px]">
          <FilledButton
            onClick={() => void save()}
            data-testid="save-button-id"
          >
            Save
          </FilledButton>
        </div>
      </div>
    </div>
  );
};
