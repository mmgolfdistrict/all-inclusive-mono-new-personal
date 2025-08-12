import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import { formatMoney, formatTime } from "~/utils/formatters";
import { type InviteFriend } from "~/utils/types";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import { toast } from "react-toastify";
import { useDebounce, useMediaQuery } from "usehooks-ts";
import { Avatar } from "../avatar";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Edit } from "../icons/edit";
import { Info } from "../icons/info";
import { Players } from "../icons/players";
import { Tooltip } from "../tooltip";
import { type OwnedTeeTime } from "./owned";
import Flyout from "../modal/flyout";
import { Modal } from "../modal/modal";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserContext } from "~/contexts/UserContext";

type SideBarProps = {
  isManageOwnedTeeTimeOpen: boolean;
  setIsManageOwnedTeeTimeOpen: Dispatch<SetStateAction<boolean>>;
  selectedTeeTime: OwnedTeeTime | undefined;
  refetch: () => Promise<unknown>;
};

export const ManageOwnedTeeTime = ({
  isManageOwnedTeeTimeOpen,
  setIsManageOwnedTeeTimeOpen,
  selectedTeeTime,
  refetch,
}: SideBarProps) => {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const params = useSearchParams();
  const ManageOwnedTeeTimeDetail = ({
    setIsManageOwnedTeeTimeOpen,
    selectedTeeTime,
    refetch
  }: Omit<SideBarProps, "isManageOwnedTeeTimeOpen">) => {

    const { course } = useCourseContext();
    const { user } = useUserContext();
    console.log("course", user);
    const [minimumOfferPrice, setMinimumOfferPrice] = useState<number>(0);
    const [friends, setFriends] = useState<InviteFriend[]>([]);
    const [friendLists, setFriendList] = useState<InviteFriend[]>([]);
    // const [isInviteVisible, setIsInviteVisible] = useState(false);
    const [newFriend, setNewFriend] = useState<InviteFriend>({
      id: "",
      handle: "",
      name: "",
      email: "",
      slotId: "",
      bookingId: "",
      currentlyEditing: false,
      emailOrPhoneNumber: "",
    });
    const debouncedValue = useDebounce<InviteFriend>(newFriend, 500);

    const friendsRef = useRef(friends);
    useEffect(() => {
      friendsRef.current = friends;
    }, [friends]);

    const [inviteSuccess, setInviteSuccess] = useState<Record<string, boolean>>(
      {}
    );
    console.log("friends", friends);
    const href = window.location.href;
    const redirectHref =
      (href.includes("/my-tee-box")
        ? href.split("/my-tee-box")[0]
        : href.match(/^(https?:\/\/[^/]+\/[0-9A-Fa-f-]+)/)?.[0]) || "";

    // const handleInviteFriend = async (friend: InviteFriend, index: number) => {
    //   if (invite.isLoading) return;

    //   const bookingSlotId = friend?.slotId;
    //   const match = friend?.slotId.match(/\d(?=\D*$)/);
    //   const lastDigit = match ? match[0] : null;

    //   const teeTimeIds = selectedTeeTime?.teeTimeId.split(",") || [];
    //   const teeTimeIdForFriend = teeTimeIds[Math.floor(index / 4)];

    //   try {
    //     await invite.mutateAsync({
    //       invites: [
    //         {
    //           emailOrPhoneNumber: friend.name || "",
    //           teeTimeId: teeTimeIdForFriend || "",
    //           bookingSlotId,
    //           slotPosition: lastDigit ? parseInt(lastDigit, 10) : 0,
    //         }
    //       ],
    //       redirectHref: redirectHref,
    //     });

    //     setFriends((prevFriends) =>
    //       prevFriends.map((f, idx) =>
    //         idx === index ? { ...f, name: friend.name } : f
    //       )
    //     );

    //     setInviteSuccess((prev) => ({ ...prev, [friend.slotId]: true }));
    //     setIsInviteVisible(false);
    //     toast.success("Invitation sent successfully.");
    //   } catch (error) {
    //     setFriends((prev) =>
    //       prev.map((f) =>
    //         f.slotId === bookingSlotId
    //           ? { ...f, name: "", email: "", handle: "", id: "", currentlyEditing: true }
    //           : f
    //       )
    //     );
    //     setNewFriend({
    //       id: "",
    //       handle: "",
    //       name: "",
    //       email: "",
    //       slotId: bookingSlotId,
    //       bookingId: "",
    //       currentlyEditing: true,
    //     });
    //     toast.error((error as Error)?.message ?? "An error occurred inviting friend.");
    //   }
    // };

    const invite = api.user.inviteUsers.useMutation();

    const { data, isLoading } = api.searchRouter.searchUsers.useQuery(
      { searchText: debouncedValue.name },
      { enabled: debouncedValue?.name?.length > 0 }
    );

    const updateNames = api.teeBox.updateNamesOnBookings.useMutation();
    const updateMinimumOfferPrice = api.teeBox.setMinimumOfferPrice.useMutation();

    const maxFriends = useMemo(() => {
      if (!selectedTeeTime) return 0;
      return selectedTeeTime?.bookingIds.length;
    }, [selectedTeeTime?.bookingIds]);

    const friendList = useMemo(() => {
      if (!data) return [];
      return data as InviteFriend[];
    }, [data]);

    useEffect(() => {
      if (selectedTeeTime) {
        const friendsToSet = selectedTeeTime.golfers;
        friendsToSet.forEach((friend) => {
          friend.currentlyEditing = false;
        });
        setFriends(selectedTeeTime.golfers);
        setMinimumOfferPrice(
          selectedTeeTime.minimumOfferPrice > 0
            ? selectedTeeTime.minimumOfferPrice
            : selectedTeeTime.firstHandPrice
        );
      }
    }, [selectedTeeTime, isManageOwnedTeeTimeOpen]);

    useEffect(() => {
      if (isManageOwnedTeeTimeOpen) {
        document.body.classList.add("overflow-hidden");
      } else {
        document.body.classList.remove("overflow-hidden");
        setMinimumOfferPrice(
          selectedTeeTime?.minimumOfferPrice ||
          selectedTeeTime?.firstHandPrice ||
          0
        ); //reset price
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
    }, [isManageOwnedTeeTimeOpen, selectedTeeTime, inviteSuccess]);

    const handleFocus = () => {
      if (!minimumOfferPrice) setMinimumOfferPrice(0);
    };

    const handleBlur = () => {
      if (!minimumOfferPrice) setMinimumOfferPrice(0);
    };

    const handleMinimumOfferPrice = (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/[$,]/g, "");

      const decimals = value.split(".")[1];
      if (decimals && decimals?.length > 2) return;

      const strippedLeadingZeros = value.replace(/^0+/, "");

      setMinimumOfferPrice(Number(strippedLeadingZeros));
    };

    const totalPayout = useMemo(() => {
      return Math.abs(minimumOfferPrice * friends.length - 45);
    }, [minimumOfferPrice, friends]);

    const save = async () => {
      if (!selectedTeeTime) {
        toast.error("Tee time not selected");
        return;
      }

      const latestFriends = friendsRef.current;
      selectedTeeTime.golfers = latestFriends;

      if (updateNames.isLoading || updateMinimumOfferPrice.isLoading) return;

      // Prepare friends list
      selectedTeeTime.golfers.map((el, index) => {
        friends.forEach((fd) => {
          if (!fd.slotId) {
            fd.slotId = el.slotId;

            if (index === 0) {
              // First slot — use logged in user's name
              fd.name = user?.name || "Guest";
            } else {
              fd.name = fd.name === "" ? "Guest" : fd.name;
            }
          }

          fd.bookingId = selectedTeeTime.bookingIds[0] || "";
          fd.handle = fd.handle || "";

          // Reapply default name if still blank
          if (fd.name === "") {
            fd.name = "Guest";
          }
        });
      });


      selectedTeeTime.golfers = friends;

      try {
        // NEW: Call inviteUsers API for all friends that have email/phone
        const invitesPayload = friends
          .filter((f) => f.emailOrPhoneNumber && f.slotId) // only send valid invites
          .map((f) => ({
            emailOrPhoneNumber: f.emailOrPhoneNumber!,
            teeTimeId: selectedTeeTime.teeTimeId,
            bookingSlotId: f.slotId,
            slotPosition: parseInt(f.slotId?.match(/\d(?=\D*$)/)?.[0] || "0", 10),
          }));

        if (invitesPayload.length > 0) {
          await invite.mutateAsync({
            invites: invitesPayload,
            redirectHref: redirectHref,
          });
        }

        // Update names
        await updateNames.mutateAsync({
          usersToUpdate: selectedTeeTime.golfers,
          bookingId: selectedTeeTime.bookingIds[0] || "",
        });

        // Update min offer price
        await updateMinimumOfferPrice.mutateAsync({
          teeTimeId: selectedTeeTime?.teeTimeId,
          minimumOfferPrice,
        });

        toast.success("Tee time listing updated successfully");
        if (params.get("groupId")) {
          router.replace(`/${course?.id}/my-tee-box?section=owned`);
        }

        await refetch();
        setIsManageOwnedTeeTimeOpen(false);
      } catch (error) {
        toast.error(
          (error as Error)?.message ?? "An error occurred managing tee time"
        );
      }
    };

    // const removeFriend = (slotId: string) => {
    //   const newFriends: InviteFriend[] = JSON.parse(JSON.stringify(friends));

    //   newFriends.forEach((friend) => {
    //     if (friend.slotId == slotId) {
    //       friend.currentlyEditing = true;
    //     }
    //   });
    //   setNewFriend({ ...newFriend, name: "", slotId: slotId });
    //   setFriends(newFriends);
    // };

    // const addFriend = (e: ChangeEvent<HTMLInputElement>) => {
    //   if (friends?.length + 1 > maxFriends) return;
    //   const selectedFriend = friendList?.find(
    //     (friend) => `${friend.email} (${friend.handle})` === e.target.value
    //   );
    //   if (selectedFriend) {
    //     selectedFriend.slotId = newFriend.slotId;
    //   }
    //   if (selectedFriend) {
    //     setFriends((prev) => [...prev, selectedFriend]);
    //     setNewFriend({
    //       id: "",
    //       handle: "",
    //       name: "",
    //       email: "",
    //       slotId: "",
    //       bookingId: "",
    //       currentlyEditing: false,
    //       emailOrPhoneNumber: "",
    //     });
    //   }
    // };

    const addFriendUpdated = async (
      friendToFind: InviteFriend,
      index: number
    ) => {
      const friendsCopy = [...friends];
      const currentSlotId = friendToFind.slotId;

      friendsCopy.forEach((friend) => {
        if (friend.slotId == currentSlotId) {
          friend.email = friendToFind.email;
          friend.name = friendToFind.name;
          friend.handle = friendToFind.handle;
          friend.id = friendToFind.id;
          friend.currentlyEditing = false;
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

      // const bookingSlotId = selectedTeeTime?.golfers[index]?.slotId || "";
      // const match = bookingSlotId.match(/\d(?=\D*$)/);
      // const lastDigit = match ? match[0] : null;

      // try {
      //   await invite.mutateAsync({
      //     invites: [
      //       {
      //         emailOrPhoneNumber: friendToFind.emailOrPhoneNumber || "",
      //         teeTimeId: selectedTeeTime?.teeTimeId || "",
      //         bookingSlotId,
      //         slotPosition: lastDigit ? parseInt(lastDigit, 10) : 0,
      //       }
      //     ],
      //     redirectHref: redirectHref,
      //   });

      //   setInviteSuccess((prev) => ({ ...prev, [bookingSlotId]: true }));
      //   toast.success("Invitation sent successfully.");
      // } catch (error) {
      //   setFriends((prev) =>
      //     prev.map((f) =>
      //       f.slotId === friendToFind.slotId
      //         ? { ...f, name: "", email: "", handle: "", id: "", currentlyEditing: true }
      //         : f
      //     )
      //   );

      //   setNewFriend({
      //     id: "",
      //     handle: "",
      //     name: "",
      //     email: "",
      //     slotId: friendToFind.slotId,
      //     bookingId: "",
      //     currentlyEditing: true,
      //   });
      //   toast.error((error as Error)?.message ?? "An error occurred inviting friend.");
      // }
    };


    // const handleNewFriend = (
    //   e: ChangeEvent<HTMLInputElement>,
    //   friend: InviteFriend
    // ) => {
    //   const friendsCopy = [...friends];
    //   friendsCopy.forEach((frnd) => {
    //     if (frnd.slotId == friend.slotId) {
    //       frnd.name = e.target.value;
    //       if (e.target.value == "") {
    //         frnd.id = "";
    //         frnd.handle = "";
    //         frnd.name = "";
    //         frnd.email = "";
    //       }
    //     }
    //   });

    //   setFriends(friendsCopy);
    //   setNewFriend({
    //     id: "",
    //     handle: "",
    //     name: e.target.value,
    //     email: "",
    //     slotId: friend.slotId,
    //     bookingId: "",
    //     currentlyEditing: false,
    //     emailOrPhoneNumber: "",
    //   });
    //   setIsInviteVisible(true);
    // };

    return (
      <>
        <div className="flex flex-col gap-6 px-0 sm:px-4">
          <TeeTimeItem
            courseImage={selectedTeeTime?.courseLogo ?? ""}
            courseName={selectedTeeTime?.courseName ?? ""}
            courseDate={selectedTeeTime?.date ?? ""}
            golferCount={selectedTeeTime?.golfers.length ?? 0}
            purchasedFor={
              selectedTeeTime?.purchasedFor ??
              selectedTeeTime?.firstHandPrice ??
              0
            }
            timezoneCorrection={course?.timezoneCorrection}
            sensiblePurchasedFor={selectedTeeTime?.weatherGuaranteeAmount}
          />
          {course?.supportsOffers ? (
            <div
              className={`flex flex-col gap-1 text-center w-fit mx-auto`}
            >
              <label
                htmlFor="minimumOfferPrice"
                className="text-base text-primary-gray md:text-lg"
              >
                Minimum offer price per golfer
              </label>
              <div className="relative">
                <span className="absolute left-1 top-1 text-2xl md:text-4xl">
                  $
                </span>
                <input
                  value={minimumOfferPrice?.toString()?.replace(/^0+/, "")}
                  type="number"
                  onFocus={handleFocus}
                  onChange={handleMinimumOfferPrice}
                  onBlur={handleBlur}
                  className="mx-auto max-w-[18.75rem] rounded-lg bg-secondary-white px-4 py-1 text-center text-2xl font-semibold outline-none md:text-4xl"
                  data-testid="minimum-offer-price-id"
                />
              </div>
            </div>
          ) : null}

          {selectedTeeTime?.isGroupBooking || !course?.supportsPlayerNameChange ? null : (
            <div className="flex flex-col gap-2 pb-6 text-center">
              <label
                htmlFor="friends"
                className="text-base text-primary-gray md:text-lg"
              >
                Add/edit invited friends
              </label>

              {friends.length > 0 &&
                friends.map((friend, index) => (
                  <div key={friend.slotId} className="w-full max-w-[25rem] rounded-lg">
                    <div className="relative">
                      {/* Show "You" for first slot if not editing */}
                      {/* {!friend.currentlyEditing ? (
                        <div className="mx-auto w-full rounded-lg bg-secondary-white px-4 py-1 flex justify-between text-base font-semibold outline-none">
                          <div
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {index === 0 ? "You" : friend.name}
                          </div> */}
                      {/* {index !== 0 && course?.supportsPlayerNameChange ? (
                            <button onClick={() => removeFriend(friend.slotId)}>
                              <Edit className="w-5" />
                            </button>
                          ) : null} */}
                      {/* </div>
                      ) : ( */}
                      <>
                        {/* Editable field */}
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
                                    email: value, // update email since that's what the input is bound to
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
                            } else {
                              setFriendList([]);
                            }
                          }}
                          placeholder="Enter username, email, or phone"
                          className="mx-auto w-full max-w-[25rem] rounded-lg bg-secondary-white px-4 py-2 text-sm font-semibold outline-none"
                          data-testid={`search-friend-${friend.slotId}`}
                          disabled={index === 0}
                        />

                        {/* Friend search dropdown */}
                        {friendList.length > 0 && friend.slotId === newFriend.slotId && newFriend.email?.trim() !== "" && (
                          <ul className="absolute z-10 w-full bg-white shadow-md rounded-lg mt-1">
                            {friendList.map((frnd, idx) => (
                              <li key={idx} className={`border-b last:border-b-0`}>
                                <div
                                  className="cursor-pointer p-3 hover:bg-gray-100"
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
                        )}

                        {/* Invite prompt if no match */}
                        {/* {friend.slotId === newFriend.slotId &&
                            debouncedValue.name.length > 0 &&
                            !isLoading &&
                            friendList.length === 0 && (
                              <div className="flex justify-center items-center flex-col gap-1 rounded-md w-full mx-auto max-w-[25rem] mt-2">
                                {(!inviteSuccess[friend.slotId] || isInviteVisible) && (
                                  <div className="flex justify-center gap-4 mt-2 items-center w-full fade-in">
                                    Friend not found. Invite them!
                                    <FilledButton
                                      className={`w-full !max-w-fit ${invite.isLoading ? "animate-pulse" : ""
                                        }`}
                                      onClick={() => handleInviteFriend(friend, index)}
                                      data-testid={`invite-button-${index}`}
                                    >
                                      {invite.isLoading ? "Inviting..." : "Invite"}
                                    </FilledButton>
                                  </div>
                                )}
                              </div>
                            )} */}
                      </>
                      {/* )} */}
                    </div>
                  </div>
                ))}
            </div>
          )}
          {/* ------------------Group Booking code-------------- */}
          {/* {!selectedTeeTime?.isGroupBooking || !course?.supportsPlayerNameChange ? null : (
            <div className="flex flex-col gap-2 pb-6 text-center">
              <label
                htmlFor="friends"
                className="text-base text-primary-gray md:text-lg"
              >
                Add/edit invited friends
              </label>
              {Array.from({ length: selectedTeeTime?.golfers.length || 1 }).map((_, index) => {
                const friend = friends[index] ?? {
                  id: "",
                  handle: "",
                  name: "",
                  email: "",
                  slotId: `slot-${index}`,
                  bookingId: "",
                  currentlyEditing: true,
                  emailOrPhoneNumber: "",
                };
                return (
                  <div
                    key={friend.slotId}
                    className="w-full max-w-[25rem] rounded-lg"
                  >
                    {!friend.currentlyEditing ? (
                      <div className="mx-auto w-full rounded-lg bg-secondary-white px-4 py-1 flex justify-between text-base font-semibold outline-none">
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {index === 0 ? "You" : friend.name || `Guest`}
                        </div>
                        {index !== 0 && course?.supportsPlayerNameChange ? (
                          <button onClick={() => removeFriend(friend.slotId)}>
                            <Edit className="w-5" />
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <>
                        <input
                          value={friend.name}
                          type="search"
                          list="searchedFriends"
                          onFocus={(e: ChangeEvent<HTMLInputElement>) => {
                            const friendsCopy = [...friends];
                            friendsCopy.forEach((friend) => {
                              if (friend.slotId === newFriend.slotId) {
                                friend.emailOrPhoneNumber = e.target.value;
                              }
                            });
                            setFriends(friendsCopy);
                          }}
                          onChange={(e) => handleNewFriend(e, friend)}
                          onSelect={addFriend}
                          placeholder="Username or email"
                          className="mx-auto w-full max-w-[25rem] rounded-lg bg-secondary-white px-4 py-2 flex justify-between text-sm font-semibold outline-none"
                          data-testid="search-friend-id"
                        />
                        {friend.slotId === newFriend.slotId && friendList.length ? (
                          <div className="mx-auto w-full max-w-[25rem] rounded-lg py-2 flex justify-between text-sm font-semibold outline-none">
                            <ul className="w-full text-opacity-100 text-gray-700 shadow-md border border-solid border-gray-200 rounded-8 text-start">
                              {friendList.map((frnd, idx) => (
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
                        {/* {friend.slotId === newFriend.slotId &&
                          debouncedValue.name.length > 0 &&
                          !isLoading &&
                          !friendList.length && (
                            <div className="flex justify-center items-center flex-col gap-1 rounded-md w-full mx-auto max-w-[25rem]">
                              {(!inviteSuccess[friend.slotId] || isInviteVisible) && (
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
                                    {invite.isLoading ? "Inviting..." : "Invite"}
                                  </FilledButton>
                                </div>
                              )}
                            </div>
                          )} 
        </>
                    )}
      </div >
                );
              })}
            </div >
          )} */}
        </div >
        <div className="flex flex-col gap-4 px-4 pb-6">
          {course?.supportsOffers ? (
            <>
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">
                  Your Listing Price
                </div>
                <div className="text-secondary-black">
                  {formatMoney(minimumOfferPrice * friends.length)}
                </div>
              </div>
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">
                  Service Fee{" "}
                  <Tooltip
                    trigger={<Info className="h-[0.875rem] w-[0.875rem]" />}
                    content={<div className="max-w-[12.5rem] text-sm break-words">This fee ensures ongoing enhancements to our service, ultimately offering golfers the best access to booking tee times</div>}
                  />
                </div>
                <div className="text-secondary-black">
                  {formatMoney(45)}
                </div>
              </div>
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">
                  You Receive after Sale
                </div>
                <div className="text-secondary-black">
                  {formatMoney(totalPayout)}
                </div>
              </div>
            </>
          ) : null}
          <p className="mt-4 mb-2 text-sm text-primary-gray md:text-base font-semibold text-justify">
            Tip: If you know you can’t make your time, the earlier you can
            list, the greater the chance it sells.
          </p>
          <div className="text-center text-sm font-[300] text-primary-gray">
            All sales are final.
          </div>
          <div className="flex flex-col gap-2">
            <FilledButton
              className={`w-full ${updateNames.isLoading ||
                updateMinimumOfferPrice.isLoading ||
                invite.isLoading
                ? "!border-gray-200 !bg-gray-200"
                : ""
                }`}
              onClick={() => void save()}
              data-testid="save-button-id"
              disabled={
                updateNames.isLoading ||
                updateMinimumOfferPrice.isLoading ||
                invite.isLoading
              }
            >
              Save
            </FilledButton>
            <OutlineButton
              onClick={() => setIsManageOwnedTeeTimeOpen(false)}
              data-testid="cancel-button-id"
            >
              Cancel
            </OutlineButton>
          </div>
        </div>
      </>
    );
  };

  return isMobile ? (
    <Modal
      title="Invite Players"
      isOpen={isManageOwnedTeeTimeOpen}
      onClose={() => setIsManageOwnedTeeTimeOpen(false)}
    >
      <ManageOwnedTeeTimeDetail
        setIsManageOwnedTeeTimeOpen={setIsManageOwnedTeeTimeOpen}
        selectedTeeTime={selectedTeeTime}
        refetch={refetch}
      />
    </Modal>
  ) : (
    <Flyout
      title="Invite Players"
      isOpen={isManageOwnedTeeTimeOpen}
      setIsOpen={setIsManageOwnedTeeTimeOpen}
    >
      <ManageOwnedTeeTimeDetail
        setIsManageOwnedTeeTimeOpen={setIsManageOwnedTeeTimeOpen}
        selectedTeeTime={selectedTeeTime}
        refetch={refetch}
      />
    </Flyout>
  );
};

const TeeTimeItem = ({
  courseImage,
  courseName,
  courseDate,
  golferCount,
  purchasedFor,
  timezoneCorrection,
  sensiblePurchasedFor,
}: {
  courseImage: string;
  courseName: string;
  courseDate: string;
  golferCount: number;
  purchasedFor: number;
  timezoneCorrection: number | undefined;
  sensiblePurchasedFor: number | undefined;
}) => {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-secondary-white px-4 py-5">
      <div className="flex items-center gap-4">
        <Avatar src={courseImage} />
        <div className="flex flex-col">
          <div className="whitespace-normal break-words text-secondary-black">
            {courseName}
          </div>
          <div className="text-primary-gray">
            {formatTime(courseDate, false, timezoneCorrection)}
          </div>
        </div>
      </div>
      <div className="flex gap-4 text-sm">
        <div className="w-[2.5rem] ">
          <Players className="ml-auto w-[1.875rem]" />
        </div>
        {golferCount} {golferCount === 1 ? "golfer" : "golfers"}
      </div>
      <div className="flex text-sm font-[300]">
        <div className="w-[3.4375rem]" />
        <div className="text-justify text-prmiary-gray">
          You purchased for{" "}
          <span className="font-semibold text-secondary-black">
            {formatMoney(purchasedFor)}
          </span>
        </div>
      </div>
      {sensiblePurchasedFor !== undefined && sensiblePurchasedFor !== 0 && (
        <div className="flex text-sm font-[300]">
          <div className="w-[3.4375rem]" />
          <div className="text-justify text-prmiary-gray">
            Weather guarantee purchased for{" "}
            <span className="font-semibold text-secondary-black">
              {formatMoney(sensiblePurchasedFor / 100)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
