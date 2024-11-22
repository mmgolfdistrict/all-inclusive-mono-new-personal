import { useCourseContext } from "~/contexts/CourseContext";
import { useSidebar } from "~/hooks/useSidebar";
import { api } from "~/utils/api";
import { formatMoney, formatTime } from "~/utils/formatters";
import { type InviteFriend } from "~/utils/types";
import {
  useEffect,
  useMemo,
  // useMemo,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import { toast } from "react-toastify";
import { useDebounce } from "usehooks-ts";
import { Avatar } from "../avatar";
import { FilledButton } from "../buttons/filled-button";
import { OutlineButton } from "../buttons/outline-button";
import { Close } from "../icons/close";
import { Edit } from "../icons/edit";
import { Info } from "../icons/info";
import { Players } from "../icons/players";
import { Tooltip } from "../tooltip";
import { type OwnedTeeTime } from "./owned";

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
  const { course } = useCourseContext();
  const [minimumOfferPrice, setMinimumOfferPrice] = useState<number>(0);
  const [friends, setFriends] = useState<InviteFriend[]>([]);
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
  const [inviteFriend, setInviteFriend] = useState<string>("");
  const [inviteSucess, setInviteSucess] = useState<boolean>(false);

  const invite = api.user.inviteUser.useMutation();

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

  const { toggleSidebar } = useSidebar({
    isOpen: isManageOwnedTeeTimeOpen,
    setIsOpen: setIsManageOwnedTeeTimeOpen,
  });

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
      });
      setInviteFriend("");
      setInviteSucess(false);
    }
  }, [isManageOwnedTeeTimeOpen, selectedTeeTime]);

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

  console.log("friends,", friends);
  const save = async () => {
    if (!selectedTeeTime) {
      toast.error("Tee time not selected");
      return;
    }

    // if (!updateNames.data?.success) {
    //   toast.error(updateNames.data?.message);
    //   return;
    // }

    if (updateNames.isLoading || updateMinimumOfferPrice.isLoading) return;

    selectedTeeTime.golfers.map((el) => {
      friends.forEach((fd) => {
        if (!fd.slotId) {
          fd.slotId = el.slotId;
          fd.name = fd.name == "" ? "Guest" : fd.name;
        }
        fd.bookingId = selectedTeeTime.bookingIds[0] || "";
        fd.handle = fd.handle ? fd.handle : "";
        fd.name = fd.name == "" ? "Guest" : fd.name;
      });
    });

    //  if(newFriend.name.length){
    //   selectedTeeTime.golfers=[...friends,newFriend];
    //  }else{
    //   selectedTeeTime.golfers=friends;
    //  }
    selectedTeeTime.golfers = friends;

    try {
      await updateNames.mutateAsync({
        usersToUpdate: selectedTeeTime.golfers,
        bookingId: selectedTeeTime.bookingIds[0] || "",
      });
      await updateMinimumOfferPrice.mutateAsync({
        teeTimeId: selectedTeeTime?.teeTimeId,
        minimumOfferPrice,
      });
      await refetch();
      toast.success("Tee time listing updated successfully");
      setIsManageOwnedTeeTimeOpen(false);
    } catch (error) {
      toast.error(
        (error as Error)?.message ?? "An error occurred managing tee time"
      );
    }
  };

  const removeFriend = (slotId: string) => {
    // const newFriends = [...friends];
    // let y:InviteFriend[]=newFriends.splice(index, 1);
    // const slotIdOfRemoved=y.length?y[0]?.slotId:""
    // setNewFriend({...newFriend,slotId:slotIdOfRemoved||""})
    // setFriends(newFriends);
    const newFriends: InviteFriend[] = JSON.parse(JSON.stringify(friends));

    newFriends.forEach((friend) => {
      if (friend.slotId == slotId) {
        friend.currentlyEditing = true;
      }
    });
    setNewFriend({ ...newFriend, name: "", slotId: slotId });
    setFriends(newFriends);
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

    // }
    // if (selectedFriend) {
    //   setFriends((prev) => [...prev, selectedFriend]);
    //   setNewFriend({
    //     id: "",
    //     handle: "",
    //     name: "",
    //     email: "",
    //     slotId: "",
    //     bookingId: "",
    //     currentlyEditing:false
    //   });
    // }
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

  return (
    <>
      {isManageOwnedTeeTimeOpen && (
        <div
          className={`fixed left-0 top-0 z-20 h-[100dvh] w-screen backdrop-blur `}
        >
          <div className="h-screen bg-[#00000099]" />
        </div>
      )}
      <aside
        // ref={sidebar}
        className={`!duration-400 fixed right-0 top-1/2 z-20 flex h-[90dvh] w-[80vw] -translate-y-1/2 flex-col overflow-y-hidden border border-stroke bg-white shadow-lg transition-all ease-linear sm:w-[500px] md:h-[100dvh] ${
          isManageOwnedTeeTimeOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between p-4">
            <div className="text-lg">Manage Owned Tee Time</div>

            <button
              // ref={trigger}
              onClick={toggleSidebar}
              aria-controls="sidebar"
              aria-expanded={isManageOwnedTeeTimeOpen}
              className="z-[2]"
              aria-label="sidebarToggle"
              data-testid="close-button-id"
            >
              <Close className="h-[25px] w-[25px]" />
            </button>
          </div>
          <div className="flex h-full flex-col justify-between overflow-y-auto">
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
                    className="text-[16px] text-primary-gray md:text-[18px]"
                  >
                    Minimum offer price per golfer
                  </label>
                  <div className="relative">
                    <span className="absolute left-1 top-1 text-[24px] md:text-[32px]">
                      $
                    </span>
                    <input
                      value={minimumOfferPrice?.toString()?.replace(/^0+/, "")}
                      type="number"
                      onFocus={handleFocus}
                      onChange={handleMinimumOfferPrice}
                      onBlur={handleBlur}
                      className="mx-auto max-w-[300px] rounded-lg bg-secondary-white px-4 py-1 text-center text-[24px] font-semibold outline-none md:text-[32px]"
                      data-testid="minimum-offer-price-id"
                    />
                  </div>
                </div>
              ) : null}

              <div className={`flex flex-col gap-2 pb-6 text-center`}>
                <label
                  htmlFor="friends"
                  className="text-[16px] text-primary-gray md:text-[18px]"
                >
                  Add/edit invited friends
                </label>

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
                              {index !== 0 &&
                              course?.supportsPlayerNameChange ? (
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
                                      {friendList.map((frnd, idx) => (
                                        <li key={idx}>
                                          <div
                                            className="cursor-pointer p-4 border-b border-solid border-gray-300"
                                            onClick={() => {
                                              addFriendUpdated({
                                                ...frnd,
                                                slotId: friend.slotId,
                                              });
                                            }}
                                          >
                                            {frnd.email} ({frnd.handle})
                                          </div>
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
                                            invite.isLoading
                                              ? "animate-pulse"
                                              : ""
                                          }`}
                                          onClick={inviteFriendCall}
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
                              ) : null}
                            </>
                          )}
                        </>
                      );
                    })
                  : null}
              </div>
            </div>
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
                        trigger={<Info className="h-[14px] w-[14px]" />}
                        content="This fee ensures ongoing enhancements to our service, ultimately offering golfers the best access to booking tee times"
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
              <p className="mt-4 mb-2 text-[14px] text-primary-gray md:text-[16px] font-semibold text-left">
                Tip: If you know you can’t make your time, the earlier you can
                list, the greater the chance it sells.
              </p>
              <div className="text-center text-[14px] font-[300] text-primary-gray">
                All sales are final.
              </div>
              <div className="flex flex-col gap-2">
                <FilledButton
                  className="w-full"
                  onClick={() => void save()}
                  data-testid="save-button-id"
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
          </div>
        </div>
      </aside>
    </>
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
          <div className="whitespace-nowrap text-secondary-black">
            {courseName}
          </div>
          <div className="text-primary-gray">
            {formatTime(courseDate, false, timezoneCorrection)}
          </div>
        </div>
      </div>
      <div className="flex gap-4 text-[14px]">
        <div className="w-[40px] ">
          <Players className="ml-auto w-[30px]" />
        </div>
        {golferCount} {golferCount === 1 ? "golfer" : "golfers"}
      </div>
      <div className="flex text-[14px] font-[300]">
        <div className="w-[55px]" />
        <div className="text-prmiary-gray">
          You purchased for{" "}
          <span className="font-semibold text-secondary-black">
            {formatMoney(purchasedFor)}
          </span>
        </div>
      </div>
      {sensiblePurchasedFor !== undefined && sensiblePurchasedFor !== 0 && (
        <div className="flex text-[14px] font-[300]">
          <div className="w-[55px]" />
          <div className="text-prmiary-gray">
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
