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
  const [minimumOfferPrice, setMinimumOfferPrice] = useState<number>(200);
  const [friends, setFriends] = useState<InviteFriend[]>([]);
  const [newFriend, setNewFriend] = useState<string>("");
  const debouncedValue = useDebounce<string>(newFriend, 500);
  const [inviteFriend, setInviteFriend] = useState<string>("");
  const [inviteSucess, setInviteSucess] = useState<boolean>(false);

  const invite = api.user.inviteUser.useMutation();

  const { data, isLoading } = api.searchRouter.searchUsers.useQuery(
    { searchText: debouncedValue },
    { enabled: debouncedValue?.length > 0 }
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
      setFriends(selectedTeeTime.golfers as InviteFriend[]);
      setMinimumOfferPrice(
        selectedTeeTime.minimumOfferPrice > 0
          ? selectedTeeTime.minimumOfferPrice
          : 200
      );
    }
  }, [selectedTeeTime, isManageOwnedTeeTimeOpen]);

  const { trigger, sidebar, toggleSidebar } = useSidebar({
    isOpen: isManageOwnedTeeTimeOpen,
    setIsOpen: setIsManageOwnedTeeTimeOpen,
  });

  useEffect(() => {
    if (isManageOwnedTeeTimeOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
      setMinimumOfferPrice(selectedTeeTime?.minimumOfferPrice ?? 0); //reset price
      setNewFriend("");
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
    const value = e.target.value.replace("$", "").replaceAll(",", "");

    const decimals = value.split(".")[1];
    if (decimals && decimals?.length > 2) return;

    const strippedLeadingZeros = value.replace(/^0+/, "");

    setMinimumOfferPrice(Number(strippedLeadingZeros));
  };

  const totalPayout = useMemo(() => {
    return minimumOfferPrice * friends.length - 45;
  }, [minimumOfferPrice, friends]);

  const save = async () => {
    if (!selectedTeeTime) {
      toast.error("Tee time not selected");
      return;
    }
    if (updateNames.isLoading || updateMinimumOfferPrice.isLoading) return;
    const userIdsForBooking = friends
      .filter((friend) => friend.id !== "")
      .map((i) => i.id);
    try {
      await updateNames.mutateAsync({
        bookingIds: selectedTeeTime?.bookingIds.slice(0, friends.length) ?? [],
        userIds: userIdsForBooking,
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
        ref={sidebar}
        className={`!duration-400 fixed right-0 top-1/2 z-20 flex h-[90dvh] w-[80vw] -translate-y-1/2 flex-col overflow-y-hidden border border-stroke bg-white shadow-lg transition-all ease-linear sm:w-[500px] md:h-[100dvh] ${
          isManageOwnedTeeTimeOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between p-4">
            <div className="text-lg">Manage Owned Tee Time</div>

            <button
              ref={trigger}
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
                  selectedTeeTime?.firstHandPrice ??
                  selectedTeeTime?.purchasedFor ??
                  0
                }
                timezoneCorrection={course?.timezoneCorrection}
              />
              <div className={`flex flex-col gap-1 text-center w-fit mx-auto`}>
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
              <div className={`flex flex-col gap-2 pb-6 text-center`}>
                <label
                  htmlFor="friends"
                  className="text-[16px] text-primary-gray md:text-[18px]"
                >
                  Add/edit invited friends
                </label>
                {friends.length > 0
                  ? friends?.map((friend, idx) => (
                      <div
                        key={idx}
                        className="mx-auto w-full max-w-[400px] rounded-lg bg-secondary-white px-4 py-1 flex justify-between text-[16px] font-semibold outline-none"
                      >
                        <div>
                          {idx === 0 && friend.name.toLowerCase() === "guest"
                            ? "You"
                            : friend.name}
                        </div>
                        <button
                          onClick={() => removeFriend(idx)}
                          data-testid="remove-friend-button-id"
                        >
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
                      list="searchedFriends"
                      onChange={handleNewFriend}
                      onSelect={addFriend}
                      placeholder="Username or email"
                      className="mx-auto w-full max-w-[400px] rounded-lg bg-secondary-white px-4 py-2 flex justify-between text-[14px] font-semibold outline-none"
                      data-testid="search-friend-id"
                    />
                    {!isLoading &&
                    friendList?.length === 0 &&
                    debouncedValue.length > 0 ? (
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
              </div>

              <datalist id="searchedFriends">
                {friendList?.map((friend, idx) => (
                  <option key={idx}>
                    {friend.email} ({friend.handle})
                  </option>
                ))}
              </datalist>
            </div>
            <div className="flex flex-col gap-4 px-4 pb-6">
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">
                  Tee Time Price
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
                    content="Service fee description."
                  />
                </div>
                <div className="text-secondary-black">{formatMoney(45)}</div>
              </div>
              <div className="flex justify-between">
                <div className="font-[300] text-primary-gray">Total Payout</div>
                <div className="text-secondary-black">
                  {formatMoney(totalPayout)}
                </div>
              </div>
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
}: {
  courseImage: string;
  courseName: string;
  courseDate: string;
  golferCount: number;
  purchasedFor: number;
  timezoneCorrection: number | undefined;
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
    </div>
  );
};
